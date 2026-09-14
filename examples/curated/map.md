# Curated board images (`examples/curated`)

Generated 2026-09-14T15:50:42.369Z from 2155 captures in the 591 games whose registry status is `done` or `watching` (or that the registry does not know). Labels are classification A corrected in memory by classification 3; nothing under `examples/games` was modified and every kept image is a **copy**.

- **368** images kept out of 2155, from **183** distinct games (80 forced by the rare rule, 64 added by the greedy fill, 224 added for a corner case).
- **138** asset types, **25** of them RARE (10 images or fewer).
- **168** captures are overlay-contaminated: 2 kept because they carry a rare asset, 166 excluded.
- Copied bytes: 210.2 MiB (PNG + reading per image).

## Rules

- Correction 1. 15 relabel-piece actions (colour changes) applied
- Correction 2. 6 fix-kind actions applied
- Correction 3. 87 add-piece knights added, level and state from classification 3
- Correction 4. 257 drop-piece actions applied except the 5 the audit marked unclear (20260912-crop490/01-211026 e26, 20260912-crop490/02-211300 e26, 20260914-event659/03-034252 e37, 20260914-ore1633/07-002852 e57, 20260913-army4015/13-232427 e21), which keep A's label and are tagged "uncertain"
- Correction 5. pieces whose colour is not a seat of the game are removed (registry seats, else classification 3 inferred seats; 20260913-fort4077 gains purple from the complete-seats action)
- Correction 6. the 168 mark-capture-overlay-contaminated captures are excluded from selection unless they carry a rare asset (a rare asset has at most 10 sources), in which case they are kept and tagged "overlay-contaminated"
- Correction 7. knight level/state and metropolis type come from classification 3; a "knight (no close match)" stays a knight with level unknown and, like "metropolis unknown", is listed per image but is not an asset type and never counts towards coverage
- Rare: an asset type present in 10 or fewer images is RARE; every image containing one is kept, no exceptions
- Fill: greedy fill to at least 5 kept images per asset type: an image from a game not yet represented for that asset type outranks another frame of a game that already contributes one, then images covering more under-covered asset types, then clean images (no uncertain piece, not overlay-contaminated), then images that would not push an already saturated asset type further
- Soft maximum: 10 kept images per asset type is a preference only; the rare rule overrides it
- Corner cases: at most 3 images per (colour, asset type, case), different games first, then images already kept (so nothing is copied twice), then clean ones. Board-piece interactions only; no UI-overlay cases.

## red

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](red/city.html) |  | 1502 | 254 | 134 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](red/knight-l1-active.html) |  | 562 | 69 | 57 | 3 | 0 | 2 | 3 | 3 |
| [knight level 1 inactive](red/knight-l1-inactive.html) |  | 732 | 151 | 88 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](red/knight-l2-active.html) |  | 423 | 82 | 55 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 inactive](red/knight-l2-inactive.html) |  | 318 | 94 | 64 | 3 | 0 | 3 | 3 | 3 |
| [knight level 3 active](red/knight-l3-active.html) |  | 53 | 24 | 15 | 3 | 0 | 1 | 3 | 3 |
| [knight level 3 inactive](red/knight-l3-inactive.html) |  | 40 | 21 | 14 | 3 | 0 | 1 | 3 | 3 |
| [metropolis politics](red/metropolis-politics.html) |  | 24 | 11 | 10 | 0 | 0 | 3 | 3 | 3 |
| [metropolis science](red/metropolis-science.html) |  | 115 | 30 | 22 | 0 | 0 | 3 | 3 | 3 |
| [metropolis trade](red/metropolis-trade.html) |  | 105 | 36 | 19 | 0 | 0 | 3 | 3 | 3 |
| [road](red/road.html) |  | 1898 | 312 | 159 | 0 | 3 | 0 | 3 | 3 |
| [settlement](red/settlement.html) |  | 1701 | 260 | 136 | 3 | 0 | 0 | 3 | 3 |

## blue

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](blue/city.html) |  | 1364 | 221 | 111 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](blue/knight-l1-active.html) |  | 482 | 67 | 44 | 3 | 0 | 3 | 3 | 3 |
| [knight level 1 inactive](blue/knight-l1-inactive.html) |  | 634 | 115 | 73 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](blue/knight-l2-active.html) |  | 358 | 81 | 50 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 inactive](blue/knight-l2-inactive.html) |  | 262 | 68 | 50 | 3 | 0 | 3 | 3 | 3 |
| [knight level 3 active](blue/knight-l3-active.html) |  | 46 | 17 | 13 | 2 | 0 | 2 | 3 | 3 |
| [knight level 3 inactive](blue/knight-l3-inactive.html) |  | 28 | 14 | 8 | 2 | 0 | 2 | 3 | 3 |
| [metropolis politics](blue/metropolis-politics.html) |  | 47 | 18 | 12 | 0 | 0 | 3 | 3 | 3 |
| [metropolis science](blue/metropolis-science.html) |  | 109 | 40 | 21 | 0 | 0 | 3 | 3 | 3 |
| [metropolis trade](blue/metropolis-trade.html) |  | 57 | 22 | 18 | 0 | 0 | 3 | 3 | 3 |
| [road](blue/road.html) |  | 1698 | 257 | 133 | 0 | 3 | 0 | 3 | 3 |
| [settlement](blue/settlement.html) |  | 1507 | 225 | 121 | 3 | 0 | 0 | 3 | 3 |

## orange

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](orange/city.html) |  | 742 | 110 | 67 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](orange/knight-l1-active.html) |  | 223 | 29 | 26 | 3 | 0 | 2 | 3 | 3 |
| [knight level 1 inactive](orange/knight-l1-inactive.html) |  | 302 | 42 | 31 | 3 | 0 | 1 | 3 | 3 |
| [knight level 2 active](orange/knight-l2-active.html) |  | 209 | 37 | 30 | 3 | 0 | 1 | 3 | 3 |
| [knight level 2 inactive](orange/knight-l2-inactive.html) |  | 158 | 36 | 28 | 3 | 0 | 0 | 3 | 3 |
| [knight level 3 active](orange/knight-l3-active.html) |  | 27 | 13 | 10 | 0 | 0 | 3 | 3 | 0 |
| [knight level 3 inactive](orange/knight-l3-inactive.html) |  | 14 | 8 | 8 | 0 | 0 | 1 | 3 | 1 |
| [metropolis politics](orange/metropolis-politics.html) |  | 19 | 11 | 7 | 0 | 0 | 0 | 3 | 3 |
| [metropolis science](orange/metropolis-science.html) |  | 32 | 10 | 8 | 0 | 0 | 0 | 3 | 3 |
| [metropolis trade](orange/metropolis-trade.html) |  | 25 | 12 | 8 | 0 | 0 | 2 | 1 | 0 |
| [road](orange/road.html) |  | 883 | 115 | 71 | 0 | 3 | 0 | 3 | 3 |
| [settlement](orange/settlement.html) |  | 773 | 91 | 59 | 3 | 0 | 0 | 3 | 3 |

## black

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](black/city.html) |  | 1368 | 252 | 128 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](black/knight-l1-active.html) |  | 517 | 82 | 52 | 3 | 0 | 3 | 3 | 3 |
| [knight level 1 inactive](black/knight-l1-inactive.html) |  | 694 | 135 | 82 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](black/knight-l2-active.html) |  | 405 | 96 | 58 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 inactive](black/knight-l2-inactive.html) |  | 290 | 87 | 59 | 3 | 0 | 3 | 3 | 3 |
| [knight level 3 active](black/knight-l3-active.html) |  | 48 | 23 | 18 | 2 | 0 | 3 | 3 | 3 |
| [knight level 3 inactive](black/knight-l3-inactive.html) |  | 24 | 14 | 12 | 2 | 0 | 3 | 3 | 3 |
| [metropolis politics](black/metropolis-politics.html) |  | 80 | 29 | 17 | 0 | 0 | 3 | 3 | 3 |
| [metropolis science](black/metropolis-science.html) |  | 112 | 41 | 23 | 0 | 0 | 3 | 3 | 3 |
| [metropolis trade](black/metropolis-trade.html) |  | 72 | 24 | 17 | 0 | 0 | 3 | 3 | 3 |
| [road](black/road.html) |  | 1632 | 279 | 137 | 0 | 3 | 0 | 3 | 3 |
| [settlement](black/settlement.html) |  | 1401 | 232 | 118 | 3 | 0 | 0 | 3 | 3 |

## green

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](green/city.html) |  | 402 | 81 | 41 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](green/knight-l1-active.html) |  | 147 | 31 | 19 | 3 | 0 | 3 | 3 | 3 |
| [knight level 1 inactive](green/knight-l1-inactive.html) |  | 189 | 41 | 23 | 2 | 0 | 2 | 3 | 3 |
| [knight level 2 active](green/knight-l2-active.html) |  | 112 | 30 | 21 | 3 | 0 | 2 | 3 | 3 |
| [knight level 2 inactive](green/knight-l2-inactive.html) |  | 100 | 26 | 17 | 3 | 0 | 1 | 3 | 3 |
| [knight level 3 active](green/knight-l3-active.html) |  | 32 | 20 | 11 | 3 | 0 | 0 | 2 | 2 |
| [knight level 3 inactive](green/knight-l3-inactive.html) |  | 17 | 11 | 10 | 3 | 0 | 0 | 1 | 0 |
| [metropolis politics](green/metropolis-politics.html) |  | 15 | 13 | 6 | 0 | 0 | 0 | 2 | 1 |
| [metropolis science](green/metropolis-science.html) |  | 27 | 16 | 6 | 0 | 0 | 3 | 3 | 1 |
| [metropolis trade](green/metropolis-trade.html) |  | 27 | 17 | 8 | 0 | 0 | 3 | 3 | 3 |
| [road](green/road.html) |  | 485 | 92 | 46 | 0 | 3 | 0 | 3 | 3 |
| [settlement](green/settlement.html) |  | 428 | 75 | 43 | 3 | 0 | 0 | 3 | 3 |

## white

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](white/city.html) |  | 340 | 63 | 30 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](white/knight-l1-active.html) |  | 151 | 21 | 16 | 3 | 0 | 2 | 3 | 3 |
| [knight level 1 inactive](white/knight-l1-inactive.html) |  | 141 | 26 | 22 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](white/knight-l2-active.html) |  | 125 | 30 | 18 | 0 | 0 | 3 | 3 | 3 |
| [knight level 2 inactive](white/knight-l2-inactive.html) |  | 67 | 19 | 13 | 1 | 0 | 3 | 3 | 3 |
| [knight level 3 active](white/knight-l3-active.html) |  | 11 | 7 | 4 | 0 | 0 | 0 | 3 | 2 |
| [knight level 3 inactive](white/knight-l3-inactive.html) | yes | 3 | 3 | 2 | 0 | 0 | 1 | 0 | 0 |
| [metropolis politics](white/metropolis-politics.html) | yes | 7 | 7 | 2 | 0 | 0 | 2 | 3 | 0 |
| [metropolis science](white/metropolis-science.html) |  | 48 | 15 | 11 | 0 | 0 | 3 | 3 | 3 |
| [metropolis trade](white/metropolis-trade.html) |  | 16 | 8 | 4 | 0 | 0 | 3 | 0 | 3 |
| [road](white/road.html) |  | 393 | 71 | 36 | 0 | 3 | 0 | 3 | 3 |
| [settlement](white/settlement.html) |  | 332 | 54 | 29 | 3 | 0 | 0 | 3 | 3 |

## purple

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](purple/city.html) |  | 112 | 32 | 9 | 2 | 0 | 0 | 3 | 3 |
| [knight level 1 active](purple/knight-l1-active.html) |  | 43 | 17 | 7 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 inactive](purple/knight-l1-inactive.html) |  | 89 | 22 | 10 | 3 | 0 | 1 | 3 | 3 |
| [knight level 2 active](purple/knight-l2-active.html) |  | 17 | 11 | 5 | 0 | 0 | 0 | 1 | 2 |
| [knight level 2 inactive](purple/knight-l2-inactive.html) | yes | 6 | 6 | 4 | 0 | 0 | 0 | 1 | 0 |
| [knight level 3 inactive](purple/knight-l3-inactive.html) | yes | 3 | 3 | 2 | 0 | 0 | 0 | 0 | 0 |
| [metropolis politics](purple/metropolis-politics.html) | yes | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 0 |
| [metropolis science](purple/metropolis-science.html) | yes | 8 | 8 | 3 | 0 | 0 | 0 | 1 | 3 |
| [metropolis trade](purple/metropolis-trade.html) | yes | 4 | 4 | 1 | 0 | 0 | 0 | 3 | 1 |
| [road](purple/road.html) |  | 158 | 42 | 12 | 0 | 3 | 0 | 3 | 3 |
| [settlement](purple/settlement.html) |  | 138 | 37 | 12 | 3 | 0 | 0 | 3 | 3 |

## pink

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](pink/city.html) |  | 225 | 38 | 17 | 1 | 0 | 0 | 3 | 3 |
| [knight level 1 active](pink/knight-l1-active.html) |  | 108 | 21 | 13 | 3 | 0 | 1 | 3 | 3 |
| [knight level 1 inactive](pink/knight-l1-inactive.html) |  | 131 | 26 | 14 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](pink/knight-l2-active.html) |  | 65 | 22 | 12 | 2 | 0 | 0 | 3 | 3 |
| [knight level 2 inactive](pink/knight-l2-inactive.html) |  | 63 | 15 | 10 | 1 | 0 | 0 | 3 | 3 |
| [knight level 3 active](pink/knight-l3-active.html) | yes | 3 | 3 | 2 | 0 | 0 | 1 | 0 | 0 |
| [knight level 3 inactive](pink/knight-l3-inactive.html) | yes | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| [metropolis politics](pink/metropolis-politics.html) | yes | 5 | 5 | 3 | 0 | 0 | 0 | 0 | 1 |
| [metropolis science](pink/metropolis-science.html) |  | 18 | 12 | 7 | 0 | 0 | 1 | 3 | 2 |
| [metropolis trade](pink/metropolis-trade.html) | yes | 10 | 10 | 3 | 0 | 0 | 3 | 1 | 2 |
| [road](pink/road.html) |  | 286 | 50 | 23 | 0 | 3 | 0 | 3 | 3 |
| [settlement](pink/settlement.html) |  | 269 | 46 | 21 | 3 | 0 | 0 | 3 | 3 |

## silver

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](silver/city.html) |  | 63 | 25 | 10 | 0 | 0 | 0 | 3 | 3 |
| [knight level 1 active](silver/knight-l1-active.html) |  | 28 | 10 | 5 | 0 | 0 | 0 | 2 | 3 |
| [knight level 1 inactive](silver/knight-l1-inactive.html) |  | 34 | 16 | 11 | 1 | 0 | 3 | 3 | 2 |
| [knight level 2 active](silver/knight-l2-active.html) |  | 28 | 14 | 10 | 0 | 0 | 0 | 3 | 3 |
| [knight level 2 inactive](silver/knight-l2-inactive.html) |  | 15 | 11 | 8 | 0 | 0 | 0 | 3 | 3 |
| [knight level 3 active](silver/knight-l3-active.html) | yes | 7 | 7 | 5 | 0 | 0 | 1 | 1 | 1 |
| [knight level 3 inactive](silver/knight-l3-inactive.html) | yes | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 |
| [metropolis politics](silver/metropolis-politics.html) | yes | 5 | 5 | 3 | 0 | 0 | 3 | 0 | 0 |
| [metropolis science](silver/metropolis-science.html) | yes | 9 | 9 | 4 | 0 | 0 | 0 | 0 | 1 |
| [metropolis trade](silver/metropolis-trade.html) | yes | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 |
| [road](silver/road.html) |  | 72 | 29 | 12 | 0 | 3 | 0 | 3 | 3 |
| [settlement](silver/settlement.html) |  | 65 | 23 | 11 | 3 | 0 | 0 | 3 | 3 |

## bronze

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](bronze/city.html) |  | 14 | 14 | 3 | 0 | 0 | 0 | 3 | 3 |
| [knight level 1 active](bronze/knight-l1-active.html) | yes | 4 | 4 | 3 | 0 | 0 | 0 | 2 | 0 |
| [knight level 1 inactive](bronze/knight-l1-inactive.html) | yes | 5 | 5 | 2 | 0 | 0 | 0 | 2 | 1 |
| [knight level 2 active](bronze/knight-l2-active.html) | yes | 4 | 4 | 2 | 0 | 0 | 0 | 2 | 2 |
| [knight level 2 inactive](bronze/knight-l2-inactive.html) | yes | 6 | 6 | 2 | 0 | 0 | 2 | 2 | 0 |
| [knight level 3 active](bronze/knight-l3-active.html) | yes | 3 | 3 | 1 | 0 | 0 | 0 | 0 | 1 |
| [knight level 3 inactive](bronze/knight-l3-inactive.html) | yes | 4 | 4 | 1 | 0 | 0 | 0 | 2 | 0 |
| [metropolis politics](bronze/metropolis-politics.html) | yes | 7 | 7 | 1 | 0 | 0 | 0 | 3 | 1 |
| [road](bronze/road.html) |  | 14 | 14 | 3 | 0 | 3 | 0 | 3 | 3 |
| [settlement](bronze/settlement.html) | yes | 10 | 10 | 2 | 3 | 0 | 0 | 1 | 3 |

## gold

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](gold/city.html) |  | 77 | 29 | 8 | 0 | 0 | 0 | 3 | 3 |
| [knight level 1 active](gold/knight-l1-active.html) |  | 40 | 14 | 8 | 3 | 0 | 0 | 3 | 1 |
| [knight level 1 inactive](gold/knight-l1-inactive.html) |  | 26 | 11 | 6 | 3 | 0 | 0 | 0 | 0 |
| [knight level 2 active](gold/knight-l2-active.html) |  | 35 | 17 | 6 | 3 | 0 | 1 | 1 | 3 |
| [knight level 2 inactive](gold/knight-l2-inactive.html) |  | 20 | 11 | 5 | 3 | 0 | 0 | 3 | 3 |
| [metropolis science](gold/metropolis-science.html) |  | 12 | 8 | 2 | 0 | 0 | 1 | 3 | 1 |
| [metropolis trade](gold/metropolis-trade.html) | yes | 4 | 4 | 1 | 0 | 0 | 0 | 1 | 3 |
| [road](gold/road.html) |  | 94 | 37 | 9 | 0 | 3 | 0 | 3 | 3 |
| [settlement](gold/settlement.html) |  | 82 | 35 | 9 | 3 | 0 | 0 | 3 | 3 |

## mysticblue

| variant | rare | images available | images kept | distinct games | board-edge | shore-road | metropolis-tower-overlap | near-robber | near-merchant |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [city](mysticblue/city.html) |  | 329 | 55 | 24 | 3 | 0 | 0 | 3 | 3 |
| [knight level 1 active](mysticblue/knight-l1-active.html) |  | 138 | 19 | 12 | 3 | 0 | 2 | 3 | 3 |
| [knight level 1 inactive](mysticblue/knight-l1-inactive.html) |  | 165 | 37 | 16 | 3 | 0 | 3 | 3 | 3 |
| [knight level 2 active](mysticblue/knight-l2-active.html) |  | 105 | 17 | 11 | 3 | 0 | 0 | 3 | 3 |
| [knight level 2 inactive](mysticblue/knight-l2-inactive.html) |  | 58 | 16 | 9 | 3 | 0 | 0 | 3 | 3 |
| [knight level 3 active](mysticblue/knight-l3-active.html) |  | 27 | 12 | 5 | 0 | 0 | 2 | 3 | 3 |
| [knight level 3 inactive](mysticblue/knight-l3-inactive.html) |  | 11 | 8 | 4 | 0 | 0 | 0 | 3 | 0 |
| [metropolis politics](mysticblue/metropolis-politics.html) |  | 27 | 16 | 4 | 0 | 0 | 2 | 3 | 1 |
| [metropolis science](mysticblue/metropolis-science.html) |  | 23 | 10 | 4 | 0 | 0 | 2 | 3 | 3 |
| [metropolis trade](mysticblue/metropolis-trade.html) |  | 14 | 10 | 3 | 0 | 0 | 3 | 3 | 3 |
| [road](mysticblue/road.html) |  | 373 | 67 | 26 | 0 | 3 | 0 | 3 | 3 |
| [settlement](mysticblue/settlement.html) |  | 308 | 51 | 22 | 3 | 0 | 0 | 3 | 3 |

## Corner cases

### board-edge

A settlement, city, metropolis or knight standing on an outer-corner vertex - a vertex that belongs to exactly one tile (18 of the 54), so the sprite is drawn half over the sea and the shore tile art.

67 asset types, 133 images.

| asset type | images | games |
| --- | ---: | --- |
| black city | 3 | 20260912-game1818, 20260912-gangshit, 20260914-loot6925 |
| black knight level 1 active | 3 | 20260913-white3776, 20260914-edge2168, 20260914-road2697 |
| black knight level 1 inactive | 3 | 20260912-king1110, 20260913-edge7681, 20260914-edge2168 |
| black knight level 2 active | 3 | 20260913-game9549, 20260913-green7092, 20260913-turn1790 |
| black knight level 2 inactive | 3 | 20260912-game1818, 20260913-game9549, 20260913-green7092 |
| black knight level 3 active | 2 | 20260912-game1818, 20260912-sheep5955 |
| black knight level 3 inactive | 2 | 20260913-map2124 |
| black settlement | 3 | 20260912-blue8994, 20260913-king852, 20260914-map7182 |
| blue city | 3 | 20260912-king1110, 20260912-town9850, 20260914-white4988 |
| blue knight level 1 active | 3 | 20260912-stone7716, 20260913-pack2330, 20260913-red4763 |
| blue knight level 1 inactive | 3 | 20260912-rule7781, 20260912-town9850, 20260913-stone8568 |
| blue knight level 2 active | 3 | 20260912-rob3705, 20260912-rule4540, 20260914-edge396 |
| blue knight level 2 inactive | 3 | 20260912-game9771, 20260912-rob3705, 20260913-stone8568 |
| blue knight level 3 active | 2 | 20260912-crop490 |
| blue knight level 3 inactive | 2 | 20260912-stone7841 |
| blue settlement | 3 | 20260912-blue8994, 20260913-game9549, 20260913-white7201 |
| bronze settlement | 3 | 20260914-edge2168 |
| gold knight level 1 active | 3 | 20260914-bank9969, 20260914-gold2088 |
| gold knight level 1 inactive | 3 | 20260913-town4715, 20260914-bank9969, 20260914-gold2088 |
| gold knight level 2 active | 3 | 20260914-edge396, 20260914-gold2088 |
| gold knight level 2 inactive | 3 | 20260914-edge396, 20260914-gold2088 |
| gold settlement | 3 | 20260913-event161, 20260913-white3776, 20260914-gold2088 |
| green city | 3 | 20260912-dice8909, 20260913-town9323 |
| green knight level 1 active | 3 | 20260912-dice8909, 20260912-spot230, 20260914-rule743 |
| green knight level 1 inactive | 2 | 20260912-city1417, 20260914-rule743 |
| green knight level 2 active | 3 | 20260912-win5210, 20260913-game5852, 20260913-road418 |
| green knight level 2 inactive | 3 | 20260912-win5210, 20260914-event98, 20260914-ore1633 |
| green knight level 3 active | 3 | 20260913-deal9022, 20260914-ore1633 |
| green knight level 3 inactive | 3 | 20260913-deal9022, 20260914-ore1633 |
| green settlement | 3 | 20260913-deal9022, 20260913-game5852, 20260913-road418 |
| mysticblue city | 3 | 20260913-white3776, 20260914-event98, 20260914-rule743 |
| mysticblue knight level 1 active | 3 | 20260913-green1183, 20260913-spot2571, 20260913-task707 |
| mysticblue knight level 1 inactive | 3 | 20260913-event161, 20260913-spot2571, 20260914-map7182 |
| mysticblue knight level 2 active | 3 | 20260913-spot2571 |
| mysticblue knight level 2 inactive | 3 | 20260913-spot2571 |
| mysticblue settlement | 3 | 20260912-wool8372, 20260913-spot2571, 20260913-task707 |
| orange city | 3 | 20260912-king1110, 20260913-king5484, 20260913-sail950 |
| orange knight level 1 active | 3 | 20260912-coin9063, 20260912-grid8553, 20260913-map599 |
| orange knight level 1 inactive | 3 | 20260912-dice8909, 20260912-rule4540, 20260913-map2124 |
| orange knight level 2 active | 3 | 20260912-256414712, 20260912-grid8553, 20260912-town2147 |
| orange knight level 2 inactive | 3 | 20260912-fort2461, 20260912-king6295, 20260913-white7201 |
| orange settlement | 3 | 20260912-dice8909, 20260913-road418, 20260914-roll728 |
| pink city | 1 | 20260913-mine2890 |
| pink knight level 1 active | 3 | 20260913-fort7899, 20260913-green7193, 20260914-loot6925 |
| pink knight level 1 inactive | 3 | 20260913-fort7899, 20260913-green7193, 20260913-wheat5803 |
| pink knight level 2 active | 2 | 20260914-loot6925 |
| pink knight level 2 inactive | 1 | 20260914-loot6925 |
| pink settlement | 3 | 20260913-edge7681, 20260913-fort7899, 20260913-game9549 |
| purple city | 2 | 20260914-port2768 |
| purple knight level 1 active | 3 | 20260913-hill5176, 20260913-map8115 |
| purple knight level 1 inactive | 3 | 20260913-hill5176, 20260913-map8115 |
| purple settlement | 3 | 20260913-hill5176, 20260914-bank9969, 20260914-road2697 |
| red city | 3 | 20260913-roll7318, 20260914-bank9969, 20260914-road2697 |
| red knight level 1 active | 3 | 20260912-pact3344, 20260913-mine4750, 20260914-mine2129 |
| red knight level 1 inactive | 3 | 20260912-wool8372, 20260914-bank9969, 20260914-mine2129 |
| red knight level 2 active | 3 | 20260912-sheep5955, 20260913-green7092, 20260914-white4988 |
| red knight level 2 inactive | 3 | 20260912-farm4368, 20260913-map2124, 20260914-catan7909 |
| red knight level 3 active | 3 | 20260913-edge7681 |
| red knight level 3 inactive | 3 | 20260913-edge7681 |
| red settlement | 3 | 20260913-fort7899, 20260913-king5484, 20260913-red4763 |
| silver knight level 1 inactive | 1 | 20260914-card7322 |
| silver settlement | 3 | 20260913-town5830, 20260913-turn1449, 20260914-isle3902 |
| white city | 3 | 20260913-king5855, 20260913-roll7318, 20260914-ore1633 |
| white knight level 1 active | 3 | 20260913-deal3564, 20260913-king7931, 20260913-town9323 |
| white knight level 1 inactive | 3 | 20260912-green3767, 20260913-sail950, 20260913-town9323 |
| white knight level 2 inactive | 1 | 20260914-ore1633 |
| white settlement | 3 | 20260913-pack2330, 20260913-road3569, 20260913-town9323 |

### shore-road

A road on a shore edge - an edge that borders exactly one tile (30 of the 72), so the road runs along the coastline with sea and harbour art behind it.

12 asset types, 33 images.

| asset type | images | games |
| --- | ---: | --- |
| black road | 3 | 20260912-pact3344, 20260912-rob3705, 20260912-stone7841 |
| blue road | 3 | 20260912-stone7841, 20260913-green7193, 20260913-white7201 |
| bronze road | 3 | 20260914-edge2168 |
| gold road | 3 | 20260913-white3776, 20260914-bank9969, 20260914-roll728 |
| green road | 3 | 20260913-deal9022, 20260913-green916, 20260913-road418 |
| mysticblue road | 3 | 20260913-green1183, 20260914-grain2823, 20260914-map7182 |
| orange road | 3 | 20260912-dice8909, 20260913-road418, 20260913-white7201 |
| pink road | 3 | 20260913-army4015, 20260913-band9892, 20260913-green7193 |
| purple road | 3 | 20260913-hill5176, 20260914-road2697, 20260914-white4988 |
| red road | 3 | 20260912-rule4540, 20260913-turn1449, 20260914-rule743 |
| silver road | 3 | 20260913-map4938, 20260913-town5830, 20260913-turn1449 |
| white road | 3 | 20260913-pack2330, 20260913-road3569, 20260913-sail950 |

### metropolis-tower-overlap

A metropolis tower whose drawn sprite rectangle overlaps the sprite of a piece on a neighbouring vertex by more than 2% of a building sprite area. Both the covering metropolis and the covered piece are flagged. Draw geometry: buildings 154 px at spacing/416*1.2 anchored -0.065 spacings above the vertex, the tower the same scale offset 0.28*154*pieceScale to the right, knight badges 0.35 spacings centred on the vertex.

68 asset types, 99 images.

| asset type | images | games |
| --- | ---: | --- |
| black knight level 1 active | 3 | 20260912-clay4006, 20260912-roll5960, 20260912-sail2787 |
| black knight level 1 inactive | 3 | 20260912-plan5710, 20260913-event140, 20260913-town353 |
| black knight level 2 active | 3 | 20260912-isle430, 20260912-plan4727, 20260912-stone9236 |
| black knight level 2 inactive | 3 | 20260912-game1818, 20260912-gangshit, 20260913-task707 |
| black knight level 3 active | 3 | 20260912-256540820, 20260912-town9850 |
| black knight level 3 inactive | 3 | 20260912-256540820, 20260912-game1818, 20260912-turn6081 |
| black metropolis politics | 3 | 20260912-256540820, 20260912-clay4006, 20260912-game1818 |
| black metropolis science | 3 | 20260912-256540820, 20260912-gangshit, 20260912-plan4727 |
| black metropolis trade | 3 | 20260912-256428444, 20260912-town9850, 20260913-task707 |
| blue knight level 1 active | 3 | 20260913-brick4698, 20260913-pack2330, 20260913-stone8568 |
| blue knight level 1 inactive | 3 | 20260912-area1168, 20260913-king5855, 20260913-stone8568 |
| blue knight level 2 active | 3 | 20260912-white1525, 20260912-win5210, 20260913-edge7681 |
| blue knight level 2 inactive | 3 | 20260912-white1525, 20260913-stone8568, 20260914-plan3378 |
| blue knight level 3 active | 2 | 20260913-fort7013, 20260914-gold2088 |
| blue knight level 3 inactive | 2 | 20260914-gold2088 |
| blue metropolis politics | 3 | 20260912-road1494, 20260913-fort7013, 20260914-gold2088 |
| blue metropolis science | 3 | 20260912-area1168, 20260912-isle430, 20260912-white1525 |
| blue metropolis trade | 3 | 20260912-plan4727, 20260913-brick4698, 20260913-stone8568 |
| bronze knight level 2 inactive | 2 | 20260912-wool8372 |
| gold knight level 2 active | 1 | 20260914-steal2639 |
| gold metropolis science | 1 | 20260914-steal2639 |
| green knight level 1 active | 3 | 20260913-green7092, 20260914-loot8849 |
| green knight level 1 inactive | 2 | 20260913-green7092, 20260914-loot8849 |
| green knight level 2 active | 2 | 20260912-dice8909, 20260913-green7092 |
| green knight level 2 inactive | 1 | 20260913-green7092 |
| green metropolis science | 3 | 20260913-green7092 |
| green metropolis trade | 3 | 20260914-loot8849, 20260914-map7182, 20260914-ore1633 |
| mysticblue knight level 1 active | 2 | 20260913-white3776 |
| mysticblue knight level 1 inactive | 3 | 20260913-spot2571, 20260913-white3776 |
| mysticblue knight level 3 active | 2 | 20260914-grain2823 |
| mysticblue metropolis politics | 2 | 20260914-grain2823 |
| mysticblue metropolis science | 2 | 20260912-wool8372 |
| mysticblue metropolis trade | 3 | 20260913-white3776 |
| orange knight level 1 active | 2 | 20260912-256418147, 20260912-clay4006 |
| orange knight level 1 inactive | 1 | 20260912-clay4006 |
| orange knight level 2 active | 1 | 20260912-256476858 |
| orange knight level 3 active | 3 | 20260914-map7182 |
| orange knight level 3 inactive | 1 | 20260912-256418147 |
| orange metropolis trade | 2 | 20260912-256476858, 20260912-256537837 |
| pink knight level 1 active | 1 | 20260913-deal9022 |
| pink knight level 1 inactive | 3 | 20260913-deal9022, 20260913-edge7681 |
| pink knight level 3 active | 1 | 20260913-spot2148 |
| pink metropolis science | 1 | 20260913-spot2148 |
| pink metropolis trade | 3 | 20260913-deal9022 |
| purple knight level 1 inactive | 1 | 20260914-port2768 |
| purple metropolis politics | 1 | 20260914-port2768 |
| red knight level 1 active | 2 | 20260912-trade5172, 20260913-brick3545 |
| red knight level 1 inactive | 3 | 20260912-256435701, 20260913-army6054, 20260913-brick3545 |
| red knight level 2 active | 3 | 20260912-ore1015, 20260912-pact3344, 20260913-turn9715 |
| red knight level 2 inactive | 3 | 20260912-256489236, 20260912-plan4727, 20260913-sail950 |
| red knight level 3 active | 1 | 20260913-256587190 |
| red knight level 3 inactive | 1 | 20260913-256587190 |
| red metropolis politics | 3 | 20260912-ore1015, 20260912-pact3344, 20260913-roll7318 |
| red metropolis science | 3 | 20260912-256435701, 20260912-trade5172, 20260912-turn6081 |
| red metropolis trade | 3 | 20260912-256435701, 20260912-clay4006, 20260912-dice8909 |
| silver knight level 1 inactive | 3 | 20260913-task5065, 20260914-isle3902 |
| silver knight level 3 active | 1 | 20260913-land5958 |
| silver knight level 3 inactive | 1 | 20260913-land5958 |
| silver metropolis politics | 3 | 20260913-land5958, 20260914-isle3902 |
| silver metropolis trade | 1 | 20260913-task5065 |
| white knight level 1 active | 2 | 20260914-event98, 20260914-ore1633 |
| white knight level 1 inactive | 3 | 20260913-crop4923, 20260913-loot3793, 20260914-event98 |
| white knight level 2 active | 3 | 20260913-spot6718, 20260914-event659, 20260914-ore1633 |
| white knight level 2 inactive | 3 | 20260914-event659, 20260914-ore1633 |
| white knight level 3 inactive | 1 | 20260914-ore1633 |
| white metropolis politics | 2 | 20260914-ore1633 |
| white metropolis science | 3 | 20260913-crop4923, 20260914-event659, 20260914-event98 |
| white metropolis trade | 3 | 20260913-turn9715 |

### near-robber

The piece touches the tile the robber stands on (classification 3 `near-robber` flag).

126 asset types, 228 images.

| asset type | images | games |
| --- | ---: | --- |
| black city | 3 | 20260912-roll5960, 20260913-crop4923, 20260914-rule743 |
| black knight level 1 active | 3 | 20260913-brick3545, 20260914-bank9969, 20260914-rule743 |
| black knight level 1 inactive | 3 | 20260912-farm4368, 20260912-game9771, 20260912-plan5710 |
| black knight level 2 active | 3 | 20260912-stone9236, 20260913-game9549, 20260913-green7092 |
| black knight level 2 inactive | 3 | 20260913-band9892, 20260913-crop4923, 20260913-game9549 |
| black knight level 3 active | 3 | 20260912-256428444, 20260912-sail2787, 20260914-white4988 |
| black knight level 3 inactive | 3 | 20260912-256546411, 20260912-pact3344, 20260913-sea4409 |
| black metropolis politics | 3 | 20260912-crop490, 20260912-sail2787, 20260913-green7092 |
| black metropolis science | 3 | 20260912-256489236, 20260912-gangshit, 20260912-pact3344 |
| black metropolis trade | 3 | 20260912-farm4368, 20260913-grain9566, 20260913-land5194 |
| black road | 3 | 20260912-pact3344, 20260912-plan5710, 20260913-edge7681 |
| black settlement | 3 | 20260912-fort2461, 20260912-plan5710, 20260912-rob3705 |
| blue city | 3 | 20260912-clay4006, 20260912-dice8909, 20260913-green916 |
| blue knight level 1 active | 3 | 20260912-blue8994, 20260913-pack2330, 20260913-red4763 |
| blue knight level 1 inactive | 3 | 20260912-plan4727, 20260913-ore8121, 20260914-isle6999 |
| blue knight level 2 active | 3 | 20260913-edge7681, 20260914-edge396, 20260914-white4988 |
| blue knight level 2 inactive | 3 | 20260912-clay4006, 20260912-dice8909, 20260912-game9771 |
| blue knight level 3 active | 3 | 20260912-area5226, 20260913-roll3478, 20260914-edge2168 |
| blue knight level 3 inactive | 3 | 20260912-stone7841, 20260913-road5319, 20260914-catan7909 |
| blue metropolis politics | 3 | 20260912-brick5791, 20260913-fort7013, 20260914-gold2088 |
| blue metropolis science | 3 | 20260912-area5226, 20260913-edge7681, 20260913-hill5176 |
| blue metropolis trade | 3 | 20260913-brick4698, 20260913-spot6718, 20260914-plan3378 |
| blue road | 3 | 20260912-stone7841, 20260913-green7193, 20260913-white7201 |
| blue settlement | 3 | 20260912-blue8994, 20260912-stone7841, 20260913-white7201 |
| bronze city | 3 | 20260914-edge2168 |
| bronze knight level 1 active | 2 | 20260912-land5766, 20260914-edge2168 |
| bronze knight level 1 inactive | 2 | 20260914-edge2168 |
| bronze knight level 2 active | 2 | 20260912-land5766, 20260914-edge2168 |
| bronze knight level 2 inactive | 2 | 20260912-wool8372 |
| bronze knight level 3 inactive | 2 | 20260914-edge2168 |
| bronze metropolis politics | 3 | 20260914-edge2168 |
| bronze road | 3 | 20260914-edge2168 |
| bronze settlement | 1 | 20260914-edge2168 |
| gold city | 3 | 20260913-event140, 20260913-event161, 20260914-bank9969 |
| gold knight level 1 active | 3 | 20260913-event140, 20260913-event161, 20260914-roll728 |
| gold knight level 2 active | 1 | 20260914-steal2639 |
| gold knight level 2 inactive | 3 | 20260914-roll728 |
| gold metropolis science | 3 | 20260914-roll728 |
| gold metropolis trade | 1 | 20260914-steal2639 |
| gold road | 3 | 20260913-white3776, 20260914-bank9969, 20260914-roll728 |
| gold settlement | 3 | 20260913-white3776, 20260914-bank9969, 20260914-gold2088 |
| green city | 3 | 20260912-dice8909, 20260912-spot230, 20260914-map7182 |
| green knight level 1 active | 3 | 20260913-game5852, 20260913-map8115, 20260914-mine2129 |
| green knight level 1 inactive | 3 | 20260913-deal9022, 20260913-map8115, 20260914-mine2129 |
| green knight level 2 active | 3 | 20260912-isle5030, 20260912-road3216, 20260913-road3569 |
| green knight level 2 inactive | 3 | 20260912-dice8714, 20260912-sea3674, 20260914-map7182 |
| green knight level 3 active | 2 | 20260912-path6296, 20260913-king5855 |
| green knight level 3 inactive | 1 | 20260913-king5855 |
| green metropolis politics | 2 | 20260913-king5855, 20260914-path1563 |
| green metropolis science | 3 | 20260913-green7092, 20260913-town9323 |
| green metropolis trade | 3 | 20260912-edge7877, 20260914-map7182, 20260914-ore1633 |
| green road | 3 | 20260912-sea3674, 20260913-deal9022, 20260914-map7182 |
| green settlement | 3 | 20260912-dice8714, 20260913-deal9022, 20260914-loot8849 |
| mysticblue city | 3 | 20260912-brick5791, 20260913-green7092, 20260913-stone8568 |
| mysticblue knight level 1 active | 3 | 20260912-brick5791, 20260912-city9699, 20260913-event161 |
| mysticblue knight level 1 inactive | 3 | 20260913-blue6169, 20260913-roll3478, 20260914-grain2823 |
| mysticblue knight level 2 active | 3 | 20260912-crop490, 20260913-brick3545, 20260914-map7182 |
| mysticblue knight level 2 inactive | 3 | 20260913-roll3478, 20260913-spot2571, 20260914-map7182 |
| mysticblue knight level 3 active | 3 | 20260913-spot2571, 20260914-catan7909, 20260914-rule743 |
| mysticblue knight level 3 inactive | 3 | 20260913-spot2571, 20260914-rule743 |
| mysticblue metropolis politics | 3 | 20260913-spot2571, 20260914-grain2823, 20260914-rule743 |
| mysticblue metropolis science | 3 | 20260912-wool8372, 20260913-brick3545, 20260914-map7182 |
| mysticblue metropolis trade | 3 | 20260914-event659, 20260914-rule743 |
| mysticblue road | 3 | 20260912-brick5791, 20260913-green7092, 20260914-map7182 |
| mysticblue settlement | 3 | 20260912-wool8372, 20260913-brick3545, 20260913-green1183 |
| orange city | 3 | 20260912-dice8909, 20260912-isle430, 20260912-plan4727 |
| orange knight level 1 active | 3 | 20260912-blue8994, 20260912-grid8553, 20260913-map599 |
| orange knight level 1 inactive | 3 | 20260912-area5876, 20260912-army6890, 20260912-game1818 |
| orange knight level 2 active | 3 | 20260912-dice8909, 20260912-game1818, 20260912-rob3705 |
| orange knight level 2 inactive | 3 | 20260912-dice8909, 20260912-game1818, 20260913-road418 |
| orange knight level 3 active | 3 | 20260912-pack2962, 20260912-tile9857, 20260913-sail950 |
| orange knight level 3 inactive | 3 | 20260912-256418147, 20260913-sail950, 20260913-white7201 |
| orange metropolis politics | 3 | 20260912-tile9857, 20260913-white8746, 20260914-map7182 |
| orange metropolis science | 3 | 20260912-blue8994, 20260912-hill9622, 20260913-army4015 |
| orange metropolis trade | 1 | 20260913-white7201 |
| orange road | 3 | 20260912-dice8909, 20260912-isle430, 20260913-white7201 |
| orange settlement | 3 | 20260912-256418147, 20260912-game1818, 20260912-grid8553 |
| pink city | 3 | 20260912-farm4368, 20260913-edge7681, 20260914-loot6925 |
| pink knight level 1 active | 3 | 20260912-town9850, 20260913-edge7681, 20260913-green7193 |
| pink knight level 1 inactive | 3 | 20260913-deal9022, 20260913-edge7681, 20260913-game9549 |
| pink knight level 2 active | 3 | 20260913-edge7681, 20260913-fort7899, 20260913-wheat5803 |
| pink knight level 2 inactive | 3 | 20260912-blue5396, 20260913-green7193, 20260913-wheat5803 |
| pink metropolis science | 3 | 20260912-town9850, 20260913-grid4761, 20260913-king5484 |
| pink metropolis trade | 1 | 20260913-deal9022 |
| pink road | 3 | 20260913-green7193, 20260913-road5319, 20260913-wheat5803 |
| pink settlement | 3 | 20260913-edge7681, 20260913-fort7899, 20260913-game9549 |
| purple city | 3 | 20260913-hill5176, 20260914-loot8849, 20260914-port2768 |
| purple knight level 1 active | 3 | 20260913-dice5721, 20260914-port2768, 20260914-white4988 |
| purple knight level 1 inactive | 3 | 20260913-dice5721, 20260914-loot8849, 20260914-port2768 |
| purple knight level 2 active | 1 | 20260913-hill5176 |
| purple knight level 2 inactive | 1 | 20260914-loot8849 |
| purple metropolis politics | 1 | 20260914-port2768 |
| purple metropolis science | 1 | 20260914-mine2129 |
| purple metropolis trade | 3 | 20260914-white4988 |
| purple road | 3 | 20260913-hill5176, 20260914-loot8849, 20260914-road2697 |
| purple settlement | 3 | 20260913-band9892, 20260914-bank9969, 20260914-white4988 |
| red city | 3 | 20260912-256428444, 20260912-deal2553, 20260913-brick3545 |
| red knight level 1 active | 3 | 20260912-256489236, 20260913-grid3044, 20260913-roll7318 |
| red knight level 1 inactive | 3 | 20260913-brick3545, 20260913-hill5176, 20260914-roll728 |
| red knight level 2 active | 3 | 20260912-edge7877, 20260912-town2147, 20260912-white1525 |
| red knight level 2 inactive | 3 | 20260912-256489236, 20260912-gangshit, 20260913-game9549 |
| red knight level 3 active | 3 | 20260912-rule4540, 20260913-sail950, 20260914-isle3902 |
| red knight level 3 inactive | 3 | 20260912-blue8410, 20260912-rule4540, 20260913-trade4830 |
| red metropolis politics | 3 | 20260912-dice1262, 20260912-rule7781, 20260913-roll7318 |
| red metropolis science | 3 | 20260912-trade5172, 20260913-grain9566, 20260913-mine4750 |
| red metropolis trade | 3 | 20260913-256587190, 20260913-game9549, 20260913-sail950 |
| red road | 3 | 20260912-rule4540, 20260913-turn1449, 20260914-edge2168 |
| red settlement | 3 | 20260913-fort7899, 20260913-red4763, 20260914-loot6925 |
| silver city | 3 | 20260913-bank1720, 20260913-map4938, 20260913-turn1449 |
| silver knight level 1 active | 2 | 20260913-turn5885, 20260914-isle3902 |
| silver knight level 1 inactive | 3 | 20260913-bank1720, 20260913-wall6069, 20260914-isle6999 |
| silver knight level 2 active | 3 | 20260913-bank1720, 20260913-town5830, 20260913-turn5885 |
| silver knight level 2 inactive | 3 | 20260913-bank1720, 20260913-map4938, 20260913-wall6069 |
| silver knight level 3 active | 1 | 20260913-wall6069 |
| silver road | 3 | 20260913-map4938, 20260913-turn1449, 20260913-wall6069 |
| silver settlement | 3 | 20260913-task5065, 20260913-town5830, 20260913-turn5885 |
| white city | 3 | 20260913-crop9200, 20260913-event727, 20260913-spot6718 |
| white knight level 1 active | 3 | 20260912-stone7716, 20260913-ore5565, 20260913-town9323 |
| white knight level 1 inactive | 3 | 20260912-stone7716, 20260913-256647109, 20260913-loot3793 |
| white knight level 2 active | 3 | 20260913-256647109, 20260913-rule6827, 20260914-ore1633 |
| white knight level 2 inactive | 3 | 20260913-fort7013, 20260913-hill5081, 20260913-map599 |
| white knight level 3 active | 3 | 20260913-crop9200, 20260913-event727 |
| white metropolis politics | 3 | 20260913-rule6827, 20260914-ore1633 |
| white metropolis science | 3 | 20260913-farm729, 20260913-fort7013, 20260913-land8399 |
| white road | 3 | 20260913-256647109, 20260913-fort7013, 20260913-spot6718 |
| white settlement | 3 | 20260912-white1525, 20260913-deal3564, 20260913-road3569 |

### near-merchant

The piece touches the tile the Cities & Knights merchant stands on (classification 3 `near-merchant` flag).

120 asset types, 199 images.

| asset type | images | games |
| --- | ---: | --- |
| black city | 3 | 20260912-256546411, 20260912-sea3674, 20260913-loot3793 |
| black knight level 1 active | 3 | 20260912-clay4006, 20260914-road2697, 20260914-rule743 |
| black knight level 1 inactive | 3 | 20260912-dice8714, 20260912-farm4368, 20260912-king6295 |
| black knight level 2 active | 3 | 20260912-isle430, 20260913-fort8377, 20260913-game9549 |
| black knight level 2 inactive | 3 | 20260913-fort7013, 20260913-game9549, 20260913-stone8568 |
| black knight level 3 active | 3 | 20260912-256435701, 20260912-hill9622, 20260912-town9850 |
| black knight level 3 inactive | 3 | 20260912-256546411, 20260913-sail950, 20260914-port2768 |
| black metropolis politics | 3 | 20260912-256487432, 20260912-clay4006, 20260914-port2768 |
| black metropolis science | 3 | 20260912-gangshit, 20260912-rule4540, 20260913-event727 |
| black metropolis trade | 3 | 20260912-256428444, 20260912-town9850, 20260913-task707 |
| black road | 3 | 20260912-hill9622, 20260912-pact3344, 20260912-rob3705 |
| black settlement | 3 | 20260912-blue8994, 20260912-rob3705, 20260914-map7182 |
| blue city | 3 | 20260912-clay4006, 20260912-town2147, 20260913-event727 |
| blue knight level 1 active | 3 | 20260912-area5226, 20260913-event727, 20260914-grain2823 |
| blue knight level 1 inactive | 3 | 20260912-area1168, 20260912-plan4727, 20260913-event727 |
| blue knight level 2 active | 3 | 20260912-256537837, 20260912-play2434, 20260913-fort7899 |
| blue knight level 2 inactive | 3 | 20260912-white1525, 20260914-edge2168, 20260914-plan3378 |
| blue knight level 3 active | 3 | 20260912-area5226, 20260913-town4715, 20260914-gold2088 |
| blue knight level 3 inactive | 3 | 20260912-king1110, 20260913-road5319 |
| blue metropolis politics | 3 | 20260912-king1110, 20260913-roll3478, 20260913-trade4830 |
| blue metropolis science | 3 | 20260912-isle430, 20260913-edge7681, 20260914-gold2088 |
| blue metropolis trade | 3 | 20260912-area1168, 20260912-isle5030, 20260913-edge7681 |
| blue road | 3 | 20260913-green7193, 20260913-road5319, 20260913-white7201 |
| blue settlement | 3 | 20260912-game1818, 20260913-green7193, 20260913-white7201 |
| bronze city | 3 | 20260914-edge2168 |
| bronze knight level 1 inactive | 1 | 20260914-edge2168 |
| bronze knight level 2 active | 2 | 20260914-edge2168 |
| bronze knight level 3 active | 1 | 20260914-edge2168 |
| bronze metropolis politics | 1 | 20260914-edge2168 |
| bronze road | 3 | 20260912-wool8372, 20260914-edge2168 |
| bronze settlement | 3 | 20260912-wool8372, 20260914-edge2168 |
| gold city | 3 | 20260914-gold2088, 20260914-roll728, 20260914-steal2639 |
| gold knight level 1 active | 1 | 20260914-steal2639 |
| gold knight level 2 active | 3 | 20260914-roll728, 20260914-steal2639 |
| gold knight level 2 inactive | 3 | 20260914-roll728 |
| gold metropolis science | 1 | 20260914-steal2639 |
| gold metropolis trade | 3 | 20260914-steal2639 |
| gold road | 3 | 20260914-gold2088, 20260914-roll728, 20260914-steal2639 |
| gold settlement | 3 | 20260914-bank9969, 20260914-gold2088, 20260914-steal2639 |
| green city | 3 | 20260912-256540820, 20260912-isle5030, 20260914-map7182 |
| green knight level 1 active | 3 | 20260912-coin1672, 20260912-wool9807, 20260913-spot2148 |
| green knight level 1 inactive | 3 | 20260912-sea3674, 20260913-green916, 20260913-road418 |
| green knight level 2 active | 3 | 20260912-isle5030, 20260914-event294, 20260914-rule743 |
| green knight level 2 inactive | 3 | 20260912-dice8714, 20260912-sea3674, 20260914-event98 |
| green knight level 3 active | 2 | 20260912-dice8909, 20260913-deal9022 |
| green metropolis politics | 1 | 20260913-road418 |
| green metropolis science | 1 | 20260912-coin1672 |
| green metropolis trade | 3 | 20260912-edge7877, 20260912-road3216, 20260914-loot8849 |
| green road | 3 | 20260912-256540820, 20260912-sea3674, 20260913-green916 |
| green settlement | 3 | 20260912-256540820, 20260912-dice8714, 20260912-win5210 |
| mysticblue city | 3 | 20260912-brick5791, 20260913-stone8568, 20260914-event98 |
| mysticblue knight level 1 active | 3 | 20260912-crop490, 20260913-event161, 20260914-event98 |
| mysticblue knight level 1 inactive | 3 | 20260913-event161, 20260913-king852, 20260913-task707 |
| mysticblue knight level 2 active | 3 | 20260913-event161, 20260913-spot2571, 20260913-stone8568 |
| mysticblue knight level 2 inactive | 3 | 20260913-brick3545, 20260913-event161, 20260914-map7182 |
| mysticblue knight level 3 active | 3 | 20260914-grain2823 |
| mysticblue metropolis politics | 1 | 20260913-stone8568 |
| mysticblue metropolis science | 3 | 20260913-brick3545, 20260914-map7182 |
| mysticblue metropolis trade | 3 | 20260913-white3776, 20260914-rule743 |
| mysticblue road | 3 | 20260913-event161, 20260914-grain2823, 20260914-map7182 |
| mysticblue settlement | 3 | 20260913-event161, 20260913-task707, 20260914-grain2823 |
| orange city | 3 | 20260912-clay4006, 20260912-plan4727, 20260913-map2124 |
| orange knight level 1 active | 3 | 20260912-blue8994, 20260912-grid8553, 20260912-tile9857 |
| orange knight level 1 inactive | 3 | 20260912-ore1588, 20260912-pack6316, 20260913-turn9715 |
| orange knight level 2 active | 3 | 20260912-256476858, 20260912-roll5960, 20260912-stone9236 |
| orange knight level 2 inactive | 3 | 20260912-fort2461, 20260912-game1818, 20260913-map4938 |
| orange knight level 3 inactive | 1 | 20260913-pack5320 |
| orange metropolis politics | 3 | 20260912-turn3916, 20260913-white8746, 20260914-map7182 |
| orange metropolis science | 3 | 20260912-game1818, 20260913-catan486, 20260913-sail950 |
| orange road | 3 | 20260912-grid8553, 20260912-pack6316, 20260912-roll5960 |
| orange settlement | 3 | 20260912-256418147, 20260912-stone9236, 20260914-roll728 |
| pink city | 3 | 20260912-farm4368, 20260913-edge7681, 20260914-loot6925 |
| pink knight level 1 active | 3 | 20260913-band9892, 20260913-edge7681, 20260913-green7193 |
| pink knight level 1 inactive | 3 | 20260913-edge7681, 20260913-game9549, 20260914-loot6925 |
| pink knight level 2 active | 3 | 20260913-edge7681, 20260913-fort7899, 20260913-green7193 |
| pink knight level 2 inactive | 3 | 20260913-edge7681, 20260913-fort7899, 20260913-green7193 |
| pink metropolis politics | 1 | 20260913-wheat5803 |
| pink metropolis science | 2 | 20260913-green7193 |
| pink metropolis trade | 2 | 20260913-edge7681, 20260913-wheat5803 |
| pink road | 3 | 20260913-band9892, 20260913-edge7681, 20260913-green7193 |
| pink settlement | 3 | 20260913-deal9022, 20260913-edge7681, 20260913-game9549 |
| purple city | 3 | 20260914-loot8849, 20260914-mine2129, 20260914-white4988 |
| purple knight level 1 active | 3 | 20260913-dice5721, 20260913-sea984, 20260914-white4988 |
| purple knight level 1 inactive | 3 | 20260913-dice5721, 20260914-road2697, 20260914-white4988 |
| purple knight level 2 active | 2 | 20260913-hill5176, 20260914-white4988 |
| purple metropolis science | 3 | 20260914-mine2129 |
| purple metropolis trade | 1 | 20260914-white4988 |
| purple road | 3 | 20260913-hill5176, 20260914-road2697, 20260914-white4988 |
| purple settlement | 3 | 20260914-bank9969, 20260914-road2697, 20260914-white4988 |
| red city | 3 | 20260912-town9850, 20260913-farm729, 20260914-road2697 |
| red knight level 1 active | 3 | 20260912-256489236, 20260912-road3216, 20260913-grid3044 |
| red knight level 1 inactive | 3 | 20260913-army6054, 20260913-green1183, 20260913-hill5176 |
| red knight level 2 active | 3 | 20260912-edge7877, 20260912-pact3344, 20260912-stone9236 |
| red knight level 2 inactive | 3 | 20260912-256476858, 20260912-gangshit, 20260912-tile9857 |
| red knight level 3 active | 3 | 20260912-rule4540, 20260913-sail950, 20260913-spot6718 |
| red knight level 3 inactive | 3 | 20260912-rule4540, 20260912-tile9857, 20260913-256587190 |
| red metropolis politics | 3 | 20260912-plot4048, 20260912-turn6081, 20260913-spot6718 |
| red metropolis science | 3 | 20260912-tile9857, 20260913-256587190, 20260913-loot3793 |
| red metropolis trade | 3 | 20260912-stone9236, 20260912-win5210, 20260913-game9549 |
| red road | 3 | 20260912-256476858, 20260913-road5319, 20260914-rule743 |
| red settlement | 3 | 20260912-dice8909, 20260913-deal3564, 20260914-loot6925 |
| silver city | 3 | 20260913-bank1720, 20260913-map4938, 20260913-turn1449 |
| silver knight level 1 active | 3 | 20260913-land5958, 20260913-map4938, 20260914-isle3902 |
| silver knight level 1 inactive | 2 | 20260913-task5065, 20260913-turn1449 |
| silver knight level 2 active | 3 | 20260913-land5958, 20260913-wall6069 |
| silver knight level 2 inactive | 3 | 20260913-map4938, 20260913-pack5320, 20260913-wall6069 |
| silver knight level 3 active | 1 | 20260913-map4938 |
| silver metropolis science | 1 | 20260914-isle3902 |
| silver road | 3 | 20260913-map4938, 20260913-turn1449, 20260913-wall6069 |
| silver settlement | 3 | 20260913-bank1720, 20260913-task5065, 20260913-turn1449 |
| white city | 3 | 20260912-rule7781, 20260913-crop9200, 20260913-event727 |
| white knight level 1 active | 3 | 20260913-event727, 20260913-hill5081 |
| white knight level 1 inactive | 3 | 20260913-crop9200, 20260913-land5194, 20260913-loot3793 |
| white knight level 2 active | 3 | 20260913-farm729, 20260913-fort7013, 20260913-roll7318 |
| white knight level 2 inactive | 3 | 20260912-rule7781, 20260913-map599, 20260913-sail950 |
| white knight level 3 active | 2 | 20260913-event727 |
| white metropolis science | 3 | 20260913-fort7013, 20260913-fort8377, 20260913-roll7318 |
| white metropolis trade | 3 | 20260913-mine4750, 20260913-town353 |
| white road | 3 | 20260913-farm729, 20260913-fort7013, 20260913-hill5081 |
| white settlement | 3 | 20260913-crop4923, 20260913-farm729, 20260913-land5194 |

## Totals

| measure | value |
| --- | ---: |
| imagesAnalysed | 2155 |
| imagesKept | 368 |
| imagesKeptByRareRule | 80 |
| imagesKeptByFill | 64 |
| imagesKeptByCornerCase | 224 |
| distinctGamesKept | 183 |
| distinctGamesAnalysed | 591 |
| assetTypes | 138 |
| rareAssetTypes | 25 |
| copiedBytes | 220381752 |
| overlayContaminatedCaptures | 168 |
| overlayContaminatedKeptForRareAssets | 2 |
| overlayContaminatedExcluded | 166 |
| assetTypesBelowMinimum | none |
| assetTypesBelowGameTarget | mysticblue metropolis science, white knight level 3 active |

## Excluded overlay-contaminated captures (166)

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
- 20260912-brick8895/02-213221
- 20260912-city4959/01-072550
- 20260912-clay4690/01-100726
- 20260912-clay4690/02-100959
- 20260912-cost1293/02-145715
- 20260912-cost217/01-133521
- 20260912-cost4359/01-221809
- 20260912-crop7518/01-230701
- 20260912-deal6312/01-225205
- 20260912-deck9983/02-142219
- 20260912-event263/01-164045
- 20260912-event263/02-164318
- 20260912-event406/01-201707
- 20260912-farm8303/01-215722
- 20260912-gold66/02-080459
- 20260912-grain7446/02-142829
- 20260912-green918/01-124016
- 20260912-grid3325/01-220025
- 20260912-grid3325/02-220259
- 20260912-grid720/02-101301
- 20260912-hand3383/02-091058
- 20260912-hand4707/01-191533
- 20260912-hand8858/02-195123
- 20260912-isle696/02-170159
- 20260912-land872/02-153231
- 20260912-map5323/02-121648
- 20260912-ore4990/01-102236
- 20260912-pack5873/02-000135
- 20260912-pact3330/02-082554
- 20260912-pact7865/01-080828
- 20260912-play7857/02-085036
- 20260912-red3544/02-215341
- 20260912-road7300/01-081711
- 20260912-roll2072/01-224248
- 20260912-rule7781/02-193229
- 20260912-sail9558/02-184217
- 20260912-sea9449/02-172655
- 20260912-sheep5955/01-081130
- 20260912-spot230/01-212645
- 20260912-spot7693/02-093057
- 20260912-steal1992/01-223330
- 20260912-stone6142/01-083544
- 20260912-task1235/02-133146
- 20260912-town7361/01-142902
- 20260912-town7361/02-143136
- 20260912-win9397/01-065828
- 20260912-wood1619/01-225514
- 20260912-wood1619/02-225748
- 20260912-wool2923/01-152656
- 20260912-wool7869/02-122920
- 20260913-256647109/01-074946
- 20260913-256647109/07-080430
- 20260913-army4015/05-230353
- 20260913-army4015/07-230842
- 20260913-army4015/08-231113
- 20260913-army4015/09-231335
- 20260913-army4015/12-232113
- 20260913-army4015/13-232427
- 20260913-army6897/02-192531
- 20260913-blue6169/03-235618
- 20260913-crop9200/05-192921
- 20260913-crop9200/07-193554
- 20260913-crop9200/10-194723
- 20260913-crop9200/11-195113
- 20260913-edge7681/04-035350
- 20260913-event140/02-214123
- 20260913-event140/07-215331
- 20260913-event161/01-040217
- 20260913-event727/02-183157
- 20260913-event727/07-184813
- 20260913-event727/11-185803
- 20260913-farm7421/04-182110
- 20260913-fort4077/02-020959
- 20260913-fort649/05-120650
- 20260913-fort7013/01-224403
- 20260913-fort8377/02-104121
- 20260913-fort9510/03-231445
- 20260913-game9549/01-170322
- 20260913-game9549/10-172806
- 20260913-green7193/02-210951
- 20260913-green7193/04-211452
- 20260913-green916/03-052241
- 20260913-grid4761/04-090653
- 20260913-grid5833/02-222318
- 20260913-isle6233/01-021939
- 20260913-king3990/02-013841
- 20260913-king5484/11-135648
- 20260913-land5194/02-202251
- 20260913-land5194/04-202752
- 20260913-land8399/02-125051
- 20260913-land8399/05-125820
- 20260913-land853/02-003856
- 20260913-map8115/09-171714
- 20260913-mine2890/04-080038
- 20260913-mine2890/05-080308
- 20260913-mine4750/02-063518
- 20260913-mine4750/04-064022
- 20260913-ore5592/01-002410
- 20260913-pack2330/03-070819
- 20260913-pack2330/07-071827
- 20260913-play8700/02-233503
- 20260913-plot856/02-024015
- 20260913-red4763/06-145856
- 20260913-road5319/05-151933
- 20260913-roll3478/04-205158
- 20260913-roll3478/11-210841
- 20260913-rule5458/01-011359
- 20260913-sea4409/01-232716
- 20260913-sea4409/04-233937
- 20260913-spot2571/09-050106
- 20260913-spot6718/02-143346
- 20260913-stone1868/08-150803
- 20260913-task1956/03-063441
- 20260913-task1956/04-063715
- 20260913-task1956/06-064215
- 20260913-task3696/01-020120
- 20260913-task6947/01-005510
- 20260913-task707/01-053204
- 20260913-task707/05-054722
- 20260913-task707/11-060904
- 20260913-tile2726/02-022521
- 20260913-town4715/01-143339
- 20260913-trade5728/11-163526
- 20260913-turn9715/07-202714
- 20260913-wall6069/09-222204
- 20260913-win5817/01-002108
- 20260913-win5817/02-002342
- 20260914-event294/04-045741
- 20260914-event294/05-050003
- 20260914-event294/07-050520
- 20260914-event294/09-051024
- 20260914-event98/01-041248
- 20260914-event98/03-041813
- 20260914-event98/07-042835
- 20260914-gold2088/06-031000
- 20260914-grain2823/07-063708
- 20260914-grain5360/05-071947
- 20260914-isle6999/02-001517
- 20260914-map7182/03-070154
- 20260914-mine2129/01-032249
- 20260914-mine2129/10-034603
- 20260914-path1563/03-000939
- 20260914-path1563/12-003209
- 20260914-plan3378/04-012614
- 20260914-port2768/02-014829
- 20260914-road2697/05-014318
- 20260914-roll728/02-041735
- 20260914-roll728/05-042532
- 20260914-roll728/07-043035
- 20260914-steal2639/04-035548
- 20260914-white4988/01-010158
- 20260914-white4988/02-010421
- 20260914-win7375/10-061255
- 20260914-win7375/12-061741

## Overlay-contaminated captures kept for a rare asset (2)

- 20260913-land5958/03-161215
- 20260913-wheat5803/15-224540

## Captures with no usable reading (3)

- 20260912-loot8435/02-041042 (reading-not-ok-or-png-missing)
- 20260912-steal3258/02-202009 (reading-not-ok-or-png-missing)
- 20260914-event294/15-052533 (reading-not-ok-or-png-missing)
