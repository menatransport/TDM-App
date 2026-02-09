import { NextResponse } from 'next/server';

// js-cache-property-access: Cache API key at module level
const LONGDO_API_KEY = process.env.LONGDO_API_KEY;
const LONGDO_BASE_URL = 'https://api.longdo.com/RouteService/json/route/guide';

export async function GET(req: Request) {
    // js-early-exit: Validate inputs early
    const bodyStr = req.headers.get('params');
    if (!bodyStr) {
        return NextResponse.json(
            { error: 'Missing params header' },
            { status: 400 }
        );
    }

    if (!LONGDO_API_KEY) {
        return NextResponse.json(
            { error: 'LONGDO_API_KEY not configured' },
            { status: 500 }
        );
    }

    let bodyObj: Record<string, unknown>;
    try {
        bodyObj = JSON.parse(bodyStr);
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON in params header' },
            { status: 400 }
        );
    }

    const queryString = Object.entries(bodyObj)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');

    try {
        const response = await fetch(
            `${LONGDO_BASE_URL}?${queryString}&key=${LONGDO_API_KEY}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(10000), // 10s timeout
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Longdo API returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Longdo API error:', message);
        return NextResponse.json(
            { error: 'Failed to fetch route data' },
            { status: 500 }
        );
    }
}