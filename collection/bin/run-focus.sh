#!/usr/bin/env bash
# Starts the focus worker in the foreground: scouts every map for games whose seats use a colour with gaps
# in ../examples/variants.json, captures once and revisits them every few minutes from a second tab.
#
#   bin/run-focus.sh [agent] [chrome-profile-dir] [extra flags...]
#
# Uses the same single Chrome profile as the spectate worker; never run both at the same time.
set -euo pipefail
cd "$(dirname "$0")/.."
AGENT="${1:-f1}"
PROFILE="${2:-.profiles/$AGENT}"
shift $(( $# > 2 ? 2 : $# ))
exec npm run -s focus -- --agent "$AGENT" --profile "$PROFILE" --revisit-minutes 5 --min-revisit-minutes 2 --max-visits 20 --settle-seconds 15 "$@"
