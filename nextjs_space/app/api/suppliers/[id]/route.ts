export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params?.id ?? '0');
    const supplier = await prisma.supplier.findUnique({ where: { id }, include: { priceSheets: true } });
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params?.id ?? '0');
    const body = await request.json();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body?.name,
        contact: body?.contact,
        phone: body?.phone,
        email: body?.email,
        address: body?.address,
        taxRate: body?.tax_rate !== undefined ? parseFloat(String(body.tax_rate)) : body?.taxRate !== undefined ? parseFloat(String(body.taxRate)) : undefined,
        taxExempt: body?.tax_exempt !== undefined ? Boolean(body.tax_exempt) : body?.taxExempt !== undefined ? Boolean(body.taxExempt) : undefined,
        deliveryFee: body?.delivery_fee !== undefined ? parseFloat(String(body.delivery_fee)) : body?.deliveryFee !== undefined ? parseFloat(String(body.deliveryFee)) : undefined,
        notes: body?.notes,
      },
    });
    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params?.id ?? '0');
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to delete' }, { status: 500 });
  }
}
