#!/usr/bin/env bash
# Stops any running worker (spectate or focus) and its Chrome, then starts the focus worker in the
# background. The revisit queue in ../examples/revisit.json is resumed.
#
#   bin/restart-focus.sh [agent] [chrome-profile-dir] [extra flags...]
set -euo pipefail
cd "$(dirname "$0")/.."
AGENT="${1:-f1}"
PROFILE="${2:-.profiles/$AGENT}"
shift $(( $# > 2 ? 2 : $# ))
pkill -f 'src/(spectate|focus)-worker.ts' || true
sleep 2
pkill -f "$(basename "$PROFILE")" || true
sleep 3
mkdir -p ../examples/logs
nohup npm run -s focus -- --agent "$AGENT" --profile "$PROFILE" --revisit-minutes 5 --max-visits 10 --settle-seconds 15 "$@" \
  >> "../examples/logs/$AGENT.stdout.log" 2>&1 &
echo "focus worker $AGENT started (pid $!); follow ../examples/logs/$AGENT.log"
