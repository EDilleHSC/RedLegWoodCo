export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params?.id ?? '0');
    const items = await prisma.projectItem.findMany({ where: { projectId } });
    return NextResponse.json(items ?? []);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = parseInt(params?.id ?? '0');
    const body = await request.json();
    const items: any[] = Array.isArray(body) ? body : [body];
    const created = [];
    for (const item of items) {
      const thicknessQuarters = parseInt(String(item?.thickness_quarters ?? item?.thicknessQuarters ?? 4));
      const widthInches = parseFloat(String(item?.width_inches ?? item?.widthInches ?? 0));
      const lengthInches = parseFloat(String(item?.length_inches ?? item?.lengthInches ?? 0));
      const quantity = parseInt(String(item?.quantity ?? 1));
      const boardFeet = ((thicknessQuarters / 4) * widthInches * lengthInches * quantity) / 12;
      const pricePerBf = parseFloat(String(item?.price_per_bf ?? item?.pricePerBf ?? 0));
      const totalCost = boardFeet * pricePerBf;

      const row = await prisma.projectItem.create({
        data: {
          projectId,
          species: item?.species ?? '',
          grade: item?.grade ?? '',
          thicknessQuarters,
          widthInches,
          lengthInches,
          quantity,
          boardFeet: Math.round(boardFeet * 100) / 100,
          pricePerBf,
          totalCost: Math.round(totalCost * 100) / 100,
        },
      });
      created.push(row);
    }
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  }
}
