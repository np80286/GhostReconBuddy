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
void test('real-world firearm reference wiki contains only direct Wildlands matches', () => {
  const mappings = new Map(seed.realWorldWeapons.map((weapon) => [weapon.id, weapon]));
  assert.deepEqual([...mappings.keys()], ['m4a1-carbine', 'sr-25']);
  assert.ok([...mappings.values()].every((weapon) => weapon.relationship === 'DIRECT'));
  assert.equal(mappings.get('m4a1-carbine')?.wildlandsWeaponId, 'm4a1');
  assert.equal(mappings.get('sr-25')?.wildlandsWeaponId, 'sr25');
});
void test('the real-world reference wiki rejects non-direct relationships', () => {
  assert.throws(
    () =>
      validateCatalog(
        changed((d) => {
          d.realWorldWeapons[0].relationship = 'FAMILY';
        }),
      ),
    /invalid real-world weapon mapping/,
  );
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
