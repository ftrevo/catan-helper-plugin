# Audit of classification B (report.md of 2026-09-14T11:02Z)

Independent check of `collection/src/classify-b.ts`, `classify-b-report.ts` and the 2,152 `*.b.json` results. Nothing under `examples/games` was touched; no `*.reading.json` or existing `classify-b*.ts` was edited. Numbers below were recomputed with my own scripts (`examples/classification-v2/audit-scripts/`), samples were drawn with a fixed seed by a new helper (`collection/src/classify-b-audit.ts`) and viewed as contact sheets in `examples/classification-v2/audit-crops/`. Structured numbers are in `audit.json`.

## Verdict per headline claim

| claim | verdict | evidence |
| --- | --- | --- |
| colour agreement 99.57% | **confirmed as computed**, interpretation corrected | recount 65,503 / 65,786. Uses B's unconstrained colour; A's colour is never fed to B's decision. But B's own unconstrained road colour is wrong often at weak scores (A right in 6/12 sampled non-phantom colour mismatches), so this is agreement with a noisy judge, not an A error rate. |
| kind agreement 99.96% | **confirmed as computed**, misleading | roads (49% of pieces) cannot disagree on kind in B (only `none` above 95, which never fired). Vertex-only kind agreement is 33,741 / 33,770 = 99.91%. |
| 559 seat-constrained colour mismatches | **corrected** | 531 are the phantom-colour pieces: a colour outside the seat list can never equal the seat-constrained answer, so the flag is tautological there. 28 are genuine; of 12 sampled, B right 4 (all one bronze road A calls black), A right 1, neither 4 (UI or robber under the position), unclear 3. |
| 531 phantom-colour pieces | **count confirmed**, meaning corrected | 353 are in games with *inferred* seats and 186 of those are pieces B strongly agrees with A on (score < 20, same colour) - the seat inference is wrong, not A. In the 178 phantom pieces of registry-seat games B never strongly agrees with A's colour, so registry seats look reliable. Sample of 12: 4 real pieces with a missing inferred seat, 7 UI / no piece, 1 unclear. |
| 283 colour mismatches | **count confirmed**, overstates A | 40 of the 283 have B's seat-constrained colour equal to A. Sample of 12 non-phantom ones: A right 6, B right 2, neither 2, unclear 2. B's failures are white/silver, black/bronze and blue/black on roads scoring 55-70. |
| 87 knights missed by A | **confirmed** | all 87 are inactive knights (61 level 1, 26 level 2), none phantom, worst score 14.9; 12/12 sampled are real knight badges at vertices A left empty. |
| 29 kind mismatches | **count confirmed**, mostly UI | sample of 12: B right 3 (knight badges A read as settlements), neither 7 (trade cards, avatars, the robber at the vertex), unclear 2, A right 0. |
| 0 knight level/state mismatches | **confirmed as computed**, says nothing about A | the flag compares B's variant under A's colour with B's variant under B's own colour. A has no level/state; the report's A-side variant columns are B's templates (report.ts:79-85). |
| UI overlays raise the mismatch rate ~60x; robber/merchant do not | **direction confirmed**, magnitude imprecise | recount 164/1,480 = 11.1% vs 119/64,365 = 0.18%; robber 0.29% vs 0.45%; merchant 0.10% vs 0.46%. About 45% of the overlay-suspected captures are false positives (below), so the "with overlay" population is diluted; the true effect for real panels is larger. |
| bronze road A=180 vs B=59, 117 of A's on edge 5 | **confirmed** | recount 180 / 117 / 59. Edge 5 is under the trade-offer panel: 11 of 12 drop-candidate crops centred on e5 show the panel (people icon, arrow, card), and three board views show it over tiles 2 and 6. All 59 B bronze roads are in games that seat bronze (land5766 and wool8372 by inference, edge2168 by registry). 51 coincide with A; the other 8 are the edge2168 e47 road that A calls black in eight frames and is copper-brown by eye - B right, A wrong. |
| robber found in 2,140/2,152 with margin >= 14 | **confirmed** | recount 2,140/2,152 (2,143/2,155 with the added captures), min margin 14.1. 10/10 random boards and all 4 white3776 frames show the grey pawn inside the detected tile's circle. |
| white3776 02-04 v25: merchant, not robber | **confirmed** | robber t16, t16, t17, t1 in frames 01-04; the black merchant is on t14 in frame 01 and on t10 (directly below v25) from frame 02. A read the piece as mysticblue in frame 01 and white in 02-04; B says mysticblue in all four with byte-identical per-colour scores (16.2-16.3, white 30.6); registry seats are mysticblue, gold, red, black. That the merchant *caused* A's flip is plausible but not provable from these data. |
| 347 captures overlay-contaminated | **corrected** | flag precision 4/12 on a random sample. Captures resting only on small `ui-panel` rectangles: 3/12 real. Captures with `tokensFound<18`, a hidden token scoring >= 40 or a rectangle >= 1 spacing: 10/12 real, 1 false, 1 unclear. |

## Bugs and limitations found in B

- **B1 - white sheep pass as UI** (`classify-b.ts:655-663`, `699-700`). The flat/light/unsaturated block test admits the white pasture-sheep artwork; the two-block (16 px) closing welds sheep + number token into a 0.6-0.8 spacing blob, which clears the 0.45 spacing size filter. Every false positive I saw (17 of 17) is a token next to a sheep, or a token next to a white piece. The comment "number tokens are far too small to pass" holds only for a token alone. Impact: roughly 45% of the 348 overlay captures and 617 of the 1,482 `under-overlay` piece flags are wrong; `mark-capture-overlay-contaminated` is not safe as-is.
- **B2 - tautological seat mismatch** (`classify-b.ts:814`, `893`). `colour-mismatch-seat` fires for every phantom piece by construction; only 28 of 559 carry information.
- **B3 - seat inference too strict** (`classify-b.ts:967-987`). A colour needs a building *and* a road in at least two frames; in two-frame games one dropped piece removes a seat. This produces at least 186 false phantom flags, 4 of 12 sampled phantoms were real pieces, and 23 `drop-piece` candidates are pieces B agrees with A on (one verified real: `20260912-spot2638/02` e15, black road).
- **B4 - roads have no "nothing here" hypothesis** (`classify-b.ts:490-510`, `roadNone: 95`). B always returns an argmin colour for an edge; above about 45 that colour is close to arbitrary. Consequences: kind agreement on roads is structural, `colour-mismatch` overstates A's road errors, and the seat-constrained colour should be the one used for roads.
- **B5 - hidden-token threshold too tight** (`THRESHOLDS.token = 25`). Visible tokens score up to 24.8 (p99 13.7); I saw false hidden-token hits at 31.9 (`king3990/01` t5) and 32.7 (`ship4971/02` t3) on plainly visible tokens, and a true hit at 27.9 (`win9397/01` t15, a card over the token). The 25-40 band is unreliable on its own.
- **B6 - A-side variants are B's** (`classify-b-report.ts:79-85`). Metropolis type and knight level/state in the colour x variant table come from B's templates for both columns; only the colour axis compares A with B.
- **B7 - `watching` games skipped** (`classify-b.ts:1013`). Three captures had no B result; added by this audit.
- **N1 - not a B bug, a training note**: `training/src/renderer.ts:189-198` draws the robber at (-0.2, -0.05) spacings, height 0.45; B's calibration on real captures (-0.3, -0.26, 0.43) is the one that matches the game, verified on 14 boards. The synthetic robber sits lower and further right than the real one.

What is *not* wrong: vertex/edge/tile pixel positions come from the same `layout.ts` functions A uses, so the two readings are compared at identical points; `PIECE_SCALE`, anchor, metropolis tower offset, wall offset, knight diameter and road rotation match `renderer.ts` exactly; agreement is computed without seats and without A's colour (A's colour is only used for `levelWithAColour`); the aggregation reproduces `report.json` cell for cell.

## Recomputed totals (original 2,152 captures; `audit.json` also has the 2,155 figures)

| quantity | report | recount |
| --- | ---: | ---: |
| pieces A reports and B re-read | 65,786 | 65,786 |
| colour agreement | 65,503 (99.57%) | 65,503 (99.57%) |
| kind agreement | 65,757 (99.96%) | 65,757 (99.96%); vertex-only 99.91% |
| both | 65,483 | 65,483 |
| missed-by-a | 87 | 87 |
| colour-mismatch-seat / phantom / colour-mismatch / kind-mismatch / weak | 559 / 531 / 283 / 29 / 415 | identical |
| near-robber / near-merchant / under-overlay | 7,693 / 5,766 / 1,479 | identical |
| robber detected, min/p10/median margin, worst accepted | 2,140; 14.1 / 22.4 / 24.5; 19.1 | identical |
| merchant detected | 1,119 | 1,119 |
| overlay captures, by rule | 347; tokensFound 92, hidden-token 92, ui-panel 283 | identical (84 captures fire both token rules) |
| rare-colour table (bronze, silver, gold, purple, pink, mysticblue, white x 12 variants) | see report | no cell differs; full table in `audit.json` |

Decompositions the report does not give: `colour-mismatch-seat` 559 = 531 phantom + 28 genuine; `colour-mismatch` 283 = 243 also seat-mismatched + 40 where the seat-constrained colour equals A; phantom 531 = 178 registry-seat games (0 with strong B agreement on A's colour) + 353 inferred-seat games (186 with strong agreement); bronze roads in A: 129 in games not seating bronze, 51 in games seating bronze (all 51 also bronze in B).

## Visual verification (fresh seeded samples, seed 7)

Sheets in `examples/classification-v2/audit-crops/` (`<class>.png`, 4 columns, A and B labels under each crop; zooms in `zoom/`, second overlay sample in `overlay2/`).

| class | pop. | n | A right | B right | both | neither | unclear |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| relabel candidates | 15 | 12 | 0 | 12 | 0 | 0 | 0 |
| missed-by-a | 87 | 12 | 0 | 12 | 0 | 0 | 0 |
| kind-mismatch | 29 | 12 | 0 | 3 | 0 | 7 | 2 |
| colour-mismatch-seat, genuine (not phantom) | 28 | 12 | 1 | 4 | 0 | 4 | 3 |
| colour-mismatch, not phantom | 68 | 12 | 6 | 2 | 0 | 2 | 2 |
| phantom-colour | 531 | 12 | 0 | 0 | 4 | 7 | 1 |
| agree (stratified 8 road / 6 settlement / 4 city / 4 knight / 2 metropolis) | 51,585 | 24 | - | - | 24 | 0 | 0 |

| class | n | correct | wrong | unclear |
| --- | ---: | ---: | ---: | ---: |
| drop candidates (drop is correct?) | 12 | 11 | 1 (`spot2638/02` e15, real black road) | 0 |
| overlay-flagged captures (real UI over board?) | 12 | 4 | 8 | 0 |
| overlay-clean captures (no UI missed?) | 12 | 12 | 0 | 0 |
| second sample: flagged captures kept by the narrowed rule | 12 | 10 | 1 | 1 |
| second sample: flagged captures rejected by the narrowed rule | 12 | 3 | 9 | 0 |
| fresh sample: small solid rectangles kept by rule E | 8 | 8 | 0 | 0 |
| robber tile (pawn inside the detected tile's circle?) | 10 (+4 white3776 frames) | 14 | 0 | 0 |

Notes on the eye checks. "Neither" in the mismatch classes is almost always a trade card, avatar, "+1 points" banner or the robber pawn sitting where A reported a piece; there B's low-confidence answer is as meaningless as A's. The 6 "A right" colour mismatches all have B's seat-constrained colour equal to A. The metropolis towers in the agreeing sample are the lime `metropolis_trade` sprite, consistent with B's type; the distinction from the dark-green `metropolis_science` is subtle and I did not test it further. Merchant circles landed on the coloured merchant figure on every board where one was detected (about 15 boards).

## Overlay rule: what works

Rule E = overlay-suspected **and** (`tokensFound < 18` **or** a hidden token scoring >= 40 **or** a `ui-panel` rectangle with fill >= 0.55 **or** max side >= 1.3 spacings). Panels are solid rectangles (fill 0.55-1.0); the sheep+token blobs are sparse (fill 0.27-0.51 in all 17 labelled cases). Rule E keeps 190 of the 348 captures, 15/15 of the true positives and 0/17 of the false positives I labelled, and 8/8 of a fresh sample of small solid rectangles it keeps are the trade panel. The kept list is `audit-crops/overlay2/ruleE-kept.txt`; 865 `under-overlay` piece flags sit in kept captures, 617 in rejected ones. Caveat: tuned on 32 labelled captures plus 8 fresh; expect a residual few percent of false positives and the loss of a few panels that only show a low-fill fragment inside the board box. A cleaner fix in `findOverlays` is to reject blobs centred within 0.35 spacing of a tile centre whose token is visible, or to require a fill ratio.

## Coverage additions

Every `ok` reading with a PNG had a `.b.json` except the three in games left `watching` when the worker stopped; the default run skips those (`classify-b.ts:1013`). Added with `node --import tsx src/classify-b.ts --list ...`:

- `20260912-ore3646/01-124626` - 17 pieces, no flags, no seats (single frame, none in the registry), robber t13
- `20260912-roll1690/01-193258` - 17 pieces, no flags, no seats, robber t5
- `20260913-deal1997/01-030208` - 25 pieces, 3 `under-overlay`, overlay-suspected, no seats, robber t14

All 59 added pieces agree with A on colour and kind. No PNG under `examples/games` is newer than the report (newest 07:44Z, report 11:02Z), so no other images were added after B ran. With these three the totals are 2,155 captures, 65,845 pieces, 65,562 colour agreements (99.57%).

## Proposed actions: assessment

| action | count | assessment |
| --- | ---: | --- |
| relabel-piece | 15 | **safe as-is.** 12/12 verified; all are white -> silver/mysticblue or gold -> green knights, plus white3776 v25 (mysticblue). The three unsampled are later frames of sampled pieces with the same scores. |
| fix-kind | 5 | **safe as-is.** All five are knight badges A read as settlements; four seen by eye. |
| add-piece | 87 | **safe as-is.** 12/12 real inactive knights; none phantom; worst score 14.9. Optionally view the two flagged `under-overlay` first. |
| complete-registry-seats | 29 games / 47 colours | **safe where >= 3 strong pieces support the colour.** Check by eye: hill4380 blue and orange (2 pieces each), wall2349 blue (2), fort4077 blue (2) and purple (1). 4/4 sampled additions were real pieces. |
| drop-piece | 247 | **needs narrowing.** Exclude the 23 pieces in inferred-seat games where B's colour equals A's (one verified real, `spot2638/02` e15); review by eye the 43 that are neither on edge 5 nor `under-overlay`. The remaining ~180-200 are the trade-panel and chat positions (124 on edge 5, then e9, e21, e22, e17, e16) and 11/12 sampled were correct drops. |
| mark-capture-overlay-contaminated | 347 | **do not apply as-is** (about 45% false positives, all a token welded to a white sheep or a white piece). Apply rule E's 190 captures instead, or fix `findOverlays` (B1) and rerun. |

## What the previous agent missed

1. The white pasture sheep defeat the "flat light block" test, so the overlay detector fires on ordinary board artwork; the report's precision claim rests on the size filter alone.
2. `colour-mismatch-seat` is tautological for phantom pieces; the 559 headline is really 28.
3. Seat inference fails on two-frame games; a large share of "phantom colours" (>= 186) are real pieces of a real seat, and `drop-piece` inherits this.
4. B's unconstrained road colour is unreliable at weak scores, so `colour-mismatch` and the "B counts" for roads should use the seat-constrained colour throughout (the report does so only in the colour x variant table).
5. The colour x variant table's A-side metropolis types and knight variants are B's; the "0 level mismatches" is a self-consistency check of B.
6. A under-counts bronze as well as over-counting it: eight bronze roads at edge2168 e47 are labelled black by A across all frames (the report's `-121` bronze delta hides a `+8` inside it).
7. Three `watching`-game captures were never classified.
8. The example crops in report.md are the first hits in directory order, so they over-represent the early `256xxxxxx` games; this does not bias the numbers but means the 70 crops are not a sample.
9. For training: the synthetic renderer's robber position does not match the real game (N1).

Where I am unsure: the exact false-positive share of the 348 overlay captures (my two samples give 33% and, stratified, roughly 45%); whether the merchant caused A's flip at white3776 v25 (consistent, not proven); science vs trade metropolis type, which I only checked on two agreeing pieces; and the "unclear" rows above, mostly roads under or beside UI where neither reading can be judged from the pixels.
