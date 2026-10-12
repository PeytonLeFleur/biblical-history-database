import { ulid } from 'ulid';

/**
 * Permanent opaque identifiers (SPEC Part 3.6).
 * Format: `<prefix>_<ULID>`. Never embed names, dates, or interpretations.
 */
export const ID_PREFIXES = {
  event: 'evt',
  person: 'per',
  location: 'loc',
  source: 'src',
  claim: 'clm',
  artifact: 'art',
  synchronism: 'syn',
  chronologyModel: 'chr',
  kingdom: 'kgd',
  dynasty: 'dyn',
  reign: 'rgn',
  constraint: 'cst',
  dateHypothesis: 'dth',
  vision: 'vis',
  prophecy: 'pro',
  fulfillment: 'ful',
  genealogy: 'gen',
  site: 'sit',
  document: 'doc',
  evidence: 'evd',
  relationship: 'rel',
  crossReference: 'xrf',
  region: 'reg',
  locationHypothesis: 'lhy',
  candidate: 'cnd',
  researchJob: 'job',
  researchAttempt: 'att',
  review: 'rev',
  revision: 'rvn',
  calendar: 'cal',
  regnalConvention: 'rcv',
} as const;

export type EntityKind = keyof typeof ID_PREFIXES;
export type IdPrefix = (typeof ID_PREFIXES)[EntityKind];

const ULID_RE = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;
const PREFIX_SET = new Set<string>(Object.values(ID_PREFIXES));

export function newId(kind: EntityKind, seedTime?: number): string {
  return `${ID_PREFIXES[kind]}_${ulid(seedTime)}`;
}

export function isValidId(id: string, kind?: EntityKind): boolean {
  const sep = id.indexOf('_');
  if (sep < 0) return false;
  const prefix = id.slice(0, sep);
  const body = id.slice(sep + 1);
  if (kind !== undefined && prefix !== ID_PREFIXES[kind]) return false;
  return PREFIX_SET.has(prefix) && ULID_RE.test(body);
}

export function prefixOf(id: string): IdPrefix | undefined {
  const prefix = id.split('_', 1)[0];
  return prefix !== undefined && PREFIX_SET.has(prefix) ? (prefix as IdPrefix) : undefined;
}
