#!/usr/bin/env bash
# Commits the registry and the per-game readings (PNGs stay gitignored) as a progress snapshot.
#
#   bin/snapshot.sh "snapshot at 450 spectated games"
set -euo pipefail
cd "$(dirname "$0")/../.."
MESSAGE="${1:-snapshot of the spectated games}"
npm run -s status --prefix collection
git add examples/registry.json examples/games
git commit -q -m "chore(examples): $MESSAGE"
git log --oneline -1
