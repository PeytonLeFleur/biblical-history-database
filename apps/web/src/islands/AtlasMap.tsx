import { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre v6 ships its web worker as a separate ES module; let Vite bundle it and hand MapLibre the URL.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

export interface MapEventLink { id: string; title: string; href: string; role: string; association: string }
export interface MapPoint {
  id: string;
  placeName: string;
  label: string;
  modern: string | null;
  lat: number;
  lon: number;
  identification: string; // hypothesis confidence
  verified: boolean; // confident identification AND source claim-checked
  sourceTitle: string;
  sourceLevel: string;
  sourceUrl: string | null;
  events: MapEventLink[];
}
export interface AtlasMapProps {
  points: MapPoint[];
  styleUrl: string;
  attribution: string;
  events: Array<{ id: string; title: string }>;
}

/** Event-association status is a separate question from site identification. */
function assocLabel(p: MapPoint, eventFilter: string): string {
  const links = eventFilter === 'all' ? p.events : p.events.filter((e) => e.id === eventFilter);
  if (!links.length) return '';
  const firm = links.some((e) => e.association === 'certain' || e.association === 'probable');
  return firm ? ' · probable event location' : ' · proposed event location';
}

export default function AtlasMap({ points, styleUrl, events }: AtlasMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('event');
    if (p && events.some((e) => e.id === p)) setEventFilter(p);
  }, [events]);

  const visible = useMemo(
    () => points.filter((p) => (eventFilter === 'all' || p.events.some((e) => e.id === eventFilter)) && (!verifiedOnly || p.verified)),
    [points, eventFilter, verifiedOnly],
  );

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: visible.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          verified: p.verified ? 1 : 0,
          label: `${p.placeName}${assocLabel(p, eventFilter)}`,
        },
      })),
    }),
    [visible, eventFilter],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // maplibre-gl ships CJS/UMD; depending on the bundler the API is on the namespace or on `default`.
        const mod = (await import('maplibre-gl')) as unknown as typeof import('maplibre-gl') & { default?: typeof import('maplibre-gl') };
        const maplibre = mod.default ?? mod;
        if (cancelled || !ref.current) return;
        maplibre.setWorkerUrl(workerUrl);
        const map = new maplibre.Map({
          container: ref.current,
          style: styleUrl,
          center: [35.2, 31.9],
          zoom: 6.5,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
        map.on('error', (e: { error?: unknown }) => {
          // Tile/style failures are reported but the table below remains usable.
          if (!map.isStyleLoaded()) setError(`Base map could not be loaded (${(e.error as Error)?.message ?? 'network error'}). Locations are listed below.`);
        });
        map.on('load', () => {
          map.addSource('places', { type: 'geojson', data: geojson });
          map.addLayer({
            id: 'places-verified', type: 'circle', source: 'places', filter: ['==', ['get', 'verified'], 1],
            paint: { 'circle-radius': 8, 'circle-color': '#495543', 'circle-stroke-color': '#f3efe6', 'circle-stroke-width': 2 },
          });
          map.addLayer({
            id: 'places-proposed', type: 'circle', source: 'places', filter: ['==', ['get', 'verified'], 0],
            paint: { 'circle-radius': 8, 'circle-color': 'rgba(243,239,230,0.6)', 'circle-stroke-color': '#7a5a2f', 'circle-stroke-width': 3 },
          });
          map.addLayer({
            id: 'places-labels', type: 'symbol', source: 'places',
            layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-max-width': 14 },
            paint: { 'text-color': '#252923', 'text-halo-color': '#f3efe6', 'text-halo-width': 1.5 },
          });
          for (const layer of ['places-verified', 'places-proposed']) {
            map.on('click', layer, (e: import('maplibre-gl').MapLayerMouseEvent) => {
              const id = e.features?.[0]?.properties?.id as string | undefined;
              const p = points.find((x) => x.id === id);
              if (!p) return;
              const el = document.createElement('div');
              el.className = 'text-sm';
              const h = document.createElement('p');
              h.className = 'font-semibold';
              h.textContent = p.placeName + (p.modern ? ` (${p.modern})` : '');
              el.append(h);
              const idp = document.createElement('p');
              idp.textContent = `${p.verified ? 'Verified identification' : 'Proposed identification'} — ${p.identification}; source: ${p.sourceTitle} [${p.sourceLevel.replaceAll('_', ' ')}]`;
              el.append(idp);
              for (const ev of p.events) {
                const a = document.createElement('a');
                a.href = ev.href;
                a.textContent = `${ev.title}: ${ev.role} (association: ${ev.association})`;
                a.className = 'block mt-1';
                el.append(a);
              }
              new maplibre.Popup({ maxWidth: '320px' }).setLngLat([p.lon, p.lat]).setDOMContent(el).addTo(map);
            });
            map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
            map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
          }
          if (points.length) {
            const b = new maplibre.LngLatBounds();
            points.forEach((p) => b.extend([p.lon, p.lat]));
            map.fitBounds(b, { padding: 60, maxZoom: 9, duration: 0 });
          }
        });
      } catch (e) {
        setError(`The interactive map could not start (${(e as Error).message}). Locations are listed below.`);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource('places') as import('maplibre-gl').GeoJSONSource | undefined;
    src?.setData(geojson);
  }, [geojson]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Event</span>
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="border border-stone-light bg-ivory px-2 py-1.5" data-testid="map-event-filter">
            <option value="all">All researched events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified identifications only
        </label>
        <p className="text-stone" aria-live="polite">{visible.length} location{visible.length === 1 ? '' : 's'} shown</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs" aria-label="Map legend">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-ivory bg-olive" />Verified identification (confident + source-checked)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3.5 w-3.5 rounded-full border-[3px] border-brass-dark bg-ivory/60" />Proposed identification</span>
        <span>Labels marked “proposed event location” show that the place's connection to the event is a proposal, even when the site itself is securely identified.</span>
      </div>
      <div ref={ref} className="mt-3 h-[28rem] w-full border border-stone-light/50 bg-parchment" data-testid="map-container" role="region" aria-label="Interactive map of researched locations" />
      {error && <p className="mt-2 text-sm text-rust" role="alert">{error}</p>}
    </div>
  );
}
