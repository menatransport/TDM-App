import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// ตำแหน่งรถปัจจุบัน (fleetdata.vehicle_curent_data) จาก FASTTRACK_API_URL/gpsdata

export interface FleetVehicle {
  id: string;
  plate: string;
  address: string;
  status: string;
  speed: number | null; // km/h
  lat: number;
  lng: number;
  updatedAt: string;
}

// VehicleCurrentDataOut ของ backend
interface GpsDataRow {
  plate_master: string;
  plate_type: string | null;
  gps_vendor: string | null;
  current_latlng: string | null;
  gps_updated_at: string | null;
  gps_id: string | null;
  status: string | null;
  speed: number | null;
  updated_at: string | null;
}

const toVehicle = (row: GpsDataRow): FleetVehicle | null => {
  const [lat, lng] = (row.current_latlng ?? '').split(',').map((s) => parseFloat(s.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: row.plate_master,
    plate: row.plate_master,
    address: '',
    status: row.status ?? '',
    speed: row.speed ?? null,
    lat,
    lng,
    updatedAt: row.gps_updated_at ?? row.updated_at ?? '',
  };
};

// ====== แปลง lat,lng → ที่อยู่ภาษาไทยแบบสั้น (Longdo reverse geocode) ======
// cache ตามพิกัดปัด 3 ตำแหน่ง (~100 ม.) รถจอดอยู่ที่เดิมจะไม่ยิง API ซ้ำทุกรอบ poll
const addressCache = new Map<string, string>();
const ADDRESS_CACHE_MAX = 5000;

interface LongdoAddress {
  aoi?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
}

const shortAddress = (a: LongdoAddress) =>
  [
    a.aoi ?? a.road?.replace(/^ถนน/, 'ถ.') ?? a.subdistrict,
    a.district,
    a.province === 'กรุงเทพมหานคร' ? 'กทม.' : a.province,
  ]
    .filter(Boolean)
    .join(' ');

const addressOf = async (lat: number, lng: number) => {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = addressCache.get(key);
  if (hit !== undefined) return hit;
  try {
    const res = await fetch(
      `https://api.longdo.com/map/services/address?lon=${lng}&lat=${lat}&noelevation=1&key=${process.env.LONGDO_API_KEY}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return '';
    const address = shortAddress(await res.json());
    if (addressCache.size >= ADDRESS_CACHE_MAX) addressCache.clear();
    addressCache.set(key, address);
    return address;
  } catch {
    return ''; // หา address ไม่ได้ก็ยังแสดงรถได้ ไม่ cache เพื่อให้รอบหน้าลองใหม่
  }
};

export async function GET(req: Request) {
  const jwtToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  try {
    const payload = verifyToken(jwtToken) as { role?: string };
    if (payload.role !== 'external') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const externalRes = await fetch(`${process.env.FASTTRACK_API_URL}/gpsdata?gps_vendor=songdee`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${req.headers.get('x-access-token') ?? ''}`,
      },
      cache: 'no-store',
    });
    // access_token หมดอายุ → ให้หน้าเว็บพากลับไป login
    if (externalRes.status === 401) {
      return NextResponse.json({ error: 'Access token expired' }, { status: 401 });
    }
    if (!externalRes.ok) {
      return NextResponse.json({ error: `GPS API error: ${externalRes.status}` }, { status: 502 });
    }
    const rows: GpsDataRow[] = await externalRes.json();
    const vehicles = rows.map(toVehicle).filter((v): v is FleetVehicle => v !== null);
    await Promise.all(vehicles.map(async (v) => (v.address = await addressOf(v.lat, v.lng))));
    return NextResponse.json({ vehicles });
  } catch (err: unknown) {
    console.error('❌ GPS fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 });
  }
}
