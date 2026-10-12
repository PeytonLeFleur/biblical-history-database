/**
 * Idempotent importer: research files → PostgreSQL (rules/05 §1).
 * Keyed on permanent IDs; re-running converges. A revision-history row is written for each new record revision.
 */
import { connect } from '@atlas/database';
import { parsePassageRef } from '@atlas/scripture';
import type { ResearchStore } from './store.ts';

type Sql = ReturnType<typeof connect>['sql'];

export interface ImportSummary {
  [table: string]: number;
}

const DRY_RUN = '__atlas_dry_run_rollback__';

/** Import research files. With `dryRun`, everything runs inside a transaction that is rolled back. */
export async function importResearch(store: ResearchStore, opts: { url?: string; dryRun?: boolean } = {}): Promise<ImportSummary> {
  const { sql } = connect(opts.url);
  const n: ImportSummary = {};
  const bump = (t: string, k = 1) => (n[t] = (n[t] ?? 0) + k);
  try {
    await sql.begin(async (tx) => {
      const t = tx as unknown as Sql;
      const passage = async (ref: string) => {
        const p = parsePassageRef(ref);
        const s = `${p.start.book}.${p.start.chapter}.${p.start.verse}`;
        const e = `${p.end.book}.${p.end.chapter}.${p.end.verse}`;
        const id = s === e ? s : `${s}-${e}`;
        await t`insert into passage_refs (id, start_ref, end_ref, start_index, end_index)
          select ${id}, ${s}, ${e}, a.canon_index, b.canon_index from verses a, verses b where a.ref = ${s} and b.ref = ${e}
          on conflict (id) do nothing`;
        return id;
      };
      const history = async (kind: string, id: string, revision: number, snapshot: unknown) => {
        await t`insert into revision_history (record_kind, record_id, revision, changed_by, change_summary, snapshot)
          values (${kind}, ${id}, ${revision}, 'research-import', 'imported from research files', ${JSON.stringify(snapshot)}::jsonb)
          on conflict (record_kind, record_id, revision) do nothing`;
      };

      // Sources
      const sources = store.sources();
      for (const s of sources) {
        await t`insert into sources ${t({
          id: s.id, title: s.title, source_type: s.source_type, authors: s.authors, publisher: s.publisher, journal: s.journal,
          published_date: s.published_date, url: s.url, doi: s.doi, isbn: s.isbn, standard_reference: s.standard_reference,
          license: s.license, verification_level: s.verification_level, accessed_at: s.accessed_at, access_notes: s.access_notes,
          dedupe_key: `id:${s.id}`, retraction_status: s.retraction_status, is_fixture: s.is_fixture,
        })} on conflict (id) do update set title = excluded.title, verification_level = excluded.verification_level,
          accessed_at = excluded.accessed_at, access_notes = excluded.access_notes, retraction_status = excluded.retraction_status, updated_at = now()`;
        await t`delete from source_verifications where source_id = ${s.id}`;
        for (const v of s.verification_log) {
          await t`insert into source_verifications (source_id, level, verified_at, method, notes) values (${s.id}, ${v.level}, ${v.date}, ${v.method}, ${v.notes})`;
        }
        bump('sources');
      }
      for (const s of sources.filter((x) => x.source_type === 'news_report')) {
        await t`insert into news_reports (source_id, outlet, reports_on_source_id) values (${s.id}, ${s.outlet ?? 'unknown'}, ${s.reports_on_source_id})
          on conflict (source_id) do update set outlet = excluded.outlet, reports_on_source_id = excluded.reports_on_source_id`;
      }

      // Entities (FK order)
      const entities = store.entities();
      const ofKind = <K extends (typeof entities)[number]['kind']>(k: K) => entities.filter((e): e is Extract<(typeof entities)[number], { kind: K }> => e.kind === k);
      for (const k of ofKind('kingdom')) {
        await t`insert into kingdoms (id, slug, name, description, is_fixture, revision) values (${k.id}, ${k.slug}, ${k.name}, ${k.description}, ${k.is_fixture}, ${k.revision})
          on conflict (id) do update set slug = excluded.slug, name = excluded.name, description = excluded.description, revision = excluded.revision, updated_at = now()`;
        bump('kingdoms');
      }
      for (const p of ofKind('person')) {
        await t`insert into people (id, slug, canonical_name, description, kingdom_id, is_fixture, revision)
          values (${p.id}, ${p.slug}, ${p.canonical_name}, ${p.description}, ${p.kingdom_id}, ${p.is_fixture}, ${p.revision})
          on conflict (id) do update set slug = excluded.slug, canonical_name = excluded.canonical_name, description = excluded.description,
          kingdom_id = excluded.kingdom_id, revision = excluded.revision, updated_at = now()`;
        for (const a of p.aliases) {
          await t`insert into person_aliases (person_id, alias, language, source_id) values (${p.id}, ${a.alias}, ${a.language}, ${a.source_id})
            on conflict (person_id, alias) do nothing`;
        }
        await history('person', p.id, p.revision, p);
        bump('people');
      }
      for (const p of ofKind('place')) {
        await t`insert into places (id, slug, primary_name, place_type, modern_name, modern_country, kingdom_id, description, is_fixture, revision)
          values (${p.id}, ${p.slug}, ${p.primary_name}, ${p.place_type}, ${p.modern_name}, ${p.modern_country}, ${p.kingdom_id}, ${p.description}, ${p.is_fixture}, ${p.revision})
          on conflict (id) do update set primary_name = excluded.primary_name, modern_name = excluded.modern_name, description = excluded.description,
          revision = excluded.revision, updated_at = now()`;
        for (const a of p.ancient_names) {
          await t`insert into place_names (place_id, name, language, period, source_id) values (${p.id}, ${a.name}, ${a.language}, ${a.period}, ${a.source_id})
            on conflict (place_id, name, language) do nothing`;
        }
        for (const h of p.hypotheses) {
          await t`insert into location_hypotheses (id, place_id, label, geom, coordinate_precision, confidence, proponents, reasoning, geom_source_id, is_fixture)
            values (${h.id}, ${p.id}, ${h.label},
              ${h.lat === null ? null : t`ST_SetSRID(ST_MakePoint(${h.lon}, ${h.lat}), 4326)`},
              ${h.coordinate_precision}, ${h.confidence}, ${h.proponents}, ${h.reasoning}, ${h.geom_source_id}, ${p.is_fixture})
            on conflict (id) do update set label = excluded.label, geom = excluded.geom, confidence = excluded.confidence, reasoning = excluded.reasoning, updated_at = now()`;
        }
        await history('place', p.id, p.revision, p);
        bump('places');
      }
      for (const s of ofKind('site')) {
        await t`insert into archaeological_sites (id, slug, name, place_id, geom, geom_source_id, description, is_fixture, revision)
          values (${s.id}, ${s.slug}, ${s.name}, ${s.place_id}, ${s.lat === null ? null : t`ST_SetSRID(ST_MakePoint(${s.lon}, ${s.lat}), 4326)`}, ${s.geom_source_id}, ${s.description}, ${s.is_fixture}, ${s.revision})
          on conflict (id) do update set name = excluded.name, geom = excluded.geom, description = excluded.description, updated_at = now()`;
        bump('archaeological_sites');
      }
      for (const a of ofKind('artifact')) {
        await t`insert into artifacts (id, slug, name, artifact_type, findspot_site_id, current_institution, accession_number, date_earliest, date_latest,
            description, image_url, image_license, image_attribution, is_fixture, revision)
          values (${a.id}, ${a.slug}, ${a.name}, ${a.artifact_type}, ${a.findspot_site_id}, ${a.current_institution}, ${a.accession_number}, ${a.date.earliest},
            ${a.date.latest}, ${a.description}, ${a.image?.url ?? null}, ${a.image?.license ?? null}, ${a.image?.attribution ?? null}, ${a.is_fixture}, ${a.revision})
          on conflict (id) do update set name = excluded.name, description = excluded.description, current_institution = excluded.current_institution, updated_at = now()`;
        bump('artifacts');
      }
      for (const d of ofKind('document')) {
        await t`insert into primary_documents (id, slug, name, document_type, language, standard_reference, artifact_id, date_earliest, date_latest, description, is_fixture, revision)
          values (${d.id}, ${d.slug}, ${d.name}, ${d.document_type}, ${d.language}, ${d.standard_reference}, ${d.artifact_id}, ${d.date.earliest}, ${d.date.latest},
            ${d.description}, ${d.is_fixture}, ${d.revision})
          on conflict (id) do update set name = excluded.name, description = excluded.description, updated_at = now()`;
        bump('primary_documents');
      }
      for (const m of ofKind('chronology_model')) {
        await t`insert into chronology_models (id, slug, name, scope, textual_tradition, description, is_absolute_axis, is_fixture, revision)
          values (${m.id}, ${m.slug}, ${m.name}, ${m.scope}, ${m.textual_tradition}, ${m.description}, ${m.is_absolute_axis}, ${m.is_fixture}, ${m.revision})
          on conflict (id) do update set name = excluded.name, description = excluded.description, updated_at = now()`;
        bump('chronology_models');
      }
      const reigns = ofKind('reign');
      for (const r of reigns) {
        await t`insert into ruler_reigns (id, person_id, kingdom_id, model_id, title, start_earliest, start_latest, end_earliest, end_latest, precision,
            is_coregency, stated_length_years, notes, is_fixture, revision)
          values (${r.id}, ${r.person_id}, ${r.kingdom_id}, ${r.model_id}, ${r.title}, ${r.start.earliest}, ${r.start.latest}, ${r.end.earliest}, ${r.end.latest},
            ${r.precision}, ${r.is_coregency}, ${r.stated_length_years}, ${r.notes}, ${r.is_fixture}, ${r.revision})
          on conflict (id) do update set start_earliest = excluded.start_earliest, start_latest = excluded.start_latest, end_earliest = excluded.end_earliest,
            end_latest = excluded.end_latest, precision = excluded.precision, revision = excluded.revision, updated_at = now()`;
        bump('ruler_reigns');
      }
      for (const r of reigns) {
        await t`update ruler_reigns set coregent_with_reign_id = ${r.coregent_with_reign_id}, predecessor_reign_id = ${r.predecessor_reign_id} where id = ${r.id}`;
      }
      for (const e of entities) {
        for (const c of e.citations) {
          await t`insert into record_citations (record_kind, record_id, source_id)
            select ${e.kind}, ${e.id}, ${c} where not exists (select 1 from record_citations where record_kind = ${e.kind} and record_id = ${e.id} and source_id = ${c})`;
        }
      }

      // Events and their research files
      const ids = store.eventIds();
      for (const id of ids) {
        const ev = store.event(id);
        await t`insert into events (id, slug, title, summary, literary_classification, narrative_mode, categories, priority, research_status,
            publication_level, external_reason, last_reviewed_at, is_fixture, revision)
          values (${ev.id}, ${ev.slug}, ${ev.title}, ${ev.summary}, ${ev.literary_classification}, ${ev.narrative_mode}, ${ev.categories}::event_category[],
            ${ev.priority}, ${ev.research_status}, ${ev.publication_level}, ${ev.external_reason}, ${ev.last_reviewed_at}, ${ev.is_fixture}, ${ev.revision})
          on conflict (id) do update set slug = excluded.slug, title = excluded.title, summary = excluded.summary, categories = excluded.categories,
            priority = excluded.priority, research_status = excluded.research_status, publication_level = excluded.publication_level,
            last_reviewed_at = excluded.last_reviewed_at, revision = excluded.revision, updated_at = now()`;
        await history('event', ev.id, ev.revision, ev);
        bump('events');
      }
      for (const id of ids) {
        const ev = store.event(id);
        await t`update events set parent_event_id = ${ev.parent_event_id} where id = ${id}`;
        for (const m of ev.mentions) {
          const pid = await passage(m.passage);
          await t`insert into event_mentions (event_id, passage_id, mention_type, notes) values (${id}, ${pid}, ${m.mention_type}, ${m.notes})
            on conflict (event_id, passage_id) do update set mention_type = excluded.mention_type, notes = excluded.notes`;
          bump('event_mentions');
        }
        const ctx = store.context(id);
        if (ctx) {
          for (const r of ctx.rulers) {
            await t`insert into event_participants (event_id, person_id, role) values (${id}, ${r.person_id}, ${r.role}) on conflict do nothing`;
          }
          for (const l of ctx.locations) {
            await t`insert into event_locations (event_id, place_id, role, confidence) values (${id}, ${l.location_id}, ${l.role}, ${l.confidence}) on conflict do nothing`;
          }
          for (const c of ctx.constraints) {
            const pid = c.passage ? await passage(c.passage) : null;
            const kindOf = (x: string) => x.split('_')[0]!;
            await t`insert into chronological_constraints (id, subject_kind, subject_id, relation, object_kind, object_id, offset_min, offset_max, unit, precision,
                textual_assertion, passage_id, model_id, assumptions, verification_status)
              values (${c.id}, ${kindOf(c.subject)}, ${c.subject}, ${c.relation}, ${kindOf(c.object)}, ${c.object}, ${c.offset?.min ?? null}, ${c.offset?.max ?? null},
                ${c.unit}, ${c.precision}, ${c.textual_assertion}, ${pid}, ${c.model_id}, ${c.assumptions}, ${c.verification})
              on conflict (id) do update set relation = excluded.relation, textual_assertion = excluded.textual_assertion, assumptions = excluded.assumptions, updated_at = now()`;
            bump('chronological_constraints');
          }
          for (const h of ctx.date_hypotheses) {
            await t`insert into date_hypotheses (id, subject_kind, subject_id, model_id, earliest, latest, precision, original_expression, derivation)
              values (${h.id}, 'evt', ${id}, ${h.model_id}, ${h.interval.earliest}, ${h.interval.latest}, ${h.precision}, ${h.original_expression}, ${h.derivation})
              on conflict (id) do update set earliest = excluded.earliest, latest = excluded.latest, derivation = excluded.derivation, updated_at = now()`;
            bump('date_hypotheses');
          }
        }
        const evd = store.evidence(id);
        if (evd) {
          for (const c of evd.claims) {
            const pid = c.passage ? await passage(c.passage) : null;
            await t`insert into claims (id, statement, layer, event_id, passage_id, classification, reasoning, limitations, reviewer_status, review_required, research_date)
              values (${c.id}, ${c.statement}, ${c.layer}, ${id}, ${pid}, ${c.classification}, ${c.reasoning}, ${c.limitations}, ${c.reviewer_status}, ${c.review_required}, ${c.research_date})
              on conflict (id) do update set statement = excluded.statement, classification = excluded.classification, reasoning = excluded.reasoning,
                limitations = excluded.limitations, reviewer_status = excluded.reviewer_status, review_required = excluded.review_required, updated_at = now()`;
            bump('claims');
          }
          for (const e of evd.evidence) {
            await t`insert into evidence_findings (id, source_id, finding, locator, stance, strength, proposed_connection_by, competing_explanations, limitations, independent_line)
              values (${e.id}, ${e.source_id}, ${e.finding}, ${e.locator}, ${e.stance}, ${e.strength}, ${e.proposed_connection_by}, ${e.competing_explanations}, ${e.limitations}, ${e.independent_line})
              on conflict (id) do update set finding = excluded.finding, stance = excluded.stance, strength = excluded.strength, updated_at = now()`;
            bump('evidence_findings');
          }
          for (const c of evd.claims) {
            await t`delete from claim_evidence where claim_id = ${c.id}`;
            const rows = [
              ...c.supporting_evidence.map((e) => ({ claim_id: c.id, evidence_id: e, role: 'supporting' })),
              ...c.counterevidence.map((e) => ({ claim_id: c.id, evidence_id: e, role: 'counter' })),
              ...c.contextual_evidence.map((e) => ({ claim_id: c.id, evidence_id: e, role: 'contextual' })),
            ];
            if (rows.length) await t`insert into claim_evidence ${t(rows)} on conflict do nothing`;
            bump('claim_evidence', rows.length);
          }
        }
        const xr = store.crossrefs(id);
        if (xr) {
          for (const r of xr.relationships) {
            if (r.from.kind === 'passage' && r.to.kind === 'passage') {
              const f = await passage(r.from.ref);
              const to = await passage(r.to.ref);
              await t`insert into biblical_cross_references (id, from_passage_id, to_passage_id, type, confidence, rationale, dataset, provenance)
                values (${r.id}, ${f}, ${to}, ${r.type}, ${r.confidence}, ${r.rationale}, ${r.provenance.dataset}, ${JSON.stringify(r.provenance)}::jsonb)
                on conflict (id) do update set confidence = excluded.confidence, rationale = excluded.rationale, updated_at = now()`;
              bump('biblical_cross_references');
            } else {
              const end = async (x: typeof r.from) => (x.kind === 'passage' ? ['passage', await passage(x.ref)] : [x.kind, x.id]);
              const [fk, fid] = await end(r.from);
              const [tk, tid] = await end(r.to);
              await t`insert into historical_relationships (id, type, from_kind, from_id, to_kind, to_id, confidence, layer, rationale, provenance,
                  interpretive_approach, proposed_by, review_required)
                values (${r.id}, ${r.type}, ${fk!}, ${fid!}, ${tk!}, ${tid!}, ${r.confidence}, ${r.layer}, ${r.rationale}, ${JSON.stringify(r.provenance)}::jsonb,
                  ${r.interpretive_approach}, ${r.proposed_by}, ${r.review_required})
                on conflict (id) do update set confidence = excluded.confidence, rationale = excluded.rationale, updated_at = now()`;
              bump('historical_relationships');
            }
          }
        }
        await t`insert into publication_status (record_kind, record_id, level, revision) values ('event', ${id}, ${ev.publication_level}, ${ev.revision})
          on conflict (record_kind, record_id) do update set level = excluded.level, revision = excluded.revision`;
      }

      // Visions, prophecies and interpretations (after events: they reference events and passages).
      for (const v of ofKind('vision')) {
        const pid = await passage(v.passage);
        await t`insert into visions (id, slug, title, passage_id, recipient_id, setting_event_id, description, is_fixture, revision)
          values (${v.id}, ${v.slug}, ${v.title}, ${pid}, ${v.recipient_id}, ${v.experience_event_id}, ${v.description}, ${v.is_fixture}, ${v.revision})
          on conflict (id) do update set title = excluded.title, description = excluded.description, updated_at = now()`;
        bump('visions');
      }
      for (const p of ofKind('prophecy')) {
        const pid = await passage(p.passage);
        await t`insert into prophecies (id, slug, title, passage_id, vision_id, description, is_fixture, revision)
          values (${p.id}, ${p.slug}, ${p.title}, ${pid}, ${p.vision_id}, ${p.description}, ${p.is_fixture}, ${p.revision})
          on conflict (id) do update set title = excluded.title, description = excluded.description, updated_at = now()`;
        for (const i of p.interpretations) {
          await t`insert into proposed_fulfillments (id, prophecy_id, fulfilling_event_id, description, interpretive_approach, theological_framework, proponents, reviewer_status, is_fixture)
            values (${i.id}, ${p.id}, ${i.linked_events[0] ?? null}, ${`${i.label}: ${i.summary}`}, ${i.approach}, ${i.framework}, ${i.proponents}, ${i.reviewer_status}, ${p.is_fixture})
            on conflict (id) do update set description = excluded.description, reviewer_status = excluded.reviewer_status, updated_at = now()`;
          bump('proposed_fulfillments');
        }
        bump('prophecies');
      }
      for (const s of ofKind('synchronism')) {
        const pid = s.passage ? await passage(s.passage) : null;
        await t`insert into synchronisms (id, type, passage_id, biblical_record_kind, biblical_record_id, external_entity, external_source_id, proposed_synchronization,
            independent_earliest, independent_latest, precision, dating_method, is_direct, via, assumptions, evidence_strength, competing_interpretations, reviewer_status, is_fixture, revision)
          values (${s.id}, ${s.type}, ${pid}, ${s.biblical_subject ? s.biblical_subject.split('_')[0]! : null}, ${s.biblical_subject}, ${s.external_entity}, ${s.external_source_id},
            ${s.proposed_synchronization}, ${s.independent_date.earliest}, ${s.independent_date.latest}, ${s.precision}, ${s.dating_method}, ${s.direct}, ${s.via},
            ${s.assumptions}, ${s.evidence_strength}, ${JSON.stringify(s.competing_interpretations)}::jsonb, ${s.reviewer_status}, ${s.is_fixture}, ${s.revision})
          on conflict (id) do update set proposed_synchronization = excluded.proposed_synchronization, independent_earliest = excluded.independent_earliest,
            independent_latest = excluded.independent_latest, assumptions = excluded.assumptions, reviewer_status = excluded.reviewer_status, updated_at = now()`;
        bump('synchronisms');
      }

      // Coverage from extraction files
      for (const b of (await t<{ slug: string }[]>`select slug from books`)) {
        for (const ch of store.chapters(b.slug)) {
          for (const v of ch.verse_coverage) {
            await t`update verse_coverage set status = ${v.status}, candidate_ids = ${v.candidate_ids}, notes = ${v.notes},
              reviewed_at = ${v.status === 'not_reviewed' ? null : t`coalesce(reviewed_at, now())`}, session_log = ${ch.session_log} where ref = ${v.ref}`;
          }
          bump('verse_coverage', ch.verse_coverage.length);
        }
      }

      // Jobs, reviews
      for (const j of store.jobs()) {
        await t`insert into research_jobs (id, subject_kind, subject_id, book, chapter, stage, status, priority, checkpoint, is_fixture)
          values (${j.id}, ${j.subject_kind}, ${j.subject_id}, ${j.book}, ${j.chapter}, ${j.stage}, ${j.status}, ${j.priority}, ${JSON.stringify(j.checkpoint)}::jsonb, ${j.is_fixture})
          on conflict (id) do update set stage = excluded.stage, status = excluded.status, checkpoint = excluded.checkpoint, updated_at = now()`;
        bump('research_jobs');
      }
      for (const r of store.reviews()) {
        await t`insert into review_queue (id, record_kind, record_id, record_revision, reason, triggers, status, is_fixture)
          values (${r.id}, ${r.record_kind}, ${r.record_id}, ${r.record_revision}, ${r.reason}, ${r.triggers}, ${r.status}, ${r.is_fixture})
          on conflict (id) do update set status = excluded.status`;
        await t`delete from review_decisions where review_id = ${r.id}`;
        for (const d of r.decisions) {
          await t`insert into review_decisions (review_id, decision, reviewer, decided_at, record_revision, rationale)
            values (${r.id}, ${d.decision}, ${d.reviewer}, ${d.decided_at}, ${d.record_revision}, ${d.rationale})`;
        }
        bump('review_queue');
      }
      if (opts.dryRun) {
        const counts = await t<{ events: number; claims: number; coverage: number }[]>`
          select (select count(*)::int from events) as events, (select count(*)::int from claims) as claims,
                 (select count(*)::int from verse_coverage where status <> 'not_reviewed') as coverage`;
        n['db_events_visible'] = counts[0]!.events;
        n['db_claims_visible'] = counts[0]!.claims;
        n['db_coverage_reviewed_visible'] = counts[0]!.coverage;
        throw new Error(DRY_RUN);
      }
    }).catch((e: Error) => {
      if (e.message !== DRY_RUN) throw e;
    });
  } finally {
    await sql.end();
  }
  return n;
}
