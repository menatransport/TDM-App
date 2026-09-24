import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { authorize, destinationsCol, parseDestination, toDestination } from '../shared';

type Ctx = { params: Promise<{ id: string }> };

// แก้/ลบได้เฉพาะปลายทางของลูกค้าตัวเอง (filter ด้วย client ด้วย)

export async function PUT(req: Request, { params }: Ctx) {
  const { client, denied } = authorize(req);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const parsed = parseDestination(await req.json().catch(() => null));
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const doc = await (await destinationsCol()).findOneAndUpdate(
      { _id: new ObjectId(id), client },
      { $set: parsed.value },
      { returnDocument: 'after' },
    );
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ destination: toDestination(doc) });
  } catch (err) {
    console.error('❌ Destination update error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { client, denied } = authorize(req);
  if (denied) return denied;
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const res = await (await destinationsCol()).deleteOne({ _id: new ObjectId(id), client });
    if (!res.deletedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ Destination delete error:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 });
  }
}
