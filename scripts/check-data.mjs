import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../lib/validate-catalog.mjs';
const data = validateCatalog(
  JSON.parse(
    await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8'),
  ),
);
const workbook = JSON.parse(
  await readFile(
    new URL('../data/damage-workbook.json', import.meta.url),
    'utf8',
  ),
);
const archive = await readFile(
  new URL(
    '../resources/workbooks_spreadsheets/Wildlands Damage Sheet.xlsx',
    import.meta.url,
  ),
);
const cells = workbook.sheets.reduce(
  (sum, sheet) =>
    sum + sheet.rows.reduce((rowSum, row) => rowSum + row.cells.length, 0),
  0,
);
const formulas = workbook.sheets.reduce(
  (sum, sheet) =>
    sum +
    sheet.rows.reduce(
      (rowSum, row) => rowSum + row.cells.filter((cell) => cell.formula).length,
      0,
    ),
  0,
);
if (
  workbook.sheetCount !== data.coverage.damageWorkbook.sheetCount ||
  workbook.sheets.length !== workbook.sheetCount ||
  cells !== workbook.cellCount ||
  formulas !== workbook.formulaCount ||
  workbook.sha256 !== data.coverage.damageWorkbook.archiveSha256 ||
  createHash('sha256').update(JSON.stringify(workbook)).digest('hex') !==
    data.coverage.damageWorkbook.snapshotSha256 ||
  createHash('sha256').update(archive).digest('hex') !== workbook.sha256
)
  throw new Error(
    'Damage workbook archive, extracted snapshot or coverage audit mismatch',
  );
console.log(
  `${data.weapons.length} weapons, ${data.attachments.length} attachment types, ${data.compatibility.length} pairs, ${data.measurements.length} historical observations, ${data.missions.length} missions, ${workbook.sheetCount} archived workbook sheets (${cells.toLocaleString()} populated cells). References and imported workbook audit are valid.`,
);
