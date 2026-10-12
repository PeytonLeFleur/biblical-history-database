# BIBLICAL HISTORY ATLAS
## Complete Master Build Specification for Claude Code

**Project:** Biblical History Atlas  
**GitHub account:** `peytonlefleur`  
**Repository:** `biblical-history-database`  
**Repository visibility:** Public  
**Website target:** `https://peytonlefleur.github.io/biblical-history-database/`  
**Canonical scope:** 66 books of the Protestant Bible  
**Preferred translations:** ESV and NKJV  
**Preferred commentary:** Enduring Word by David Guzik  
**Research method:** Claude Code operated, source verified, incremental  
**Primary objective:** Build a comprehensive, interconnected biblical history research database and public website.

---

# PART 1. YOUR MISSION

You are responsible for building an operational biblical history research platform from the ground up.

This is not a mockup, proof of concept, or planning exercise.

Create the GitHub repository, implement the software architecture, establish the research standards, build the database, develop the research tools, construct the website, and systematically research the historical events and claims associated with all 66 books of the Bible.

The platform must connect the biblical text with the historical world.

A person reading Amos 1:1 should be able to investigate the earthquake mentioned in that passage, find relevant geological and archaeological research, examine historical dating proposals, discover its potential geographical extent, and find references elsewhere in Scripture, including Zechariah 14:5.

A person reading Daniel 5 should be able to investigate Belshazzar, Nabonidus, Babylon, Cyrus, Babylon's fall, Babylonian chronicles, ancient inscriptions, archaeological discoveries, the surrounding historical chronology, and related biblical passages.

A person researching a biblical king should be able to explore that king's reign, family, kingdom, contemporary rulers, military campaigns, biblical appearances, external historical records, archaeological artifacts, and chronological relationships.

A person studying a prophecy should be able to examine the passage, its literary context, historical setting, major interpretations, proposed fulfillments, and supporting or challenging historical evidence.

The system must eventually allow users to move freely between Scripture, events, people, locations, civilizations, dates, prophecies, artifacts, scholarly publications, news reports, and evidence.

## 1.1 Fundamental research questions

For every identifiable historical event or claim, investigate:

1. What exactly does the Bible say?
2. Where is the event mentioned in Scripture?
3. Is the passage narrating an occurrence, referring to another event, describing a vision, or predicting something?
4. Who was involved?
5. Where did the event happen?
6. When did it happen, or when is it proposed to have happened?
7. How is the date derived?
8. What kingdoms or civilizations were involved?
9. What was happening elsewhere in the world at the same time?
10. What independent ancient records exist?
11. What archaeological discoveries are relevant?
12. What scientific studies are relevant?
13. What physical artifacts are associated with the claim?
14. What contemporary or later historical writers discussed it?
15. What modern news reports have covered discoveries related to it?
16. What do historians and scholars conclude?
17. What credible disagreements exist?
18. What does Enduring Word say about the biblical passage?
19. What other biblical passages reference the event?
20. Are there prophetic or theological connections?
21. What evidence supports the specific claim?
22. What evidence challenges the claim?
23. What remains uncertain?
24. How reliable are the relevant source identifications?
25. What would additional research need to establish?

## 1.2 Governing research principle

The database must distinguish four different categories:

1. **Biblical text:** What Scripture explicitly records.
2. **Biblical interpretation:** What commentators and theological traditions conclude.
3. **Historical reconstruction:** What scholars infer about ancient circumstances and chronology.
4. **External evidence:** What independent documents, archaeology, and scientific findings establish.

Never collapse these categories into one conclusion.

The objective is not to manufacture evidence supporting Scripture or to approach Scripture with a predetermined assumption of falsehood.

The objective is to accurately document the biblical claims and the strongest available evidence, including uncertainty, disputes, and limitations.

# PART 2. MANDATORY FIRST ACTIONS

## 2.1 Preserve this specification

Before implementing the project, save this entire prompt as:

`docs/SPEC.md`

Preserve all sections, requirements, and decisions.

Do not summarize this specification or replace it with a shorter interpretation.

Create a concise root `CLAUDE.md` that:

- Identifies `docs/SPEC.md` as the authoritative specification.
- Explains how to find the current milestone.
- Directs Claude Code to the five research rule files.
- Identifies the relevant coding and research standards.
- Explains the checkpoint and recovery process.
- Requires source verification and honest progress reporting.

This specification is authoritative over informal assumptions.

If the exact text of the specification is unavailable for saving, identify that limitation rather than reconstructing missing requirements from memory.

## 2.2 Create the GitHub repository

Use the authenticated GitHub account:

`peytonlefleur`

Create:

`biblical-history-database`

Repository URL:

`https://github.com/peytonlefleur/biblical-history-database`

Visibility: **PUBLIC**.

Public visibility is explicitly authorized for this new repository.

Do not modify, overwrite, or use any existing Win or AG Grow repository.

Verify authentication before creating the repository.

If GitHub authentication is incorrect, document the issue and continue independent local implementation without creating a repository under the wrong account.

Configure Git, `.gitignore`, repository metadata, and the remote.

Use `main` as the stable integration branch.

Use feature branches and pull requests for substantial changes where practical.

Do not merge failing builds.

Push validated milestones to the repository.

## 2.3 GitHub Pages

Prepare the static frontend for:

`https://peytonlefleur.github.io/biblical-history-database/`

Configure the correct base path, asset URLs, and routing behavior.

Set up GitHub Actions for tests, builds, exports, and Pages deployment.

Do not claim deployment succeeded until it has been verified.

GitHub Pages must host only the public static frontend and eligible research exports.

PostgreSQL, research workers, and server processes cannot run on GitHub Pages.

## 2.4 Secrets and publication protection

Never commit:

- API credentials.
- Authentication tokens.
- Passwords.
- Local `.env` files.
- Private review records.
- Restricted source downloads.
- Unlicensed copyrighted text.
- Database credentials.
- Synthetic fixtures in production exports.

Use `.env.example` files without real secrets.

# PART 3. FIXED SOFTWARE ARCHITECTURE

Do not choose an entirely different stack without a documented technical reason.

## 3.1 Technology

Use:

- TypeScript.
- Node.js supported LTS.
- pnpm workspaces.
- Astro.
- React islands where interactivity requires them.
- Tailwind CSS.
- PostgreSQL.
- PostGIS.
- Drizzle ORM.
- Zod.
- JSON Schema.
- Fastify for the backend foundation.
- MapLibre GL JS.
- Apache ECharts or a purpose built historical timeline renderer.
- Vitest.
- Playwright.
- ESLint.
- GitHub Actions.
- Docker Compose.

Use strict TypeScript settings.

Pin dependency versions through the lockfile.

Python is allowed for specialist scientific calculations and data processing when justified, but TypeScript remains the primary application language.

## 3.2 Local development

The initial system must run locally.

Use Docker Compose for PostgreSQL and PostGIS.

If Docker is unavailable, provide a compatible documented local PostgreSQL alternative.

Detect the development environment instead of assuming Linux.

The frontend, research CLI, validation system, database migrations, and static export pipeline must be independently runnable.

## 3.3 Frontend architecture

Use Astro for the public site.

Render research content statically wherever practical.

Use React for interactive maps, the timeline, search controls, and other features requiring client side state.

Do not require the database or API server for normal browsing of the deployed GitHub Pages website.

Generate public JSON datasets and search indexes from validated research records.

## 3.4 Backend architecture

Create `apps/api` as a functional but minimal foundation.

Initially implement:

- Configuration validation.
- Database connectivity.
- Health endpoint.
- Basic read only event endpoints.
- Basic entity lookup.
- Source metadata retrieval.
- Research status retrieval.

Do not build a large production API before the research system and static website work.

Keep future server deployment possible.

## 3.5 Database architecture

Use one global PostgreSQL database.

Do not create 66 disconnected databases.

Book workspaces are organizational units. People, places, events, sources, artifacts, and historical relationships are globally shared.

Use normalized tables, stable identifiers, constraints, migrations, and indexes.

Use PostGIS for geographic queries.

Use full text search for database research.

## 3.6 Event and entity identifiers

Use permanent opaque, type prefixed ULIDs.

Examples:

- `evt_` for events.
- `per_` for people.
- `loc_` for locations.
- `src_` for sources.
- `clm_` for claims.
- `art_` for artifacts.
- `syn_` for synchronisms.
- `chr_` for chronological models.

Append valid ULIDs.

Human readable slugs are separate fields.

Do not embed disputed dates, names, or historical interpretations into permanent identifiers.

Preserve identity mappings through merges and revisions.

# PART 4. THE RESEARCH EXECUTION MODEL

## 4.1 Claude Code is the research operator

For Version 1, Claude Code itself performs the AI assisted historical research during active sessions.

Use available authorized browsing, search, local processing, and source retrieval tools.

Do not build a separate research service that automatically consumes paid Anthropic, OpenAI, or commercial search APIs.

Do not require additional paid API keys.

The research package must provide deterministic infrastructure for:

- Job preparation.
- Stage selection.
- Loading existing context.
- Source registration.
- Data validation.
- Database import.
- Checkpointing.
- Entity matching.
- Research audits.
- Static exports.
- Resume operations.

Claude Code supplies the investigative reasoning and structured research outputs.

Never claim a CLI command independently performs LLM research unless the required research agent is actually running.

## 4.2 Research cost defaults

Use:

- Paid external research API budget: $0.
- Paid cloud service budget: $0.
- Automated paid API calls: disabled.
- Recurring research monitoring: disabled.
- Manual research refresh: enabled.
- Concurrent retrievals per source host: maximum three unless its documented rules require fewer.
- Transient retries: maximum three with increasing delays.
- Default search target: up to 15 distinct search queries for a substantial event before deciding whether additional depth is justified.
- Initial source discovery target: eight genuinely distinct relevant sources for substantial events where available.

These are workflow targets, not evidence quotas.

Do not invent sources to reach a target.

## 4.3 Research session boundaries

Work in verifiable increments.

A normal research session should process:

- One chapter, or
- Up to three substantial events,

whichever is more manageable.

Large chapters and disputed events may require multiple sessions.

Save progress after every completed unit.

Do not mark incomplete stages complete when context or tool limits interrupt research.

# PART 5. SCRIPTURE AND THEOLOGICAL PREFERENCES

## 5.1 Canon

Use the 66 book Protestant canon.

Genesis through Revelation.

The primary canonical index follows standard English Protestant book, chapter, and verse numbering.

## 5.2 Preferred Bible translations

The owner's preferred translations are:

1. English Standard Version.
2. New King James Version.

Prioritize these for study and authorized comparison.

However, do not reproduce or bulk store copyrighted editions without permission.

### Machine readable fallback

Use the unmodified Protestant edition of the World English Bible from an authorized public domain distributor, such as eBible.org, as the default locally stored Bible text.

Do not relabel WEB quotations as ESV or NKJV.

Keep the imported WEB text unchanged. Store annotations separately.

Implement an ESV adapter for compliant API access when authorized.

For NKJV, provide references or authorized integration without inventing a public API.

All research records must remain functional without locally stored ESV or NKJV text.

## 5.3 Biblical passage identifiers

Use stable OSIS style identifiers.

Examples:

- `Amos.1.1`
- `Zech.14.5`
- `Dan.5.1`

Store translation specific verse mappings separately.

Account for English, Hebrew, and Greek versification differences.

Use a verified canonical verse inventory.

Every canonical verse must have a coverage status.

Allowed statuses:

- `not_reviewed`
- `reviewed_no_candidate`
- `reviewed_with_candidate`
- `needs_recheck`
- `blocked`

Every verse must be inspected during book research.

A verse without a historical event should receive a valid reviewed status rather than an invented event.

## 5.4 Preferred commentary

The first preferred theological commentary is:

**Enduring Word Bible Commentary by David Guzik**

https://enduringword.com/

For each relevant biblical passage, consult Enduring Word first when accessible and permitted.

Store:

- Commentary title.
- Passage.
- URL.
- Author attribution.
- Date accessed.
- Concise original paraphrase of the interpretation.
- Relevant interpretive claims.

Do not mirror full commentary pages.

Do not bulk scrape copyrighted material.

If the material cannot be accessed, record that limitation.

Enduring Word is a preferred interpretive resource, not independent historical or archaeological corroboration.

## 5.5 Theological and historical interpretation

The owner's worldview is Christian.

Prioritize:

1. The biblical text.
2. Immediate context.
3. Hebrew, Aramaic, and Greek where relevant.
4. Historical and cultural background.
5. Scripture cross referencing Scripture.
6. Enduring Word.
7. Additional theological commentary.
8. Independent historical and scientific evidence.

Represent legitimate interpretive disagreements accurately.

Do not automatically suppress academically established positions because they differ from traditional Christian conclusions.

Do not describe scholarly consensus as infallible.

### Daniel

Explicitly represent the traditional earlier dating arguments and the widespread critical scholarly position favoring substantial composition or final redaction in the second century BC.

Distinguish scholarly arguments from theological commitments.

For prophetic interpretation, document relevant:

- Preterist.
- Futurist.
- Historicist.
- Idealist.
- Mixed approaches.

Where applicable, distinguish dispensational, amillennial, and other theological readings.

Do not treat disputed prophetic interpretation as established historical fact.

## 5.6 Noncanonical historical sources

Susanna, Bel and the Dragon, and the Prayer of Azariah are excluded from the canonical 66 book Daniel inventory.

They may be indexed as historical and textual sources.

Other ancient literature, including Josephus and 1 Maccabees, may be used as historical evidence or context without being presented as canonical Scripture.

# PART 6. RESEARCHABLE MATERIAL

## 6.1 Event definition

An event is a bounded occurrence or connected sequence of occurrences presented as happening in time.

It may have:

- Participants.
- A specific action.
- A location.
- A temporal relationship.
- Historical consequences.

Use the smallest meaningful granularity that supports independent investigation.

Do not create an event for every sentence.

Do not collapse entire chapters into single events when distinct occurrences need separate research.

Use parent and child event relationships.

## 6.2 Worked examples

### Amos 1:1

The earthquake referenced during Uzziah's reign is a historical event candidate.

Zechariah 14:5 provides a related biblical reference that should be investigated for shared identity.

Do not automatically identify it with a particular archaeological destruction layer.

### Daniel 1

The Babylonian deportation and the arrival of Judean captives are historically researchable.

Daniel's court education is a narrative episode.

His dietary decision is a separate narrative episode.

Do not create an event for every meal.

### Daniel 3

The golden image and its dedication belong to a connected royal event.

The refusal to worship and furnace narrative are related events or subevents.

Do not present external evidence for Babylonian religion as proof of the supernatural outcome.

### Daniel 5

Create a larger narrative group including:

- Belshazzar's feast.
- The writing on the wall.
- Daniel's interpretation.
- Belshazzar's death.
- Royal transition.

Separately identify the historical fall of Babylon as a major external historical event and connect it to the biblical narrative.

### Daniel 6

Daniel's ongoing prayer practice is background conduct.

The decree, accusation, imprisonment, and outcome form a connected narrative sequence.

### Daniel 7 through 12

Store visions as vision records.

Store prophetic statements as prophecy records.

Do not classify symbolic events inside visions as historical occurrences without a separately justified interpretation.

## 6.3 Other record types

Maintain distinct structured records for:

- Visions.
- Prophecies.
- Parables.
- Laws.
- Genealogies.
- Literary imagery.
- Ongoing practices.
- Historical references.
- Teaching.
- Theological interpretation.

These remain linked to the relevant biblical passages.

# PART 7. CONTROLLED TAXONOMIES

## 7.1 Event categories

Allowed categories:

- `political`
- `military`
- `royal`
- `migration`
- `construction`
- `destruction`
- `natural_disaster`
- `environmental`
- `astronomical`
- `religious`
- `social`
- `economic`
- `legal`
- `birth`
- `death`
- `genealogical`
- `miracle_claim`
- `personal_narrative`
- `other`

Permit multiple categories.

## 7.2 Literary classifications

- `historical_narrative`
- `prophetic_oracle`
- `apocalyptic_vision`
- `poetry`
- `wisdom`
- `parable`
- `law`
- `genealogy`
- `epistle`
- `gospel_narrative`
- `historical_reference`
- `mixed`
- `uncertain`

## 7.3 Research priorities

- `critical`
- `high`
- `medium`
- `low`
- `background`

Priority affects research order, not theological value.

## 7.4 Research statuses

- `queued`
- `extracting`
- `context_research`
- `external_research`
- `cross_referencing`
- `validating`
- `needs_review`
- `publishable`
- `published`
- `blocked`

Track every stage separately.

## 7.5 Source types

- `ancient_primary_text`
- `artifact_record`
- `excavation_report`
- `scientific_paper`
- `academic_monograph`
- `scholarly_commentary`
- `theological_commentary`
- `institutional_database`
- `museum_catalog`
- `historical_reference`
- `news_report`
- `popular_summary`
- `dataset`
- `other`

## 7.6 Relationship types

- `same_event`
- `direct_reference`
- `same_person`
- `same_location`
- `same_kingdom`
- `same_period`
- `parent_event`
- `child_event`
- `preceded_by`
- `followed_by`
- `historical_consequence`
- `prophecy_reference`
- `proposed_fulfillment`
- `genealogical_connection`
- `thematic_parallel`
- `artifact_association`
- `source_attestation`
- `possible_identity`
- `supports`
- `contradicts`

Every relationship must have provenance and uncertainty metadata.

# PART 8. FIVE STAGE RESEARCH ENGINE

Create five executable research rule files.

These must be detailed procedures, not vague summaries.

Each rule must specify:

- Inputs.
- Required tasks.
- Research methods.
- Outputs.
- Schemas.
- Error handling.
- Checkpoints.
- Completion criteria.
- Validation.

## RULE 01: Scripture extraction

File:

`rules/01-scripture-extraction.md`

Read every chapter and verse of the assigned book.

Extract all historically relevant:

- Events.
- People.
- Places.
- Kingdoms.
- Reigns.
- Battles.
- Political actions.
- Military campaigns.
- Natural disasters.
- Environmental phenomena.
- Construction.
- Destruction.
- Births.
- Deaths.
- Genealogies.
- Miracles.
- Historical references.
- Prophecies.
- Visions.
- Relevant astronomical phenomena.

Classify each candidate accurately.

Distinguish actual narrated occurrences from predictions, symbolic visions, poetry, and hypothetical material.

Record:

- Book.
- Chapter.
- Verse range.
- Candidate ID.
- Title.
- Textual description.
- Literary classification.
- Event category.
- Participants.
- Locations.
- Temporal statements.
- Research priority.
- Related passages.
- Ambiguities.

Generate verse coverage records.

Output an auditable candidate inventory.

Do not claim extraction is complete until every canonical verse is accounted for.

## RULE 02: Historical reconstruction

File:

`rules/02-historical-reconstruction.md`

For each candidate, investigate:

- Historical setting.
- Date or date range.
- Chronological relationships.
- Relevant rulers.
- Kingdoms.
- Dynastic succession.
- Wars.
- Political context.
- Ancient geography.
- Modern locations.
- Original terminology.
- Cultural background.
- Economic circumstances.
- Conflicting historical reconstructions.

Use existing globally shared entities.

Do not invent exact dates or coordinates.

Identify competing models.

Connect findings to source citations.

Output a historical context dossier.

## RULE 03: External evidence investigation

File:

`rules/03-external-evidence.md`

Investigate:

### Archaeology

- Excavations.
- Artifacts.
- Inscriptions.
- Destruction layers.
- Pottery.
- Radiocarbon evidence.
- Coins.
- Seals.
- Burial sites.
- Archaeological surveys.

### Geology

- Earthquake evidence.
- Fault systems.
- Flood evidence.
- Sediment records.
- Volcanic activity.
- Ancient climate.
- Drought reconstruction.

### Astronomy

- Ancient eclipse records.
- Planetary phenomena.
- Calendar relevant observations.
- Astronomical chronology.

### Ancient documentary history

- Assyrian records.
- Babylonian chronicles.
- Egyptian inscriptions.
- Persian royal inscriptions.
- Cuneiform administrative tablets.
- Ancient Greek and Roman historians.
- Jewish historical documents.
- Relevant ancient Near Eastern texts.

### Scientific and academic research

- Peer reviewed studies.
- University publications.
- Scientific datasets.
- Academic historical publications.
- Specialist archaeological research.

### Modern news

Find credible reporting about discoveries, excavations, scientific studies, and newly interpreted ancient records.

Trace news stories to underlying original findings.

Do not count multiple articles reporting one discovery as independent confirmations.

For every source, identify:

- Author.
- Publisher.
- Publication date.
- Original document or artifact.
- Methodology where relevant.
- Actual findings.
- Proposed biblical connection.
- Competing explanations.
- Criticism.
- Limitations.
- Verification status.

Output a source backed evidence dossier.

## RULE 04: Canonical cross referencing

File:

`rules/04-cross-referencing.md`

Search all 66 books, including those not yet fully researched.

Identify:

- Same events.
- Direct references.
- Same people.
- Same places.
- Shared kingdoms.
- Shared historical periods.
- Related political and military events.
- Genealogies.
- Historical consequences.
- Prophecy relationships.
- Proposed fulfillments.
- Theological and thematic parallels.

Do not merge related but distinct events.

Do not confuse thematic similarity with historical identity.

Assign typed relationships with source provenance.

Resolve existing entities before creating new ones.

Store uncertain matches as hypotheses.

## RULE 05: Publication and validation

File:

`rules/05-publication-validation.md`

Integrate all findings into the global database.

Validate:

- Biblical references.
- Entity relationships.
- Citations.
- Source metadata.
- Evidence classifications.
- Chronology.
- Geography.
- Duplicate records.
- Research completeness.
- Copyright compliance.
- Publication status.

Generate readable event dossiers from structured data.

Record outstanding disputes and research gaps.

Publish eligible records with clear research status labels.

Do not confuse programmatic validity with historical verification.

# PART 9. EVIDENCE STANDARDS

## 9.1 Classification system

Use the following classifications for individual historical claims.

### Independently corroborated

Independent documentary, archaeological, or scientific evidence directly establishes the specific claim with substantial confidence.

General contextual similarity is insufficient.

### Strongly supported

Multiple relevant findings create a substantial cumulative case, but material uncertainty remains.

### Historically plausible

The claim is consistent with known historical context, but independent evidence does not directly establish the specific occurrence.

### Disputed

Material disagreement exists concerning the evidence, dating, identification, or reconstruction.

### No independent corroboration found

A documented research effort did not identify sufficient independent evidence.

This is not automatic disproof.

### Contradicted by available evidence

Substantial relevant evidence directly conflicts with the specific claim or proposed identification.

Explain the conflict.

### Not empirically testable

The essential claim cannot presently be assessed through historical or scientific methods.

Do not turn this into a theological verdict.

## 9.2 Classification provenance

Claude Code may propose an evidence classification.

Store:

- Claim.
- Proposed classification.
- Supporting evidence.
- Counterevidence.
- Reasoning.
- Limitations.
- Source identifiers.
- Research date.
- Reviewer status.

Valid reviewer statuses:

- `machine_proposed`
- `human_approved`
- `human_rejected`
- `requires_review`

Never describe machine proposed judgments as human reviewed.

## 9.3 Automatic review triggers

Send findings to the human review queue when:

1. Priority is critical.
2. Evidence is classified as disputed.
3. Evidence is classified as contradicted.
4. Canonical entities are merged or split.
5. A prophetic fulfillment identification is proposed or materially revised.
6. A published historical identification changes substantially.
7. Credible primary sources conflict materially.
8. Source authenticity is unresolved and affects publication.

The project owner is the human reviewer.

Do not assume a review schedule.

## 9.4 Local review interface

Implement local CLI commands:

`pnpm review:list`

`pnpm review:show RECORD_ID`

`pnpm review:approve RECORD_ID`

`pnpm review:reject RECORD_ID`

`pnpm review:return RECORD_ID`

Record reviewer identity, date, decision, record version, and rationale where provided.

Administrative controls must not be exposed through GitHub Pages.

# PART 10. SOURCE QUALITY AND VERIFICATION

## 10.1 Source hierarchy

Prefer:

1. Ancient primary documentation and physical evidence.
2. Peer reviewed research.
3. Institutional and museum publications.
4. Academic books and specialist reference works.
5. Credible reporting connected to identifiable primary research.
6. Popular explanatory summaries.

Theological commentaries serve a different interpretive purpose.

## 10.2 Verification levels

Use:

- `discovered`
- `metadata_verified`
- `source_accessed`
- `claim_checked`
- `human_reviewed`

Definitions:

**Discovered:** A candidate source has been identified.

**Metadata verified:** Bibliographic details have been checked through a credible registry, publisher, or institution.

**Source accessed:** Relevant original material has actually been accessed.

**Claim checked:** The specific source content has been examined for support of the recorded claim.

**Human reviewed:** A human reviewer has approved the applicable source to claim relationship.

A functioning URL is not proof of claim support.

A DOI match is not proof of research findings.

If a full paper is inaccessible, do not pretend it was reviewed.

## 10.3 Source registry

Create a source registry using verified resources such as:

- Enduring Word.
- Crossway ESV resources.
- Authorized NKJV resources.
- eBible.org.
- Israel Antiquities Authority.
- Israel Antiquities Authority Publications.
- Israel National Archaeological Database.
- Open Richly Annotated Cuneiform Corpus.
- Society of Biblical Literature.
- Bible Odyssey.
- British Museum collections.
- Metropolitan Museum of Art.
- Relevant university excavation projects.
- Archaeological journals.
- Geological surveys.
- Ancient Near Eastern text collections.
- Academic publishers.

Investigate useful existing datasets:

- OpenBible.info cross references.
- OpenBible.info geocoding.
- Treasury of Scripture Knowledge.
- Pleiades ancient geography.
- Open Hebrew and Greek textual corpora.
- Other licensed biblical reference datasets.

Verify licensing and quality before importing.

Do not assume public accessibility grants redistribution rights.

## 10.4 Copyright

Paraphrase external publications by default.

For copyrighted external prose, cap direct quotations in a published dossier at one short sentence or 25 words from any individual source, whichever is shorter, unless explicit licensing permits more.

Do not accumulate multiple excerpts to reproduce substantial content.

Follow stricter publisher specific restrictions where applicable.

Record source links and bibliographic metadata.

For locally hosted artifact photographs, default to public domain or CC0 images.

Store provenance and attribution.

For restricted images, link to the museum or source page instead of redistributing the file.

# PART 11. DATABASE DATA MODEL

Implement normalized data structures for at least:

1. Books.
2. Chapters.
3. Verses.
4. Passage references.
5. Passage coverage.
6. Events.
7. Event mentions.
8. Historical people.
9. Person aliases.
10. Kingdoms.
11. Dynasties.
12. Places.
13. Ancient geographical names.
14. Location hypotheses.
15. Historical regions.
16. Chronological models.
17. Historical synchronisms.
18. Chronological constraints.
19. Calendar systems.
20. Regnal conventions.
21. Ruler reigns.
22. Date hypotheses.
23. Visions.
24. Prophecies.
25. Proposed fulfillments.
26. Genealogies.
27. Archaeological sites.
28. Artifacts.
29. Primary historical documents.
30. Academic sources.
31. News sources.
32. Claims.
33. Evidence findings.
34. Claim evidence relationships.
35. Biblical cross references.
36. Historical relationships.
37. Research jobs.
38. Research attempts.
39. Research logs.
40. Source verification.
41. Human review queue.
42. Review decisions.
43. Publication status.
44. Revision history.

Additional tables may be created where justified.

Use stable identifiers, proper foreign keys, uniqueness constraints, and database migrations.

# PART 12. CHRONOLOGICAL RESEARCH ENGINE

This is a major project requirement.

The timeline must be a functioning chronological model, not a collection of independently guessed dates.

Build a system where externally dated historical events establish anchors, biblical statements establish relative chronological relationships, and computational rules determine possible event ranges.

When an anchor changes, dependent event dates must update.

## 12.1 Anchor synchronisms

Create a dedicated historical synchronism entity.

A synchronism connects a biblical event, person, or reign with an independently dated historical event or document.

Research and seed the following candidate anchors.

### Old Testament

- Assyrian eclipse recorded in 763 BC.
- Ahab at the Battle of Qarqar, conventionally 853 BC.
- Jehu's tribute represented on the Black Obelisk, conventionally 841 BC.
- Sennacherib's Judah campaign, conventionally 701 BC.
- Jerusalem's surrender in the Babylonian Chronicle, conventionally 597 BC.
- Babylon's fall, conventionally 539 BC.

Research their original sources and scholarly dating.

Relevant sources include the Assyrian eponym chronicles, Kurkh Monolith, Black Obelisk, Assyrian inscriptions, Babylonian Chronicle, and Nabonidus Chronicle.

Do not automatically treat these as direct biblical synchronisms simply because the external dates are well established.

The Assyrian eclipse, for example, anchors Assyrian chronology through intermediate historical relationships.

Store that distinction.

### New Testament

Research:

- Herod the Great's death.
- Proposed dates for Jesus' birth.
- The fifteenth year of Tiberius in Luke 3:1.
- Pontius Pilate's governorship.
- Proposed crucifixion dates, particularly AD 30 and AD 33.
- The Gallio inscription at Delphi.
- Paul's journeys and appearances before Roman authorities.
- Relevant Roman imperial chronology.

Distinguish independent dates from proposed biblical correlations.

### Synchronism fields

Store:

- Permanent ID.
- Biblical passage.
- External historical entity.
- External source.
- Proposed synchronization.
- Independent date.
- Precision.
- Dating method.
- Interpretive assumptions.
- Evidence strength.
- Competing interpretations.
- Scholarly references.
- Reviewer status.

Types:

- `direct_contemporary_identification`
- `reign_synchronization`
- `documentary_correlation`
- `astronomical_anchor`
- `calendar_anchor`
- `archaeological_correlation`
- `inferred_synchronization`

## 12.2 Relative chronology constraint graph

Implement a chronological constraint graph.

Most biblical chronology is relational.

Supported constraints must include:

- Before.
- After.
- During.
- Same year.
- Same approximate period.
- Begins after.
- Ends before.
- Overlaps.
- Immediately follows.
- Specified days later.
- Specified months later.
- Specified years later.
- Specified years earlier.
- Occurs within a particular reign.
- Occurs in a particular regnal year.
- Occurs within an independently dated range.

Store the original textual assertion separately from its mathematical interpretation.

For example, "after these things" establishes sequence but does not establish a fixed elapsed duration.

Do not assign numerical precision absent from the source.

Each constraint requires:

- Source entity.
- Target entity.
- Relationship.
- Numerical offset if applicable.
- Unit.
- Precision.
- Source citation.
- Chronological model.
- Assumptions.
- Verification status.

## 12.3 Chronological computation

Implement a deterministic solver that:

1. Loads the selected chronology model.
2. Loads accepted external anchors.
3. Loads relative chronological constraints.
4. Applies regnal conventions.
5. Applies calendar conversion rules.
6. Calculates allowable date intervals.
7. Propagates interval constraints.
8. Detects contradictions.
9. Records derivation chains.
10. Recalculates dependent dates when an input changes.

The solver must preserve uncertainty rather than inventing a single date.

If the available constraints produce multiple feasible chronologies, retain the alternatives.

If a constraint network is impossible, generate a diagnostic report rather than silently dropping evidence.

Use AI to research and propose constraints, but use deterministic code to calculate consequences.

## 12.4 Regnal year conventions

Support:

- Accession year counting.
- Nonaccession year counting.
- Nisan based new years.
- Tishri based new years.
- Other documented regional calendars.
- Coregencies.
- Overlapping reigns.
- Partial reign years.
- Changes in counting conventions.
- Disputed reign lengths.

Do not assume Israel, Judah, Babylon, Assyria, Persia, and Egypt used identical systems.

### Required reconciliation test

Investigate Daniel 1:1 and Jeremiah 25:1.

Represent the third year of Jehoiakim in Daniel and the fourth year referenced in Jeremiah.

Implement the commonly proposed difference in regnal reckoning as a documented hypothesis.

Store its assumptions.

Do not silently change either biblical statement.

Test alternative reconstructions where relevant.

## 12.5 Date storage and calendar conversion

Use astronomical year numbering internally.

Examples:

- 1 BC corresponds to year 0.
- 2 BC corresponds to year -1.
- 539 BC corresponds to year -538.

Present conventional BC/AD notation publicly.

Support:

- Exact dates where justified.
- Date intervals.
- Relative chronology.
- Regnal dates.
- Approximate dates.
- Undated events.
- Conflicting date models.

For ancient day level dates, use a clearly documented proleptic Julian convention where appropriate.

Do not pretend that every ancient source originally used the Julian calendar.

Store the original calendar explicitly.

Support:

- Babylonian lunar dating.
- Hebrew lunisolar dating.
- Egyptian civil dates.
- Julian dates.
- Gregorian dates for relevant historical periods.
- Regnal dating.
- Astronomical day numbers.

Use established scholarly conversion tables or documented algorithms.

Preserve uncertainty introduced by lunar observation or historical reconstruction.

## 12.6 Genesis 1 through 11

Do not force Genesis 1 through 11 onto an absolute historical date axis by default.

Create a separate biblical internal chronology band.

Research:

- Masoretic chronology.
- Septuagint chronology.
- Samaritan Pentateuch chronology.
- Ussher chronology.
- Other documented models.

Store genealogical ages and textual variants separately.

Do not combine incompatible textual traditions.

Allow viewers to select named chronology models.

Clearly label model derived dates as reconstructions.

Where independent chronological anchors are unavailable, explain that limitation.

Do not infer that absence of an external date proves or disproves the biblical narrative.

Use similar caution for patriarchal chronology.

## 12.7 Ruler chronology foundation

Create sourced king and ruler lists for:

- United monarchy of Israel.
- Northern Kingdom of Israel.
- Kingdom of Judah.
- Egypt.
- Assyria.
- Babylon.
- Media and Persia.
- Achaemenid Empire.
- Macedonian and Greek kingdoms.
- Seleucid Empire.
- Ptolemaic Kingdom.
- Hasmonean dynasty.
- Herodian dynasty.
- Roman emperors.
- Roman governors of Judaea.

Store:

- Canonical identity.
- Names and titles.
- Kingdom.
- Reign start.
- Reign end.
- Uncertainty.
- Regnal calendar.
- Accession convention.
- Coregencies.
- Predecessor.
- Successor.
- Contemporary rulers.
- Biblical references.
- External sources.
- Chronological alternatives.

Do not invent a universal king list.

Seed ruler chronologies from verified scholarly sources and preserve competing models.

## 12.8 Chronology consistency tests

Implement automated tests ensuring:

1. Child events are temporally compatible with their parent historical period.
2. Ruler actions are compatible with reign dates or an explicitly documented alternative context.
3. Strict before and after relationships cannot produce impossible cycles.
4. Computed earliest dates do not exceed latest dates.
5. Coregencies are not mistakenly represented as sequential reigns.
6. Calendar conversions are consistent.
7. Precision is preserved.
8. Undated events are not assigned unsupported dates.
9. Different chronology models are not silently mixed.
10. Changing an anchor recalculates dependent dates.
11. Contradictory sources remain visible.
12. A historical model cannot silently override explicit evidence.

Distinguish literary parent episodes from genuine historical time intervals when applying containment tests.

## 12.9 Chronological explanation

Every computed date must retain a derivation.

Users should be able to inspect:

- Original biblical statement.
- External anchor.
- Relative relationships.
- Regnal assumptions.
- Calendar assumptions.
- Active chronology model.
- Calculated interval.
- Competing dates.
- Source citations.

The website must explain why an event appears at a particular point in history.

# PART 13. ANCIENT GEOGRAPHY ENGINE

Build a geographically interconnected historical database.

Store:

- Ancient name.
- Modern identification.
- Alternate names.
- Historical kingdom.
- Modern country.
- Coordinates where sufficiently supported.
- Proposed regions.
- Uncertainty.
- Competing identifications.
- Source evidence.

Use PostGIS.

Do not invent coordinates.

For disputed locations, retain candidate locations instead of silently selecting one.

## 13.1 Mapping provider

Use OpenFreeMap as the initial keyless mapping provider, subject to its current access terms.

Keep the provider configurable.

Document a possible self hosted Protomaps PMTiles implementation for later use.

Do not depend on paid map APIs.

## 13.2 Ancient territorial boundaries

Do not invent ancient kingdom borders.

Only render boundaries from traceable, appropriately licensed historical geographical datasets or documented scholarly reconstructions.

Record:

- Source.
- Time period.
- Interpretation.
- Precision.
- Licensing.
- Uncertainty.

Where reliable polygon data is unavailable, show sourced points and clearly identified approximate regions instead.

## 13.3 Interactive geographical explorer

Users must be able to explore:

- Biblical event locations.
- Ancient cities.
- Archaeological sites.
- Significant artifact findspots.
- Kingdoms where credible boundary data exists.
- Battles.
- Natural disasters.
- Documented or reconstructed migration routes.

Filters should include:

- Bible book.
- Chapter.
- Event type.
- Historical period.
- Kingdom.
- Person.
- Evidence status.
- Research completeness.

Differentiate findspots from modern museum locations.

# PART 14. INTERACTIVE HISTORICAL TIMELINE

Build a comprehensive chronological visualization.

## 14.1 Parallel lanes

Display kingdoms and civilizations side by side.

Examples:

- Judah.
- Israel.
- Egypt.
- Assyria.
- Babylon.
- Persia.
- Greece.
- Rome.

## 14.2 Ruler reign bars

Show kings and rulers as time intervals.

Represent overlapping reigns and coregencies correctly.

## 14.3 Event representation

Use:

- Points for well dated individual events.
- Bars for event periods.
- Uncertainty intervals for approximate dates.
- Distinct visual treatment for competing dates.
- Separate internal chronology views for events without defensible absolute dates.

Avoid presenting an approximate date as exact.

## 14.4 Chronology model switcher

Allow viewers to select different chronology models.

Recompute and reposition dependent events.

Clearly identify the active model.

Never mix incompatible models without disclosure.

## 14.5 Historical context view

From any event, provide a "What else was happening?" view.

Show contemporary:

- Kings.
- Kingdoms.
- Battles.
- Political developments.
- Biblical events.
- Major historical occurrences.

## 14.6 Prophetic ministries

Represent ministry periods of biblical prophets when meaningful time ranges can be established.

Use book superscriptions, biblical chronology, and external historical evidence.

Display uncertainty.

## 14.7 Timeline navigation

Support zooming from broad historical periods to individual decades or years where the data permits.

Support filters by:

- Book.
- Person.
- Kingdom.
- Geography.
- Prophecy.
- Event type.
- Evidence classification.
- Chronological model.

Clicking a timeline item must open its associated dossier.

# PART 15. PUBLIC WEBSITE

Build a complete research website, not merely a dashboard.

## 15.1 Required pages

1. Homepage.
2. All Bible books.
3. Book overview.
4. Chapter navigation.
5. Verse and passage explorer.
6. Historical event dossiers.
7. Global interactive timeline.
8. Interactive world map.
9. People directory.
10. Individual historical person pages.
11. Kingdoms and civilizations.
12. Artifact explorer.
13. Archaeological discoveries.
14. Scientific research explorer.
15. Source and bibliography directory.
16. Prophecy explorer.
17. Cross reference network.
18. Global search.
19. Research methodology.
20. Research progress.
21. About the project.

## 15.2 Event dossier requirements

Each event page should display:

- Canonical event title.
- Biblical references.
- Biblical account summary.
- Historical overview.
- Date or range.
- Chronology derivation.
- Ancient and modern geography.
- Relevant people.
- Kingdoms.
- Archaeological evidence.
- Scientific findings.
- Ancient documents.
- Modern news coverage.
- Source citations.
- Commentary references.
- Related events.
- Prophetic relationships.
- Historical disputes.
- Unanswered questions.
- Evidence classifications.
- Research status.
- Last reviewed date.

Claims should have citations close to the relevant text.

Do not hide the source bibliography.

## 15.3 Search

Search must support:

- Bible references.
- Names and aliases.
- Ancient cities.
- Kingdoms.
- Battles.
- Natural disasters.
- Artifacts.
- Archaeological discoveries.
- Historical periods.
- Scientific research.
- Source titles.

Example searches:

- Earthquake during Uzziah.
- Babylon's fall.
- Daniel 5.
- Nebuchadnezzar.
- Belshazzar.
- Jehu Black Obelisk.
- Sennacherib Jerusalem.
- Gallio inscription.
- Archaeology of Jericho.

## 15.4 Visual design

The website should resemble a serious university research collection, archaeological museum archive, and scholarly historical atlas.

Use a restrained editorial aesthetic.

Suggested palette:

- Warm ivory: `#F3EFE6`
- Parchment: `#E8DFCF`
- Dark ink: `#252923`
- Deep olive: `#495543`
- Aged brass: `#A27B45`
- Muted stone: `#77766E`

Suggested typography:

- Source Serif 4.
- Inter.

Use clear typographic hierarchy, whitespace, subtle dividers, and purposeful visual structure.

Avoid:

- Harsh gradients.
- Pure white backgrounds.
- Generic SaaS dashboard aesthetics.
- Excessive floating cards.
- Generic shadows.
- Rainbow color palettes.
- Lucide or Heroicons as default icon libraries.
- Fake charts.
- Fabricated statistics.
- Unsourced historical map shapes.
- Decorative imagery unrelated to the content.

Prefer labels and purpose built SVGs where needed.

Meet practical accessibility, keyboard navigation, contrast, responsive design, and mobile usability requirements.

## 15.5 Imagery

Default to public domain or CC0 imagery for locally hosted historical artifacts.

Use the Metropolitan Museum of Art Open Access collection when relevant.

Store attribution and image provenance.

For restricted collections, link to the institution rather than copying images.

Never assume a museum image is unrestricted simply because it appears online.

# PART 16. PUBLICATION AND REVIEW POLICY

## 16.1 Preliminary

A preliminary event may be published when:

- The biblical reference is valid.
- The summary accurately reflects the text.
- The literary classification is correct.
- External claims have traceable citations.
- Uncertainty is displayed.
- Automated checks pass.

Display a visible preliminary research label.

No minimum external source count is required.

## 16.2 Researched

A record may be marked researched when:

- The five stages have been completed.
- Required source searches have been performed.
- Relevant accessible evidence has been evaluated.
- Source support has been checked for important claims.
- Competing positions are represented.
- Chronology and geography have been reviewed.
- Cross references are validated.
- The research audit passes.

This does not guarantee historical correctness.

## 16.3 Human reviewed

A record receives human reviewed status only after explicit owner approval.

Record the reviewed version and decision date.

Do not infer human approval.

## 16.4 Separate completeness measurements

Track independently:

- Canonical verse coverage.
- Event extraction completion.
- Historical research completion.
- External evidence research completion.
- Chronology validation.
- Cross referencing completion.
- Source verification.
- Human review.
- Publication readiness.

Do not describe the entire book as historically researched merely because verse extraction is complete.

# PART 17. TESTING AND QUALITY ASSURANCE

## 17.1 Synthetic fixtures

Synthetic data is allowed exclusively in test directories.

Mark synthetic records:

`is_fixture: true`

Fixture records must never appear in public static exports.

The export pipeline must reject fixture records and dependent fixture relationships.

Use real sourced research records for public demonstrations.

## 17.2 Automated validation

Test:

- All 66 books are present.
- Canonical chapters are indexed.
- Canonical verse coverage is tracked.
- Passage references resolve.
- Entity IDs are stable.
- Duplicate events are detected.
- Source records are valid.
- Claim to source relationships are traceable.
- Source verification states are accurate.
- Chronology models are internally consistent.
- Calendar conversions are deterministic.
- Geographic coordinates are valid.
- Research stages preserve checkpoints.
- Review decisions are versioned.
- Static exports exclude fixtures.
- Restricted material is not exported.
- Frontend routes work on GitHub Pages.
- Search works.
- Maps render.
- Timeline renders.
- Mobile layouts work.
- Accessibility checks pass.

## 17.3 Provenance and reproducibility

Every major research conclusion must preserve:

- Source references.
- Research date.
- Research stage.
- Original claim.
- Derived interpretation.
- Relevant computation.
- Reviewer status.
- Revision history.

Keep enough information to reproduce research decisions without relying on Claude Code remembering a previous session.

# PART 18. REPOSITORY STRUCTURE

Create a maintainable monorepo resembling:

```text
biblical-history-database/
│
├── CLAUDE.md
├── README.md
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── docker-compose.yml
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── shared/
│   ├── database/
│   ├── scripture/
│   ├── research-engine/
│   ├── chronology-engine/
│   ├── geography/
│   ├── source-registry/
│   ├── validation/
│   └── static-export/
│
├── rules/
│   ├── 00-global.md
│   ├── 01-scripture-extraction.md
│   ├── 02-historical-reconstruction.md
│   ├── 03-external-evidence.md
│   ├── 04-cross-referencing.md
│   └── 05-publication-validation.md
│
├── standards/
│   ├── evidence.md
│   ├── sources.md
│   ├── chronology.md
│   ├── geography.md
│   ├── interpretation.md
│   ├── publication.md
│   ├── copyright.md
│   └── entity-resolution.md
│
├── research/
│   ├── books/
│   ├── events/
│   ├── queues/
│   ├── reviews/
│   └── logs/
│
├── data/
│   ├── seed/
│   ├── imports/
│   └── exports/
│
├── config/
├── scripts/
├── tests/
├── deployment/
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── RESEARCH_METHOD.md
│   ├── PROJECT_STATUS.md
│   ├── NEXT_ACTION.md
│   └── DEPLOYMENT.md
│
└── .github/
    └── workflows/
```

Modify this structure only for a clear technical reason.

Keep the full specification in `docs/SPEC.md`.

# PART 19. RESEARCH CLI

Implement commands equivalent to:

```bash
pnpm research:status
pnpm research:book daniel
pnpm research:chapter daniel 5
pnpm research:event EVENT_ID
pnpm research:resume
pnpm research:validate
pnpm research:crossrefs
pnpm research:refresh EVENT_ID
pnpm research:export

pnpm chronology:validate
pnpm chronology:recalculate
pnpm chronology:anchors
pnpm chronology:models

pnpm review:list
pnpm review:show RECORD_ID
pnpm review:approve RECORD_ID
pnpm review:reject RECORD_ID
pnpm review:return RECORD_ID
```

These should be functional commands, not decorative placeholders.

Commands that require Claude Code as the operator should create or load the appropriate research job and clearly identify the next operation.

Do not pretend a CLI is conducting autonomous web research when it is only preparing tasks.

# PART 20. IMPLEMENTATION MILESTONES

Follow this order.

Each milestone requires functioning code, validation, documentation, and a checkpoint.

## MILESTONE 1: GitHub repository and project foundation

Tasks:

1. Verify GitHub identity.
2. Create the new public repository.
3. Initialize the pnpm monorepo.
4. Configure TypeScript.
5. Configure linting and tests.
6. Create `docs/SPEC.md` with this complete prompt.
7. Create `CLAUDE.md`.
8. Create all five research rule files.
9. Create global research standards.
10. Configure GitHub Actions.
11. Establish project status and recovery documents.
12. Push verified initial code.

Acceptance:

- Repository exists.
- Correct account.
- Correct visibility.
- Initial code pushed.
- Build runs.
- Tests run.
- Governing specification is preserved.

## MILESTONE 2: Biblical and historical data foundation

Tasks:

1. Index all 66 canonical books.
2. Import verified chapter and verse metadata.
3. Import the unmodified WEB text.
4. Establish OSIS identifiers.
5. Create versification mapping infrastructure.
6. Implement normalized database schemas.
7. Configure PostgreSQL and PostGIS.
8. Implement migrations.
9. Create source registry structures.
10. Create entity resolution structures.
11. Create historical ruler tables.
12. Create synchronism tables.
13. Create chronological constraint tables.
14. Create calendar and regnal convention tables.
15. Create geographic uncertainty structures.
16. Add data integrity tests.

Acceptance:

- Database starts.
- Migrations pass.
- All 66 books are indexed.
- Verse inventory validates.
- Historical and chronological schemas work.

## MILESTONE 3: Research and chronology engines

Tasks:

1. Implement five stage research orchestration.
2. Implement research queues.
3. Implement checkpoints.
4. Implement source registration.
5. Implement source verification.
6. Implement source deduplication.
7. Implement claim and evidence associations.
8. Implement event and entity matching.
9. Implement review queues.
10. Implement basic chronological constraint solving.
11. Implement anchor synchronization logic.
12. Implement regnal year handling.
13. Implement dependency based date recalculation.
14. Implement chronological contradiction detection.
15. Implement research audits.
16. Implement publication validation.

### Genuine pilot event

Before moving to the website, perform a small authentic research investigation of:

**The earthquake in Amos 1:1 and Zechariah 14:5.**

Investigate:

- Biblical references.
- Historical period.
- Uzziah's reign.
- Possible geographical associations.
- Relevant archaeoseismological research.
- Archaeological findings.
- Dating disagreements.
- Source limitations.

Create a genuine research dossier with appropriate provisional classifications.

Do not falsely claim the geological evidence conclusively proves the specific biblical earthquake.

Acceptance:

- Research data progresses through all five stages.
- Sources and claims are connected.
- Chronology and geography function.
- The genuine event dossier can be exported.
- Validation passes.

## MILESTONE 4: Public research website

Tasks:

1. Build the design system.
2. Implement homepage.
3. Implement book and chapter explorer.
4. Implement passage references.
5. Implement event dossiers.
6. Implement source bibliography.
7. Implement evidence classification display.
8. Implement interactive map.
9. Implement historical timeline.
10. Implement parallel kingdom lanes.
11. Implement ruler reign bars.
12. Implement uncertainty intervals.
13. Implement chronology model switching.
14. Implement historical context comparison.
15. Implement global search.
16. Implement people and kingdom pages.
17. Implement artifact and research pages.
18. Implement static data exports.
19. Configure GitHub Pages.
20. Run responsive, functional, and accessibility tests.

Use the genuine Amos earthquake dossier as one real research record.

Do not fabricate additional historical research to populate the interface.

Use honest empty states.

Acceptance:

- Website builds.
- Real research content renders.
- All core navigation works.
- Map and timeline work.
- Static deployment succeeds where GitHub settings permit.
- Automated tests pass.

## MILESTONE 5: Daniel research pilot

Research all 12 chapters of Daniel through the five stage process.

Important subjects:

- Babylonian deportations.
- Nebuchadnezzar.
- Babylonian court life.
- Belshazzar.
- Nabonidus.
- Babylon's fall.
- Cyrus.
- Darius the Mede.
- Median and Persian chronology.
- Greek imperial history.
- Antiochus IV where relevant.
- Composition dating debates.
- Royal succession.
- Daniel's visions.
- Major prophetic interpretations.

### Chronology test

Use Daniel 1:1 and Jeremiah 25:1 to test regnal year conventions.

Connect Daniel's historical setting to the 597 BC and 539 BC chronological anchors where justified.

Represent alternative models accurately.

### Session boundary

Process one chapter or up to three substantial events per research session.

Save progress after each unit.

Do not call Daniel fully researched until all twelve chapters pass the defined coverage and research audits.

Human review may remain pending.

## MILESTONE 6: Cross book historical validation

Research overlapping passages including:

- 2 Kings 24.
- 2 Kings 25.
- 2 Chronicles 36.
- Jeremiah 25.
- Jeremiah 52.
- Ezra 1.
- Isaiah 44:28 through 45:1.

Use these to test:

- Shared events.
- Shared rulers.
- Babylonian exile chronology.
- Jerusalem's destruction.
- Cyrus.
- Royal decrees.
- Prophetic references.
- Historical synchronisms.
- Cross book entity resolution.

Do not duplicate canonical events already established in Daniel research.

## MILESTONE 7: Full canon expansion

Process the remaining books.

Prioritize books with overlapping historical contexts to improve global entity resolution and chronological consistency.

Gradually research:

- Pentateuch.
- Historical books.
- Wisdom and poetic references.
- Major prophets.
- Minor prophets.
- Gospels.
- Acts.
- Epistles.
- Revelation.

Preserve literary classifications and historical uncertainty.

Maintain book, chapter, event, and verse level progress.

Do not claim comprehensive completion until the actual research work is finished.

# PART 21. VERSION CONTROL AND CHECKPOINTS

Every work session must begin by reading:

1. `CLAUDE.md`.
2. Relevant sections of `docs/SPEC.md`.
3. `docs/PROJECT_STATUS.md`.
4. `docs/NEXT_ACTION.md`.
5. Active milestone information.
6. Relevant rules and standards.
7. Most recent relevant commits.

At the end of every session:

- Save structured research.
- Run applicable tests.
- Update project status.
- Record blockers.
- Record outstanding source verification.
- Record the next executable task.
- Commit completed work.

Never rely solely on conversational memory.

The repository is the permanent source of project context.

## 21.1 Required status documents

`docs/PROJECT_STATUS.md` must contain:

- Current milestone.
- Completed tasks.
- Incomplete tasks.
- Test results.
- Research progress.
- Existing blockers.
- Research and source limitations.
- Latest relevant commit.
- Next execution priorities.

`docs/NEXT_ACTION.md` must contain one clear next task with enough context for a new Claude Code session to continue immediately.

# PART 22. LICENSING

Use the MIT license for original application source code.

Use CC BY 4.0 for original publicly released research descriptions and structured records where appropriate.

Document third party exceptions.

Do not attempt to relicense copyrighted Bible translations, journal articles, museum assets, ancient text editions, or external proprietary datasets.

Keep source rights and attribution data attached to every imported resource.

# PART 23. FINAL ACCEPTANCE REQUIREMENTS

The system must ultimately provide:

1. A real GitHub repository.
2. Persistent source code and project instructions.
3. A functioning database.
4. All 66 biblical books indexed.
5. Complete verse coverage tracking.
6. The five executable research procedures.
7. Structured claim and evidence records.
8. Source verification controls.
9. Shared historical entities.
10. Canonical cross references.
11. Chronological synchronisms.
12. A working relative chronology constraint engine.
13. Regnal year calculations.
14. Calendar conversion support.
15. Chronological model comparisons.
16. Geographic uncertainty handling.
17. Human review workflows.
18. Public event dossiers.
19. Interactive ancient world maps.
20. A connected historical timeline.
21. Parallel kingdom chronology lanes.
22. Ruler reign bars.
23. Researchable prophetic records.
24. Searchable academic and historical sources.
25. An accessible responsive website.
26. GitHub Pages deployment.
27. Automated tests.
28. Source and copyright safeguards.
29. Persistent checkpoints.
30. A research process capable of gradually covering the entire biblical canon.

## Final research standard

The platform must never confuse:

- A biblical assertion with an independently verified historical fact.
- A commentary interpretation with physical evidence.
- A scholarly hypothesis with certainty.
- A historically plausible identification with independent corroboration.
- A machine generated conclusion with human review.
- A successfully completed software workflow with exhaustively completed research.
- A chronological calculation with the historical certainty of its underlying assumptions.

Every important conclusion must be traceable.

Every uncertainty must remain visible.

Every historical date must have an evidentiary or computational derivation.

Every external source must have appropriate provenance.

Every event must connect to Scripture.

# PART 24. EXECUTE NOW

Begin Milestone 1 immediately.

Do not respond with only a plan.

Inspect the development environment and available GitHub authentication.

Create the new public repository under `peytonlefleur`.

Save this full specification in `docs/SPEC.md`.

Create `CLAUDE.md` and the research rules.

Initialize the monorepo.

Set up the project architecture.

Implement and validate the first milestone.

Push the completed work to GitHub.

Continue to Milestone 2 if the environment and current session permit.

If an external permission or dependency blocks a particular action, record the blocker and continue independent work.

Do not invent completed actions.

Do not fabricate research.

Do not promise unattended work after the session stops.

Save a complete checkpoint before the session ends.

The ultimate goal is a permanent, expandable, historically rigorous biblical research atlas that connects every book of Scripture with ancient history, archaeology, science, chronology, geography, documentary evidence, and other biblical passages.

**Build the real system, preserve the research, validate every stage, and expand the database systematically.**
