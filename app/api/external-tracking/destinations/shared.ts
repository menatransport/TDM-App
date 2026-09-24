import { NextResponse } from 'next/server';
import type { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

// ปลายทางของหน้า external-tracking (db: MONGO_DB, collection: external_destinations)
// แยกตามลูกค้า: client = ชื่อหน้า @ ของ username ที่ login (tipco@... → "tipco")

export interface FleetDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface DestinationDoc {
  _id: ObjectId;
  name: string;
  lat: number;
  lng: number;
  client: string;
}

export const destinationsCol = async () => (await getDb()).collection<DestinationDoc>('external_destinations');

export const toDestination = (d: DestinationDoc): FleetDestination => ({
  id: d._id.toString(),
  name: d.name,
  lat: d.lat,
  lng: d.lng,
});

// ตรวจ role external → { client } หรือ { denied: response error }
export const authorize = (req: Request): { client: string; denied?: never } | { denied: NextResponse; client?: never } => {
  const jwtToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  try {
    const payload = verifyToken(jwtToken) as { role?: string; username?: string };
    if (payload.role !== 'external') return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    const client = (payload.username ?? '').split('@')[0].trim().toLowerCase();
    if (!client) return { denied: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    return { client };
  } catch {
    return { denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
};

// ตรวจ body จากฟอร์ม → { name, lat, lng } หรือข้อความ error
export const parseDestination = (body: unknown) => {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? '').trim();
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!name) return { error: 'กรุณากรอกชื่อปลายทาง' };
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: 'พิกัดไม่ถูกต้อง' };
  }
  return { value: { name, lat, lng } };
};
