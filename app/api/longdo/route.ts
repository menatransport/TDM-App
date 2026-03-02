import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;

    // รองรับทั้ง query params (ใหม่) และ headers (เดิม) เพื่อ backward compatibility
    let plate: string | null, flat: string | null, flon: string | null,
        tlat: string | null, tlon: string | null, type: string | null;

    if (searchParams.has('plate')) {
        // วิธีใหม่: รับจาก query params
        plate = searchParams.get('plate');
        flat = searchParams.get('flat');
        flon = searchParams.get('flon');
        tlat = searchParams.get('tlat');
        tlon = searchParams.get('tlon');
        type = searchParams.get('type') || '16';
    } else {
        // วิธีเดิม: รับจาก headers (backward compatibility)
        const bodyStr = req.headers.get('params');
        if (!bodyStr) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }
        const bodyObj = JSON.parse(bodyStr);
        plate = bodyObj.plate;
        flat = String(bodyObj.flat);
        flon = String(bodyObj.flon);
        tlat = String(bodyObj.tlat);
        tlon = String(bodyObj.tlon);
        type = String(bodyObj.type || 16);
    }

    if (!plate || !flat || !flon || !tlat || !tlon) {
        return NextResponse.json(
            { error: 'Missing required parameters: plate, flat, flon, tlat, tlon' },
            { status: 400 }
        );
    }

    const queryString = new URLSearchParams({
        plate, flat, flon, tlat, tlon, type: type || '16',
    }).toString();

    try {
        const response = await fetch(
            `https://api.longdo.com/RouteService/json/route/guide?${queryString}&key=${process.env.LONGDO_API_KEY}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Longdo API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Longdo API fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch route data from Longdo' },
            { status: 500 }
        );
    }
}