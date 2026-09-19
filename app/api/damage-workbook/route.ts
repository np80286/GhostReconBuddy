import workbook from '@/data/damage-workbook.json';
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { workbook, storage: 'snapshot' },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        },
      },
    );
  }
  try {
    const { readDamageWorkbook } = await import('@/lib/database');
    const snapshot = await readDamageWorkbook();
    return Response.json(
      { workbook: snapshot, storage: 'postgres' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Database unavailable. Please retry later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
