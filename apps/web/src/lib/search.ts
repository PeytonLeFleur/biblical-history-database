/** Small client-side ranked search (no dependencies). */
export interface SearchItem { type: string; title: string; subtitle: string; url: string; text: string }

const STOP = new Set(['the', 'of', 'a', 'an', 'in', 'during', 'and', 'to', 'at', 'on', 'archaeology', 'days']);
export const normalize = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9 ]+/g, ' ');
const tokens = (s: string) => normalize(s).split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));

export function search(items: SearchItem[], query: string): SearchItem[] {
  const q = tokens(query);
  if (!q.length) return [];
  const scored = items.map((it) => {
    const title = normalize(it.title);
    const text = normalize(`${it.title} ${it.text}`);
    let score = 0;
    let matched = 0;
    for (const t of q) {
      const re = new RegExp(`\\b${t}`);
      if (re.test(title)) { score += 3; matched++; }
      else if (re.test(text)) { score += 1; matched++; }
    }
    // Require every significant term to match somewhere.
    return { it, score: matched === q.length ? score + (it.type === 'Event' ? 1 : 0) : 0 };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.it);
}
