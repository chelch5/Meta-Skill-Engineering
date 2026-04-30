#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SKILL_NAME="${1:-skill-packaging}"

python "${REPO_ROOT}/scripts/meta-skill-studio.py" \
  --mode cli \
  --action package-skill \
  --skill "${SKILL_NAME}" \
  --destination "${REPO_ROOT}/dist/skills" \
  --format json >/dev/null

echo "Packaging validation passed for ${SKILL_NAME}"
