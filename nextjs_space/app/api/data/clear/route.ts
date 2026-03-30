export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await prisma.projectItem.deleteMany();
    await prisma.project.deleteMany();
    await prisma.priceSheet.deleteMany();
    await prisma.supplier.deleteMany();
    // Reset settings to defaults
    await prisma.setting.upsert({ where: { key: 'default_tax_rate' }, update: { value: '0' }, create: { key: 'default_tax_rate', value: '0' } });
    await prisma.setting.upsert({ where: { key: 'dark_mode' }, update: { value: 'true' }, create: { key: 'dark_mode', value: 'true' } });
    await prisma.setting.upsert({ where: { key: 'default_supplier_id' }, update: { value: '' }, create: { key: 'default_supplier_id', value: '' } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to clear data' }, { status: 500 });
  }
}
