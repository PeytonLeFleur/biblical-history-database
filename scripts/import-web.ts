/**
 * Import the World English Bible, Protestant edition (eBible.org `engwebp`, public domain), UNCHANGED (SPEC 5.2),
 * and derive the canonical English verse inventory (SPEC 5.3).
 *
 * Input:  data/imports/raw/engwebp/engwebp_vpl.txt  (gitignored download; see data/imports/README.md)
 * Output: data/seed/scripture/web/<OSIS>.json
 *         data/seed/scripture/verse-inventory.json
 *         data/seed/scripture/versification/web.json
 *
 * Canonical numbering = standard English Protestant (KJV/NKJV/ESV tradition). Where WEB numbering differs,
 * the difference is recorded as a translation-specific mapping — the WEB text itself is never altered.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CANON } from '@atlas/scripture';
import { validateVerseInventory } from '../packages/validation/src/index.ts';

const ROOT = resolve(import.meta.dirname, '..');
const RAW = join(ROOT, 'data/imports/raw/engwebp/engwebp_vpl.txt');
const OUT = join(ROOT, 'data/seed/scripture');

const LINE_RE = /^([1-3A-Z]{3}) (\d+):(\d+) ?(.*)$/;

interface Row {
  code: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * WEB places the Romans doxology at 14:24–26 (Majority Text position) and leaves 16:25 as an empty
 * placeholder with no 16:26–27. Standard English numbering has it at 16:25–27.
 */
const WEB_TO_CANONICAL: Array<{ web: string; canonical: string; note: string }> = [
  { web: 'Rom.14.24', canonical: 'Rom.16.25', note: 'Romans doxology: WEB follows Majority Text placement after 14:23.' },
  { web: 'Rom.14.25', canonical: 'Rom.16.26', note: 'Romans doxology.' },
  { web: 'Rom.14.26', canonical: 'Rom.16.27', note: 'Romans doxology.' },
];

function main() {
  const raw = readFileSync(RAW, 'utf8');
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const rows: Row[] = [];
  for (const [i, line] of raw.split(/\r?\n/).entries()) {
    if (line.length === 0) continue;
    const m = LINE_RE.exec(line);
    if (!m) throw new Error(`Unparseable line ${i + 1}: ${line.slice(0, 60)}`);
    rows.push({ code: m[1]!, chapter: Number(m[2]), verse: Number(m[3]), text: m[4]! });
  }

  // VPL uses BibleWorks-style codes (SOL, EZE, JOE, …). Map them by canonical order and assert exactly 66.
  const codes = [...new Set(rows.map((r) => r.code))];
  if (codes.length !== CANON.length) throw new Error(`Expected 66 books, found ${codes.length}`);
  const osisOf = new Map(codes.map((c, i) => [c, CANON[i]!.osis]));

  const webRef = (r: Row) => `${osisOf.get(r.code)}.${r.chapter}.${r.verse}`;
  const webRefs = new Set(rows.map(webRef));
  const emptyInWeb = rows.filter((r) => r.text.trim() === '').map(webRef);

  // Per-book WEB text files — text exactly as distributed.
  mkdirSync(join(OUT, 'web'), { recursive: true });
  for (const book of CANON) {
    const chapters: Record<string, Record<string, string>> = {};
    for (const r of rows.filter((x) => osisOf.get(x.code) === book.osis)) {
      (chapters[r.chapter] ??= {})[r.verse] = r.text;
    }
    writeFileSync(
      join(OUT, 'web', `${book.osis}.json`),
      JSON.stringify({ book: book.osis, edition: 'engwebp', numbering: 'WEB', chapters }) + '\n',
    );
  }

  // Canonical inventory: WEB refs, minus WEB-only positions, plus canonical positions WEB numbers differently.
  const mappedWeb = new Set(WEB_TO_CANONICAL.map((m) => m.web));
  for (const m of WEB_TO_CANONICAL) {
    if (!webRefs.has(m.web)) throw new Error(`Mapping source ${m.web} not present in WEB; upstream changed?`);
  }
  const canonical = rows.map(webRef).filter((ref) => !mappedWeb.has(ref));
  for (const m of WEB_TO_CANONICAL) if (!canonical.includes(m.canonical)) canonical.push(m.canonical);

  const order = new Map(CANON.map((b) => [b.osis, b.order]));
  const parse = (ref: string) => {
    const [book, ch, vs] = ref.split('.') as [string, string, string];
    return { book, chapter: Number(ch), verse: Number(vs) };
  };
  canonical.sort((a, b) => {
    const x = parse(a);
    const y = parse(b);
    return order.get(x.book)! - order.get(y.book)! || x.chapter - y.chapter || x.verse - y.verse;
  });

  const report = validateVerseInventory(canonical.map(parse));
  if (!report.ok) throw new Error(`Canonical inventory invalid:\n${report.errors.join('\n')}`);

  // WEB → canonical mapping for every canonical verse whose WEB text lives elsewhere or is absent.
  const textSource = (ref: string) => {
    const m = WEB_TO_CANONICAL.find((x) => x.canonical === ref);
    if (m) return m.web;
    return webRefs.has(ref) ? ref : null;
  };

  const inventory = {
    numbering: 'Standard English Protestant (KJV/NKJV tradition)',
    derived_from: 'engwebp VPL with documented versification mappings',
    total_verses: canonical.length,
    books: CANON.map((b) => {
      const refs = canonical.filter((r) => r.startsWith(`${b.osis}.`));
      const perChapter = Array.from({ length: b.chapters }, (_, i) => refs.filter((r) => parse(r).chapter === i + 1).length);
      return { osis: b.osis, chapters: b.chapters, verses_per_chapter: perChapter, total: refs.length };
    }),
  };
  writeFileSync(join(OUT, 'verse-inventory.json'), JSON.stringify(inventory, null, 1) + '\n');

  mkdirSync(join(OUT, 'versification'), { recursive: true });
  writeFileSync(
    join(OUT, 'versification', 'web.json'),
    JSON.stringify(
      {
        translation: 'WEB',
        edition: 'engwebp',
        mappings: WEB_TO_CANONICAL,
        web_only_positions: [...mappedWeb],
        canonical_without_web_position: canonical.filter((r) => textSource(r) === null),
        empty_in_web: emptyInWeb.map((ref) => ({
          web_ref: ref,
          note: mappedWeb.has(ref) || WEB_TO_CANONICAL.some((m) => m.canonical === ref)
            ? 'Text relocated; see mappings.'
            : 'WEB omits this verse from the main text (textual variant); canonical position retained.',
        })),
      },
      null,
      1,
    ) + '\n',
  );

  console.log(`WEB rows: ${rows.length}`);
  console.log(`Canonical verses: ${canonical.length}`);
  console.log(`Empty in WEB: ${emptyInWeb.join(', ')}`);
  console.log(`Source sha256: ${sha256}`);
}

main();
