import seed from '@/data/catalog.json';
import { DatabaseApp } from '@/components/database-app';
export default function Home() {
  return <DatabaseApp initialCatalog={seed} />;
}
