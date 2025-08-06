// app/api/test-db/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const loadId = req.headers.get('id');
  // console.log('ORDERS [API] Access Token || ID :', [loadId,Access_token]);
    const externalRes = await fetch(`https://backend-tdm.onrender.com/job-tickets?load_id=${loadId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Access_token}`,
    }
  });
  const data = await externalRes.json();
  // console.log('ORDERS [API] ดึงข้อมูลจาก external API:', data);
  return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const value = await req.json();
  console.log('ข้อมูล +++  : ',[Access_token,value])
    const externalRes = await fetch(`https://backend-tdm.onrender.com/job-tickets`, {
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

