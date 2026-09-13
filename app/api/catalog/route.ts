import seed from '@/data/catalog.json';
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      { catalog: seed, storage: 'snapshot' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const { readCatalog } = await import('@/lib/database');
    const catalog = await readCatalog();
    return Response.json(
      { catalog, storage: 'postgres' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: 'Database unavailable. Please retry later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
