#!/usr/bin/env bash
set -euo pipefail
# State is durable even when there is no new content or generation partially fails.
git add -- "$@"
if git diff --cached --quiet; then exit 0; fi
git config user.name 'github-actions[bot]'
git config user.email 'github-actions[bot]@users.noreply.github.com'
git commit -m "Auto-update: ${PIPELINE_NAME:-content} results and progress"
if [ "${AUTOMATION_LOCAL_ONLY:-0}" != 1 ]; then
  git pull --rebase origin main
  git push origin HEAD:main
fi
