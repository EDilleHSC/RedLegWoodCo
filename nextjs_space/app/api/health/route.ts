export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    ) ?? [];
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      tables: tables?.length ?? 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
