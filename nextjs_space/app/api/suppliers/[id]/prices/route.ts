export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supplierId = parseInt(params?.id ?? '0');
    const prices = await prisma.priceSheet.findMany({
      where: { supplierId },
      orderBy: [{ species: 'asc' }, { grade: 'asc' }, { thicknessQuarters: 'asc' }],
    });
    return NextResponse.json(prices ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}
