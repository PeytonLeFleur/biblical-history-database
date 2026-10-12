/** Generate a human-readable dossier strictly from structured research data (rules/05 §5, SPEC 15.2). */
import { formatInterval } from '@atlas/shared';
import { displayPassage, parsePassageRef } from '@atlas/scripture';
import { solveAllModels } from './chronology.ts';
import type { ResearchStore } from './store.ts';

const CLASS_LABEL: Record<string, string> = {
  independently_corroborated: 'Independently corroborated',
  strongly_supported: 'Strongly supported',
  historically_plausible: 'Historically plausible',
  disputed: 'Disputed',
  no_independent_corroboration_found: 'No independent corroboration found',
  contradicted_by_available_evidence: 'Contradicted by available evidence',
  not_empirically_testable: 'Not empirically testable',
};

const LEVEL_LABEL: Record<string, string> = {
  unpublished: 'Unpublished draft',
  preliminary: 'Preliminary research',
  researched: 'Researched — not human reviewed',
  human_reviewed: 'Reviewed by project owner',
};

export function renderDossier(store: ResearchStore, id: string): string {
  const ev = store.event(id);
  const ctx = store.context(id);
  const evd = store.evidence(id);
  const xr = store.crossrefs(id);
  const val = store.validation(id);
  const sources = new Map(store.sources().map((s) => [s.id, s]));
  const entities = new Map(store.entities().map((e) => [e.id, e]));
  const cited: string[] = [];
  const cite = (ids: string[]) => {
    const nums = ids.map((s) => {
      if (!cited.includes(s)) cited.push(s);
      return cited.indexOf(s) + 1;
    });
    return nums.length ? ` [${[...new Set(nums)].join(', ')}]` : '';
  };
  const passage = (ref: string) => displayPassage(parsePassageRef(ref));
  const name = (eid: string): string => {
    if (eid.startsWith('evt_')) {
      try {
        return eid === id ? 'this event' : store.event(eid).title;
      } catch {
        return eid;
      }
    }
    const e = entities.get(eid);
    if (!e) return eid;
    if (e.kind === 'reign') {
      const model = e.model_id ? entities.get(e.model_id) : undefined;
      return `reign of ${name(e.person_id)}${model && 'name' in model ? ` (${model.name})` : ''}`;
    }
    return e.kind === 'person' ? e.canonical_name : e.kind === 'place' ? e.primary_name : 'name' in e ? e.name : eid;
  };
  const L: string[] = [];
  L.push(`# ${ev.title}`, '');
  L.push(`> **Status:** ${LEVEL_LABEL[ev.publication_level]} · research status \`${ev.research_status}\` · revision ${ev.revision} · last reviewed: ${ev.last_reviewed_at ?? 'not reviewed'}`);
  L.push('> Programmatic validation is not historical verification. Classifications are machine-proposed unless marked as owner-reviewed.', '');
  L.push('## Biblical references', '');
  for (const m of ev.mentions) L.push(`- ${passage(m.passage)} (${m.mention_type})${m.notes ? `: ${m.notes}` : ''}`);
  L.push('', '## Biblical account', '', ctx?.text_summary.body ?? ev.summary, '');
  if (ctx) {
    L.push('## Historical setting', '', `**Period:** ${ctx.setting.period}`, '', `${ctx.setting.body}${cite(ctx.setting.citations)}`, '');
    if (ctx.rulers.length) {
      L.push('### Rulers', '');
      for (const r of ctx.rulers) L.push(`- ${name(r.person_id)}: ${r.role}${cite(r.citations)}`);
      L.push('');
    }
    L.push('## Date and chronology', '');
    // Computed by the deterministic solver for every chronology model (SPEC 12.3, 12.9).
    const describe = (ids: string[]) =>
      ids.map((d) => {
        const c = ctx.constraints.find((x) => x.id === d);
        if (c) return `“${c.textual_assertion}”`;
        const base = d.split('#')[0]!;
        return entities.has(base) ? `${name(base)} (${d.includes('#start') ? 'reign start' : d.includes('#end') ? 'reign end' : 'anchor'})` : d;
      }).join(' → ');
    let computed = false;
    for (const [model, results] of solveAllModels(store)) {
      for (const r of results) {
        const iv = r.intervals.get(id);
        if (!iv || iv.years.earliest === null && iv.years.latest === null) continue;
        computed = true;
        const label = model ? name(model) : 'model-independent';
        L.push(`- **${formatInterval(iv.years)}** — computed under *${label}*${r.feasible ? '' : ' (INFEASIBLE)'}; precision: ${iv.precision}`);
        L.push(`  - Earliest bound from: ${describe(iv.start.earliest.derivation) || '—'}`);
        L.push(`  - Latest bound from: ${describe(iv.start.latest.derivation) || '—'}`);
      }
    }
    if (computed) L.push('', '*Computed ranges are reconstructions that depend on the named chronology model and the stated assumptions. They are not independent dates.*', '');
    if (!ctx.date_hypotheses.length && !computed) L.push('No date hypothesis recorded.');
    for (const h of ctx.date_hypotheses) {
      L.push(`- **${formatInterval(h.interval)}** (${h.precision}; model: ${h.model_id ? name(h.model_id) : 'model-independent'})${cite(h.citations)}`, `  - Derivation: ${h.derivation}`);
    }
    if (ctx.constraints.length) {
      L.push('', '**Chronological statements:**', '');
      for (const c of ctx.constraints) L.push(`- “${c.textual_assertion}”${c.passage ? ` (${passage(c.passage)})` : ''} → \`${c.relation}\` ${name(c.object)}${c.assumptions.length ? `; assumptions: ${c.assumptions.join('; ')}` : ''}${cite(c.citations)}`);
    }
    L.push('');
    if (ctx.locations.length) {
      L.push('## Geography', '');
      for (const l of ctx.locations) {
        const p = entities.get(l.location_id);
        L.push(`- ${name(l.location_id)} (${l.role}; confidence: ${l.confidence})`);
        if (p?.kind === 'place') for (const h of p.hypotheses) L.push(`  - ${h.label}: ${h.confidence}${h.geom_source_id ? cite([h.geom_source_id]) : ''}`);
      }
      L.push('');
    }
    if (ctx.competing_reconstructions.length) {
      L.push('## Competing reconstructions', '');
      for (const r of ctx.competing_reconstructions) L.push(`- **${r.label}** (${r.proponents.join(', ')}): ${r.summary}${cite(r.citations)}`);
      L.push('');
    }
  }
  if (evd) {
    L.push('## Claims and evidence', '');
    for (const c of evd.claims) {
      L.push(`### ${c.statement}`, '', `**Classification:** ${CLASS_LABEL[c.classification]} (${c.reviewer_status.replace('_', ' ')}) · layer: ${c.layer}`, '', c.reasoning, '');
      const items = [
        ...c.supporting_evidence.map((x) => ['Supporting', x] as const),
        ...c.counterevidence.map((x) => ['Challenging', x] as const),
        ...c.contextual_evidence.map((x) => ['Context', x] as const),
      ];
      for (const [label, eid] of items) {
        const e = evd.evidence.find((x) => x.id === eid);
        if (e) L.push(`- *${label} (${e.strength}):* ${e.finding}${e.locator ? ` (${e.locator})` : ''}${cite([e.source_id])}`);
      }
      if (c.limitations.length) L.push('', `*Limitations:* ${c.limitations.join(' ')}`);
      L.push('');
    }
  }
  if (xr?.relationships.length) {
    L.push('## Related passages and events', '');
    for (const r of xr.relationships) {
      const end = (x: typeof r.to) => (x.kind === 'passage' ? passage(x.ref) : name(x.id));
      L.push(`- ${end(r.from)} → **${r.type.replaceAll('_', ' ')}** → ${end(r.to)} (${r.confidence}): ${r.rationale}${cite(r.provenance.citations)}`);
    }
    L.push('');
  }
  if (ctx?.commentary.length) {
    L.push('## Commentary (interpretation, not historical evidence)', '');
    for (const c of ctx.commentary) L.push(`- ${c.paraphrase}${cite([c.source_id])}`);
    L.push('');
  }
  const gaps = [...(evd?.research_gaps ?? []), ...(ctx?.open_questions ?? [])];
  if (gaps.length) {
    L.push('## Unanswered questions and research gaps', '');
    for (const g of gaps) L.push(`- ${g}`);
    L.push('');
  }
  if (val?.disputes.length) {
    L.push('## Disputes', '');
    for (const d of val.disputes) L.push(`- ${d}`);
    L.push('');
  }
  L.push('## Sources', '');
  cited.forEach((sid, i) => {
    const s = sources.get(sid);
    if (!s) return L.push(`${i + 1}. ${sid} (unregistered)`);
    const bits = [s.authors.join(', '), s.title, s.journal, s.publisher, s.published_date].filter(Boolean).join('. ');
    L.push(`${i + 1}. ${bits}.${s.doi ? ` doi:${s.doi}` : ''}${s.url ? ` <${s.url}>` : ''} — *${s.source_type.replaceAll('_', ' ')}; verification: ${s.verification_level.replaceAll('_', ' ')}*`);
  });
  return L.join('\n') + '\n';
}
