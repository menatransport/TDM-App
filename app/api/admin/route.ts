import { NextResponse } from 'next/server';

export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const query = req.headers.get('query')
  console.log("JOBS_API_URL : ",process.env.JOBS_API_URL! + "?" + query);
  const externalRes = await fetch(process.env.JOBS_API_URL! + "?" + query, {
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
    
    const externalRes = await fetch(process.env.RESET_PASSWORD_API_POST!, {
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

export async function PUT(req: Request) {
  try {
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    const value = await req.json();
    const result = []
    if (!value || !Array.isArray(value) || value.length === 0) {
      console.error('non-empty array OK Add Array');
      result.push(value);
    }else{
      result.push(...value);
    }
    // console.log('PUT *****************:', JSON.stringify(result, null, 2));
    const externalRes = await fetch(`${process.env.JOBS_API_URL!}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(result, null, 2)
    });

    const data = await externalRes.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}