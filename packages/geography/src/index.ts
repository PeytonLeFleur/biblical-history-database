// Coordinate validation. PostGIS-backed location hypotheses arrive with the database schema.
export interface Coordinates {
  lat: number;
  lon: number;
}

export function isValidCoordinates(c: Coordinates): boolean {
  return (
    Number.isFinite(c.lat) && Number.isFinite(c.lon) &&
    c.lat >= -90 && c.lat <= 90 && c.lon >= -180 && c.lon <= 180
  );
}

/** Location confidence levels — a location may carry several competing hypotheses (SPEC 13). */
export const LOCATION_CONFIDENCE = ['certain', 'probable', 'possible', 'disputed', 'unknown'] as const;
export type LocationConfidence = (typeof LOCATION_CONFIDENCE)[number];
