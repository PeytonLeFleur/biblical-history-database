/** Client-safe Bible reference resolution (no Node APIs). */
export interface BookLite { osis: string; slug: string; name: string; chapters: number }

const ALIASES: Record<string, string> = {
  gen: 'Gen', ex: 'Exod', exo: 'Exod', lev: 'Lev', num: 'Num', deut: 'Deut', dt: 'Deut', josh: 'Josh', judg: 'Judg', ps: 'Ps', psalm: 'Ps', psa: 'Ps',
  prov: 'Prov', eccl: 'Eccl', song: 'Song', 'song of songs': 'Song', isa: 'Isa', jer: 'Jer', lam: 'Lam', ezek: 'Ezek', eze: 'Ezek', dan: 'Dan',
  hos: 'Hos', obad: 'Obad', mic: 'Mic', nah: 'Nah', hab: 'Hab', zeph: 'Zeph', hag: 'Hag', zech: 'Zech', zec: 'Zech', mal: 'Mal',
  matt: 'Matt', mt: 'Matt', mk: 'Mark', lk: 'Luke', jn: 'John', rom: 'Rom', gal: 'Gal', eph: 'Eph', phil: 'Phil', col: 'Col',
  heb: 'Heb', jas: 'Jas', rev: 'Rev', revelations: 'Rev',
};

export function resolveReference(input: string, books: BookLite[]): { slug: string; osis: string; name: string; chapter: number; verse: number | null } | null {
  const m = /^\s*([1-3]?\s*[a-zA-Z][a-zA-Z .]*?)\s*\.?\s*(\d+)(?:\s*[:.]\s*(\d+))?\s*$/.exec(input);
  if (!m) return null;
  const raw = m[1]!.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const compact = raw.replace(/\s+/g, '');
  const book =
    books.find((b) => b.name.toLowerCase() === raw || b.slug === raw.replace(/\s/g, '-') || b.osis.toLowerCase() === compact) ??
    books.find((b) => b.osis === ALIASES[raw] || b.osis === ALIASES[compact]) ??
    books.find((b) => b.name.toLowerCase().replace(/\s/g, '').startsWith(compact) && compact.length >= 3);
  if (!book) return null;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  return { slug: book.slug, osis: book.osis, name: book.name, chapter, verse: m[3] ? Number(m[3]) : null };
}
