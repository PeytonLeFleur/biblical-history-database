/**
 * Research CLI entry point (SPEC Part 19).
 * Commands either work for real or say exactly which milestone implements them. Nothing pretends to research.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CANON } from '@atlas/scripture';

const ROOT = resolve(import.meta.dirname, '..');
const [group, command, ...args] = process.argv.slice(2);

type Handler = (args: string[]) => number | Promise<number>;

const pending = (milestone: number, what: string): Handler => () => {
  console.error(`Not yet implemented: ${what} arrives in Milestone ${milestone} (see docs/PROJECT_STATUS.md).`);
  return 2;
};

function readJsonDir(dir: string): unknown[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(abs, f), 'utf8')) as unknown);
}

const researchStatus: Handler = () => {
  const books = CANON.map((b) => {
    const dir = join(ROOT, 'research/books', b.slug);
    const extracted = existsSync(join(dir, 'extraction'))
      ? readdirSync(join(dir, 'extraction')).filter((f) => f.endsWith('.json')).length
      : 0;
    return { book: b.name, chapters: b.chapters, extracted };
  });
  const started = books.filter((b) => b.extracted > 0);
  const events = existsSync(join(ROOT, 'research/events'))
    ? readdirSync(join(ROOT, 'research/events')).filter((d) => d.startsWith('evt_')).length
    : 0;
  const jobs = readJsonDir('research/queues').length;
  console.log('Biblical History Atlas: research status');
  console.log(`  Books in canon:            ${CANON.length}`);
  console.log(`  Books with extraction:     ${started.length}`);
  console.log(`  Event research folders:    ${events}`);
  console.log(`  Research jobs queued:      ${jobs}`);
  for (const b of started) console.log(`    ${b.book}: ${b.extracted}/${b.chapters} chapter files`);
  if (started.length === 0) console.log('  No research has been recorded yet.');
  return 0;
};

const reviewList: Handler = () => {
  const items = readJsonDir('research/reviews') as Array<{ id?: string; record_id?: string; reason?: string; status?: string }>;
  const open = items.filter((i) => i.status !== 'decided');
  if (open.length === 0) {
    console.log('Review queue is empty.');
    return 0;
  }
  for (const i of open) console.log(`${i.id ?? '?'}  ${i.record_id ?? '?'}  ${i.reason ?? ''}`);
  return 0;
};

const commands: Record<string, Record<string, Handler>> = {
  research: {
    status: researchStatus,
    book: pending(3, 'research job preparation for a book'),
    chapter: pending(3, 'research job preparation for a chapter'),
    event: pending(3, 'event research job loading'),
    resume: pending(3, 'checkpoint resume'),
    validate: pending(3, 'research validation'),
    crossrefs: pending(3, 'cross-reference job preparation'),
    refresh: pending(3, 'manual research refresh'),
    export: pending(4, 'static research export'),
  },
  chronology: {
    validate: pending(3, 'chronology validation'),
    recalculate: pending(3, 'chronology recalculation'),
    anchors: pending(3, 'anchor listing'),
    models: pending(3, 'chronology model listing'),
  },
  review: {
    list: reviewList,
    show: pending(3, 'review item display'),
    approve: pending(3, 'review approval'),
    reject: pending(3, 'review rejection'),
    return: pending(3, 'review return'),
  },
};

const handler = group && command ? commands[group]?.[command] : undefined;
if (!handler) {
  console.error('Usage: pnpm <research|chronology|review>:<command> [args]');
  process.exit(1);
}
process.exit(await handler(args));
