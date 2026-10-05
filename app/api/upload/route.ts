// app/api/upload/route.ts
import { NextRequest, NextResponse, after } from 'next/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { jsonWithEtag } from '@/lib/etagJson';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.AWS_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;
const BASE_PATH = process.env.AWS_BASE_PATH!;

// รูปย่อสำหรับแสดงใน grid เก็บที่ <jobId>/thumb/<ชื่อไฟล์>.webp
const THUMB_DIR = 'thumb';
const THUMB_SIZE = 320;
// จำนวนรูปเก่าที่สร้างรูปย่อย้อนหลังต่อหนึ่งครั้งที่เรียก GET
const THUMB_BACKFILL_LIMIT = 10;
// signed URL คงที่ตลอดช่วงเวลานี้ เบราว์เซอร์จึง cache รูปได้ (URL ใช้ได้อย่างน้อย 6 ชม.)
const SIGN_WINDOW_SEC = 6 * 60 * 60;

const thumbKeyOf = (key: string) => key.replace(/\/([^/]+)$/,`/${THUMB_DIR}/$1.webp`);

const makeThumb = async (input: Buffer): Promise<Buffer | null> => {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(input)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();
  } catch (err) {
    console.error('Thumbnail Error:', err);
    return null;
  }
};

const putThumb = async (key: string, original: Buffer) => {
  const thumb = await makeThumb(original);
  if (!thumb) return;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: thumbKeyOf(key),
    Body: thumb,
    ContentType: 'image/webp',
  }));
};

// version ใส่ใน response-cache-control ทำให้ URL เปลี่ยนเมื่อไฟล์ถูกอัปโหลดทับ (ชื่อซ้ำ) จึงไม่ได้รูปเก่าจาก cache
const signStable = (key: string, version: number) => {
  const windowStartSec = Math.floor(Date.now() / 1000 / SIGN_WINDOW_SEC) * SIGN_WINDOW_SEC;
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseCacheControl: `private, max-age=${SIGN_WINDOW_SEC}, v=${version}`,
  });
  return getSignedUrl(s3, command, {
    expiresIn: SIGN_WINDOW_SEC * 2,
    signingDate: new Date(windowStartSec * 1000),
  });
};


export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll('file') as File[];
  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'ไม่มีไฟล์' }, { status: 400 });
  }

  const uploadedPaths: string[] = [];
  
  for (const file of files) {
    const jobid = file.name.split("_")[0];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${BASE_PATH}/${jobid}/${file.name}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      uploadedPaths.push(fileName);
      try {
        await putThumb(fileName, buffer);
      } catch (err) {
        console.error('S3 Thumbnail Upload Error:', err);
      }
    } catch (err) {
      console.error('S3 Upload Error:', err);
      return NextResponse.json({ error: `Upload failed: ${file.name}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, paths: uploadedPaths });
}


const extractType = (filename: string): string => {
  const match = filename.match(/_(origin|destination|pallet|damage|bill|other)_/);
  return match ? match[1] : "unknown";
};

//  GET ||||||||

export async function GET(req: NextRequest) {
  const jobId = req.headers.get("id") || req.nextUrl.searchParams.get("id");

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const prefix = `${BASE_PATH}/${jobId}/`;

  try {
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );

    const objects = (listRes.Contents || []).filter((file) => file.Key);
    const thumbs = new Map(
      objects
        .filter((file) => file.Key!.startsWith(`${prefix}${THUMB_DIR}/`))
        .map((file) => [file.Key!, file])
    );
    const files = objects.filter((file) => !file.Key!.startsWith(`${prefix}${THUMB_DIR}/`));

    const signedImages = await Promise.all(
      files.map(async (file) => {
        const thumb = thumbs.get(thumbKeyOf(file.Key!));
        const [url, thumbUrl] = await Promise.all([
          signStable(file.Key!, file.LastModified?.getTime() ?? 0),
          thumb ? signStable(thumb.Key!, thumb.LastModified?.getTime() ?? 0) : null,
        ]);

        return {
          key: file.Key,
          url,
          thumbUrl: thumbUrl ?? url,
          name: file.Key?.split('/').pop(),
          category: extractType(file.Key?.split('/').pop() || ""),
        };
      })
    );

    // รูปเก่าที่ยังไม่มีรูปย่อ: สร้างหลังส่ง response แล้ว ครั้งถัดไปจะได้รูปย่อ
    const missingThumbs = files
      .filter((file) => !thumbs.has(thumbKeyOf(file.Key!)))
      .slice(0, THUMB_BACKFILL_LIMIT);
    if (missingThumbs.length > 0) {
      after(async () => {
        for (const file of missingThumbs) {
          try {
            const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file.Key! }));
            const bytes = await obj.Body?.transformToByteArray();
            if (bytes) await putThumb(file.Key!, Buffer.from(bytes));
          } catch (err) {
            console.error('Thumbnail Backfill Error:', file.Key, err);
          }
        }
      });
    }

    return jsonWithEtag(req, { images: signedImages });
  } catch (err) {
    console.error("❌ S3 List Error:", err);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json();
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key ,
      })
    );
    // ลบรูปย่อด้วย (ถ้าไม่มีก็ไม่เป็นไร)
    await s3
      .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: thumbKeyOf(key) }))
      .catch((err) => console.error("❌ Delete thumbnail error:", err));

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}