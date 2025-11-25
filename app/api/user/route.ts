import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const externalRes = await fetch(process.env.USER_REGISTER_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.USER_XAPI!
      },
      body: JSON.stringify(body),
    });
    const data = await externalRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}