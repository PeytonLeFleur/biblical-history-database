# Standard: Entity Resolution

Source: SPEC Parts 3.5–3.6, 8 (Rule 04).

## Identity
- Permanent IDs are opaque prefixed ULIDs (`newId(kind)`). Slugs are separate and mutable.
- Never put a disputed date, name or interpretation in an ID.
- IDs are never reused. A merged-away ID stays in an `entity_redirects` mapping to its survivor.

## Before creating any person, place, kingdom, event, artifact or source
1. Search by canonical name and every known alias, including transliteration variants (Nebuchadnezzar / Nebuchadrezzar / Nabû-kudurri-uṣur) and biblical alternates (Uzziah / Azariah).
2. Compare kingdom, period, role, relatives and passages.
3. Decide:
   - **Same:** reuse the ID and add an alias with its source.
   - **Possibly the same:** keep both and add a `possible_identity` relationship with rationale and confidence. **Queue for review.**
   - **Different:** create a new entity, and record why it is distinct where confusion is likely (e.g. different Herods).

## Merges and splits
- Only through the review queue (SPEC 9.3 #4).
- Write the redirect, move the relationships, and write revision-history rows for every affected record.

## Events
- Before creating an event, check for overlapping passages and similar participants and timeframes (duplicate detection, Rule 05).
- Parallel accounts of one occurrence (e.g. Kings and Chronicles) become **one event** with several `event_mentions`. Any discrepancies between the accounts are recorded on the event.
- Related but distinct occurrences remain separate events, joined by typed relationships.
