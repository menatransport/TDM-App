// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { jsonWithEtag } from '@/lib/etagJson';

// สถานะที่หน้าคนขับไม่แสดง
const HIDDEN_STATUSES = new Set(['ตกคิว', 'อบรมที่บริษัท', 'ยกเลิก', 'ซ่อม']);
// field ที่การ์ดงานของคนขับใช้
const DRIVER_FIELDS = ['load_id', 'h_plate', 'job_type', 'status', 'locat_recive', 'locat_deliver', 'date_recive', 'date_deliver'] as const;

export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  // console.log('ORDERS [API] Access Token:', Access_token);
    const externalRes = await fetch(process.env.JOBS_API_URL!, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Access_token}`,
    }
  });
  const data = await externalRes.json();
  if (!Array.isArray(data?.jobs)) {
    return NextResponse.json(data, { status: externalRes.status });
  }

  const jobs = data.jobs
    .filter((job: any) => !HIDDEN_STATUSES.has(job.status))
    .map((job: any) => Object.fromEntries(DRIVER_FIELDS.map((f) => [f, job[f]])));
  return jsonWithEtag(req, { jobs });
  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const jobID  = req.headers.get('id');
    const externalRes = await fetch(process.env.JOBS_API_URL! + "?load_id=" + jobID, {
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


export async function POST(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');
  const value = await req.json();
  // console.log('POST ******** CREATE JOBS BULK *****:', JSON.stringify(value));
    const externalRes = await fetch(`${process.env.JOBS_API_URL!}/bulk`, {
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