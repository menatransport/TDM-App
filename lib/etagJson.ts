import { createHash } from "crypto";

// ส่ง JSON พร้อม ETag: ถ้าข้อมูลไม่เปลี่ยน ตอบ 304 (ไม่มี body) ประหยัดเน็ตมือถือ
// เบราว์เซอร์ส่ง If-None-Match ให้เองอัตโนมัติจาก HTTP cache
export function jsonWithEtag(req: Request, data: unknown, status = 200): Response {
  const body = JSON.stringify(data);
  const etag = `W/"${createHash("sha1").update(body).digest("base64url")}"`;
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-cache",
    ETag: etag,
  };

  if (status === 200 && req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { status, headers });
}
