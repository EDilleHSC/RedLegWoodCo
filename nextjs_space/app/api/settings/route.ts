export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    (settings ?? []).forEach((s: any) => {
      result[s?.key ?? ''] = s?.value ?? '';
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const items: Array<{ key: string; value: string }> = Array.isArray(body) ? body : [body];
    for (const item of items) {
      if (!item?.key) continue;
      let val = String(item?.value ?? '');
      // Sanitize tax rate: empty or NaN defaults to '0'
      if (item.key === 'default_tax_rate') {
        const parsed = parseFloat(val);
        if (!val || isNaN(parsed)) val = '0';
      }
      await prisma.setting.upsert({
        where: { key: item.key },
        update: { value: val },
        create: { key: item.key, value: val },
      });
    }
    const allSettings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    (allSettings ?? []).forEach((s: any) => {
      result[s?.key ?? ''] = s?.value ?? '';
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}
