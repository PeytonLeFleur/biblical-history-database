import { afterAll, describe, expect, it } from 'vitest';
import {
  CONSTRAINT_RELATIONS,
  EVENT_CATEGORIES,
  EVIDENCE_CLASSIFICATIONS,
  RELATIONSHIP_TYPES,
  SOURCE_TYPES,
  VERSE_COVERAGE_STATUSES,
  newId,
} from '@atlas/shared';
import { CANON } from '@atlas/scripture';
import { connect } from './client.ts';

// Requires a migrated + seeded database (pnpm db:up && pnpm db:migrate && pnpm db:seed).
const { sql } = connect();
afterAll(() => sql.end());

const one = async <T>(q: Promise<T[]>) => (await q)[0]!;

/** Run inside a transaction that always rolls back, so tests never leave rows behind. */
async function rollback(fn: (tx: typeof sql) => Promise<void>) {
  await sql
    .begin(async (tx) => {
      await fn(tx as unknown as typeof sql);
      throw new Error('__rollback__');
    })
    .catch((e: Error) => {
      if (e.message !== '__rollback__') throw e;
    });
}

describe('scripture foundation', () => {
  it('indexes all 66 books in canonical order', async () => {
    const rows = await sql<{ osis: string }[]>`select osis from books order by canon_order`;
    expect(rows.map((r) => r.osis)).toEqual(CANON.map((b) => b.osis));
  });

  it('indexes 1,189 chapters matching the canon', async () => {
    const rows = await sql<{ book: string; n: number }[]>`select book, count(*)::int as n from chapters group by book`;
    const byBook = new Map(rows.map((r) => [r.book, r.n]));
    for (const b of CANON) expect(byBook.get(b.osis), b.osis).toBe(b.chapters);
    expect(rows.reduce((s, r) => s + r.n, 0)).toBe(1189);
  });

  it('has 31,102 canonical verses, contiguous and consistent with chapter verse counts', async () => {
    expect((await one(sql<{ n: number }[]>`select count(*)::int as n from verses`)).n).toBe(31102);
    const bad = await sql`
      select c.id from chapters c
      left join verses v on v.chapter_id = c.id
      group by c.id, c.verse_count
      having count(v.ref) <> c.verse_count or min(v.verse) <> 1 or max(v.verse) <> c.verse_count`;
    expect(bad).toHaveLength(0);
    const idx = await one(sql<{ lo: number; hi: number; n: number }[]>`
      select min(canon_index)::int as lo, max(canon_index)::int as hi, count(distinct canon_index)::int as n from verses`);
    expect(idx).toEqual({ lo: 1, hi: 31102, n: 31102 });
  });

  it('tracks coverage for every canonical verse', async () => {
    const missing = await sql`select v.ref from verses v left join verse_coverage c using (ref) where c.ref is null`;
    expect(missing).toHaveLength(0);
  });

  it('stores WEB text for every canonical verse, unchanged, with Romans doxology mapped', async () => {
    const n = await one(sql<{ n: number }[]>`
      select count(distinct canonical_ref)::int as n from verse_texts where translation = 'WEB' and canonical_ref is not null`);
    expect(n.n).toBe(31102);
    const amos = await one(sql<{ text: string }[]>`select text from verse_texts where translation='WEB' and canonical_ref='Amos.1.1'`);
    expect(amos.text).toContain('earthquake');
    const zech = await one(sql<{ text: string }[]>`select text from verse_texts where translation='WEB' and canonical_ref='Zech.14.5'`);
    expect(zech.text).toContain('Uzziah');
    const dox = await one(sql<{ translation_ref: string }[]>`
      select translation_ref from verse_texts where translation='WEB' and canonical_ref='Rom.16.27'`);
    expect(dox.translation_ref).toBe('Rom.14.26');
    const mappings = await sql`select * from versification_mappings where translation = 'WEB'`;
    expect(mappings).toHaveLength(3);
  });

  it('does not store ESV or NKJV text', async () => {
    const rows = await sql`select 1 from verse_texts where translation in ('ESV', 'NKJV')`;
    expect(rows).toHaveLength(0);
  });
});

describe('schema guarantees', () => {
  it('database enums match the shared taxonomies exactly', async () => {
    const values = async (t: string) =>
      (await sql<{ v: string }[]>`
        select e.enumlabel as v from pg_enum e join pg_type t on t.oid = e.enumtypid
        where t.typname = ${t} order by e.enumsortorder`).map((r) => r.v);
    expect(await values('event_category')).toEqual([...EVENT_CATEGORIES]);
    expect(await values('source_type')).toEqual([...SOURCE_TYPES]);
    expect(await values('relationship_type')).toEqual([...RELATIONSHIP_TYPES]);
    expect(await values('evidence_classification')).toEqual([...EVIDENCE_CLASSIFICATIONS]);
    expect(await values('verse_coverage_status')).toEqual([...VERSE_COVERAGE_STATUSES]);
    expect(await values('constraint_relation')).toEqual([...CONSTRAINT_RELATIONS]);
  });

  it('has PostGIS available', async () => {
    const r = await one(sql<{ v: string }[]>`select postgis_lib_version() as v`);
    expect(r.v).toMatch(/^3\./);
  });

  it('rejects passage references to non-canonical verses', async () => {
    await expect(
      sql`insert into passage_refs (id, start_ref, end_ref, start_index, end_index) values ('Bel.1.1', 'Bel.1.1', 'Bel.1.1', 0, 0)`,
    ).rejects.toThrow(/foreign key/);
  });

  it('rejects invalid enum values', async () => {
    await expect(sql`update verse_coverage set status = 'done' where ref = 'Gen.1.1'`).rejects.toThrow(/enum/);
  });

  it('stores and queries PostGIS geometry for location hypotheses (fixture, rolled back)', async () => {
    await rollback(async (tx) => {
      const placeId = newId('location');
      const hypId = newId('locationHypothesis');
      await tx`insert into places (id, slug, primary_name, is_fixture) values (${placeId}, 'fixture-place', 'Fixture', true)`;
      await tx`insert into location_hypotheses (id, place_id, label, geom, confidence, is_fixture)
               values (${hypId}, ${placeId}, 'fixture point', ST_SetSRID(ST_MakePoint(35.0, 32.0), 4326), 'possible', true)`;
      const r = await one(tx<{ x: number; y: number }[]>`
        select ST_X(geom) as x, ST_Y(geom) as y from location_hypotheses where id = ${hypId}`);
      expect(r).toEqual({ x: 35, y: 32 });
    });
  });

  it('supports passage range queries via canon_index (Isaiah 44:28–45:1 spans a chapter boundary)', async () => {
    const r = await one(sql<{ n: number }[]>`
      select count(*)::int as n from verses
      where canon_index between (select canon_index from verses where ref = 'Isa.44.28')
                            and (select canon_index from verses where ref = 'Isa.45.1')`);
    expect(r.n).toBe(2);
  });

  it('enforces chronology foreign keys (reign requires an existing person and kingdom)', async () => {
    await expect(
      sql`insert into ruler_reigns (id, person_id, kingdom_id, precision) values (${newId('reign')}, 'per_missing', 'kgd_missing', 'reign')`,
    ).rejects.toThrow(/foreign key/);
  });
});
