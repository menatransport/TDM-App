// app/api/proxytest/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const externalRes = await fetch('https://api.zippopotam.us/us/33162');

    if (!externalRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: externalRes.status });
    }

    const data = await externalRes.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
