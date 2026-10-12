/**
 * File-backed research store (rules/00-global.md §0.5). The repository is the permanent research memory.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import type { z } from 'zod';
import {
  ChapterExtraction,
  ContextDossier,
  CrossrefDossier,
  Entity,
  EventRecord,
  EvidenceDossier,
  ResearchJob,
  ReviewItem,
  SourceFile,
  ValidationResult,
} from './schemas.ts';

export const REPO_ROOT = resolve(import.meta.dirname, '../../..');

export const today = () => new Date().toISOString().slice(0, 10);
export const now = () => new Date().toISOString();

export class ResearchStore {
  constructor(readonly root: string = REPO_ROOT) {}

  path(...parts: string[]) {
    return join(this.root, ...parts);
  }
  rel(abs: string) {
    return relative(this.root, abs);
  }

  read<S extends z.ZodType>(schema: S, file: string): z.infer<S> {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`${this.rel(file)} failed schema validation:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
    }
    return parsed.data;
  }

  write<S extends z.ZodType>(schema: S, file: string, data: z.input<S>): z.infer<S> {
    const parsed = schema.parse(data);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(parsed, null, 2) + '\n');
    return parsed;
  }

  listJson(dir: string): string[] {
    const abs = this.path(dir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs).filter((f) => f.endsWith('.json')).sort().map((f) => join(abs, f));
  }

  // Locations
  chapterFile = (bookSlug: string, ch: number) => this.path('research/books', bookSlug, 'extraction', `ch-${String(ch).padStart(3, '0')}.json`);
  eventDir = (id: string) => this.path('research/events', id);
  eventFile = (id: string, name: 'event' | 'context' | 'evidence' | 'crossrefs' | 'validation') => join(this.eventDir(id), `${name}.json`);
  sourceFile = (id: string) => this.path('research/sources', `${id}.json`);
  entityFile = (id: string) => this.path('research/entities', `${id}.json`);
  jobFile = (id: string) => this.path('research/queues', `${id}.json`);
  reviewFile = (id: string) => this.path('research/reviews', `${id}.json`);

  // Typed accessors
  chapters(bookSlug: string): ChapterExtraction[] {
    return this.listJson(`research/books/${bookSlug}/extraction`).map((f) => this.read(ChapterExtraction, f));
  }
  eventIds(): string[] {
    const abs = this.path('research/events');
    if (!existsSync(abs)) return [];
    return readdirSync(abs).filter((d) => d.startsWith('evt_') && existsSync(join(abs, d, 'event.json'))).sort();
  }
  event = (id: string) => this.read(EventRecord, this.eventFile(id, 'event'));
  optional<S extends z.ZodType>(schema: S, file: string): z.infer<S> | null {
    return existsSync(file) ? this.read(schema, file) : null;
  }
  context = (id: string) => this.optional(ContextDossier, this.eventFile(id, 'context'));
  evidence = (id: string) => this.optional(EvidenceDossier, this.eventFile(id, 'evidence'));
  crossrefs = (id: string) => this.optional(CrossrefDossier, this.eventFile(id, 'crossrefs'));
  validation = (id: string) => this.optional(ValidationResult, this.eventFile(id, 'validation'));
  sources = () => this.listJson('research/sources').map((f) => this.read(SourceFile, f));
  entities = () => this.listJson('research/entities').map((f) => this.read(Entity, f));
  jobs = () => this.listJson('research/queues').map((f) => this.read(ResearchJob, f));
  reviews = () => this.listJson('research/reviews').map((f) => this.read(ReviewItem, f));
}
