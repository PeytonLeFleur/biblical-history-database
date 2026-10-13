import { useEffect, useMemo, useState } from 'react';

/** Data shapes are prepared at build time from data/exports/chronology.json (the chronology engine's output). */
export interface Step {
  label: string;
  passage: string | null;
  passageLabel: string | null;
  passageHref: string | null;
  assumptions: string[];
}
export interface Range { earliest: number | null; latest: number | null }
export interface TimelineItem {
  id: string;
  kind: 'reign' | 'event';
  label: string;
  lane: string; // kingdom id or 'events'
  href: string | null;
  start: Range;
  end: Range;
  precision: string;
  derivation: { earliest: Step[]; latest: Step[] };
}
export interface TimelineModel {
  id: string;
  name: string;
  items: TimelineItem[];
  undated: Array<{ id: string; label: string; href: string | null }>;
  contradictions: string[];
}
export interface Lane { id: string; label: string; researched: boolean }
export interface TimelineProps {
  models: TimelineModel[];
  lanes: Lane[];
  initialModel: string;
}

export const fmtYear = (y: number) => (y <= 0 ? `${1 - y} BC` : `AD ${y}`);
const fmtRange = (r: Range) =>
  r.earliest === null && r.latest === null ? 'undated'
    : r.earliest === r.latest ? fmtYear(r.earliest!)
    : `${r.earliest === null ? '?' : fmtYear(r.earliest)} – ${r.latest === null ? '?' : fmtYear(r.latest)}`;

const W = 1000;
const LABEL_W = 150;
const ROW_H = 26;
const LANE_PAD = 10;
const AXIS_H = 34;

function niceStep(span: number) {
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (span / s <= 10) return s;
  return 2000;
}

/** Greedy interval packing so overlapping reigns (e.g. coregencies) get separate rows inside a lane. */
function pack(items: TimelineItem[]) {
  const rows: number[] = [];
  const placed = new Map<string, number>();
  const sorted = [...items].sort((a, b) => (a.start.earliest ?? 0) - (b.start.earliest ?? 0));
  for (const it of sorted) {
    const s = it.start.earliest ?? 0;
    const e = (it.end.latest ?? it.start.latest ?? s) + 1;
    let row = rows.findIndex((endAt) => endAt <= s);
    if (row === -1) {
      row = rows.length;
      rows.push(e);
    } else rows[row] = e;
    placed.set(it.id, row);
  }
  return { rows: Math.max(1, rows.length), placed };
}

export default function Timeline({ models, lanes, initialModel }: TimelineProps) {
  const [modelId, setModelId] = useState(initialModel);
  const model = models.find((m) => m.id === modelId) ?? models[0]!;
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const focus = p.get('focus');
    const m = p.get('model');
    if (m && models.some((x) => x.id === m)) setModelId(m);
    if (focus) setSelected(focus);
  }, [models]);

  const full = useMemo<[number, number]>(() => {
    const ys = models.flatMap((m) => m.items.flatMap((i) => [i.start.earliest, i.end.latest ?? i.start.latest])).filter((y): y is number => y !== null);
    if (!ys.length) return [-1000, 100];
    const lo = Math.min(...ys);
    const hi = Math.max(...ys) + 1;
    const pad = Math.max(5, Math.round((hi - lo) * 0.12));
    return [lo - pad, hi + pad];
  }, [models]);
  const [domain, setDomain] = useState<[number, number]>(full);
  const [d0, d1] = domain;
  const x = (y: number) => LABEL_W + ((y - d0) / (d1 - d0)) * (W - LABEL_W - 10);
  const zoom = (f: number) => {
    const c = (d0 + d1) / 2;
    const half = Math.max(2, ((d1 - d0) / 2) * f);
    setDomain([c - half, c + half]);
  };
  const pan = (f: number) => {
    const d = (d1 - d0) * f;
    setDomain([d0 + d, d1 + d]);
  };

  const laneLayout = lanes.map((lane) => {
    const items = model.items.filter((i) => i.lane === lane.id);
    const { rows, placed } = pack(items);
    return { lane, items, rows, placed };
  });
  let yCursor = AXIS_H;
  const laneY = laneLayout.map((l) => {
    const y = yCursor;
    yCursor += l.rows * ROW_H + LANE_PAD * 2;
    return y;
  });
  const H = yCursor + 8;
  const step = niceStep(d1 - d0);
  const ticks: number[] = [];
  for (let t = Math.ceil(d0 / step) * step; t <= d1; t += step) ticks.push(t);
  const sel = model.items.find((i) => i.id === selected) ?? null;

  return (
    <div className="timeline">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Chronology model</span>
          <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="border border-stone-light bg-ivory px-2 py-1.5" data-testid="model-select">
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <div className="flex gap-1" role="group" aria-label="Zoom and pan">
          <button type="button" className="border border-stone-light px-2.5 py-1.5" onClick={() => pan(-0.25)} aria-label="Pan earlier">←</button>
          <button type="button" className="border border-stone-light px-2.5 py-1.5" onClick={() => zoom(0.6)} aria-label="Zoom in">+</button>
          <button type="button" className="border border-stone-light px-2.5 py-1.5" onClick={() => zoom(1.6)} aria-label="Zoom out">−</button>
          <button type="button" className="border border-stone-light px-2.5 py-1.5" onClick={() => pan(0.25)} aria-label="Pan later">→</button>
          <button type="button" className="border border-stone-light px-2.5 py-1.5" onClick={() => setDomain(full)}>Reset</button>
        </div>
        <p className="text-stone" aria-live="polite" data-testid="active-model">Active model: <strong className="text-ink">{model.name}</strong> · showing {fmtYear(Math.round(d0))} – {fmtYear(Math.round(d1))}</p>
      </div>

      {model.contradictions.length > 0 && (
        <p className="mt-3 border-l-4 border-rust px-3 text-sm">Contradictions in this model: {model.contradictions.join('; ')}</p>
      )}

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full" role="group" aria-labelledby="tl-title" aria-describedby="tl-desc" data-testid="timeline-svg">
          <title id="tl-title">Timeline under {model.name}</title>
          <desc id="tl-desc">Reigns and events as computed uncertainty windows. The same data is listed in the table below.</desc>
          <defs>
            <pattern id="tl-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="2.2" height="5" fill="#a27b45" />
            </pattern>
            <clipPath id="tl-clip"><rect x={LABEL_W} y={0} width={W - LABEL_W} height={H} /></clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={AXIS_H - 6} y2={H} stroke="#d8cfbd" strokeWidth={1} />
              <text x={x(t)} y={AXIS_H - 12} fontSize={11} textAnchor={x(t) > W - 40 ? 'end' : 'middle'} fill="#5f5e57">{fmtYear(t)}</text>
            </g>
          ))}
          {laneLayout.map(({ lane, items, rows, placed }, li) => (
            <g key={lane.id}>
              <rect x={0} y={laneY[li]} width={W} height={rows * ROW_H + LANE_PAD * 2} fill={li % 2 ? '#efe9dd' : '#f3efe6'} opacity={0.8} />
              <text x={8} y={laneY[li]! + LANE_PAD + 15} fontSize={12} fontWeight={600} fill="#252923">{lane.label}</text>
              {items.length === 0 && (
                <text x={LABEL_W + 8} y={laneY[li]! + LANE_PAD + 15} fontSize={11} fill="#5f5e57" fontStyle="italic">
                  {lane.researched ? 'Nothing dated under this model' : 'Not yet researched'}
                </text>
              )}
              <g clipPath="url(#tl-clip)">
                {items.map((it) => {
                  const row = placed.get(it.id) ?? 0;
                  const y = laneY[li]! + LANE_PAD + row * ROW_H;
                  const s0 = it.start.earliest ?? d0;
                  const s1 = (it.start.latest ?? s0) + 1;
                  const e0 = it.kind === 'reign' ? it.end.earliest ?? s1 : s0;
                  const e1 = it.kind === 'reign' ? (it.end.latest ?? e0) + 1 : s1;
                  const isSel = selected === it.id;
                  const onKey = (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(it.id);
                    }
                  };
                  return (
                    <g key={it.id} role="button" tabIndex={0} aria-label={`${it.label}: ${fmtRange({ earliest: it.start.earliest, latest: it.kind === 'reign' ? it.end.latest : it.start.latest })}. Show derivation.`}
                      onClick={() => setSelected(it.id)} onKeyDown={onKey} style={{ cursor: 'pointer' }} data-testid={`tl-item-${it.kind}`} data-id={it.id}>
                      {it.kind === 'reign' ? (
                        <>
                          {/* uncertain start and end zones are lighter; the core is solid */}
                          <rect x={x(s0)} y={y + 4} width={Math.max(1, x(s1) - x(s0))} height={16} fill="#495543" opacity={0.35} />
                          <rect x={x(s1)} y={y + 4} width={Math.max(0, x(e0) - x(s1))} height={16} fill="#495543" />
                          <rect x={x(e0)} y={y + 4} width={Math.max(1, x(e1) - x(e0))} height={16} fill="#495543" opacity={0.35} />
                        </>
                      ) : (
                        <rect x={x(s0)} y={y + 4} width={Math.max(3, x(s1) - x(s0))} height={16} fill="url(#tl-hatch)" stroke="#7a5a2f" strokeWidth={1} />
                      )}
                      {isSel && <rect x={x(s0) - 2} y={y + 2} width={Math.max(5, x(it.kind === 'reign' ? e1 : s1) - x(s0)) + 4} height={20} fill="none" stroke="#252923" strokeWidth={1.5} />}
                      <text x={Math.max(LABEL_W + 4, x(s0)) + 4} y={y + 16} fontSize={11} fill={it.kind === 'reign' ? '#f3efe6' : '#252923'} fontWeight={600} style={{ paintOrder: 'stroke' }}
                        stroke={it.kind === 'reign' ? 'none' : '#f3efe6'} strokeWidth={it.kind === 'reign' ? 0 : 3}>
                        {it.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-stone">
        Solid bars: the span the model treats as within the reign. Light ends: uncertainty about when it began or ended. Hatched spans:
        the whole window in which an event may fall. No single date is implied.
      </p>

      <section className="mt-6 border border-stone-light/40 p-4" aria-live="polite" data-testid="derivation-panel">
        {sel ? (
          <div>
            <h3 className="font-serif text-xl">{sel.label}</h3>
            <p className="text-sm text-stone">
              {sel.kind === 'reign' ? `Began ${fmtRange(sel.start)} · ended ${fmtRange(sel.end)}` : `Window: ${fmtRange(sel.start)}`} · precision {sel.precision} · {model.name}
            </p>
            <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
              {(['earliest', 'latest'] as const).map((k) => (
                <div key={k}>
                  <p className="font-semibold">{k === 'earliest' ? 'Earliest bound derived from' : 'Latest bound derived from'}</p>
                  <ol className="mt-1 list-decimal space-y-1 pl-5">
                    {sel.derivation[k].length === 0 && <li className="text-stone">No constraint (open bound).</li>}
                    {sel.derivation[k].map((s, i) => (
                      <li key={i}>
                        {s.label}
                        {s.passageHref && <> (<a href={s.passageHref}>{s.passageLabel}</a>)</>}
                        {s.assumptions.length > 0 && <span className="block text-stone">Assumption: {s.assumptions.join(' ')}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            {sel.href && <p className="mt-3 text-sm"><a href={sel.href}>{sel.kind === 'event' ? 'Open the dossier →' : 'Open the person page →'}</a></p>}
          </div>
        ) : (
          <p className="text-sm text-stone">Select a bar to see how its range was derived.</p>
        )}
      </section>

      <h3 className="mt-8 font-semibold">All items under this model</h3>
      <table className="data mt-2" data-testid="timeline-table">
        <thead><tr><th scope="col">Item</th><th scope="col">Lane</th><th scope="col">Computed range</th><th scope="col">Precision</th></tr></thead>
        <tbody>
          {model.items.map((it) => (
            <tr key={it.id}>
              <td>{it.href ? <a href={it.href}>{it.label}</a> : it.label}</td>
              <td>{lanes.find((l) => l.id === it.lane)?.label}</td>
              <td>{it.kind === 'reign' ? `${fmtRange(it.start)} → ${fmtRange(it.end)}` : fmtRange(it.start)}</td>
              <td>{it.precision}</td>
            </tr>
          ))}
          {model.items.length === 0 && <tr><td colSpan={4} className="text-stone">Nothing can be placed on an absolute timeline under this choice.</td></tr>}
        </tbody>
      </table>
      {model.undated.length > 0 && (
        <p className="mt-3 text-sm text-stone" data-testid="timeline-undated">
          Not datable under this model: {model.undated.map((u, i) => <span key={u.id}>{i > 0 && ', '}{u.href ? <a href={u.href}>{u.label}</a> : u.label}</span>)}.
        </p>
      )}
    </div>
  );
}
