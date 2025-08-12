import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // รับ JSON จาก client
    const { prompt } = await req.json();

    console.log('route api : ', [prompt, process.env.GEMINI_KEY]);

    const externalRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: String(prompt) } // ต้องเป็น string
              ]
            }
          ]
        }),
      }
    );

    const data = await externalRes.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error('❌ DB Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch from Gemini API' }, { status: 500 });
  }
}
