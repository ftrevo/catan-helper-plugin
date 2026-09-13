# Collection

Everything that drives the capture collection in `../examples`: a Puppeteer worker that spectates
colonist.io games, the shared registry that keeps workers from watching the same game, and the tools that
report on, re-read and repair the collected data. Nothing here is part of the extension or the training
package; those only consume the captures.

## Rules the collection follows

These were set when the collection started and have not changed since. Change them here and in
`src/spectate-worker.ts` together.

- **Base map only.** The lobby is filtered to rows whose map is `Base`; other maps and the 5-6 and 7-8
  player variants are skipped. The lobby list reorders between parsing and clicking, so the capture itself
  is checked too: at least 15 of the 18 tokens must be found and at most 2 token-like discs may stand
  outside the lattice on land.
- **Game modes Base game and Cities & Knights only.** Colonist Rush is excluded. In practice the public
  spectate list has never shown a plain base-mode game, so the set is Cities & Knights.
- **Open-ended.** The registry's `target` is `null`; workers run until `../examples/STOP` exists or they
  are killed. Snapshots are committed every 50 games.
- **One visible Chrome, one profile, no evasion.** colonist.io shows a Cloudflare check to fresh
  automated browsers and only a profile that already passes as a normal visitor gets through. The worker
  drives a real, visible Chrome window with that profile. The profile is never copied to run more
  workers, and nothing is done to bypass or hide from the check. If the profile stops passing, stop.
- **Two captures per game**, about 150 s apart, after a 15 s settle. On a "Game Over" overlay the worker
  clicks the "Map" button to reveal the final board and captures that.
- **Focus phase (from 2026-09-13, 450 games in).** The user relaxed the map rule to fill the gaps in the
  rare colours: `--all-maps` accepts every map the lobby lists (a located 19-tile lattice is enough, since
  only the pieces on its vertices and edges matter) and `--focus` leaves any game whose seats use none of
  the colours listed in `../examples/variants.json` (written by `npm run variants -- --min 5`). Rare-colour
  games get more captures (`--captures 6 --interval 120`). The goal is at least 5 sightings of every piece
  variant for every colour. Rooms left this way are `skipped` in the registry.
- **Never add tool attribution to commits.** Conventional commits, short messages.

## How a worker runs

1. Opens the Play Online lobby, reads the spectate list, keeps rows with map `Base` and an accepted mode,
   and drops rooms already claimed, done or rejected in `../examples/registry.json`.
2. Claims a room (atomic, via a lock directory next to the registry), opens it as a spectator, dismisses
   the mode info card and parks the pointer on the empty bottom bar so no tooltip covers the board.
3. Takes a screenshot, runs the extension's reader on it (`extension-local/scripts/read-capture.ts`, the
   same code the popup uses) and writes `NN-HHMMSS.png` plus `NN-HHMMSS.reading.json` into
   `../examples/games/<YYYYMMDD>-<roomCode>/`. The first capture is retried four times, 12 s apart, while
   the spectator view finishes loading.
4. Accepts a capture when the reading is ok, at least 15 tokens were found and at most 2 stray discs.
   A room whose first capture never passes is moved to `../examples/rejected/` (gitignored) with the
   reason, so it can be inspected and, after a fix, recovered.
5. Writes `game.json` (mode, map, timer, viewport, per-capture summary, notes) and marks the room done in
   the registry, then goes back to the lobby. Heartbeats keep the claim alive; claims silent for 20 min
   count as stale and are shown by `npm run status`.

The folder and file pattern is documented in `../examples/README.md`.

## Commands

Run `npm install` here once. Chrome is the system Google Chrome (path in `src/spectate-worker.ts`).

| Command                                                          | What it does                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `bin/run-worker.sh w1 <profile-dir>`                             | Runs a worker in the foreground with the dataset's settings (2 captures, 150 s apart, 15 s settle).         |
| `bin/restart-worker.sh w1 <profile-dir>`                         | Kills running workers and their Chrome, starts one in the background. Use after any vision or model change. |
| `npm run worker -- --agent w1 --profile <dir> [--once] [--list]` | The worker itself. `--list` only prints the lobby; `--once` watches a single game.                          |
| `npm run status`                                                 | Progress, per-agent counts, colours seen, rejection reasons, stale claims.                                  |
| `npm run reread -- [--rejected]`                                 | Re-runs the reader on every stored capture and refreshes the summaries. Run after retraining.               |
| `npm run recover`                                                | Re-reads `../examples/rejected`; rooms whose captures now pass move back to `games/` as done.               |
| `npm run variants -- [colour ...]`                               | Counts metropolis types and knight levels per colour by matching atlas sprites at the detected pieces.      |
| `bin/snapshot.sh "snapshot at 450 spectated games"`              | Commits the registry and readings (PNGs are gitignored).                                                    |

Logs go to `../examples/logs/<agent>.log` (gitignored). A useful watch:

```sh
tail -f ../examples/logs/w1.log | grep -E 'done:|rejected \(|error:|fatal|stop requested|exiting'
```

## Operating routine

- **Milestones.** Every 50 games: `npm run status`, then `bin/snapshot.sh` and push.
- **New rejection reasons.** Open the rejected capture before assuming the reason. Most rejections so far
  were standard boards mis-handled by the locator, not odd maps; see below.
- **After changing `extension-local/src/vision` or the models.** Run the extension tests, then
  `npm run reread` (and `npm run recover` if the change affects the locator), then `bin/restart-worker.sh`.
  The worker only loads code and models at start-up.
- **Focus phase.** Refresh the gap report at every snapshot (`npm run variants -- --min 5`); the worker
  reads it before each game, so colours drop out of the wanted list as they fill up. When the report has
  no gaps left, stop the focus run.
- **Stopping.** Create `../examples/STOP` or kill the worker. Stale claims from a killed worker expire on
  their own.

## Failure modes met so far

| Symptom                                           | Cause                                                          | Handling                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| "only 13 tokens" / "5 stray tokens" on a base map | Centre tile had no visible token (desert, robber, card sprite) | Locator now tries every centre implied by each token. Recovered with `npm run recover`. |
| 3-4 stray tokens with a white player              | White settlements look like tokens                             | Stray discs standing on a vertex are ignored.                                           |
| Spacing 60-90 px with 7-17 stray tokens           | A larger or custom map that the lobby listed as Base           | Genuine rejection.                                                                      |
| "0 token-like shapes"                             | Game paused (board dimmed) or not rendered yet                 | Retries; a long pause is a genuine rejection.                                           |
| Lattice fit explains 7 of 18 tokens               | Fog-island map with separate landmasses                        | Genuine rejection.                                                                      |
| Black cities never read                           | Renderer drew pieces at the wrong scale and anchor             | Renderer calibrated with `training`'s `measure:pieces`; models retrained; all re-read.  |
| Worker rejects a mode the rules allow             | "Base 5-6 Player" matched the base-mode regex                  | Mode filter tightened.                                                                  |
