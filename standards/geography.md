# Standard: Geography

Source: SPEC Part 13. Implemented in `@atlas/geography` plus PostGIS tables.

1. **Places versus hypotheses.** A `place` (`loc_`) is the ancient referent, e.g. "Tarshish". Its modern identifications are `location_hypotheses` (`lhy_`), each with a geometry (point or polygon), confidence (`certain` | `probable` | `possible` | `disputed` | `unknown`), sources and proponents. A disputed place keeps **all** candidates. None is silently chosen.
2. **No invented coordinates.** Coordinates come from a cited gazetteer (Pleiades, OpenBible.info geocoding once its licence is verified), excavation reports or institutional records. The source is stored with each geometry.
3. **Precision.** Record the coordinate precision (`site` | `settlement` | `approximate_area` | `region`). Approximate regions are drawn as clearly labelled areas, never as sharp points.
4. **Names.** Store ancient names by language and period (Hebrew, Akkadian, Greek, Latin), alternate names, and the modern name and country.
5. **Boundaries.** Kingdom boundaries are drawn only from licensed, traceable datasets or documented scholarly reconstructions. Each records its source, period, interpretation, precision, licence and uncertainty. Without such data, show points and labelled regions only.
6. **Findspot versus museum.** An artifact's findspot (`site`) and its current holding institution are separate fields. Only the findspot is mapped as a historical location.
7. **Map provider.** OpenFreeMap is the default keyless tile provider (configurable). A self-hosted Protomaps PMTiles option is documented in `docs/ARCHITECTURE.md`. No paid map APIs.
8. **Validation.** WGS84 lat in [−90, 90] and lon in [−180, 180] (`isValidCoordinates`). Every geometry has a source.
