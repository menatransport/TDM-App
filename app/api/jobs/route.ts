// app/api/test-db/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  // console.log('ORDERS [API] Access Token:', Access_token);
    const externalRes = await fetch('https://backend-tdm.onrender.com/jobs', {
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

export async function DELETE(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const jobID  = req.headers.get('id');
    const externalRes = await fetch('https://backend-tdm.onrender.com/jobs?load_id=' + jobID, {
    method: 'DELETE',
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

export async function PUT(req: Request) {
  try {
    const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    const jobID = req.headers.get('id');
    const value = await req.json();
    console.log('PUT *****************:', [jobID, value]);
    const externalRes = await fetch(`https://backend-tdm.onrender.com/jobs?load_id=${jobID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(value)
    });

    const data = await externalRes.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function POST(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const value = await req.json();
  console.log('POST ******** CREATE JOBS BULK *****:', JSON.stringify(value));
    const externalRes = await fetch('https://backend-tdm.onrender.com/jobs/bulk', {
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