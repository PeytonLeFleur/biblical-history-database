import { data, entitiesOf, passageLabel, url, CANON } from '../lib/data';

/** Build-time search index: only published research records plus the canonical book list. */
export function GET() {
  const items: Array<{ type: string; title: string; subtitle: string; url: string; text: string }> = [];
  for (const b of data().events) {
    const e = b.event;
    items.push({
      type: 'Event', title: e.title, url: url(`events/${e.slug}/`),
      subtitle: e.mentions.map((m) => passageLabel(m.passage)).join(' · '),
      text: [e.title, e.summary, e.categories.join(' '), ...e.mentions.map((m) => passageLabel(m.passage)), ...(b.evidence?.claims.map((c) => c.statement) ?? []),
        ...(b.context?.rulers.map((r) => data().entities.find((x) => x.id === r.person_id)).map((p) => (p && p.kind === 'person' ? [p.canonical_name, ...p.aliases.map((a) => a.alias)].join(' ') : '')) ?? []),
        ...(b.context?.competing_reconstructions.map((r) => r.label) ?? [])].join(' '),
    });
  }
  for (const p of entitiesOf('person')) items.push({ type: 'Person', title: p.canonical_name, subtitle: p.description ?? '', url: url(`people/${p.slug}/`), text: [p.canonical_name, ...p.aliases.map((a) => a.alias), p.description].join(' ') });
  for (const k of entitiesOf('kingdom')) items.push({ type: 'Kingdom', title: k.name, subtitle: k.description ?? '', url: url(`kingdoms/${k.slug}/`), text: [k.name, k.description].join(' ') });
  for (const p of entitiesOf('place')) items.push({ type: 'Place', title: p.primary_name, subtitle: p.modern_name ?? '', url: url('map/'), text: [p.primary_name, p.modern_name, ...p.ancient_names.map((n) => n.name), ...p.hypotheses.map((h) => h.label)].join(' ') });
  for (const a of entitiesOf('artifact')) items.push({ type: 'Artifact', title: a.name, subtitle: [a.artifact_type, a.current_institution].filter(Boolean).join(' · '), url: url(`artifacts/#${a.id}`), text: [a.name, a.description, a.accession_number].join(' ') });
  for (const d of entitiesOf('document')) items.push({ type: 'Ancient document', title: d.name, subtitle: d.standard_reference ?? '', url: url('artifacts/'), text: [d.name, d.standard_reference, d.description].join(' ') });
  for (const p of entitiesOf('prophecy')) items.push({ type: 'Prophecy', title: p.title, subtitle: passageLabel(p.passage), url: url(`prophecies/#${p.id}`), text: [p.title, p.description, p.in_text_interpretation, ...p.interpretations.map((i) => `${i.label} ${i.summary}`)].join(' ') });
  for (const v of entitiesOf('vision')) items.push({ type: 'Vision', title: v.title, subtitle: passageLabel(v.passage), url: url('prophecies/'), text: [v.title, v.description, ...v.symbols.map((s) => `${s.symbol} ${s.description}`)].join(' ') });
  for (const s of entitiesOf('synchronism')) items.push({ type: 'Synchronism', title: s.title, subtitle: s.external_entity, url: url('timeline/'), text: [s.title, s.external_entity, s.proposed_synchronization].join(' ') });
  for (const s of data().sources) items.push({ type: 'Source', title: s.title, subtitle: [s.authors.join(', '), s.published_date].filter(Boolean).join(' · '), url: url(`sources/#${s.id}`), text: [s.title, ...s.authors, s.journal, s.publisher, s.source_type.replaceAll('_', ' ')].join(' ') });
  for (const x of data().extraction) for (const c of x.candidates) items.push({ type: 'Extracted candidate', title: c.title, subtitle: `${passageLabel(c.passage)} · extraction only`, url: url(`books/${x.slug}/${x.chapter}/`), text: [c.title, c.description, ...c.participants.map((p) => p.name_as_written), ...c.locations.map((l) => l.name_as_written)].join(' ') });
  const books = CANON.map((b) => ({ osis: b.osis, slug: b.slug, name: b.name, chapters: b.chapters }));
  return new Response(JSON.stringify({ items, books }), { headers: { 'Content-Type': 'application/json' } });
}
