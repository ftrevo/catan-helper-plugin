#!/usr/bin/env bash
# Stops every running worker and its Chrome, then starts one worker in the background. Needed after
# changing the vision code or the models: the worker only loads them at start-up.
#
#   bin/restart-worker.sh [agent] [chrome-profile-dir] [extra worker flags...]
set -euo pipefail
cd "$(dirname "$0")/.."
AGENT="${1:-w1}"
PROFILE="${2:-.profiles/$AGENT}"
shift $(( $# > 2 ? 2 : $# ))
pkill -f 'src/(spectate|focus)-worker.ts' || true
sleep 2
pkill -f "$(basename "$PROFILE")" || true
sleep 3
mkdir -p ../examples/logs
nohup npm run -s worker -- --agent "$AGENT" --profile "$PROFILE" --captures 2 --interval 150 --settle-seconds 15 "$@" \
  >> "../examples/logs/$AGENT.stdout.log" 2>&1 &
echo "worker $AGENT started (pid $!); follow ../examples/logs/$AGENT.log"
