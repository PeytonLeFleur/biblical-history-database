import { describe, expect, it } from 'vitest';
import { CANON } from '@atlas/scripture';
import { resolveReference } from './refs';
import { search } from './search';

const books = CANON.map((b) => ({ osis: b.osis, slug: b.slug, name: b.name, chapters: b.chapters }));

describe('resolveReference', () => {
  it('parses names, abbreviations and numbered books', () => {
    expect(resolveReference('Amos 1:1', books)).toMatchObject({ slug: 'amos', chapter: 1, verse: 1 });
    expect(resolveReference('Zech 14:5', books)).toMatchObject({ slug: 'zechariah', chapter: 14, verse: 5 });
    expect(resolveReference('Daniel 5', books)).toMatchObject({ slug: 'daniel', chapter: 5, verse: null });
    expect(resolveReference('2 Kings 15:1', books)).toMatchObject({ slug: '2-kings', chapter: 15 });
    expect(resolveReference('1 John 4', books)).toMatchObject({ slug: '1-john' });
  });
  it('rejects non-references and out-of-range chapters', () => {
    expect(resolveReference('Belshazzar', books)).toBeNull();
    expect(resolveReference('Amos 10', books)).toBeNull();
    expect(resolveReference('Bel 1:1', books)).toBeNull();
  });
});

describe('search', () => {
  const items = [
    { type: 'Event', title: 'The earthquake in the days of Uzziah', subtitle: '', url: '/e', text: 'Amos 1:1 Zechariah 14:5 Azariah' },
    { type: 'Person', title: 'Uzziah', subtitle: '', url: '/p', text: 'Azariah king of Judah' },
  ];
  it('requires every significant term and ranks events first', () => {
    expect(search(items, 'Earthquake during Uzziah').map((i) => i.url)).toEqual(['/e']);
    expect(search(items, 'Azariah').map((i) => i.url).sort()).toEqual(['/e', '/p']);
    expect(search(items, 'Belshazzar')).toEqual([]);
  });
});
