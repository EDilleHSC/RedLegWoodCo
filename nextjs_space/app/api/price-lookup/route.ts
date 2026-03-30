export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const supplierId = parseInt(url.searchParams.get('supplier_id') ?? '0');
    const species = (url.searchParams.get('species') ?? '').toLowerCase().trim();
    const grade = (url.searchParams.get('grade') ?? '').toLowerCase().trim();
    const thicknessQuarters = parseInt(url.searchParams.get('thickness_quarters') ?? '0');

    if (!supplierId || !species || !grade || !thicknessQuarters) {
      return NextResponse.json({ price_per_bf: 0, found: false });
    }

    // Exact match lookup - case insensitive
    const result = await prisma.priceSheet.findFirst({
      where: {
        supplierId,
        thicknessQuarters,
        species: { equals: species, mode: 'insensitive' },
        grade: { equals: grade, mode: 'insensitive' },
      },
    });

    if (result) {
      return NextResponse.json({ price_per_bf: result?.pricePerBf ?? 0, found: true });
    }

    return NextResponse.json({ price_per_bf: 0, found: false });
  } catch (error: any) {
    console.error('Price lookup error:', error);
    return NextResponse.json({ price_per_bf: 0, found: false });
  }
}
