# Example captures

Real colonist.io games captured while spectating, with the extension's reading of each capture. Used to
evaluate and later retrain the tile and piece models on real boards. **Base map only**: the standard
19-tile board (3-4-5-4-3 rows, 18 number tokens). Other maps (USA, Diamond, 5-6 player, Seafarers,
Cities & Knights pieces) are out of scope and must not be captured.

## Layout

```
examples/
├── README.md
├── registry.json                 claims and status per game (who watches what), maintained via registry.ts
├── STOP                          when present, workers finish their current game and exit
└── games/
    └── <YYYYMMDD>-<roomCode>/    one folder per game; roomCode is the hash of the game URL (#hand3397 → hand3397)
        ├── game.json             metadata: room code, url, mode, map, agent, viewport, timestamps, captures
        ├── 01-<HHMMSS>.png       captures in chronological order (two-digit sequence, capture time UTC)
        ├── 01-<HHMMSS>.reading.json
        ├── 02-<HHMMSS>.png
        └── 02-<HHMMSS>.reading.json
```

- PNGs are the raw viewport screenshots at 1x, 1600x900, the same pixels the extension would receive.
- Games come from colonist.io's Spectate list, filtered to Map = Base (Cities & Knights excluded); most
  live games are Colonist Rush, which fills the board with pieces within minutes.
  They are gitignored (a few hundred MB for 100 games); readings, metadata and the registry are committed.
- `*.reading.json` is produced by `extension-local`'s `npm run read -- <png> <json>`: the located board,
  every tile with confidences, pieces, and per-colour player statistics. `ok: false` means the board was
  not a readable standard map and the capture should be discarded.
- `game.json` fields: `roomCode`, `url`, `mode`, `map`, `turnTimer`, `agent`, `claimedAt`, `finishedAt`,
  `viewport`, `captures[]` (file, takenAt, ok, buildings, roads, colours), `notes`.

## Capture policy

A worker watches one game at a time and takes up to three captures roughly five minutes apart, or sooner
if the game ends, so that later captures contain cities and long roads. A game counts once, however many
captures it has. Captures whose reading is not `ok`, or where fewer than 15 of the 18 tokens were located (mid-game boards
hide a few: the robber sits on one), are not counted. A game whose first capture never becomes readable is
moved to `examples/rejected/` for inspection and marked `rejected` in the registry.

## Registry protocol

`training/src/collect/registry.ts` implements atomic claims with a lock directory:

- `claim(roomCode, agent)` fails if another worker already holds or finished the room.
- `finish(roomCode, summary)` / `reject(roomCode, reason)` close a claim.
- `stale` claims (no heartbeat for 20 minutes) may be re-claimed by anyone.
- The coordinator reads `registry.json`, never the game folders, to know progress.
