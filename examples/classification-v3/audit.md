# Audit of classification B v3 (report.md of 2026-09-14T15:06Z)

Independent check of `collection/src/classify-b.ts`, `classify-b-report.ts`, `classify-b-audit.ts` and the 2,158 v3 `*.b.json`, against the seven bugs (B1-B7) of the v2 audit. Nothing under `examples/games` was touched; no `*.reading.json` or `classify-b*.ts` was edited. Numbers were recomputed with my own scripts (`audit-crops-fable/scripts/`), samples drawn with seed 41 and viewed as contact sheets in `audit-crops-fable/` (labels A / B3 / B2 under each crop; a new renderer `collection/src/classify-b-audit-fable.ts` draws them). Structured numbers are in `audit.json`.

## Verdict per claim

| claim | verdict | evidence |
| --- | --- | --- |
| every headline number in report.json | **confirmed exactly** | totals, 10 flag counts, colour x kind table (all cells), mismatch-by-kind, seats 1263/892/0 and 132/459/0, overlay 168 (92/61/103), robber 2143, merchant 1119, class counts, six action counts: 0 differences |
| B1 sheep blobs no longer panels; 15/15 true UI flagged, 0/17 false positives | **confirmed** | recomputed 15/15 and 0/17; 864 `under-overlay` flags cleared, 12/12 sampled are real pieces on pasture; v3's 168 captures are a strict subset of the v2 auditor's rule E (190), and the 22 rule-E-only captures have no UI (12 viewed); 24 clean captures viewed, no UI missed |
| B2 colour-mismatch-seat 559 -> 8 | **confirmed** | the 8: B right 3 (event263 e21 red road x2, edge2168/03 e47 bronze), neither 4 (UI, robber, a knight badge), unclear 1. Of the v2 audit's 28 genuine ones: 8 still flagged, 20 now "nothing here" |
| B3 58 games gained 151 colours; 185/186 cleared | **confirmed** | recount 58 / 151 / 185 of 186 (fort4077 e59 left); 12/12 cleared pieces are real; 13/13 colours in 5 random newly seated games are real; all 15 colours seated by building+road alone are real; no game has > 4 inferred seats |
| B4 "nothing here" for edges: 719 unreadable, ~1.5% of real roads lost | **count confirmed, effect misdescribed** | the loss is not noise: 454 of the 471 unreadable roads with a seated colour and no overlay end at a knight badge (96% vs 58% of all roads), 35 of 36 sampled are real roads with A's colour, and v2 had the colour right on 491 of the 719. The -491 in colour agreement is B's loss, not A's. On UI edges of unseated colours B4 works: 11/12 phantom->none and 10/11 of the new 40-45 band drops are UI. See F1 |
| B5 hidden-token 25 -> 40 | **precision confirmed, recall poor** | tiles at 40-50: 6/6 covered (one by the robber). Tiles at 30-40: 10/12 covered by banners, panels or cards; 25-30: 3/6. Capture-level effect small (40 of the 43 tiles in 30-40 are in captures already flagged by tokensFound<18); piece-level `under-overlay` is lost on ~35 covered tiles. See F2 |
| B6 tables split | **confirmed** | A colour x A kind vs B seat colour x B kind (report.ts:157-159); variants in a B-only table |
| B7 watching games included | **confirmed** | ore3646/01, roll1690/01, deal1997/01 classified, seats inferred; deal1997/01 is no longer overlay-suspected (sheep) |
| white3776 02-04 v25 = mysticblue metropolis trade | **confirmed by eye** | relabel sheet #6-#7: light-blue city with tower next to the black merchant |
| map7182/03 6/6 phantom+overlay; gold2088/12 and town353/08 clean | **confirmed** | data: map7182/03 flagged by tokensFound=16, 2 panels, hidden tile 2; gold2088/12 and town353/08 blobs rejected as long-but-hollow (fill 0.28 / 0.32) and the boards show no UI |
| drop sample 12/12, overlay sample 12/12 | **drop confirmed; overlay 11/12** | fresh drop sample 12/12 correct, 0 wrong in 47 unique drop pieces viewed (5 unclear); 12 fresh overlay captures: 11 real UI, 1 (fort9510/03) a board with one number token missing from the render and no UI |

## Bugs and limitations found in v3

- **F1 - B4 kills real roads that end at a knight badge** (`classify-b.ts:499-517` full-length road template, `524-528` decideEdge, thresholds `86-88`). The knight badge (0.35 spacing) covers the end of the road template; the best score rises to 40-75 and the twelve colours collapse to within 12 of each other, so the rule says "none". Endpoint kinds of the 471 seated, overlay-free unreadable roads: knight+metropolis 221, knight+settlement 100, city+knight 74, knight+knight 53, anything else 23. Samples: none->unreadable 11/12 real roads, weak->unreadable 12/12, seated-no-overlay 12/12. Impact: colour agreement -491 and kind agreement -719 are B's regressions; no proposed action is built on these pieces (drop needs `phantom-colour`), but 16 of the 227 phantom+none drops are knight-adjacent and 2 of the 7 without overlay are unclear by eye. Fix: score only the middle ~60% of the edge (or drop samples within half a knight diameter of a vertex where B sees a knight or tower), or refuse "none" when an endpoint carries a knight/metropolis unless best > roadNoneAbsolute.
- **F2 - hidden-token 40 misses most real covers** (`classify-b.ts:106`, `800-821`). 10/12 tiles at 30-40 are covered (banners, trade panels, cards); the two visible ones are a knight badge and a card clipping a corner. 40 keeps precision (6/6) but leaves ~35 covered tiles unflagged at the piece level; capture level is mostly rescued by `tokensFound<18`. 30 plus a knight-clip exception would be better.
- **F3 - seat inference from A alone** (`classify-b.ts:1147-1158`). `building+road anywhere` uses A's colours only, so two hallucinated pieces of one colour under an undetected overlay would seat that colour and exempt its later phantoms from `drop`. Not observed (15/15 building+road-only seats real, 13/13 newly seated colours real), and the strong-b path is safe (needs A == B, score < 20, three times). Side effect: the exclusion of overlay pieces is what leaves fort4077 purple unseated (v41 sits on tile 15 whose token is hidden by a real "+2" banner).
- **F4 - `tokensFound<18` flags render anomalies** (`classify-b.ts:911-913`). 26 captures are flagged by this rule alone; 9/12 viewed have real UI (cards, small banners), 3 have a missing or displaced number token (fort9510/03, 256548064/01, king5484/11) or only the robber. Defensible as "not a clean frame", but not a panel.
- **F5** - `--list` / `--debug` infer seats from the listed subset only (`classify-b.ts:1194-1201`, `1232-1236`); partial reruns are not comparable with the full run.
- **F6** - presentation: "colour agreement over pieces B has an answer for" 99.92% (`report.ts:840-842`) removes B's own failures from the denominator; kind agreement 98.86% counts the 719 "none" as disagreements although most are B's (F1).
- **F7** - the robber (3 tiles) and merchant (1) count as token covers (`classify-b.ts:816-818`); negligible.
- **F8** - v2 action counts are hard-coded in `report.ts:467-474`; correct today, brittle.

What is *not* wrong: seats are applied after classification from the stored per-colour family scores (`applySeats` 1095-1126), so seats never change what B sees; `decideEdge` never reads A; `missed-by-a` pieces cannot seat a colour (A colour null) and none of the 87 is phantom or under an overlay; per-game grouping and sharding are correct; template cache keys include scale (and angle/spacing where needed).

## Regression v2 -> v3

1,898 pieces changed flag state (ignoring near-robber/near-merchant); B's *answer* changed for exactly 719 pieces, all road -> none. Top transitions (full list in `audit.json`):

| v2 flags | v3 flags | pieces |
| --- | --- | ---: |
| under-overlay | none | 864 |
| none | unreadable | 271 |
| colour-mismatch-seat+phantom-colour | none | 190 |
| weak-match | unreadable | 137 |
| colour-mismatch+colour-mismatch-seat+phantom-colour+under-overlay | phantom-colour+under-overlay+unreadable | 69 |
| colour-mismatch-seat+phantom-colour+under-overlay | phantom-colour+under-overlay | 51 |
| colour-mismatch+colour-mismatch-seat+phantom-colour+under-overlay+weak-match | phantom-colour+under-overlay+unreadable | 43 |
| colour-mismatch-seat+phantom-colour+under-overlay | phantom-colour+under-overlay+unreadable | 34 |
| colour-mismatch+colour-mismatch-seat+phantom-colour+weak-match | phantom-colour+unreadable | 28 |
| colour-mismatch+colour-mismatch-seat+phantom-colour | phantom-colour+unreadable | 22 |
| colour-mismatch+weak-match | unreadable | 20 |
| colour-mismatch+colour-mismatch-seat+phantom-colour | colour-mismatch+phantom-colour | 14 |
| colour-mismatch+colour-mismatch-seat+phantom-colour+under-overlay | colour-mismatch+phantom-colour+under-overlay | 11 |
| colour-mismatch+colour-mismatch-seat+weak-match | unreadable | 10 |
| colour-mismatch+colour-mismatch-seat+phantom-colour+under-overlay+weak-match | phantom-colour+unreadable | 9 |
| under-overlay | under-overlay+unreadable | 9 |

Sample verdicts per transition class (12 each, seed 41):

| transition | v2 right | v3 right | neither | unclear | what the crops show |
| --- | ---: | ---: | ---: | ---: | --- |
| under-overlay -> none (864) | 0 | 12 | 0 | 0 | real pieces on pasture next to sheep |
| seat-phantom -> none (191, B3) | 0 | 12 | 0 | 0 | real pieces of a colour v2 had not seated |
| none -> unreadable (271, B4) | 11 | 1 | 0 | 0 | roads ending at a knight badge; 1 trade panel |
| weak-match -> unreadable (151, B4) | 12 | 0 | 0 | 0 | roads ending at a knight badge |
| colour-mismatch -> unreadable (52) | 5 (A right) | 4 | 2 | 1 | neither = edge2168 e47 bronze road A calls black, v2 had bronze |
| phantom -> phantom+unreadable (227) | 0 | 11 | 0 | 1 | trade panels, banners, cards |

## Fresh samples (seed 41)

| class | pop. | n | A right | B right | both | neither | unclear |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| relabel candidates | 15 | 12 | 0 | 12 | 0 | 0 | 0 |
| fix-kind (all) | 6 | 6 | 0 | 6 | 0 | 0 | 0 |
| add-piece | 87 | 12 | 0 | 12 | 0 | 0 | 0 |
| colour-mismatch-seat (all) | 8 | 8 | 0 | 3 | 0 | 4 | 1 |
| colour-mismatch, seat colour = A (all) | 8 | 8 | 4 | 0 | 0 | 1 | 3 |
| unreadable roads, all | 719 | 12 | 6 (real road) | 5 (UI) | - | - | 1 |
| unreadable roads, seated colour, no overlay | 471 | 12 | 12 | 0 | - | - | 0 |
| agree (8 road / 6 settlement / 4 city / 4 knight / 2 metropolis) | 52,275 | 24 | - | - | 24 | 0 | 0 |

| class | n | correct | wrong | unclear |
| --- | ---: | ---: | ---: | ---: |
| drop candidates, random | 12 | 12 | 0 | 0 |
| drop candidates, all vertex pieces | 11 | 11 | 0 | 0 |
| drop candidates, edge with a knight at an endpoint and no overlay (all) | 7 | 5 | 0 | 2 (crop490/01+02 e26 gold 74.9, event659/03 e37) |
| drop candidates, no overlay and not e5 | 12 | 10 | 0 | 2 (crop490 e26, ore1633/07 e57) |
| drop candidates new in v3 (40-45 band, all) | 11 | 10 | 0 | 1 (army4015/13 e21) |
| overlay-flagged captures (real UI over board?) | 12 | 11 | 0 | 1 (fort9510/03: a token missing from the render) |
| overlay flagged by tokensFound only (26) | 12 | 9 | 0 | 3 (missing/displaced token, robber) |
| not-flagged with tokensFound<18 | 0 | - | - | empty by construction |
| not-flagged with a rejected blob (176) - UI missed? | 12 | 12 | 0 | 0 |
| not-flagged random - UI missed? | 12 | 12 | 0 | 0 |
| rule-E-kept, v3-rejected (22) - v3 right to reject? | 12 | 12 | 0 | 0 |
| hidden token, score 40-50 (covered?) | 6 | 6 | 0 | 0 (one is the robber) |
| hidden token, score 30-40 (v3 says visible) | 12 | 2 visible | 10 covered | 0 |
| hidden token, score 25-30 | 6 | 3 visible | 3 covered | 0 |
| newly inferred seats, 5 games / 13 colours (playing?) | 13 | 13 | 0 | 0 |
| seats by building+road only (all) | 15 | 15 | 0 | 0 |
| fort4077 purple (v41 settlement, e59 road) | 2 | 2 | 0 | 0 |

Hidden-token precision/recall as observed: at threshold 40 precision ~100% (6/6; 1 robber), recall over the 25-50 population roughly 37 / (37 + ~36 + ~6) ~ 45-50%. At threshold 30 the precision would be about (37 + 36) / 80 ~ 90% with most of the covers recovered.

## Actions verdict

| action | count | verdict |
| --- | ---: | --- |
| relabel-piece | 15 | **safe.** 12/12 by eye (white -> silver/mysticblue knights, gold -> green knights, white3776 v25); the 3 unsampled are other frames of the same pieces. |
| fix-kind | 6 | **safe.** 6/6 are knight badges A read as settlements. |
| add-piece | 87 | **safe.** 12/12 inactive knight badges; none phantom, none under an overlay. |
| drop-piece | 257 | **safe, with a narrow eye-check.** 0 wrong among 47 unique pieces viewed, 5 unclear. Before applying, look at the 7 "none" drops on edges with a knight at an endpoint and no overlay (F1 can produce them): crop490/01 and /02 e26 (gold road, 74.9), event659/03 e37 (black, 56.9), plus ore1633/07 e57 (pink) and army4015/13 e21 (black). The 124 e5 pieces and the 170 under-overlay pieces are trade panels, banners and cards. |
| mark-capture-overlay-contaminated | 168 | **safe as an exclusion list.** 20/24 viewed have real UI; the other 4 have a missing or displaced number token or only the robber, and are not clean training frames either. Weakest subset: the 26 flagged by tokensFound alone. |
| complete-seats | 1 | **safe.** fort4077 frame 02 has a real purple settlement (v41) and road (e59). |

Not an action, but a warning: do not read `unreadable` (719) or the -491 colour agreement as evidence against A. Fix F1 and rerun before using B's road colour agreement as a metric; nothing else in the action set depends on it.

## Where I am unsure

The five "unclear" drop pieces above (faint or absent roads next to knight badges or white pieces); the 3 tokensFound-only captures with displaced tokens (render glitch vs. capture timing); whether the 30-40 token band would stay ~85% covered on a larger sample (n = 12 here); science vs. trade metropolis type, which I did not test beyond the agreeing sample; and the "neither" rows, which are UI or the robber sitting where A reported a piece.
