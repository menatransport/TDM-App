import { NextResponse } from 'next/server';

export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const query = req.headers.get('query')
  console.log('query : ',query)
    const externalRes = await fetch('https://backend-tdm.onrender.com/jobs?' + query, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Access_token}`,
    }
  });
  const data = await externalRes.json();
  return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const Access_token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const body = await req.json();

    const externalRes = await fetch('https://backend-tdm.onrender.com/users/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Access_token}`,
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