import { readFile } from 'node:fs/promises';
import { validateCatalog } from '../lib/validate-catalog.mjs';
const data = validateCatalog(
  JSON.parse(
    await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8'),
  ),
);
console.log(
  `${data.weapons.length} weapons, ${data.attachments.length} attachment types, ${data.compatibility.length} pairs, ${data.measurements.length} historical observations, ${data.missions.length} missions. References and comparison conditions are valid.`,
);
