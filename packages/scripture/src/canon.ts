/**
 * The 66-book Protestant canon (SPEC 5.1) in standard English order.
 * Chapter counts follow standard English Protestant numbering.
 * Verse counts are NOT hardcoded here — they come from the imported verse inventory.
 */

export type Testament = 'OT' | 'NT';

export interface CanonBook {
  order: number;
  osis: string;
  usfm: string;
  name: string;
  slug: string;
  testament: Testament;
  chapters: number;
}

type Row = [osis: string, usfm: string, name: string, chapters: number];

const OT: Row[] = [
  ['Gen', 'GEN', 'Genesis', 50],
  ['Exod', 'EXO', 'Exodus', 40],
  ['Lev', 'LEV', 'Leviticus', 27],
  ['Num', 'NUM', 'Numbers', 36],
  ['Deut', 'DEU', 'Deuteronomy', 34],
  ['Josh', 'JOS', 'Joshua', 24],
  ['Judg', 'JDG', 'Judges', 21],
  ['Ruth', 'RUT', 'Ruth', 4],
  ['1Sam', '1SA', '1 Samuel', 31],
  ['2Sam', '2SA', '2 Samuel', 24],
  ['1Kgs', '1KI', '1 Kings', 22],
  ['2Kgs', '2KI', '2 Kings', 25],
  ['1Chr', '1CH', '1 Chronicles', 29],
  ['2Chr', '2CH', '2 Chronicles', 36],
  ['Ezra', 'EZR', 'Ezra', 10],
  ['Neh', 'NEH', 'Nehemiah', 13],
  ['Esth', 'EST', 'Esther', 10],
  ['Job', 'JOB', 'Job', 42],
  ['Ps', 'PSA', 'Psalms', 150],
  ['Prov', 'PRO', 'Proverbs', 31],
  ['Eccl', 'ECC', 'Ecclesiastes', 12],
  ['Song', 'SNG', 'Song of Solomon', 8],
  ['Isa', 'ISA', 'Isaiah', 66],
  ['Jer', 'JER', 'Jeremiah', 52],
  ['Lam', 'LAM', 'Lamentations', 5],
  ['Ezek', 'EZK', 'Ezekiel', 48],
  ['Dan', 'DAN', 'Daniel', 12],
  ['Hos', 'HOS', 'Hosea', 14],
  ['Joel', 'JOL', 'Joel', 3],
  ['Amos', 'AMO', 'Amos', 9],
  ['Obad', 'OBA', 'Obadiah', 1],
  ['Jonah', 'JON', 'Jonah', 4],
  ['Mic', 'MIC', 'Micah', 7],
  ['Nah', 'NAM', 'Nahum', 3],
  ['Hab', 'HAB', 'Habakkuk', 3],
  ['Zeph', 'ZEP', 'Zephaniah', 3],
  ['Hag', 'HAG', 'Haggai', 2],
  ['Zech', 'ZEC', 'Zechariah', 14],
  ['Mal', 'MAL', 'Malachi', 4],
];

const NT: Row[] = [
  ['Matt', 'MAT', 'Matthew', 28],
  ['Mark', 'MRK', 'Mark', 16],
  ['Luke', 'LUK', 'Luke', 24],
  ['John', 'JHN', 'John', 21],
  ['Acts', 'ACT', 'Acts', 28],
  ['Rom', 'ROM', 'Romans', 16],
  ['1Cor', '1CO', '1 Corinthians', 16],
  ['2Cor', '2CO', '2 Corinthians', 13],
  ['Gal', 'GAL', 'Galatians', 6],
  ['Eph', 'EPH', 'Ephesians', 6],
  ['Phil', 'PHP', 'Philippians', 4],
  ['Col', 'COL', 'Colossians', 4],
  ['1Thess', '1TH', '1 Thessalonians', 5],
  ['2Thess', '2TH', '2 Thessalonians', 3],
  ['1Tim', '1TI', '1 Timothy', 6],
  ['2Tim', '2TI', '2 Timothy', 4],
  ['Titus', 'TIT', 'Titus', 3],
  ['Phlm', 'PHM', 'Philemon', 1],
  ['Heb', 'HEB', 'Hebrews', 13],
  ['Jas', 'JAS', 'James', 5],
  ['1Pet', '1PE', '1 Peter', 5],
  ['2Pet', '2PE', '2 Peter', 3],
  ['1John', '1JN', '1 John', 5],
  ['2John', '2JN', '2 John', 1],
  ['3John', '3JN', '3 John', 1],
  ['Jude', 'JUD', 'Jude', 1],
  ['Rev', 'REV', 'Revelation', 22],
];

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const CANON: readonly CanonBook[] = [
  ...OT.map((r, i) => ({ r, testament: 'OT' as const, order: i + 1 })),
  ...NT.map((r, i) => ({ r, testament: 'NT' as const, order: OT.length + i + 1 })),
].map(({ r: [osis, usfm, name, chapters], testament, order }) => ({
  order,
  osis,
  usfm,
  name,
  slug: slugify(name),
  testament,
  chapters,
}));

const byOsis = new Map(CANON.map((b) => [b.osis, b]));
const byUsfm = new Map(CANON.map((b) => [b.usfm, b]));
const byKey = new Map<string, CanonBook>();
for (const b of CANON) {
  for (const k of [b.osis, b.usfm, b.name, b.slug, b.name.replace(/\s+/g, '')]) {
    byKey.set(k.toLowerCase(), b);
  }
}
// Common alternate names
byKey.set('song of songs', byOsis.get('Song')!);
byKey.set('psalm', byOsis.get('Ps')!);
byKey.set('revelations', byOsis.get('Rev')!);

export const bookByOsis = (osis: string) => byOsis.get(osis);
export const bookByUsfm = (usfm: string) => byUsfm.get(usfm.toUpperCase());

/** Resolve a book from OSIS, USFM, English name, or slug (case-insensitive). */
export function findBook(input: string): CanonBook | undefined {
  return byKey.get(input.trim().toLowerCase().replace(/-/g, ' ')) ?? byKey.get(input.trim().toLowerCase());
}
