#!/usr/bin/env bash
# Starts one collection worker in the foreground with the settings used for the examples/ dataset.
#
#   bin/run-worker.sh [agent] [chrome-profile-dir] [extra worker flags...]
#
# The Chrome profile must be one that colonist.io already treats as a normal visitor (the site shows a
# Cloudflare check to fresh automated browsers). Never copy a profile to run several workers from it.
set -euo pipefail
cd "$(dirname "$0")/.."
AGENT="${1:-w1}"
PROFILE="${2:-.profiles/$AGENT}"
shift $(( $# > 2 ? 2 : $# ))
exec npm run -s worker -- --agent "$AGENT" --profile "$PROFILE" --captures 2 --interval 150 --settle-seconds 15 "$@"
