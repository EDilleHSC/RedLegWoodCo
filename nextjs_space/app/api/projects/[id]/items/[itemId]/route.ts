export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const itemId = parseInt(params?.itemId ?? '0');
    await prisma.projectItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}
