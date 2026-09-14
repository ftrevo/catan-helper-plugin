# Classification B vs classification A

Generated 2026-09-14T11:02:01.864Z. B re-reads every stored capture by template-matching the game's own atlas sprites at the geometry the capture was read with; A is the stored `*.reading.json` from the CNN pipeline. Nothing under `examples/games` was modified.

## How B decides

For every position, B renders the game's own atlas sprites at the capture's own scale (`spacing / 416 * 1.2` for buildings, `0.35 * spacing` across for knight badges, `spacing / 416` for roads, anchored `0.065` spacings above the vertex as `renderer.ts` does) and scores each hypothesis as the mean absolute RGB error over the sprite's opaque pixels, subsampled to at most 700 samples. One alignment search of +/-3 px picks the offset for the whole family, then every colour of that silhouette is scored at that one offset, so colours are compared on an identical pixel set and the numbers mean the same thing across hypotheses.

Hypotheses per vertex: settlement, city and walled city in all twelve colours; the three metropolis towers beside the city; and all six knight badges in all twelve colours. When a tower is found, the colour is re-scored against the composite the game actually draws (city plus tower), because the tower hides the right half of the city. Per edge: the road sprite in all twelve colours, rotated to the edge. Scores are recorded per colour so weak decisions are visible.

## Totals

- captures classified: **2152** (3 skipped: reading not ok or PNG missing)
- pieces A reports and B re-read: **65786** (12238 settlement, 9307 city, 11129 knight, 32016 road, 1096 metropolis)
- colour agreement A vs B: **65503** (99.57%)
- kind agreement A vs B: **65757** (99.96%)
- both agree: **65483** (99.54%)
- pieces B finds that A does not report at all: **87** (see the `missed-by-a` section)
- seats: 1263 captures from the registry, 860 inferred, 29 unknown

| flag | pieces | share of pieces |
| --- | ---: | ---: |
| near-robber | 7693 | 11.69% |
| near-merchant | 5766 | 8.76% |
| under-overlay | 1479 | 2.25% |
| colour-mismatch-seat | 559 | 0.85% |
| phantom-colour | 531 | 0.81% |
| weak-match | 415 | 0.63% |
| colour-mismatch | 283 | 0.43% |
| missed-by-a | 87 | 0.13% |
| kind-mismatch | 29 | 0.04% |

Flag meanings:

- `phantom-colour`: A gave the piece a colour nobody is seated as.
- `colour-mismatch`: B's best colour over all twelve differs from A.
- `colour-mismatch-seat`: B's best colour among the seated colours differs from A.
- `kind-mismatch`: B's kind differs from A (settlement / city / metropolis / knight).
- `level-mismatch`: the knight level or state changes depending on whether the colour is A's or B's.
- `weak-match`: B's own best template scores worse than the 99th percentile of agreeing pieces, so B has no real support for anything here either.
- `under-overlay`: the position sits inside a detected UI panel, or on a tile whose number token is hidden.
- `near-robber` / `near-merchant`: the piece touches the tile the robber / the Cities & Knights merchant stands on.
- `missed-by-a`: A reports nothing at this vertex but B matches a piece there as sharply as it matches the pieces both agree on.

## Where the disagreements are

| A kind | pieces | colour mismatches | phantom colours | weak B match |
| --- | ---: | ---: | ---: | ---: |
| road | 32016 | 250 (0.78%) | 397 (1.24%) | 342 (1.07%) |
| settlement | 12238 | 4 (0.03%) | 55 (0.45%) | 11 (0.09%) |
| knight | 11129 | 16 (0.14%) | 21 (0.19%) | 7 (0.06%) |
| city | 9307 | 5 (0.05%) | 52 (0.56%) | 22 (0.24%) |
| metropolis | 1096 | 8 (0.73%) | 6 (0.55%) | 33 (3.01%) |

## Colour x variant: A counts vs B counts (B seat-constrained)

A counts use A's colour with the sub-variant template-matched the way `variants.ts` does it; B counts use B's seat-constrained colour (B's unconstrained colour when the seats are unknown) with B's own sub-variant. Cells are `A / B`; differences are where the curation counts would change.

| colour | settlement | city | road | metropolis science | metropolis politics | metropolis trade | knight level 1 active | knight level 1 inactive | knight level 2 active | knight level 2 inactive | knight level 3 active | knight level 3 inactive |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **bronze** | 11 | 29 / **27** | 180 / **59** | - | 7 | - | 6 / **5** | 6 | 4 | 6 | 3 | 5 |
| **silver** | 114 / **113** | 109 / **108** | 357 | 9 | 5 | 1 | 30 / **33** | 40 / **41** | 35 | 16 / **18** | 6 / **7** | 1 |
| **gold** | 135 | 110 / **109** | 419 / **427** | 12 | - | 4 | 51 / **50** | 27 / **34** | 50 / **49** | 27 / **28** | - | - |
| **purple** | 235 / **234** | 155 | 557 / **558** | 8 | 1 | 4 | 48 | 100 | 25 | 8 | - | 3 |
| **pink** | 490 / **491** | 275 | 1193 / **1239** | 18 | 5 | 10 | 136 | 160 / **172** | 87 | 84 / **88** | 3 | 1 |
| **mysticblue** | 480 / **481** | 453 / **454** | 1406 / **1455** | 23 | 27 | 11 / **14** | 159 / **161** | 198 / **216** | 131 | 63 / **70** | 37 / **40** | 14 |
| **white** | 563 / **565** | 472 / **468** | 1625 / **1534** | 48 | 7 | 19 / **16** | 175 / **170** | 179 / **180** | 158 | 83 / **82** | 18 / **14** | 5 |
| red | 3116 / **3112** | 2130 / **2126** | 7660 | 115 | 24 | 105 | 652 / **650** | 847 / **858** | 542 / **541** | 407 / **409** | 57 | 46 |
| blue | 2630 / **2617** | 1943 / **1936** | 6737 / **6739** | 109 | 47 | 57 | 554 / **557** | 752 / **757** | 442 | 325 / **327** | 53 | 35 |
| orange | 1253 / **1256** | 1048 / **1053** | 3258 / **3338** | 32 | 19 | 25 | 253 / **256** | 356 / **363** | 251 | 187 / **193** | 33 | 16 |
| black | 2462 / **2483** | 1998 / **2010** | 6563 / **6614** | 112 | 80 | 72 | 612 / **609** | 832 / **839** | 490 / **491** | 391 / **392** | 69 | 34 |
| green | 749 / **748** | 585 / **580** | 2061 / **2036** | 27 | 15 | 27 | 166 / **167** | 222 / **224** | 133 / **134** | 120 / **124** | 41 | 20 |

(Rare colours in bold. A cell showing a single number means A and B counted the same.)

Biggest count changes (|B - A| >= 5), which is where a curation built on A would be counting the wrong thing:

| colour | variant | A | B | delta |
| --- | --- | ---: | ---: | ---: |
| bronze | road | 180 | 59 | -121 |
| white | road | 1625 | 1534 | -91 |
| orange | road | 3258 | 3338 | +80 |
| black | road | 6563 | 6614 | +51 |
| mysticblue | road | 1406 | 1455 | +49 |
| pink | road | 1193 | 1239 | +46 |
| green | road | 2061 | 2036 | -25 |
| black | settlement | 2462 | 2483 | +21 |
| mysticblue | knight level 1 inactive | 198 | 216 | +18 |
| blue | settlement | 2630 | 2617 | -13 |
| black | city | 1998 | 2010 | +12 |
| pink | knight level 1 inactive | 160 | 172 | +12 |
| red | knight level 1 inactive | 847 | 858 | +11 |
| gold | road | 419 | 427 | +8 |
| black | knight level 1 inactive | 832 | 839 | +7 |
| blue | city | 1943 | 1936 | -7 |
| orange | knight level 1 inactive | 356 | 363 | +7 |
| mysticblue | knight level 2 inactive | 63 | 70 | +7 |
| gold | knight level 1 inactive | 27 | 34 | +7 |
| orange | knight level 2 inactive | 187 | 193 | +6 |

## Does the robber really flip colours?

No, not as a general mechanism. Pieces next to the robber disagree with B *less* often than pieces that are not, and the same holds for the merchant. What does flip colours is UI drawn over the board, by a factor of about 60.

The white3776 example in the brief is real but is a different piece: the grey figure that moved next to vertex 25 between frames 01 and 02 is the Cities & Knights **merchant** (`icon_merchant_black`, match score 6.3 against 26.9 for the runner-up), not the robber, which stayed on tile 16. So a grey figure landing beside a piece can disturb A - it is just rare (6 pieces in 5758 next to a merchant, 3 of them this vertex).

| condition | pieces with it | colour mismatches | rate | pieces without it | rate without |
| --- | ---: | ---: | ---: | ---: | ---: |
| robber on a touching tile | 7661 | 22 | 0.29% | 58125 | 0.45% |
| merchant on a touching tile | 5758 | 6 | 0.10% | 60028 | 0.46% |
| under a UI overlay | 1477 | 164 | 11.10% | 64309 | 0.19% |

## Where phantom colours sit on the board

Phantom colours are not spread evenly: they pile up on the board positions that the trade-offer and chat panels cover, which is what you would expect if A is reading UI rather than pieces.

| position | phantom pieces |
| --- | ---: |
| edge 5 | 125 |
| edge 16 | 25 |
| edge 9 | 24 |
| edge 17 | 20 |
| edge 22 | 18 |
| edge 21 | 17 |
| vertex 41 | 12 |
| vertex 44 | 11 |
| edge 52 | 9 |
| edge 63 | 9 |

## Games with the most mismatches

| game | pieces | colour mismatches | phantom colours | kind mismatches | missed by A | overlay captures | registry seats |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 20260913-event140 | 481 | 18 | 15 | 0 | 4 | 2 | black, pink, red, gold |
| 20260912-roll1100 | 20 | 13 | 13 | 0 | 0 | 0 | - |
| 20260913-land9050 | 18 | 13 | 13 | 0 | 0 | 0 | - |
| 20260912-256479510 | 21 | 12 | 12 | 0 | 0 | 1 | - |
| 20260912-tile4001 | 17 | 12 | 12 | 0 | 0 | 0 | - |
| 20260913-town7315 | 16 | 12 | 12 | 0 | 0 | 0 | - |
| 20260912-pack5873 | 74 | 11 | 11 | 1 | 0 | 1 | - |
| 20260912-play7857 | 66 | 11 | 11 | 1 | 0 | 1 | - |
| 20260913-fort4077 | 15 | 11 | 11 | 0 | 0 | 1 | - |
| 20260913-task1956 | 550 | 11 | 11 | 3 | 1 | 3 | red, mysticblue, orange, black |
| 20260912-event263 | 68 | 11 | 9 | 0 | 0 | 2 | - |
| 20260912-wall2349 | 14 | 10 | 10 | 0 | 0 | 0 | - |
| 20260913-army4015 | 525 | 10 | 10 | 0 | 0 | 8 | pink, blue, orange, red |
| 20260913-bank7927 | 18 | 10 | 10 | 0 | 0 | 0 | - |
| 20260913-mine2890 | 284 | 10 | 10 | 1 | 0 | 2 | blue, red, black, pink |
| 20260912-pack1321 | 29 | 9 | 9 | 0 | 0 | 0 | - |
| 20260912-steal1992 | 20 | 9 | 9 | 0 | 0 | 1 | - |
| 20260914-map7182 | 720 | 9 | 8 | 1 | 0 | 7 | black, orange, mysticblue, green |
| 20260912-area3745 | 20 | 8 | 8 | 0 | 0 | 0 | - |
| 20260912-sheep2141 | 16 | 8 | 8 | 0 | 0 | 0 | - |

## Robber and merchant detection

The robber is the `icon_robber` pawn drawn -0.3 spacings left and 0.26 up from the tile centre at 0.43 spacings tall; the Cities & Knights merchant is `icon_merchant_<colour>`, 0.25 right and 0.28 up at 0.24 spacings tall. Both were calibrated by scanning the sprites over real captures.

- robber found in **2140 / 2152** captures (99.44%), median match score 7.9, worst accepted 19.1
- not found in 12: 12 no-close-match
- margin over the runner-up tile: min 14.1, p10 22.4, median 24.5 (accepted only above 6)
- consecutive-frame stability: the robber is on the same tile in 704 of 1547 consecutive pairs (45.51%) - it only moves on a 7 or a knight action, so this is the expected order of magnitude
- merchant found in **1119** captures, by colour: red 281, black 260, blue 204, orange 109, green 70, white 61, mysticblue 41, silver 29, pink 28, purple 21, gold 11, bronze 4

## Overlays

347 captures are overlay-suspected. Rules that fired: `tokensFound` 92, `hidden-token` 92, `ui-panel` 283.

- `tokensFound`: the board locator found fewer than 18 number tokens while the lattice still fitted.
- `ui-panel`: a connected block of flat, light, unsaturated pixels (mean > 190, per-channel range <= 14, channel spread <= 32) at least 0.45 spacings wide and tall inside the board box, after a two-block morphological closing so icons inside a panel do not break it up. Number tokens are far too small to pass.
- `hidden-token`: the tile's own `prob_<n>` sprite does not match at the tile centre, so something is drawn over that tile.

## Examples

Crops are 0.9 spacings (0.7 for edges) at 4x, written to `examples/classification-v2/crops/` and named `<class>__<game>__<capture>__<pos>__A-<label>__B-<label>.png`.

### phantom-colour (531 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256421756/02-052308 | e5 | bronze-road | white-road | 58.2 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/phantom-colour__20260912-256421756__02-052308__e5__A-bronze-road__B-white-road.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | pink-road | 59.4 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/phantom-colour__20260912-256427922__01-061640__e5__A-bronze-road__B-pink-road.png` |
| 20260912-256457718/02-104304 | e52 | white-road | pink-road | 58.4 | phantom-colour colour-mismatch colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour__20260912-256457718__02-104304__e52__A-white-road__B-pink-road.png` |
| 20260912-256472762/01-125702 | e5 | bronze-road | pink-road | 59.3 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/phantom-colour__20260912-256472762__01-125702__e5__A-bronze-road__B-pink-road.png` |
| 20260912-256479510/01-131538 | v41 | red-settlement | red-settlement | 5.4 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour__20260912-256479510__01-131538__v41__A-red-settlement__B-red-settlement.png` |

### phantom-colour-strong-b (201 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256479510/01-131538 | v41 | red-settlement | red-settlement | 5.4 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour-strong-b__20260912-256479510__01-131538__v41__A-red-settlement__B-red-settlement.png` |
| 20260912-256554405/02-214128 | v19 | blue-settlement | blue-settlement | 7.8 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour-strong-b__20260912-256554405__02-214128__v19__A-blue-settlement__B-blue-settlement.png` |
| 20260912-area3745/02-112659 | v24 | blue-settlement | blue-settlement | 5 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour-strong-b__20260912-area3745__02-112659__v24__A-blue-settlement__B-blue-settlement.png` |
| 20260912-card5605/02-103824 | v14 | blue-settlement | blue-settlement | 6.2 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour-strong-b__20260912-card5605__02-103824__v14__A-blue-settlement__B-blue-settlement.png` |
| 20260912-deal6312/02-225439 | v12 | red-settlement | red-settlement | 4.9 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/phantom-colour-strong-b__20260912-deal6312__02-225439__v12__A-red-settlement__B-red-settlement.png` |

### colour-mismatch (283 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256414712/01-051425 | v11 | red-settlement | black-settlement | 55.6 | colour-mismatch colour-mismatch-seat weak-match | `examples/classification-v2/crops/colour-mismatch__20260912-256414712__01-051425__v11__A-red-settlement__B-black-settlement.png` |
| 20260912-256421756/02-052308 | e5 | bronze-road | white-road | 58.2 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/colour-mismatch__20260912-256421756__02-052308__e5__A-bronze-road__B-white-road.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | pink-road | 59.4 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/colour-mismatch__20260912-256427922__01-061640__e5__A-bronze-road__B-pink-road.png` |
| 20260912-256457718/02-104304 | e52 | white-road | pink-road | 58.4 | phantom-colour colour-mismatch colour-mismatch-seat | `examples/classification-v2/crops/colour-mismatch__20260912-256457718__02-104304__e52__A-white-road__B-pink-road.png` |
| 20260912-256472762/01-125702 | e5 | bronze-road | pink-road | 59.3 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/colour-mismatch__20260912-256472762__01-125702__e5__A-bronze-road__B-pink-road.png` |

### colour-mismatch-seat (316 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256479510/01-131538 | v41 | red-settlement | red-settlement | 5.4 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/colour-mismatch-seat__20260912-256479510__01-131538__v41__A-red-settlement__B-red-settlement.png` |
| 20260912-256548064/01-205818 | e27 | white-road | white-road | 44.1 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/colour-mismatch-seat__20260912-256548064__01-205818__e27__A-white-road__B-white-road.png` |
| 20260912-256554405/02-214128 | v19 | blue-settlement | blue-settlement | 7.8 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/colour-mismatch-seat__20260912-256554405__02-214128__v19__A-blue-settlement__B-blue-settlement.png` |
| 20260912-area3745/02-112659 | v24 | blue-settlement | blue-settlement | 5 | phantom-colour colour-mismatch-seat | `examples/classification-v2/crops/colour-mismatch-seat__20260912-area3745__02-112659__v24__A-blue-settlement__B-blue-settlement.png` |
| 20260912-brick7193/02-212315 | v6 | green-city | green-settlement | 45.8 | phantom-colour colour-mismatch-seat kind-mismatch weak-match under-overlay | `examples/classification-v2/crops/colour-mismatch-seat__20260912-brick7193__02-212315__v6__A-green-city__B-green-settlement.png` |

### kind-mismatch (29 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-board8606/01-195800 | v49 | black-settlement | black-knight-level-1-inactive | 4.9 | kind-mismatch | `examples/classification-v2/crops/kind-mismatch__20260912-board8606__01-195800__v49__A-black-settlement__B-black-knight-level-1-inactive.png` |
| 20260912-brick7193/02-212315 | v6 | green-city | green-settlement | 45.8 | phantom-colour colour-mismatch-seat kind-mismatch weak-match under-overlay | `examples/classification-v2/crops/kind-mismatch__20260912-brick7193__02-212315__v6__A-green-city__B-green-settlement.png` |
| 20260912-card5569/02-162107 | v48 | red-settlement | red-knight-level-1-inactive | 6.9 | kind-mismatch | `examples/classification-v2/crops/kind-mismatch__20260912-card5569__02-162107__v48__A-red-settlement__B-red-knight-level-1-inactive.png` |
| 20260912-pack5873/02-000135 | v39 | blue-metropolis-? | blue-city | 49.2 | kind-mismatch weak-match under-overlay | `examples/classification-v2/crops/kind-mismatch__20260912-pack5873__02-000135__v39__A-blue-metropolis-?__B-blue-city.png` |
| 20260912-play7857/02-085036 | v20 | white-knight-? | white-settlement | 59.3 | phantom-colour colour-mismatch-seat kind-mismatch weak-match under-overlay | `examples/classification-v2/crops/kind-mismatch__20260912-play7857__02-085036__v20__A-white-knight-?__B-white-settlement.png` |

### level-mismatch (0 pieces)

_none_

### weak-match (178 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256431162/01-071041 | e13 | red-road | red-road | 69.4 | weak-match | `examples/classification-v2/crops/weak-match__20260912-256431162__01-071041__e13__A-red-road__B-red-road.png` |
| 20260912-256435701/02-071918 | e25 | red-road | red-road | 62.6 | weak-match | `examples/classification-v2/crops/weak-match__20260912-256435701__02-071918__e25__A-red-road__B-red-road.png` |
| 20260912-256452649/01-115823 | e42 | red-road | red-road | 63.6 | weak-match | `examples/classification-v2/crops/weak-match__20260912-256452649__01-115823__e42__A-red-road__B-red-road.png` |
| 20260912-256546411/01-200706 | e59 | red-road | red-road | 71.6 | weak-match | `examples/classification-v2/crops/weak-match__20260912-256546411__01-200706__e59__A-red-road__B-red-road.png` |
| 20260912-256548064/01-205818 | v18 | orange-city | orange-city | 26.1 | weak-match | `examples/classification-v2/crops/weak-match__20260912-256548064__01-205818__v18__A-orange-city__B-orange-city.png` |

### under-overlay (480 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256421756/02-052308 | e5 | bronze-road | white-road | 58.2 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/under-overlay__20260912-256421756__02-052308__e5__A-bronze-road__B-white-road.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | pink-road | 59.4 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/under-overlay__20260912-256427922__01-061640__e5__A-bronze-road__B-pink-road.png` |
| 20260912-256472762/01-125702 | e5 | bronze-road | pink-road | 59.3 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/under-overlay__20260912-256472762__01-125702__e5__A-bronze-road__B-pink-road.png` |
| 20260912-256479510/01-131538 | e42 | white-road | orange-road | 56 | phantom-colour colour-mismatch colour-mismatch-seat under-overlay | `examples/classification-v2/crops/under-overlay__20260912-256479510__01-131538__e42__A-white-road__B-orange-road.png` |
| 20260912-area5876/01-074550 | v41 | black-city | black-city | 28.9 | weak-match under-overlay | `examples/classification-v2/crops/under-overlay__20260912-area5876__01-074550__v41__A-black-city__B-black-city.png` |

### near-robber-mismatch (29 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256479510/02-131812 | v44 | red-city | red-city | 6.7 | phantom-colour colour-mismatch-seat near-robber near-merchant | `examples/classification-v2/crops/near-robber-mismatch__20260912-256479510__02-131812__v44__A-red-city__B-red-city.png` |
| 20260912-cost1293/02-145715 | e5 | bronze-road | pink-road | 61.1 | phantom-colour colour-mismatch colour-mismatch-seat weak-match near-robber under-overlay | `examples/classification-v2/crops/near-robber-mismatch__20260912-cost1293__02-145715__e5__A-bronze-road__B-pink-road.png` |
| 20260912-deck1482/01-185416 | v34 | silver-knight-level-1-inactive | black-knight-level-1-inactive | 10.5 | phantom-colour colour-mismatch colour-mismatch-seat near-robber | `examples/classification-v2/crops/near-robber-mismatch__20260912-deck1482__01-185416__v34__A-silver-knight-level-1-inactive__B-black-knight-level-1-inactive.png` |
| 20260912-hand3383/02-091058 | e5 | bronze-road | pink-road | 59 | phantom-colour colour-mismatch colour-mismatch-seat near-robber under-overlay | `examples/classification-v2/crops/near-robber-mismatch__20260912-hand3383__02-091058__e5__A-bronze-road__B-pink-road.png` |
| 20260912-path1279/02-181304 | e5 | bronze-road | pink-road | 59.9 | phantom-colour colour-mismatch colour-mismatch-seat near-robber | `examples/classification-v2/crops/near-robber-mismatch__20260912-path1279__02-181304__e5__A-bronze-road__B-pink-road.png` |

### near-merchant-mismatch (8 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256479510/02-131812 | v44 | red-city | red-city | 6.7 | phantom-colour colour-mismatch-seat near-robber near-merchant | `examples/classification-v2/crops/near-merchant-mismatch__20260912-256479510__02-131812__v44__A-red-city__B-red-city.png` |
| 20260913-tile5627/06-142243 | e47 | white-road | silver-road | 65.6 | colour-mismatch weak-match near-merchant | `examples/classification-v2/crops/near-merchant-mismatch__20260913-tile5627__06-142243__e47__A-white-road__B-silver-road.png` |
| 20260913-wall6069/14-223525 | e25 | black-road | bronze-road | 74.2 | colour-mismatch colour-mismatch-seat weak-match near-merchant | `examples/classification-v2/crops/near-merchant-mismatch__20260913-wall6069__14-223525__e25__A-black-road__B-bronze-road.png` |
| 20260913-white3776/02-035427 | v25 | white-metropolis-trade | mysticblue-metropolis-trade | 16.2 | phantom-colour colour-mismatch colour-mismatch-seat near-merchant | `examples/classification-v2/crops/near-merchant-mismatch__20260913-white3776__02-035427__v25__A-white-metropolis-trade__B-mysticblue-metropolis-trade.png` |
| 20260914-edge2168/10-010613 | e47 | black-road | bronze-road | 55.3 | colour-mismatch colour-mismatch-seat near-merchant | `examples/classification-v2/crops/near-merchant-mismatch__20260914-edge2168__10-010613__e47__A-black-road__B-bronze-road.png` |

### missed-by-a (87 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-coin9063/02-221228 | v21 | none-nothing | orange-knight-level-1-inactive | 9 | missed-by-a | `examples/classification-v2/crops/missed-by-a__20260912-coin9063__02-221228__v21__A-none-nothing__B-orange-knight-level-1-inactive.png` |
| 20260912-cost7714/02-215655 | v14 | none-nothing | green-knight-level-1-inactive | 5.9 | missed-by-a | `examples/classification-v2/crops/missed-by-a__20260912-cost7714__02-215655__v14__A-none-nothing__B-green-knight-level-1-inactive.png` |
| 20260912-dice9461/01-231050 | v25 | none-nothing | blue-knight-level-1-inactive | 12.2 | missed-by-a near-robber | `examples/classification-v2/crops/missed-by-a__20260912-dice9461__01-231050__v25__A-none-nothing__B-blue-knight-level-1-inactive.png` |
| 20260912-farm4368/01-230123 | v35 | none-nothing | pink-knight-level-2-inactive | 11.7 | missed-by-a near-robber | `examples/classification-v2/crops/missed-by-a__20260912-farm4368__01-230123__v35__A-none-nothing__B-pink-knight-level-2-inactive.png` |
| 20260912-hand4271/01-201010 | v36 | none-nothing | orange-knight-level-2-inactive | 12.1 | missed-by-a near-robber near-merchant | `examples/classification-v2/crops/missed-by-a__20260912-hand4271__01-201010__v36__A-none-nothing__B-orange-knight-level-2-inactive.png` |

### agreement-sample (35670 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256411788/01-041123 | v8 | black-settlement | black-settlement | 3.7 |  | `examples/classification-v2/crops/agreement-sample__20260912-256411788__01-041123__v8__A-black-settlement__B-black-settlement.png` |
| 20260912-256414712/01-051425 | v9 | blue-settlement | blue-settlement | 4.2 |  | `examples/classification-v2/crops/agreement-sample__20260912-256414712__01-051425__v9__A-blue-settlement__B-blue-settlement.png` |
| 20260912-256418147/01-045504 | v12 | black-metropolis-science | black-metropolis-science | 9.1 |  | `examples/classification-v2/crops/agreement-sample__20260912-256418147__01-045504__v12__A-black-metropolis-science__B-black-metropolis-science.png` |
| 20260912-256421756/01-052035 | v9 | black-city | black-city | 4.3 |  | `examples/classification-v2/crops/agreement-sample__20260912-256421756__01-052035__v9__A-black-city__B-black-city.png` |
| 20260912-256427922/01-061640 | v7 | blue-knight-level-1-inactive | blue-knight-level-1-inactive | 6.9 |  | `examples/classification-v2/crops/agreement-sample__20260912-256427922__01-061640__v7__A-blue-knight-level-1-inactive__B-blue-knight-level-1-inactive.png` |
| 20260912-256428444/01-060706 | v8 | black-knight-level-1-inactive | black-knight-level-1-inactive | 3.5 |  | `examples/classification-v2/crops/agreement-sample__20260912-256428444__01-060706__v8__A-black-knight-level-1-inactive__B-black-knight-level-1-inactive.png` |
| 20260912-256431162/01-071041 | v8 | red-knight-level-1-inactive | red-knight-level-1-inactive | 5.2 |  | `examples/classification-v2/crops/agreement-sample__20260912-256431162__01-071041__v8__A-red-knight-level-1-inactive__B-red-knight-level-1-inactive.png` |
| 20260912-256435701/01-071644 | v13 | red-settlement | red-settlement | 3.4 |  | `examples/classification-v2/crops/agreement-sample__20260912-256435701__01-071644__v13__A-red-settlement__B-red-settlement.png` |
| 20260912-256440276/01-082013 | v8 | green-settlement | green-settlement | 7.9 |  | `examples/classification-v2/crops/agreement-sample__20260912-256440276__01-082013__v8__A-green-settlement__B-green-settlement.png` |
| 20260912-256452338/01-095735 | v10 | red-settlement | red-settlement | 4.5 |  | `examples/classification-v2/crops/agreement-sample__20260912-256452338__01-095735__v10__A-red-settlement__B-red-settlement.png` |
| 20260912-256452649/01-115823 | v8 | red-knight-level-1-inactive | red-knight-level-1-inactive | 5.2 |  | `examples/classification-v2/crops/agreement-sample__20260912-256452649__01-115823__v8__A-red-knight-level-1-inactive__B-red-knight-level-1-inactive.png` |
| 20260912-256457718/01-104031 | v9 | orange-city | orange-city | 4.7 |  | `examples/classification-v2/crops/agreement-sample__20260912-256457718__01-104031__v9__A-orange-city__B-orange-city.png` |
| 20260912-256472762/01-125702 | v0 | green-settlement | green-settlement | 5.4 |  | `examples/classification-v2/crops/agreement-sample__20260912-256472762__01-125702__v0__A-green-settlement__B-green-settlement.png` |
| 20260912-256476858/01-132229 | v24 | red-settlement | red-settlement | 3.5 |  | `examples/classification-v2/crops/agreement-sample__20260912-256476858__01-132229__v24__A-red-settlement__B-red-settlement.png` |
| 20260912-256479510/01-131538 | v9 | blue-settlement | blue-settlement | 4.1 |  | `examples/classification-v2/crops/agreement-sample__20260912-256479510__01-131538__v9__A-blue-settlement__B-blue-settlement.png` |
| 20260912-256487432/01-141641 | v17 | black-city | black-city | 9 |  | `examples/classification-v2/crops/agreement-sample__20260912-256487432__01-141641__v17__A-black-city__B-black-city.png` |
| 20260912-256489236/01-143518 | v8 | black-city | black-city | 8.3 |  | `examples/classification-v2/crops/agreement-sample__20260912-256489236__01-143518__v8__A-black-city__B-black-city.png` |
| 20260912-256537837/01-193642 | v7 | orange-knight-level-1-inactive | orange-knight-level-1-inactive | 6.4 |  | `examples/classification-v2/crops/agreement-sample__20260912-256537837__01-193642__v7__A-orange-knight-level-1-inactive__B-orange-knight-level-1-inactive.png` |
| 20260912-256540820/01-203248 | v5 | black-city | black-city | 3.7 |  | `examples/classification-v2/crops/agreement-sample__20260912-256540820__01-203248__v5__A-black-city__B-black-city.png` |
| 20260912-256546411/01-200706 | v7 | black-settlement | black-settlement | 6.6 |  | `examples/classification-v2/crops/agreement-sample__20260912-256546411__01-200706__v7__A-black-settlement__B-black-settlement.png` |

## Validation

| check | expected | got | result |
| --- | --- | --- | --- |
| white3776 frame 02 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.2, A said white metropolis) | PASS |
| white3776 frame 03 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.3, A said white metropolis) | PASS |
| white3776 frame 04 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.3, A said white metropolis) | PASS |
| map7182 frame 03 gold/silver/white pieces | all flagged phantom-colour and under-overlay | 6/6 flagged; capture overlaySuspected=true rules=tokensFound=16<18; ui-panel x2; hidden-token tiles 2,6 | PASS |
| white3776 robber and merchant tiles per frame | robber moves; merchant on the tile below vertex 25 (tile 10) from frame 02 | f01: robber=16 merchant=14(black), f02: robber=16 merchant=10(black), f03: robber=17 merchant=10(black), f04: robber=1 merchant=10(black) | PASS |

## Proposed actions (not applied)

### relabel-piece - 15

A reads a colour B rejects and B has a strong match (best < 20) for a different colour. Change the piece colour in the reading to B, keeping the original as a backup.

- 20260912-deck1482/01-185416 vertex 34: silver-knight-level-1-inactive -> black-knight-level-1-inactive (B score 10.5)
- 20260912-farm8303/02-215956 vertex 38: gold-knight-level-1-active -> green-knight-level-1-active (B score 6.6)
- 20260913-map4938/02-231036 vertex 13: white-knight-level-1-active -> silver-knight-level-1-active (B score 11.1)
- 20260913-town5830/05-182532 vertex 35: white-knight-level-2-inactive -> silver-knight-level-2-inactive (B score 11.2)
- 20260913-trade5728/06-162324 vertex 24: gold-knight-level-2-active -> green-knight-level-2-active (B score 16.3)
- 20260913-turn1449/08-185235 vertex 45: white-knight-level-3-active -> silver-knight-level-3-active (B score 12)
- 20260913-white3776/02-035427 vertex 25: white-metropolis-trade -> mysticblue-metropolis-trade (B score 16.2)
- 20260913-white3776/03-035950 vertex 25: white-metropolis-trade -> mysticblue-metropolis-trade (B score 16.3)
- 20260913-white3776/04-040527 vertex 25: white-metropolis-trade -> mysticblue-metropolis-trade (B score 16.3)
- 20260914-card7322/05-065830 vertex 41: white-knight-level-1-active -> silver-knight-level-1-active (B score 8.4)
- 20260914-card7322/06-070100 vertex 41: white-knight-level-1-active -> silver-knight-level-1-active (B score 8.4)
- 20260914-catan7909/13-043429 vertex 36: white-knight-level-3-active -> mysticblue-knight-level-3-active (B score 14.8)

### drop-piece - 247

A reads a piece whose colour is not seated and no template matches the pixels (best >= 45): almost always UI drawn over the board. Remove the piece from the reading.

- 20260912-256421756/02-052308 edge 5: bronze-road -> white-road (B score 58.2)
- 20260912-256427922/01-061640 edge 5: bronze-road -> pink-road (B score 59.4)
- 20260912-256457718/02-104304 edge 52: white-road -> pink-road (B score 58.4)
- 20260912-256472762/01-125702 edge 5: bronze-road -> pink-road (B score 59.3)
- 20260912-256472762/02-125936 edge 18: white-road -> mysticblue-road (B score 70.8)
- 20260912-256479510/01-131538 edge 42: white-road -> orange-road (B score 56)
- 20260912-256479510/01-131538 edge 52: white-road -> red-road (B score 71.1)
- 20260912-256479510/01-131538 edge 57: white-road -> silver-road (B score 49.6)
- 20260912-256479510/01-131538 edge 63: white-road -> silver-road (B score 72)
- 20260912-256479510/01-131538 edge 67: green-road -> gold-road (B score 62.5)
- 20260912-256479510/01-131538 edge 69: green-road -> gold-road (B score 59.4)
- 20260912-256548064/01-205818 edge 35: white-road -> white-road (B score 71.1)

### fix-kind - 5

A and B disagree on the kind and B matches strongly (best < 20) outside any overlay.

- 20260912-board8606/01-195800 vertex 49: black-settlement -> black-knight-level-1-inactive (B score 4.9)
- 20260912-card5569/02-162107 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.9)
- 20260913-white3776/01-034830 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.7)
- 20260913-white3776/02-035427 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.8)
- 20260913-white3776/04-040527 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.7)

### add-piece - 87

A reports nothing at a vertex where B matches a piece as well as it matches the pieces both agree on (best < 20, colour margin >= 8). Add the piece to the reading.

- 20260912-coin9063/02-221228 vertex 21: nothing -> orange-knight-level-1-inactive (B score 9)
- 20260912-cost7714/02-215655 vertex 14: nothing -> green-knight-level-1-inactive (B score 5.9)
- 20260912-dice9461/01-231050 vertex 25: nothing -> blue-knight-level-1-inactive (B score 12.2)
- 20260912-farm4368/01-230123 vertex 35: nothing -> pink-knight-level-2-inactive (B score 11.7)
- 20260912-hand4271/01-201010 vertex 36: nothing -> orange-knight-level-2-inactive (B score 12.1)
- 20260912-hand4271/02-201244 vertex 36: nothing -> orange-knight-level-2-inactive (B score 12.1)
- 20260912-hill6424/01-104936 vertex 45: nothing -> orange-knight-level-2-inactive (B score 11.4)
- 20260912-hill9622/02-053538 vertex 14: nothing -> orange-knight-level-2-inactive (B score 10.6)
- 20260912-land872/02-153231 vertex 22: nothing -> red-knight-level-1-inactive (B score 11.5)
- 20260912-red3090/01-112111 vertex 14: nothing -> orange-knight-level-2-inactive (B score 6.9)
- 20260912-red3090/01-112111 vertex 23: nothing -> orange-knight-level-1-inactive (B score 9.8)
- 20260912-red3090/02-112345 vertex 14: nothing -> orange-knight-level-2-inactive (B score 6.9)

### mark-capture-overlay-contaminated - 347

Captures where a UI panel covers part of the board (hidden number token, or a large flat light rectangle inside the hex area). Exclude them from training sets, or at least exclude the covered positions.

- 20260912-256414712/01-051425
- 20260912-256421756/02-052308
- 20260912-256427922/01-061640
- 20260912-256472762/01-125702
- 20260912-256479510/01-131538
- 20260912-256537837/01-193642
- 20260912-256537837/02-193916
- 20260912-256546411/01-200706
- 20260912-256548064/01-205818
- 20260912-256548064/02-210052
- 20260912-area5876/01-074550
- 20260912-bank1524/02-204735

### complete-registry-seats - 29

Games without registry seats where the inferred seat list is missing a colour that B matches strongly. Fix the seat list rather than the pieces.

- 20260912-256479510: add red
- 20260912-256554405: add blue
- 20260912-area3745: add blue, orange
- 20260912-card5605: add blue
- 20260912-deal6312: add red
- 20260912-hill4380: add blue, orange
- 20260912-king5845: add blue
- 20260912-land3994: add orange
- 20260912-pack1321: add blue
- 20260912-path1279: add green
- 20260912-roll1100: add red, black, blue
- 20260912-sheep2141: add black, blue

## Reproducing

```
cd collection
for i in 0 1 2 3 4 5 6 7; do node --import tsx src/classify-b.ts --shard $i/8 & done; wait   # ~35 s
CLASSIFY_B_LIB=1 node --import tsx src/classify-b-report.ts
CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts vertex <game>/<capture> <vertex...>  # raw scores
node --import tsx src/classify-b-crop.ts <game>/<capture> v25 e5 t10 --out /tmp/crops            # look at a spot
```

Every proposal is reversible: the readings under `examples/games` are untouched, and `report.json` lists the full set behind each count.
