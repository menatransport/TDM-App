import { NextResponse } from 'next/server';

export async function GET(req: Request) {

    const bodyStr = req.headers.get('params');
    if (!bodyStr) throw new Error("No params in headers");

    const bodyObj = JSON.parse(bodyStr);

    const queryString = Object.entries(bodyObj)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    // console.log("LONGDO_API_KEY : ", process.env.LONGDO_API_KEY);
    // console.log("queryString :", "https://api.longdo.com/RouteService/json/route/guide?" + queryString + "&key=" + process.env.LONGDO_API_KEY);
    try {
        const response = await fetch("https://api.longdo.com/RouteService/json/route/guide?" + queryString + "&key=" + process.env.LONGDO_API_KEY,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
    }

}