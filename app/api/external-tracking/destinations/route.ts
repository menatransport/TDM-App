import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authorize, destinationsCol, parseDestination, toDestination } from './shared';

export async function GET(req: Request) {
  const { client, denied } = authorize(req);
  if (denied) return denied;
  try {
    const docs = await (await destinationsCol()).find({ client }).sort({ name: 1 }).toArray();
    return NextResponse.json({ destinations: docs.map(toDestination) });
  } catch (err) {
    console.error('❌ Destinations fetch error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { client, denied } = authorize(req);
  if (denied) return denied;
  const parsed = parseDestination(await req.json().catch(() => null));
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const doc = { _id: new ObjectId(), ...parsed.value, client };
    await (await destinationsCol()).insertOne(doc);
    return NextResponse.json({ destination: toDestination(doc) }, { status: 201 });
  } catch (err) {
    console.error('❌ Destination create error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}
