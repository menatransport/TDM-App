// app/api/test-db/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const value = await req.json();
    const externalRes = await fetch(`${process.env.PALLET_DATA_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Access_token}`,
      },
      body: JSON.stringify(value), 
    });
  const data = await externalRes.json();

  return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}

