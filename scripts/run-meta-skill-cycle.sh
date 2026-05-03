#!/usr/bin/env bash
# run-meta-skill-cycle.sh
# Runs an autonomous OpenCode SDK agent against the repo-owned skill packages.
#
# Usage: ./scripts/run-meta-skill-cycle.sh [cycle_number]
#   cycle_number: optional, defaults to 1. Used for labeling the output.

set -euo pipefail

CYCLE="${1:-1}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${REPO_DIR}/tasks/worklogs"
MODEL="${META_SKILL_AGENT_MODEL:-minimax-coding-plan/MiniMax-M2.7}"
SDK_BRIDGE="${REPO_DIR}/scripts/meta_skill_studio/opencode_sdk_bridge.mjs"
REPORT="tasks/worklogs/orchestrator-cycle-${CYCLE}-report.md"

mkdir -p "${LOG_DIR}"

echo "=== Meta-Skill Orchestrator Cycle ${CYCLE} ==="
echo "Repository: ${REPO_DIR}"
echo "Runtime: opencode-sdk"
echo "Model: ${MODEL}"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

cd "${REPO_DIR}"

node "${SDK_BRIDGE}" agent \
  --model "${MODEL}" \
  --prompt "Run a full quality-improvement cycle ${CYCLE} against the 17 repo-owned root skill packages in this repository. Use the documented skill pipeline, keep LibraryUnverified and LibraryWorkbench out of the root inventory, apply warranted improvements directly to skill package files, run the relevant validation commands, and write the cycle report to ${REPORT}. Do not create commits." \
  2>&1 | tee "${LOG_DIR}/cycle-${CYCLE}-raw-output.log"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "=== Cycle ${CYCLE} Complete ==="
echo "Exit code: ${EXIT_CODE}"
echo "Finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ -f "${REPORT}" ]; then
  echo "Report generated: ${REPORT}"
else
  echo "WARNING: No orchestrator report found. Check raw output log."
fi

exit "${EXIT_CODE}"
