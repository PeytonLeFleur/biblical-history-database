import Fastify from 'fastify';
import postgres from 'postgres';
import type { Config } from './config.ts';

/** Minimal read-only API (SPEC 3.4). Public browsing uses the static site; this serves local research tooling. */
export function buildApp(config: Config) {
  const app = Fastify({ logger: false });
  const sql = config.DATABASE_URL ? postgres(config.DATABASE_URL, { max: 5, connect_timeout: 3, onnotice: () => {} }) : null;

  app.get('/health', async () => {
    let db: 'ok' | 'unavailable' | 'not_configured' = 'not_configured';
    if (sql) {
      try {
        await sql`select 1`;
        db = 'ok';
      } catch {
        db = 'unavailable';
      }
    }
    return { status: 'ok', db };
  });

  const requireDb = () => {
    if (!sql) throw Object.assign(new Error('Database not configured'), { statusCode: 503 });
    return sql;
  };

  // Fixtures and unpublished records are never served.
  app.get('/events', async () => {
    const db = requireDb();
    return db`select id, slug, title, summary, categories, publication_level, research_status, revision
              from events where not is_fixture and publication_level <> 'unpublished' order by title`;
  });

  app.get<{ Params: { id: string } }>('/events/:id', async (req, reply) => {
    const db = requireDb();
    const [event] = await db`select * from events where (id = ${req.params.id} or slug = ${req.params.id})
                             and not is_fixture and publication_level <> 'unpublished'`;
    if (!event) return reply.code(404).send({ error: 'not found' });
    const [mentions, claims, relationships] = await Promise.all([
      db`select m.passage_id, m.mention_type, m.notes from event_mentions m where m.event_id = ${event.id}`,
      db`select id, statement, layer, classification, reviewer_status, review_required from claims where event_id = ${event.id} order by id`,
      db`select id, type, from_kind, from_id, to_kind, to_id, confidence, layer, rationale from historical_relationships
         where from_id = ${event.id} or to_id = ${event.id}`,
    ]);
    return { ...event, mentions, claims, relationships };
  });

  app.get<{ Params: { id: string } }>('/entities/:id', async (req, reply) => {
    const db = requireDb();
    const id = req.params.id;
    const prefix = id.split('_')[0];
    const table = { per: 'people', loc: 'places', kgd: 'kingdoms', rgn: 'ruler_reigns', chr: 'chronology_models', sit: 'archaeological_sites' }[prefix ?? ''];
    if (!table) return reply.code(400).send({ error: 'unsupported entity prefix' });
    const [row] = await db`select * from ${db(table)} where id = ${id} and not is_fixture`;
    if (!row) return reply.code(404).send({ error: 'not found' });
    if (table === 'people') row.aliases = await db`select alias, language from person_aliases where person_id = ${id}`;
    if (table === 'places') {
      row.hypotheses = await db`select id, label, confidence, coordinate_precision, ST_Y(geom) as lat, ST_X(geom) as lon, geom_source_id
                                from location_hypotheses where place_id = ${id}`;
    }
    return row;
  });

  app.get<{ Params: { id: string } }>('/sources/:id', async (req, reply) => {
    const db = requireDb();
    const [row] = await db`select id, title, source_type, authors, publisher, journal, published_date, url, doi, verification_level,
                                  accessed_at, access_notes, license from sources where id = ${req.params.id} and not is_fixture`;
    if (!row) return reply.code(404).send({ error: 'not found' });
    row.verification_log = await db`select level, verified_at, method from source_verifications where source_id = ${row.id} order by verified_at, id`;
    return row;
  });

  app.get('/research/status', async () => {
    const db = requireDb();
    const [coverage] = await db`select count(*)::int as verses,
                                       count(*) filter (where status <> 'not_reviewed')::int as reviewed from verse_coverage`;
    const events = await db`select publication_level, count(*)::int as n from events where not is_fixture group by 1`;
    const [reviews] = await db`select count(*)::int as open from review_queue where status = 'open' and not is_fixture`;
    return { coverage, events, open_reviews: reviews?.open ?? 0, note: 'Programmatic status only; not historical verification.' };
  });

  app.addHook('onClose', async () => {
    await sql?.end({ timeout: 2 });
  });

  return app;
}
