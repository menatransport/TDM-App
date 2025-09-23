import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  // console.log('[API] รับค่าจาก client:', [username, password ]);
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  const externalRes = await fetch('https://backend-tdm.onrender.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'latlng-current': req.headers.get('latlng-current') || '',
    },
    body: params.toString(),
  });

  const db = await externalRes.json();
  // console.log('[API] ดึงข้อมูลจาก external API:', db);

  const token = generateToken({ username: username , role: db.role });
  console.log('[API] สร้าง Token:', token);

  return NextResponse.json({ success: true, jwtToken: token, access_token: db.access_token ,role: db.role, latlng_current: db.latlng_current });
}


export async function GET(req: Request) {
  console.log('req : ',req)
try {
    const externalRes = await fetch('https://backend-tdm.onrender.com/user', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '=E=QY]!{PjD53Mq',
    }
  });
  const data = await externalRes.json();

  return NextResponse.json(data);
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}