import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "sgp1",
  endpoint: "https://sgp1.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "DO801FM87FYTE8EFKKLY",
    secretAccessKey: "I1jYV5VRFHg2DWfx4gqIkGer71U6d9dhvrv5lo2ucs",
  },
});

export const uploadToS3 = async (file: File) => {
  const command = new PutObjectCommand({
    Bucket: "mn-bew-key",
    Key: `sb-001/${file.name}`,
    Body: file, // ✅ File / Blob ใช้งานได้ตรงๆ
    ContentType: file.type,
  });

  try {
    const result = await s3.send(command);
    console.log("✅ Upload Success:", result);
    return result;
  } catch (err) {
    console.error("❌ Upload Failed:", err);
    throw err;
  }
};
