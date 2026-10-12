/**
 * Seed the scripture foundation: books, chapters, canonical verses, coverage (not_reviewed), translations,
 * WEB text (unchanged), and versification mappings. Idempotent — never resets existing coverage statuses.
 * Reads the outputs of `pnpm scripture:import` from data/seed/scripture/.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CANON } from '@atlas/scripture';
import { connect } from './client.ts';

const SEED = resolve(import.meta.dirname, '../../../data/seed/scripture');
const readJson = <T>(p: string): T => JSON.parse(readFileSync(join(SEED, p), 'utf8')) as T;

interface Inventory {
  total_verses: number;
  books: Array<{ osis: string; chapters: number; verses_per_chapter: number[]; total: number }>;
}
interface WebBook {
  book: string;
  chapters: Record<string, Record<string, string>>;
}
interface WebVersification {
  mappings: Array<{ web: string; canonical: string; note: string }>;
}

const BATCH = 2000;

async function main() {
  const { sql } = connect();
  const inventory = readJson<Inventory>('verse-inventory.json');
  const versification = readJson<WebVersification>('versification/web.json');

  await sql.begin(async (tx) => {
    await tx`insert into books ${tx(
      CANON.map((b) => ({
        osis: b.osis,
        usfm: b.usfm,
        name: b.name,
        slug: b.slug,
        testament: b.testament,
        canon_order: b.order,
        chapter_count: b.chapters,
      })),
    )} on conflict (osis) do nothing`;

    const chapterRows = inventory.books.flatMap((b) =>
      b.verses_per_chapter.map((count, i) => ({ id: `${b.osis}.${i + 1}`, book: b.osis, number: i + 1, verse_count: count })),
    );
    await tx`insert into chapters ${tx(chapterRows)} on conflict (id) do nothing`;

    let canonIndex = 0;
    const verseRows = inventory.books.flatMap((b) =>
      b.verses_per_chapter.flatMap((count, ci) =>
        Array.from({ length: count }, (_, vi) => ({
          ref: `${b.osis}.${ci + 1}.${vi + 1}`,
          book: b.osis,
          chapter_id: `${b.osis}.${ci + 1}`,
          chapter: ci + 1,
          verse: vi + 1,
          canon_index: ++canonIndex,
        })),
      ),
    );
    for (let i = 0; i < verseRows.length; i += BATCH) {
      const batch = verseRows.slice(i, i + BATCH);
      await tx`insert into verses ${tx(batch)} on conflict (ref) do nothing`;
      await tx`insert into verse_coverage ${tx(batch.map((v) => ({ ref: v.ref })))} on conflict (ref) do nothing`;
    }

    await tx`insert into translations ${tx([
      {
        id: 'WEB',
        name: 'World English Bible',
        edition: 'engwebp (Protestant, eBible.org)',
        license: 'Public domain ("World English Bible" is a trademark of eBible.org)',
        source_url: 'https://ebible.org/find/details.php?id=engwebp',
        stored_locally: true,
        notes: 'Imported unchanged. Default locally stored text (SPEC 5.2).',
      },
      {
        id: 'ESV',
        name: 'English Standard Version',
        edition: null,
        license: 'Copyright Crossway. Not stored. Reference or authorized API only.',
        source_url: 'https://www.esv.org/',
        stored_locally: false,
        notes: 'Owner-preferred translation #1.',
      },
      {
        id: 'NKJV',
        name: 'New King James Version',
        edition: null,
        license: 'Copyright Thomas Nelson. Not stored. Reference only.',
        source_url: null,
        stored_locally: false,
        notes: 'Owner-preferred translation #2.',
      },
    ])} on conflict (id) do nothing`;

    const canonicalOf = new Map(versification.mappings.map((m) => [m.web, m.canonical]));
    const relocatedTargets = new Set(versification.mappings.map((m) => m.canonical));
    const textRows: Array<{ translation: string; translation_ref: string; canonical_ref: string | null; text: string }> = [];
    for (const b of CANON) {
      const web = readJson<WebBook>(`web/${b.osis}.json`);
      for (const [ch, versesInCh] of Object.entries(web.chapters)) {
        for (const [vs, text] of Object.entries(versesInCh)) {
          const ref = `${b.osis}.${ch}.${vs}`;
          // An empty WEB placeholder at a position whose text was relocated has no canonical counterpart of its own.
          const canonical = canonicalOf.get(ref) ?? (relocatedTargets.has(ref) && text.trim() === '' ? null : ref);
          textRows.push({ translation: 'WEB', translation_ref: ref, canonical_ref: canonical, text });
        }
      }
    }
    for (let i = 0; i < textRows.length; i += BATCH) {
      await tx`insert into verse_texts ${tx(textRows.slice(i, i + BATCH))}
        on conflict (translation, translation_ref) do update set text = excluded.text, canonical_ref = excluded.canonical_ref`;
    }

    await tx`insert into versification_mappings ${tx(
      versification.mappings.map((m) => ({
        translation: 'WEB',
        translation_ref: m.web,
        canonical_ref: m.canonical,
        tradition: 'Majority Text placement',
        note: m.note,
      })),
    )} on conflict (translation, translation_ref) do nothing`;
  });

  const [counts] = await sql<[{ books: number; chapters: number; verses: number; coverage: number; texts: number }]>`
    select (select count(*)::int from books) as books, (select count(*)::int from chapters) as chapters,
           (select count(*)::int from verses) as verses, (select count(*)::int from verse_coverage) as coverage,
           (select count(*)::int from verse_texts) as texts`;
  console.log('Seeded:', counts);
  await sql.end();
}

await main();
