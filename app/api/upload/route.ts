// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: 'sgp1',
  endpoint: 'https://sgp1.digitaloceanspaces.com', 
  credentials: {
    accessKeyId: 'DO00FB9KEAJ6KG2A8TTK',
    secretAccessKey: 'LLrB/5TOpWirsxbCAPSiQVq4EtVJ3CNnIrFt0nim/9c',
  },
});

const BUCKET_NAME = 'mn-bucket';
const BASE_PATH = 'sb-001/tdm-app';


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
  const jobId = req.headers.get("id");
  console.log("[GET] jobId:", jobId);

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

    const files = listRes.Contents || [];
console.log('GET FILE : ',files)
    const signedImages = await Promise.all(
      files.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.Key!,
          
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL มีอายุ 1 ชม.

        return {
          key: file.Key,
          url: signedUrl,
          name: file.Key?.split('/').pop(),
          category: extractType(file.Key?.split('/').pop() || ""),
        };
      })
    );

    return NextResponse.json({ images: signedImages });
  } catch (err) {
    console.error("❌ S3 List Error:", err);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json();
    console.log('key : ',`${key}`)
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

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}