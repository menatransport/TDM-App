import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// เส้นทางตามถนน (รถ → ปลายทาง) จาก Longdo RouteService แบบ GeoJSON
// คืนระยะทางรวม (เมตร) + จุดของเส้นทาง [lon, lat][] สำหรับวาดบนแผนที่

interface LongdoRouteGeoJson {
  features?: { geometry: { type: string; coordinates: [number, number][] } }[];
  data?: { distance?: number };
}

export async function GET(req: NextRequest) {
  const jwtToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  try {
    const payload = verifyToken(jwtToken) as { role?: string };
    if (payload.role !== 'external') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const flat = searchParams.get('flat'), flon = searchParams.get('flon');
  const tlat = searchParams.get('tlat'), tlon = searchParams.get('tlon');
  if (!flat || !flon || !tlat || !tlon) {
    return NextResponse.json({ error: 'Missing required parameters: flat, flon, tlat, tlon' }, { status: 400 });
  }

  const query = new URLSearchParams({ flat, flon, tlat, tlon, type: '16', key: process.env.LONGDO_API_KEY ?? '' });
  try {
    const res = await fetch(`https://api.longdo.com/RouteService/geojson/route?${query}`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `Longdo API error: ${res.status}` }, { status: 502 });
    }
    const geo: LongdoRouteGeoJson = await res.json();
    const distance = geo.data?.distance;
    if (typeof distance !== 'number' || !geo.features?.length) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    // ต่อ LineString ทุกช่วงเป็นเส้นเดียว ตัดจุดซ้ำที่รอยต่อ
    const path: [number, number][] = [];
    for (const f of geo.features) {
      if (f.geometry.type !== 'LineString') continue;
      for (const p of f.geometry.coordinates) {
        const last = path[path.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) path.push(p);
      }
    }
    return NextResponse.json({ distance, path });
  } catch (err: unknown) {
    console.error('❌ Longdo route error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
  }
}
