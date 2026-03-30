export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(suppliers ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.create({
      data: {
        name: body?.name ?? 'Unnamed',
        contact: body?.contact ?? '',
        phone: body?.phone ?? '',
        email: body?.email ?? '',
        address: body?.address ?? '',
        taxRate: parseFloat(String(body?.tax_rate ?? body?.taxRate ?? 0)) || 0,
        taxExempt: Boolean(body?.tax_exempt ?? body?.taxExempt ?? false),
        deliveryFee: parseFloat(String(body?.delivery_fee ?? body?.deliveryFee ?? 0)) || 0,
        notes: body?.notes ?? '',
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create supplier' }, { status: 500 });
  }
}
