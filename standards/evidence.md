# Standard: Evidence Classification

Source: SPEC Part 9. Implemented in `@atlas/shared` (`EVIDENCE_CLASSIFICATIONS`, `requiresHumanReview`).

## Unit of classification
Classify **individual claims** (`clm_`), never whole events or books. One event normally has several claims, and they can carry different classifications. Example: the setting of an event may be well supported while its specific occurrence is uncorroborated.

## Classes

| Code | Use when | Minimum record requirements |
|---|---|---|
| `independently_corroborated` | Independent documentary, archaeological or scientific evidence **directly** establishes the specific claim with substantial confidence | At least one `direct` supporting evidence record from a source at `claim_checked` or higher. General contextual similarity never qualifies. |
| `strongly_supported` | Several relevant findings build a substantial cumulative case, but material uncertainty remains | At least two independent lines of evidence, with limitations stated |
| `historically_plausible` | Consistent with the known context, but no independent evidence directly establishes the specific occurrence | The contextual evidence is cited, and the absence of direct evidence is stated |
| `disputed` | Material disagreement exists over the evidence, dating, identification or reconstruction | Each position is summarized with its sources. **Review required.** |
| `no_independent_corroboration_found` | A documented search found nothing sufficient | The search log is linked. The text must say that this is not disproof. |
| `contradicted_by_available_evidence` | Substantial relevant evidence directly conflicts with the specific claim or identification | The conflict is explained and the counterevidence cited. **Review required.** |
| `not_empirically_testable` | The essential claim cannot be assessed by historical or scientific method | State which element is untestable. This is **never** phrased as a theological verdict. |

## Rules
1. **Independence.** Count lines of evidence, not articles. Ten news stories about one inscription are one line.
2. **Specificity.** Evidence for a general practice (e.g. Babylonian royal banquets) supports the *setting*, not the specific event.
3. **Supernatural elements.** External evidence can bear on the natural setting only. The miraculous element is `not_empirically_testable`.
4. **Direction-neutral.** Apply the same standard whether the evidence supports or challenges the biblical claim.
5. **Provenance.** Every classification stores the claim, the proposed class, supporting evidence, counterevidence, reasoning, limitations, source IDs, research date and reviewer status.
6. **Reviewer status.** Classifications made by Claude Code are `machine_proposed`, or `requires_review` when a SPEC 9.3 trigger fires. Only an owner decision produces `human_approved` or `human_rejected`.

## Review triggers (SPEC 9.3)
These are implemented by `requiresHumanReview()`:
- critical priority
- `disputed`
- `contradicted_by_available_evidence`
- an entity merge or split
- a fulfillment that is proposed or revised
- a published identification that changes substantially
- primary sources that conflict
- unresolved authenticity that affects publication
