import { NextResponse } from 'next/server';
export async function GET(req: Request) {
try {
  const Access_token  = req.headers.get('Authorization')?.replace('Bearer ', '');

    const param = new URL(req.url).searchParams;
    const date_plan_start = param.get('date_plan_start') || '';
    const date_plan_end = param.get('date_plan_end') || '';
    const driver_name = param.get('driver_name') || '';
    const externalRes = await fetch(process.env.JOBS_API_URL + `?date_plan_start=${date_plan_start}&date_plan_end=${date_plan_end}&driver_name=${driver_name}`, {
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