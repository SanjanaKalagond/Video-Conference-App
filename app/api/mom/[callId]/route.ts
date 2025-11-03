import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { getMomPdfPath } from '@/lib/storage';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{
    callId: string;
  }>;
}

export async function GET(_: Request, { params }: Params) {
  const { callId } = await params;
  if (!callId) {
    return NextResponse.json({ error: 'callId is required' }, { status: 400 });
  }

  try {
    const pdf = await fs.readFile(getMomPdfPath(callId));

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="mom-${callId}.pdf"`,
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Minutes of meeting not found' },
        { status: 404 },
      );
    }
    console.error('Failed to read minutes of meeting', error);
    return NextResponse.json(
      { error: 'Failed to fetch minutes of meeting' },
      { status: 500 },
    );
  }
}
