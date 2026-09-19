import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCatalog } from '../lib/validate-catalog.mjs';
const seed = JSON.parse(
  readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'),
);
const changed = (edit) => {
  const d = structuredClone(seed);
  edit(d);
  return d;
};
void test('curated starter release is valid', () => {
  assert.equal(validateCatalog(seed), seed);
});
void test('cross-game weapon records cannot enter Wildlands', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.weapons[0].gameId = 'breakpoint';
        }),
      ),
    /cross-game/,
  );
});
void test('a number without a real source cannot publish', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.measurements[0].sourceIds = ['missing'];
        }),
      ),
    /missing source/,
  );
});
void test('unknown is not zero', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.measurements[0].value = 0;
        }),
      ),
    /shot count/,
  );
});
void test('unsupported compatibility cannot produce a comparison', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.compatibility[0].status = 'incompatible';
        }),
      ),
    /supported compatibility/,
  );
});
void test('conflicting observations cannot silently use the first row', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.measurements.push({
            ...d.measurements[0],
            id: 'conflict',
            value: 99,
          });
        }),
      ),
    /ambiguous comparison/,
  );
});
void test('comparison cannot mix target types', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.measurements[0].target = 'Vehicle';
        }),
      ),
    /target and firing/,
  );
});
void test('unknown trial context must be explicit', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          delete d.measurements[0].distanceM;
        }),
      ),
    /explicit condition/,
  );
});
void test('null distance and sample count remain permissible unknowns', () => {
  assert.doesNotThrow(() =>
    validateCatalog(
      changed((d) => {
        d.measurements[0].distanceM = null;
        d.measurements[0].sampleCount = null;
      }),
    ),
  );
});
