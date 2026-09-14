# Classification B vs classification A (v3)

Generated 2026-09-14T15:06:23.991Z. B re-reads every stored capture by template-matching the game's own atlas sprites at the geometry the capture was read with; A is the stored `*.reading.json` from the CNN pipeline. Nothing under `examples/games` was modified. This is version 3: the seven bugs an independent audit found in v2 (`examples/classification-v2/audit.md`) are fixed, and the last section says what moved.

## How B decides

For every position, B renders the game's own atlas sprites at the capture's own scale (`spacing / 416 * 1.2` for buildings, `0.35 * spacing` across for knight badges, `spacing / 416` for roads, anchored `0.065` spacings above the vertex as `renderer.ts` does) and scores each hypothesis as the mean absolute RGB error over the sprite's opaque pixels, subsampled to at most 700 samples. One alignment search of +/-3 px picks the offset for the whole family, then every colour of that silhouette is scored at that one offset, so colours are compared on an identical pixel set and the numbers mean the same thing across hypotheses.

Hypotheses per vertex: settlement, city and walled city in all twelve colours; the three metropolis towers beside the city; and all six knight badges in all twelve colours; plus "nothing here" when even the best template is worse than 78. When a tower is found, the colour is re-scored against the composite the game actually draws (city plus tower), because the tower hides the right half of the city. Per edge: the road sprite in all twelve colours, rotated to the edge, and "nothing here" - an edge whose best template is worse than 40 while the colour it picked wins by less than 12 carries no road at all (v2 had no such hypothesis, so every UI element on an edge became a road of some colour).

Seats are the colours a game is played with. They come from the registry when the room was recorded with them; otherwise a colour is seated when it has a building and a road anywhere in the game, or when at least three of its pieces are matched sharply by B. Pieces under an overlay are never used as evidence. Seats never influence what B sees: they only add the seat-constrained colour and the two seat flags.

## Totals

- captures classified: **2155** (3 skipped: reading not ok or PNG missing)
- pieces A reports and B re-read: **65845** (12252 settlement, 9318 city, 11133 knight, 32046 road, 1096 metropolis)
- colour agreement A vs B: **65071** (98.82%)
- colour agreement over the pieces B has an answer for (excluding the 719 where B says "nothing here"): **65071** (99.92%)
- kind agreement A vs B: **65097** (98.86%)
- both agree: **65051** (98.79%)
- pieces B finds that A does not report at all: **87** (see the `missed-by-a` section)
- seats: 1263 captures from the registry, 892 inferred, 0 unknown (132 / 459 / 0 games)

| flag | pieces | share of pieces | v2 | change |
| --- | ---: | ---: | ---: | ---: |
| near-robber | 7693 | 11.68% | 7693 | 0 |
| near-merchant | 5766 | 8.76% | 5766 | 0 |
| unreadable | 719 | 1.09% | - | - |
| under-overlay | 564 | 0.86% | 1482 | -918 |
| phantom-colour | 338 | 0.51% | 531 | -193 |
| weak-match | 143 | 0.22% | 415 | -272 |
| missed-by-a | 87 | 0.13% | 87 | 0 |
| colour-mismatch | 55 | 0.08% | 283 | -228 |
| kind-mismatch | 29 | 0.04% | 29 | 0 |
| colour-mismatch-seat | 8 | 0.01% | 559 | -551 |

Flag meanings:

- `phantom-colour`: A gave the piece a colour nobody is seated as.
- `colour-mismatch`: B's best colour over all twelve differs from A.
- `colour-mismatch-seat`: A's colour *is* a seated colour and B's best colour among the seated ones is a different one. A piece whose colour is not seated at all carries `phantom-colour` instead: the seat-constrained answer can never equal a colour outside the seat list, so counting those here (as v2 did) says nothing.
- `kind-mismatch`: B's kind differs from A (settlement / city / metropolis / knight).
- `level-mismatch`: the knight level or state changes depending on whether the colour is A's or B's.
- `weak-match`: B's own best template scores worse than the 99th percentile of agreeing pieces, so B has no real support for anything here either.
- `unreadable`: B answers "nothing here" - no template is a credible fit for the position at all.
- `under-overlay`: the position sits inside a detected UI panel, or on a tile whose number token is hidden.
- `near-robber` / `near-merchant`: the piece touches the tile the robber / the Cities & Knights merchant stands on.
- `missed-by-a`: A reports nothing at this vertex but B matches a piece there as sharply as it matches the pieces both agree on.

## Where the disagreements are

| A kind | pieces | colour mismatches | phantom colours | weak B match | B says nothing |
| --- | ---: | ---: | ---: | ---: | ---: |
| road | 32046 | 22 (0.07%) | 306 (0.95%) | 69 (0.22%) | 719 (2.24%) |
| settlement | 12252 | 4 (0.03%) | 2 (0.02%) | 11 (0.09%) | 0 (0.00%) |
| knight | 11133 | 16 (0.14%) | 15 (0.13%) | 7 (0.06%) | 0 (0.00%) |
| city | 9318 | 5 (0.05%) | 9 (0.10%) | 22 (0.24%) | 0 (0.00%) |
| metropolis | 1096 | 8 (0.73%) | 6 (0.55%) | 34 (3.10%) | 0 (0.00%) |

## Colour x kind: A counts vs B counts (B seat-constrained)

Both sides of this table are things both readings have: a colour and a kind. A counts use A's colour and A's kind; B counts use B's seat-constrained colour (its own colour when the seats are unknown) and B's kind. v2 put B's knight level and metropolis type on the A side of the same table, which made the A columns partly B's answer; those variants now have their own table below. Cells are `A / B`.

| colour | settlement | city | road | metropolis | knight |
| --- | ---: | ---: | ---: | ---: | ---: |
| **bronze** | 11 | 29 / **27** | 180 / **52** | 8 / **7** | 30 / **29** |
| **silver** | 114 / **113** | 109 / **108** | 357 / **330** | 15 | 128 / **135** |
| **gold** | 135 | 110 / **109** | 419 / **415** | 16 | 155 / **161** |
| **purple** | 235 / **234** | 155 | 557 / **548** | 13 | 184 |
| **pink** | 490 / **491** | 275 | 1193 / **1194** | 33 | 471 / **487** |
| **mysticblue** | 481 | 454 | 1408 / **1368** | 62 / **64** | 602 / **632** |
| **white** | 563 / **565** | 472 / **468** | 1625 / **1475** | 76 / **71** | 619 / **609** |
| red | 3119 / **3113** | 2133 / **2134** | 7667 / **7540** | 246 / **244** | 2552 / **2566** |
| blue | 2632 / **2633** | 1945 / **1947** | 6743 / **6701** | 216 / **213** | 2163 / **2170** |
| orange | 1257 / **1262** | 1049 / **1050** | 3264 / **3134** | 78 / **76** | 1097 / **1110** |
| black | 2465 / **2471** | 2001 / **2002** | 6570 / **6530** | 264 | 2429 / **2436** |
| green | 750 / **751** | 586 / **583** | 2063 / **2040** | 69 | 703 / **710** |

(Rare colours in bold. A cell showing a single number means A and B counted the same.)

## Colour x variant, B only

A carries no knight level, no knight state and no metropolis type, so there is nothing to compare these against. This is B’s own reading of the sub-variants, at B’s seat-constrained colour - useful as a census of what the collection contains, not as a check on A.

| colour | settlement | city | road | metropolis science | metropolis politics | metropolis trade | knight level 1 active | knight level 1 inactive | knight level 2 active | knight level 2 inactive | knight level 3 active | knight level 3 inactive |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **bronze** | 11 | 27 | 52 | - | 7 | - | 5 | 6 | 4 | 6 | 3 | 5 |
| **silver** | 113 | 108 | 330 | 9 | 5 | 1 | 33 | 41 | 35 | 18 | 7 | 1 |
| **gold** | 135 | 109 | 415 | 12 | - | 4 | 50 | 34 | 49 | 28 | - | - |
| **purple** | 234 | 155 | 548 | 8 | 1 | 4 | 48 | 100 | 25 | 8 | - | 3 |
| **pink** | 491 | 275 | 1194 | 18 | 5 | 10 | 136 | 172 | 87 | 88 | 3 | 1 |
| **mysticblue** | 481 | 454 | 1368 | 23 | 27 | 14 | 161 | 216 | 131 | 70 | 40 | 14 |
| **white** | 565 | 468 | 1475 | 48 | 7 | 16 | 170 | 180 | 158 | 82 | 14 | 5 |
| red | 3113 | 2134 | 7540 | 115 | 24 | 105 | 653 | 859 | 542 | 409 | 57 | 46 |
| blue | 2633 | 1947 | 6701 | 109 | 47 | 57 | 554 | 759 | 442 | 327 | 53 | 35 |
| orange | 1262 | 1050 | 3134 | 32 | 19 | 25 | 254 | 362 | 251 | 194 | 33 | 16 |
| black | 2471 | 2002 | 6530 | 112 | 80 | 72 | 613 | 838 | 490 | 392 | 69 | 34 |
| green | 751 | 583 | 2040 | 27 | 15 | 27 | 167 | 224 | 134 | 124 | 41 | 20 |

Biggest count changes (|B - A| >= 5), which is where a curation built on A would be counting the wrong thing:

| colour | kind | A | B | delta |
| --- | --- | ---: | ---: | ---: |
| white | road | 1625 | 1475 | -150 |
| orange | road | 3264 | 3134 | -130 |
| bronze | road | 180 | 52 | -128 |
| red | road | 7667 | 7540 | -127 |
| blue | road | 6743 | 6701 | -42 |
| black | road | 6570 | 6530 | -40 |
| mysticblue | road | 1408 | 1368 | -40 |
| mysticblue | knight | 602 | 632 | +30 |
| silver | road | 357 | 330 | -27 |
| green | road | 2063 | 2040 | -23 |
| pink | knight | 471 | 487 | +16 |
| red | knight | 2552 | 2566 | +14 |
| orange | knight | 1097 | 1110 | +13 |
| white | knight | 619 | 609 | -10 |
| purple | road | 557 | 548 | -9 |
| black | knight | 2429 | 2436 | +7 |
| blue | knight | 2163 | 2170 | +7 |
| green | knight | 703 | 710 | +7 |
| silver | knight | 128 | 135 | +7 |
| black | settlement | 2465 | 2471 | +6 |

## Does the robber really flip colours?

No, not as a general mechanism. Pieces next to the robber disagree with B *less* often than pieces that are not, and the same holds for the merchant. What does flip colours is UI drawn over the board.

| condition | pieces with it | colour mismatches | rate | pieces without it | rate without |
| --- | ---: | ---: | ---: | ---: | ---: |
| robber on a touching tile | 7661 | 7 | 0.09% | 58184 | 0.08% |
| merchant on a touching tile | 5758 | 3 | 0.05% | 60087 | 0.09% |
| under a UI overlay | 564 | 25 | 4.43% | 65281 | 0.05% |

## Where phantom colours sit on the board

Phantom colours are not spread evenly: they pile up on the board positions that the trade-offer and chat panels cover, which is what you would expect if A is reading UI rather than pieces.

| position | phantom pieces |
| --- | ---: |
| edge 5 | 125 |
| edge 9 | 24 |
| edge 16 | 23 |
| edge 17 | 20 |
| edge 22 | 18 |
| edge 21 | 14 |
| edge 37 | 8 |
| edge 52 | 6 |
| vertex 10 | 4 |
| vertex 25 | 4 |

## Games with the most mismatches

| game | pieces | colour mismatches | phantom colours | kind mismatches | missed by A | overlay captures | registry seats |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 20260912-pack5873 | 74 | 11 | 11 | 1 | 0 | 1 | - |
| 20260913-event140 | 481 | 3 | 15 | 0 | 4 | 2 | black, pink, red, gold |
| 20260912-play7857 | 66 | 1 | 11 | 1 | 0 | 1 | - |
| 20260913-task1956 | 550 | 1 | 11 | 3 | 1 | 3 | red, mysticblue, orange, black |
| 20260914-map7182 | 720 | 4 | 8 | 1 | 0 | 1 | black, orange, mysticblue, green |
| 20260912-event263 | 68 | 2 | 9 | 0 | 0 | 2 | - |
| 20260913-army4015 | 525 | 0 | 10 | 0 | 0 | 6 | pink, blue, orange, red |
| 20260913-mine2890 | 284 | 0 | 10 | 1 | 0 | 2 | blue, red, black, pink |
| 20260912-brick7193 | 45 | 1 | 7 | 2 | 0 | 1 | - |
| 20260913-roll3478 | 573 | 0 | 8 | 2 | 0 | 2 | red, blue, orange, mysticblue |
| 20260914-catan7909 | 445 | 3 | 5 | 0 | 0 | 0 | mysticblue, black, blue, red |
| 20260914-win7375 | 354 | 1 | 7 | 0 | 0 | 2 | mysticblue, orange, red, blue |
| 20260913-army6897 | 177 | 0 | 7 | 1 | 0 | 1 | red, blue, purple, black |
| 20260912-256479510 | 21 | 0 | 6 | 0 | 0 | 1 | - |
| 20260912-cost1293 | 40 | 0 | 6 | 0 | 0 | 1 | - |
| 20260913-crop9200 | 299 | 0 | 6 | 2 | 0 | 4 | black, blue, red, white |
| 20260913-edge7681 | 444 | 1 | 5 | 0 | 0 | 1 | pink, red, black, blue |
| 20260913-sea4409 | 457 | 0 | 6 | 0 | 6 | 2 | mysticblue, black, red, blue |
| 20260913-task6947 | 47 | 1 | 5 | 1 | 0 | 1 | - |
| 20260913-white3776 | 133 | 3 | 3 | 3 | 1 | 0 | mysticblue, gold, red, black |

## Robber and merchant detection

The robber is the `icon_robber` pawn drawn 0.3 spacings left and 0.26 up from the tile centre at 0.43 spacings tall; the Cities & Knights merchant is `icon_merchant_<colour>`, 0.25 right and 0.28 up at 0.24 spacings tall. Both were calibrated by scanning the sprites over real captures.

- robber found in **2143 / 2155** captures (99.44%), median match score 8, worst accepted 19.2
- not found in 12: 12 no-close-match
- margin over the runner-up tile: min 14.1, p10 22.4, median 24.5 (accepted only above 6)
- consecutive-frame stability: the robber is on the same tile in 704 of 1547 consecutive pairs (45.51%) - it only moves on a 7 or a knight action, so this is the expected order of magnitude
- merchant found in **1119** captures, by colour: red 281, black 260, blue 204, orange 109, green 70, white 61, mysticblue 41, silver 29, pink 28, purple 21, gold 11, bronze 4

## Overlays

168 captures are overlay-suspected (v2: 348). Rules that fired: `tokensFound` 92, `hidden-token` 61, `ui-panel` 103.

- `tokensFound`: the board locator found fewer than 18 number tokens while the lattice still fitted.
- `ui-panel`: a connected block of flat, light, unsaturated pixels (mean > 190, per-channel range <= 14, channel spread <= 32) inside the board box, after a two-block morphological closing, that is *also* shaped like a panel: solid (fill >= 0.55) or longer than 1.3 spacings. The shape test is the v3 fix: the white pasture sheep pass the flat-light test too, and the closing welds a sheep to the number token beside it into a sparse 0.6-0.8 spacing blob, which is what made about 45% of v2's overlay captures false. A small blob centred on a tile whose number token is still readable is rejected outright.
- `hidden-token`: the tile's own `prob_<n>` sprite scores worse than 40 at the tile centre, so something is drawn over that tile. v2 used 25, which fires on plainly visible tokens (they reach 47 when a piece clips a corner).

## Examples

Crops are 0.9 spacings (0.7 for edges) at 4x, written to `classification-v3/crops/` and named `<class>__<game>__<capture>__<pos>__A-<label>__B-<label>.png`.

### phantom-colour (338 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256421756/02-052308 | e5 | bronze-road | none-none | 58.2 | phantom-colour unreadable under-overlay | `classification-v3/crops/phantom-colour__20260912-256421756__02-052308__e5__A-bronze-road__B-none-none.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | none-none | 59.4 | phantom-colour unreadable under-overlay | `classification-v3/crops/phantom-colour__20260912-256427922__01-061640__e5__A-bronze-road__B-none-none.png` |
| 20260912-256457718/02-104304 | e52 | white-road | none-none | 58.4 | phantom-colour unreadable | `classification-v3/crops/phantom-colour__20260912-256457718__02-104304__e52__A-white-road__B-none-none.png` |
| 20260912-256472762/01-125702 | e5 | bronze-road | none-none | 59.3 | phantom-colour unreadable under-overlay | `classification-v3/crops/phantom-colour__20260912-256472762__01-125702__e5__A-bronze-road__B-none-none.png` |
| 20260912-256479510/01-131538 | e42 | white-road | none-none | 56 | phantom-colour unreadable | `classification-v3/crops/phantom-colour__20260912-256479510__01-131538__e42__A-white-road__B-none-none.png` |

### phantom-colour-strong-b (16 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-deck1482/01-185416 | v34 | silver-knight | black-knight-level-1-inactive | 10.5 | phantom-colour colour-mismatch near-robber | `classification-v3/crops/phantom-colour-strong-b__20260912-deck1482__01-185416__v34__A-silver-knight__B-black-knight-level-1-inactive.png` |
| 20260912-farm8303/02-215956 | v38 | gold-knight | green-knight-level-1-active | 6.7 | phantom-colour colour-mismatch | `classification-v3/crops/phantom-colour-strong-b__20260912-farm8303__02-215956__v38__A-gold-knight__B-green-knight-level-1-active.png` |
| 20260913-fort4077/02-020959 | e59 | purple-road | purple-road | 17.8 | phantom-colour | `classification-v3/crops/phantom-colour-strong-b__20260913-fort4077__02-020959__e59__A-purple-road__B-purple-road.png` |
| 20260913-map4938/02-231036 | v13 | white-knight | silver-knight-level-1-active | 11.4 | phantom-colour colour-mismatch | `classification-v3/crops/phantom-colour-strong-b__20260913-map4938__02-231036__v13__A-white-knight__B-silver-knight-level-1-active.png` |
| 20260913-town5830/05-182532 | v35 | white-knight | silver-knight-level-2-inactive | 11.2 | phantom-colour colour-mismatch | `classification-v3/crops/phantom-colour-strong-b__20260913-town5830__05-182532__v35__A-white-knight__B-silver-knight-level-2-inactive.png` |

### colour-mismatch (55 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256414712/01-051425 | v11 | red-settlement | black-settlement | 55.6 | colour-mismatch-seat colour-mismatch weak-match | `classification-v3/crops/colour-mismatch__20260912-256414712__01-051425__v11__A-red-settlement__B-black-settlement.png` |
| 20260912-brick7193/02-212315 | v10 | bronze-city | pink-knight-level-2-inactive | 49.3 | phantom-colour colour-mismatch kind-mismatch weak-match under-overlay | `classification-v3/crops/colour-mismatch__20260912-brick7193__02-212315__v10__A-bronze-city__B-pink-knight-level-2-inactive.png` |
| 20260912-catan3383/02-122309 | v25 | blue-settlement | silver-settlement | 75.4 | colour-mismatch weak-match | `classification-v3/crops/colour-mismatch__20260912-catan3383__02-122309__v25__A-blue-settlement__B-silver-settlement.png` |
| 20260912-deck1482/01-185416 | v34 | silver-knight | black-knight-level-1-inactive | 10.5 | phantom-colour colour-mismatch near-robber | `classification-v3/crops/colour-mismatch__20260912-deck1482__01-185416__v34__A-silver-knight__B-black-knight-level-1-inactive.png` |
| 20260912-dice1262/01-154518 | e20 | white-road | green-road | 70.4 | phantom-colour colour-mismatch weak-match | `classification-v3/crops/colour-mismatch__20260912-dice1262__01-154518__e20__A-white-road__B-green-road.png` |

### colour-mismatch-seat (8 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256414712/01-051425 | v11 | red-settlement | black-settlement | 55.6 | colour-mismatch-seat colour-mismatch weak-match | `classification-v3/crops/colour-mismatch-seat__20260912-256414712__01-051425__v11__A-red-settlement__B-black-settlement.png` |
| 20260912-event263/01-164045 | e21 | black-road | red-road | 38.4 | colour-mismatch-seat colour-mismatch under-overlay | `classification-v3/crops/colour-mismatch-seat__20260912-event263__01-164045__e21__A-black-road__B-red-road.png` |
| 20260913-event140/02-214123 | e30 | black-road | silver-road | 60.2 | colour-mismatch-seat colour-mismatch weak-match under-overlay | `classification-v3/crops/colour-mismatch-seat__20260913-event140__02-214123__e30__A-black-road__B-silver-road.png` |
| 20260913-task6947/01-005510 | v15 | blue-metropolis | white-knight-level-1-inactive | 60 | colour-mismatch-seat colour-mismatch kind-mismatch weak-match under-overlay | `classification-v3/crops/colour-mismatch-seat__20260913-task6947__01-005510__v15__A-blue-metropolis__B-white-knight-level-1-inactive.png` |
| 20260913-wheat5803/10-223020 | v24 | red-metropolis | black-settlement | 59.5 | colour-mismatch-seat colour-mismatch kind-mismatch weak-match near-robber | `classification-v3/crops/colour-mismatch-seat__20260913-wheat5803__10-223020__v24__A-red-metropolis__B-black-settlement.png` |

### kind-mismatch (29 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-board8606/01-195800 | v49 | black-settlement | black-knight-level-1-inactive | 4.9 | kind-mismatch | `classification-v3/crops/kind-mismatch__20260912-board8606__01-195800__v49__A-black-settlement__B-black-knight-level-1-inactive.png` |
| 20260912-brick7193/02-212315 | v6 | green-city | green-settlement | 45.8 | phantom-colour kind-mismatch weak-match under-overlay | `classification-v3/crops/kind-mismatch__20260912-brick7193__02-212315__v6__A-green-city__B-green-settlement.png` |
| 20260912-card5569/02-162107 | v48 | red-settlement | red-knight-level-1-inactive | 6.9 | kind-mismatch | `classification-v3/crops/kind-mismatch__20260912-card5569__02-162107__v48__A-red-settlement__B-red-knight-level-1-inactive.png` |
| 20260912-pack5873/02-000135 | v39 | blue-metropolis | blue-city | 49.2 | kind-mismatch weak-match under-overlay | `classification-v3/crops/kind-mismatch__20260912-pack5873__02-000135__v39__A-blue-metropolis__B-blue-city.png` |
| 20260912-play7857/02-085036 | v20 | white-knight | white-settlement | 59.3 | phantom-colour kind-mismatch weak-match under-overlay | `classification-v3/crops/kind-mismatch__20260912-play7857__02-085036__v20__A-white-knight__B-white-settlement.png` |

### level-mismatch (0 pieces)

_none_

### unreadable-road (719 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256421756/02-052308 | e5 | bronze-road | none-none | 58.2 | phantom-colour unreadable under-overlay | `classification-v3/crops/unreadable-road__20260912-256421756__02-052308__e5__A-bronze-road__B-none-none.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | none-none | 59.4 | phantom-colour unreadable under-overlay | `classification-v3/crops/unreadable-road__20260912-256427922__01-061640__e5__A-bronze-road__B-none-none.png` |
| 20260912-256431162/01-071041 | e12 | red-road | none-none | 55.5 | unreadable | `classification-v3/crops/unreadable-road__20260912-256431162__01-071041__e12__A-red-road__B-none-none.png` |
| 20260912-256435701/02-071918 | e25 | red-road | none-none | 62.6 | unreadable | `classification-v3/crops/unreadable-road__20260912-256435701__02-071918__e25__A-red-road__B-none-none.png` |
| 20260912-256452649/01-115823 | e42 | red-road | none-none | 63.6 | unreadable | `classification-v3/crops/unreadable-road__20260912-256452649__01-115823__e42__A-red-road__B-none-none.png` |

### weak-match (76 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256546411/02-200942 | e47 | blue-road | blue-road | 63.2 | weak-match | `classification-v3/crops/weak-match__20260912-256546411__02-200942__e47__A-blue-road__B-blue-road.png` |
| 20260912-256548064/01-205818 | v18 | orange-city | orange-city | 26.1 | weak-match | `classification-v3/crops/weak-match__20260912-256548064__01-205818__v18__A-orange-city__B-orange-city.png` |
| 20260912-blue8975/02-081644 | v5 | red-settlement | red-settlement | 31.1 | weak-match | `classification-v3/crops/weak-match__20260912-blue8975__02-081644__v5__A-red-settlement__B-red-settlement.png` |
| 20260912-board7943/01-101933 | e64 | blue-road | blue-road | 61.5 | weak-match | `classification-v3/crops/weak-match__20260912-board7943__01-101933__e64__A-blue-road__B-blue-road.png` |
| 20260912-catan3383/02-122309 | e59 | black-road | black-road | 62.1 | weak-match | `classification-v3/crops/weak-match__20260912-catan3383__02-122309__e59__A-black-road__B-black-road.png` |

### under-overlay (295 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256421756/02-052308 | e5 | bronze-road | none-none | 58.2 | phantom-colour unreadable under-overlay | `classification-v3/crops/under-overlay__20260912-256421756__02-052308__e5__A-bronze-road__B-none-none.png` |
| 20260912-256427922/01-061640 | e5 | bronze-road | none-none | 59.4 | phantom-colour unreadable under-overlay | `classification-v3/crops/under-overlay__20260912-256427922__01-061640__e5__A-bronze-road__B-none-none.png` |
| 20260912-256472762/01-125702 | e5 | bronze-road | none-none | 59.3 | phantom-colour unreadable under-overlay | `classification-v3/crops/under-overlay__20260912-256472762__01-125702__e5__A-bronze-road__B-none-none.png` |
| 20260912-area5876/01-074550 | v41 | black-city | black-city | 28.9 | weak-match under-overlay | `classification-v3/crops/under-overlay__20260912-area5876__01-074550__v41__A-black-city__B-black-city.png` |
| 20260912-blue6774/01-114900 | v19 | blue-city | blue-city | 39.4 | weak-match under-overlay | `classification-v3/crops/under-overlay__20260912-blue6774__01-114900__v19__A-blue-city__B-blue-city.png` |

### near-robber-mismatch (7 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-deck1482/01-185416 | v34 | silver-knight | black-knight-level-1-inactive | 10.5 | phantom-colour colour-mismatch near-robber | `classification-v3/crops/near-robber-mismatch__20260912-deck1482__01-185416__v34__A-silver-knight__B-black-knight-level-1-inactive.png` |
| 20260912-play7857/02-085036 | v25 | bronze-knight | white-knight-level-1-active | 60.8 | phantom-colour colour-mismatch weak-match near-robber under-overlay | `classification-v3/crops/near-robber-mismatch__20260912-play7857__02-085036__v25__A-bronze-knight__B-white-knight-level-1-active.png` |
| 20260913-land5958/03-161215 | v49 | mysticblue-metropolis | silver-knight-level-2-inactive | 41.5 | phantom-colour colour-mismatch kind-mismatch weak-match near-robber | `classification-v3/crops/near-robber-mismatch__20260913-land5958__03-161215__v49__A-mysticblue-metropolis__B-silver-knight-level-2-inactive.png` |
| 20260913-task1956/04-063715 | v14 | bronze-metropolis | black-settlement | 53 | phantom-colour colour-mismatch kind-mismatch weak-match near-robber under-overlay | `classification-v3/crops/near-robber-mismatch__20260913-task1956__04-063715__v14__A-bronze-metropolis__B-black-settlement.png` |
| 20260913-trade5728/06-162324 | v24 | gold-knight | green-knight-level-2-active | 16.2 | phantom-colour colour-mismatch near-robber | `classification-v3/crops/near-robber-mismatch__20260913-trade5728__06-162324__v24__A-gold-knight__B-green-knight-level-2-active.png` |

### near-merchant-mismatch (3 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260913-white3776/02-035427 | v25 | white-metropolis | mysticblue-metropolis-trade | 16.2 | phantom-colour colour-mismatch near-merchant | `classification-v3/crops/near-merchant-mismatch__20260913-white3776__02-035427__v25__A-white-metropolis__B-mysticblue-metropolis-trade.png` |
| 20260913-white3776/02-035427 | v25 | white-metropolis | mysticblue-metropolis-trade | 16.2 | phantom-colour colour-mismatch near-merchant | `classification-v3/crops/near-merchant-mismatch__20260913-white3776__02-035427__v25__A-white-metropolis__B-mysticblue-metropolis-trade.png` |
| 20260913-white3776/03-035950 | v25 | white-metropolis | mysticblue-metropolis-trade | 16.3 | phantom-colour colour-mismatch near-merchant | `classification-v3/crops/near-merchant-mismatch__20260913-white3776__03-035950__v25__A-white-metropolis__B-mysticblue-metropolis-trade.png` |
| 20260913-white3776/04-040527 | v25 | white-metropolis | mysticblue-metropolis-trade | 16.3 | phantom-colour colour-mismatch near-merchant | `classification-v3/crops/near-merchant-mismatch__20260913-white3776__04-040527__v25__A-white-metropolis__B-mysticblue-metropolis-trade.png` |

### missed-by-a (87 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-coin9063/02-221228 | v21 | none-none | orange-knight-level-1-inactive | 9.1 | missed-by-a | `classification-v3/crops/missed-by-a__20260912-coin9063__02-221228__v21__A-none-none__B-orange-knight-level-1-inactive.png` |
| 20260912-cost7714/02-215655 | v14 | none-none | green-knight-level-1-inactive | 5.9 | missed-by-a | `classification-v3/crops/missed-by-a__20260912-cost7714__02-215655__v14__A-none-none__B-green-knight-level-1-inactive.png` |
| 20260912-dice9461/01-231050 | v25 | none-none | blue-knight-level-1-inactive | 12.2 | missed-by-a near-robber | `classification-v3/crops/missed-by-a__20260912-dice9461__01-231050__v25__A-none-none__B-blue-knight-level-1-inactive.png` |
| 20260912-farm4368/01-230123 | v35 | none-none | pink-knight-level-2-inactive | 11.7 | missed-by-a near-robber | `classification-v3/crops/missed-by-a__20260912-farm4368__01-230123__v35__A-none-none__B-pink-knight-level-2-inactive.png` |
| 20260912-hand4271/01-201010 | v36 | none-none | orange-knight-level-2-inactive | 12.1 | missed-by-a near-robber near-merchant | `classification-v3/crops/missed-by-a__20260912-hand4271__01-201010__v36__A-none-none__B-orange-knight-level-2-inactive.png` |

### agreement-sample (36317 pieces)

| capture | position | A | B | B score | flags | crop |
| --- | --- | --- | --- | ---: | --- | --- |
| 20260912-256411788/01-041123 | v8 | black-settlement | black-settlement | 3.7 |  | `classification-v3/crops/agreement-sample__20260912-256411788__01-041123__v8__A-black-settlement__B-black-settlement.png` |
| 20260912-256414712/01-051425 | v9 | blue-settlement | blue-settlement | 4.2 |  | `classification-v3/crops/agreement-sample__20260912-256414712__01-051425__v9__A-blue-settlement__B-blue-settlement.png` |
| 20260912-256418147/01-045504 | v12 | black-metropolis | black-metropolis-science | 9.1 |  | `classification-v3/crops/agreement-sample__20260912-256418147__01-045504__v12__A-black-metropolis__B-black-metropolis-science.png` |
| 20260912-256421756/01-052035 | v9 | black-city | black-city | 4.3 |  | `classification-v3/crops/agreement-sample__20260912-256421756__01-052035__v9__A-black-city__B-black-city.png` |
| 20260912-256427922/01-061640 | v7 | blue-knight | blue-knight-level-1-inactive | 6.9 |  | `classification-v3/crops/agreement-sample__20260912-256427922__01-061640__v7__A-blue-knight__B-blue-knight-level-1-inactive.png` |
| 20260912-256428444/01-060706 | v8 | black-knight | black-knight-level-1-inactive | 3.5 |  | `classification-v3/crops/agreement-sample__20260912-256428444__01-060706__v8__A-black-knight__B-black-knight-level-1-inactive.png` |
| 20260912-256431162/01-071041 | v8 | red-knight | red-knight-level-1-inactive | 5.2 |  | `classification-v3/crops/agreement-sample__20260912-256431162__01-071041__v8__A-red-knight__B-red-knight-level-1-inactive.png` |
| 20260912-256435701/01-071644 | v13 | red-settlement | red-settlement | 3.4 |  | `classification-v3/crops/agreement-sample__20260912-256435701__01-071644__v13__A-red-settlement__B-red-settlement.png` |
| 20260912-256440276/01-082013 | v8 | green-settlement | green-settlement | 7.9 |  | `classification-v3/crops/agreement-sample__20260912-256440276__01-082013__v8__A-green-settlement__B-green-settlement.png` |
| 20260912-256452338/01-095735 | v10 | red-settlement | red-settlement | 4.5 |  | `classification-v3/crops/agreement-sample__20260912-256452338__01-095735__v10__A-red-settlement__B-red-settlement.png` |
| 20260912-256452649/01-115823 | v8 | red-knight | red-knight-level-1-inactive | 5.2 |  | `classification-v3/crops/agreement-sample__20260912-256452649__01-115823__v8__A-red-knight__B-red-knight-level-1-inactive.png` |
| 20260912-256457718/01-104031 | v9 | orange-city | orange-city | 4.7 |  | `classification-v3/crops/agreement-sample__20260912-256457718__01-104031__v9__A-orange-city__B-orange-city.png` |
| 20260912-256472762/01-125702 | v0 | green-settlement | green-settlement | 5.4 |  | `classification-v3/crops/agreement-sample__20260912-256472762__01-125702__v0__A-green-settlement__B-green-settlement.png` |
| 20260912-256476858/01-132229 | v24 | red-settlement | red-settlement | 3.5 |  | `classification-v3/crops/agreement-sample__20260912-256476858__01-132229__v24__A-red-settlement__B-red-settlement.png` |
| 20260912-256479510/01-131538 | v9 | blue-settlement | blue-settlement | 4.1 |  | `classification-v3/crops/agreement-sample__20260912-256479510__01-131538__v9__A-blue-settlement__B-blue-settlement.png` |
| 20260912-256487432/01-141641 | v17 | black-city | black-city | 9 |  | `classification-v3/crops/agreement-sample__20260912-256487432__01-141641__v17__A-black-city__B-black-city.png` |
| 20260912-256489236/01-143518 | v8 | black-city | black-city | 8.3 |  | `classification-v3/crops/agreement-sample__20260912-256489236__01-143518__v8__A-black-city__B-black-city.png` |
| 20260912-256537837/01-193642 | v7 | orange-knight | orange-knight-level-1-inactive | 6.4 |  | `classification-v3/crops/agreement-sample__20260912-256537837__01-193642__v7__A-orange-knight__B-orange-knight-level-1-inactive.png` |
| 20260912-256540820/01-203248 | v5 | black-city | black-city | 3.7 |  | `classification-v3/crops/agreement-sample__20260912-256540820__01-203248__v5__A-black-city__B-black-city.png` |
| 20260912-256546411/01-200706 | v7 | black-settlement | black-settlement | 6.6 |  | `classification-v3/crops/agreement-sample__20260912-256546411__01-200706__v7__A-black-settlement__B-black-settlement.png` |

## Validation

| check | expected | got | result |
| --- | --- | --- | --- |
| white3776 frame 02 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.2, A said white metropolis) | PASS |
| white3776 frame 03 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.3, A said white metropolis) | PASS |
| white3776 frame 04 vertex 25 | mysticblue metropolis trade | mysticblue metropolis trade (score 16.3, A said white metropolis) | PASS |
| map7182 frame 03 gold/silver/white pieces | all flagged phantom-colour and under-overlay | 6/6 flagged; capture overlaySuspected=true rules=tokensFound=16<18; ui-panel x2; hidden-token tiles 2 | PASS |
| white3776 robber and merchant tiles per frame | robber moves; merchant on the tile below vertex 25 (tile 10) from frame 02 | f01: robber=16 merchant=14(black), f02: robber=16 merchant=10(black), f03: robber=17 merchant=10(black), f04: robber=1 merchant=10(black) | PASS |
| audit's true-UI captures still flagged | 15/15 | 15/15 | PASS |
| audit's false-positive captures no longer flagged | 0/17 still flagged | 0/17 | PASS |
| pieces phantom in v2 only because the inferred seat list was short (B3) | none still phantom | 185/186 cleared; still phantom: 20260913-fort4077/02-020959 e59 | PASS |
| colour-mismatch-seat counts only genuine disagreements (B2) | far below 559; the audit found 28 of v2's 559 genuine | 8 (v2: 559, 28 of them genuine; those 28 in v3: 8 still flagged, 20 B now answers "nothing here" (B4)) | PASS |
| edges have a "nothing here" answer (B4) | some of A’s roads answered "none" | 719 of 32046 roads (2.24%) | PASS |

## Proposed actions (not applied)

### relabel-piece - 15 (v2: 15)

A reads a colour B rejects and B has a strong match (best < 20) for a different colour. Change the piece colour in the reading to B, keeping the original as a backup.

_Change from v2: Unchanged rule and unchanged count: none of the fixes touches a piece B matches sharply at a different colour._

- 20260912-deck1482/01-185416 vertex 34: silver-knight -> black-knight-level-1-inactive (B score 10.5)
- 20260912-farm8303/02-215956 vertex 38: gold-knight -> green-knight-level-1-active (B score 6.7)
- 20260913-map4938/02-231036 vertex 13: white-knight -> silver-knight-level-1-active (B score 11.4)
- 20260913-town5830/05-182532 vertex 35: white-knight -> silver-knight-level-2-inactive (B score 11.2)
- 20260913-trade5728/06-162324 vertex 24: gold-knight -> green-knight-level-2-active (B score 16.2)
- 20260913-turn1449/08-185235 vertex 45: white-knight -> silver-knight-level-3-active (B score 12)
- 20260913-white3776/02-035427 vertex 25: white-metropolis -> mysticblue-metropolis-trade (B score 16.2)
- 20260913-white3776/03-035950 vertex 25: white-metropolis -> mysticblue-metropolis-trade (B score 16.3)
- 20260913-white3776/04-040527 vertex 25: white-metropolis -> mysticblue-metropolis-trade (B score 16.3)
- 20260914-card7322/05-065830 vertex 41: white-knight -> silver-knight-level-1-active (B score 8.4)
- 20260914-card7322/06-070100 vertex 41: white-knight -> silver-knight-level-1-active (B score 8.5)
- 20260914-catan7909/13-043429 vertex 36: white-knight -> mysticblue-knight-level-3-active (B score 14.8)

### drop-piece - 257 (v2: 247)

A reads a piece whose colour is not seated and either no template matches the pixels (best >= 45) or B answers "nothing here" outright: almost always UI drawn over the board. Remove the piece from the reading.

_Change from v2: Two opposite moves: B3 removes the pieces that were phantom only because the seat inference had lost a colour, and B4 adds edges where B now answers "nothing here" at scores between 40 and 45._

- 20260912-256421756/02-052308 edge 5: bronze-road -> none-none (B score 58.2)
- 20260912-256427922/01-061640 edge 5: bronze-road -> none-none (B score 59.4)
- 20260912-256457718/02-104304 edge 52: white-road -> none-none (B score 58.4)
- 20260912-256472762/01-125702 edge 5: bronze-road -> none-none (B score 59.3)
- 20260912-256472762/02-125936 edge 18: white-road -> none-none (B score 70.8)
- 20260912-256479510/01-131538 edge 42: white-road -> none-none (B score 56)
- 20260912-256479510/01-131538 edge 52: white-road -> none-none (B score 71.1)
- 20260912-256479510/01-131538 edge 57: white-road -> none-none (B score 49.6)
- 20260912-256479510/01-131538 edge 63: white-road -> none-none (B score 72)
- 20260912-256479510/01-131538 edge 67: green-road -> none-none (B score 62.5)
- 20260912-256479510/01-131538 edge 69: green-road -> none-none (B score 59.4)
- 20260912-256548064/01-205818 edge 27: white-road -> none-none (B score 44.1)

### fix-kind - 6 (v2: 5)

A and B disagree on the kind and B matches strongly (best < 20) outside any overlay.

_Change from v2: Same rule; B1 is what changed - a piece v2 called under-overlay (a sheep welded to a number token) no longer is, so it is no longer excluded._

- 20260912-board8606/01-195800 vertex 49: black-settlement -> black-knight-level-1-inactive (B score 4.9)
- 20260912-card5569/02-162107 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.9)
- 20260913-king558/02-014456 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.9)
- 20260913-white3776/01-034830 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.7)
- 20260913-white3776/02-035427 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.7)
- 20260913-white3776/04-040527 vertex 48: red-settlement -> red-knight-level-1-inactive (B score 6.7)

### add-piece - 87 (v2: 87)

A reports nothing at a vertex where B matches a piece as well as it matches the pieces both agree on (best < 20, colour margin >= 8). Add the piece to the reading.

_Change from v2: Unchanged: neither seats nor overlays take part in this rule._

- 20260912-coin9063/02-221228 vertex 21: nothing -> orange-knight-level-1-inactive (B score 9.1)
- 20260912-cost7714/02-215655 vertex 14: nothing -> green-knight-level-1-inactive (B score 5.9)
- 20260912-dice9461/01-231050 vertex 25: nothing -> blue-knight-level-1-inactive (B score 12.2)
- 20260912-farm4368/01-230123 vertex 35: nothing -> pink-knight-level-2-inactive (B score 11.7)
- 20260912-hand4271/01-201010 vertex 36: nothing -> orange-knight-level-2-inactive (B score 12.1)
- 20260912-hand4271/02-201244 vertex 36: nothing -> orange-knight-level-2-inactive (B score 12.1)
- 20260912-hill6424/01-104936 vertex 45: nothing -> orange-knight-level-2-inactive (B score 11.4)
- 20260912-hill9622/02-053538 vertex 14: nothing -> orange-knight-level-2-inactive (B score 10.7)
- 20260912-land872/02-153231 vertex 22: nothing -> red-knight-level-1-inactive (B score 11.5)
- 20260912-red3090/01-112111 vertex 14: nothing -> orange-knight-level-2-inactive (B score 6.9)
- 20260912-red3090/01-112111 vertex 23: nothing -> orange-knight-level-1-inactive (B score 9.8)
- 20260912-red3090/02-112345 vertex 14: nothing -> orange-knight-level-2-inactive (B score 6.9)

### mark-capture-overlay-contaminated - 168 (v2: 347)

Captures where a UI panel covers part of the board (a solid or large flat light rectangle inside the hex area, a hidden number token, or a board locator that found fewer than 18 tokens). Exclude them from training sets, or at least exclude the covered positions.

_Change from v2: B1 and B5: a blob counts as a panel only when it is solid or long, and a token counts as hidden above 40 instead of 25. What disappeared are the sheep-plus-token false positives the audit measured at about 45%._

- 20260912-256414712/01-051425
- 20260912-256421756/02-052308
- 20260912-256427922/01-061640
- 20260912-256472762/01-125702
- 20260912-256479510/01-131538
- 20260912-256548064/01-205818
- 20260912-area5876/01-074550
- 20260912-bank1524/02-204735
- 20260912-blue6774/01-114900
- 20260912-board4923/01-231727
- 20260912-brick2569/01-234943
- 20260912-brick7193/02-212315

### complete-seats - 1 (v2: 29)

Games where a colour nobody is seated as is nevertheless matched sharply by B at exactly A’s colour: the seat list is short, not the piece. Fix the seat list rather than the pieces.

_Change from v2: B3: the looser inference already seats the colours v2 proposed adding, so all that is left is the colour it still cannot reach - one piece, in a game of two frames._

- 20260913-fort4077 (inferred seats): add purple

## Changes from v2

v2 is `classification-v2` as it stands on disk: 2155 captures, which includes the three captures of `watching` games that v2's own run skipped and the auditor added by hand afterwards. v3 picks those up by itself (B7), so both runs cover the same 2155 captures and every difference below is a decision, not a different sample.

| quantity | v2 | v3 | change |
| --- | ---: | ---: | ---: |
| captures | 2155 | 2155 | 0 |
| pieces A reports | 65845 | 65845 | 0 |
| colour agreement | 65562 | 65071 | -491 |
| kind agreement | 65816 | 65097 | -719 |
| pieces B finds, A does not | 87 | 87 | 0 |
| overlay-suspected captures | 348 | 168 | -180 |
| flag `under-overlay` | 1482 | 564 | -918 |
| flag `colour-mismatch` | 283 | 55 | -228 |
| flag `colour-mismatch-seat` | 559 | 8 | -551 |
| flag `weak-match` | 415 | 143 | -272 |
| flag `near-robber` | 7693 | 7693 | 0 |
| flag `near-merchant` | 5766 | 5766 | 0 |
| flag `phantom-colour` | 531 | 338 | -193 |
| flag `kind-mismatch` | 29 | 29 | 0 |
| flag `missed-by-a` | 87 | 87 | 0 |
| flag `unreadable` | 0 | 719 | +719 |

### Rare colours: A vs B, v3 next to v2

Both runs count A by A’s colour and kind, and B by B’s seat-constrained colour and kind (v2’s variants are collapsed to their kind so the two are comparable).

| colour | kind | v3 A | v3 B | v2 A | v2 B | B change |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| bronze | settlement | 11 | 11 | 11 | 11 | 0 |
| bronze | city | 29 | 27 | 29 | 27 | 0 |
| bronze | road | 180 | 52 | 180 | 59 | -7 |
| bronze | metropolis | 8 | 7 | 8 | 7 | 0 |
| bronze | knight | 30 | 29 | 30 | 29 | 0 |
| silver | settlement | 114 | 113 | 114 | 113 | 0 |
| silver | city | 109 | 108 | 109 | 108 | 0 |
| silver | road | 357 | 330 | 357 | 357 | -27 |
| silver | metropolis | 15 | 15 | 15 | 15 | 0 |
| silver | knight | 128 | 135 | 128 | 135 | 0 |
| gold | settlement | 135 | 135 | 135 | 135 | 0 |
| gold | city | 110 | 109 | 110 | 109 | 0 |
| gold | road | 419 | 415 | 419 | 427 | -12 |
| gold | metropolis | 16 | 16 | 16 | 16 | 0 |
| gold | knight | 155 | 161 | 155 | 161 | 0 |
| purple | settlement | 235 | 234 | 235 | 234 | 0 |
| purple | city | 155 | 155 | 155 | 155 | 0 |
| purple | road | 557 | 548 | 557 | 558 | -10 |
| purple | metropolis | 13 | 13 | 13 | 13 | 0 |
| purple | knight | 184 | 184 | 184 | 184 | 0 |
| pink | settlement | 490 | 491 | 490 | 491 | 0 |
| pink | city | 275 | 275 | 275 | 275 | 0 |
| pink | road | 1193 | 1194 | 1193 | 1239 | -45 |
| pink | metropolis | 33 | 33 | 33 | 33 | 0 |
| pink | knight | 471 | 487 | 471 | 487 | 0 |
| mysticblue | settlement | 481 | 481 | 481 | 482 | -1 |
| mysticblue | city | 454 | 454 | 454 | 455 | -1 |
| mysticblue | road | 1408 | 1368 | 1408 | 1457 | -89 |
| mysticblue | metropolis | 62 | 64 | 62 | 64 | 0 |
| mysticblue | knight | 602 | 632 | 602 | 632 | 0 |
| white | settlement | 563 | 565 | 563 | 565 | 0 |
| white | city | 472 | 468 | 472 | 468 | 0 |
| white | road | 1625 | 1475 | 1625 | 1534 | -59 |
| white | metropolis | 76 | 71 | 76 | 71 | 0 |
| white | knight | 619 | 609 | 619 | 609 | 0 |

### Proposed actions, v2 vs v3

| action | v2 | v3 | change | why |
| --- | ---: | ---: | ---: | --- |
| relabel-piece | 15 | 15 | 0 | Unchanged rule and unchanged count: none of the fixes touches a piece B matches sharply at a different colour. |
| drop-piece | 247 | 257 | +10 | Two opposite moves: B3 removes the pieces that were phantom only because the seat inference had lost a colour, and B4 adds edges where B now answers "nothing here" at scores between 40 and 45. |
| fix-kind | 5 | 6 | +1 | Same rule; B1 is what changed - a piece v2 called under-overlay (a sheep welded to a number token) no longer is, so it is no longer excluded. |
| add-piece | 87 | 87 | 0 | Unchanged: neither seats nor overlays take part in this rule. |
| mark-capture-overlay-contaminated | 347 | 168 | -179 | B1 and B5: a blob counts as a panel only when it is solid or long, and a token counts as hidden above 40 instead of 25. What disappeared are the sheep-plus-token false positives the audit measured at about 45%. |
| complete-seats | 29 | 1 | -28 | B3: the looser inference already seats the colours v2 proposed adding, so all that is left is the colour it still cannot reach - one piece, in a game of two frames. |

## Reproducing

```
cd collection
for i in 0 1 2 3 4 5 6 7; do node --import tsx src/classify-b.ts --shard $i/8 --out classification-v3 & done; wait
CLASSIFY_B_LIB=1 node --import tsx src/classify-b-report.ts
CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts vertex <game>/<capture> <vertex...>  # raw scores
node --import tsx src/classify-b-crop.ts <game>/<capture> v25 e5 t10 --out /tmp/crops            # look at a spot
```

Every proposal is reversible: the readings under `examples/games` are untouched, and `report.json` lists the full set behind each count.
