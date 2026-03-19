#!/usr/bin/env bash
# run-baseline-comparison.sh — Compare a skill before and after modification
#
# Usage:
#   ./scripts/run-baseline-comparison.sh <original-skill.md> <modified-skill.md>
#
# Produces a comparison report showing what changed, what was preserved,
# and whether the modification passed quality gates.
#
# Requires: python3, jq

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK_SCRIPT="${REPO_ROOT}/scripts/check_skill_structure.py"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
  echo "Usage: $0 <original-skill.md> <modified-skill.md>"
  echo ""
  echo "Compares a skill before and after a meta-skill operation."
  echo "Outputs a markdown comparison report to stdout."
  exit 1
}

[[ $# -lt 2 ]] && usage

ORIGINAL="$1"
MODIFIED="$2"

if [[ ! -f "$ORIGINAL" ]]; then
  echo "Error: original file not found: ${ORIGINAL}" >&2
  exit 1
fi
if [[ ! -f "$MODIFIED" ]]; then
  echo "Error: modified file not found: ${MODIFIED}" >&2
  exit 1
fi
if [[ ! -f "$CHECK_SCRIPT" ]]; then
  echo "Error: check_skill_structure.py not found at ${CHECK_SCRIPT}" >&2
  exit 1
fi
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not found" >&2
  exit 1
fi

# Run structural checks on both files
ORIG_JSON="$(python3 "$CHECK_SCRIPT" "$ORIGINAL" 2>/dev/null || true)"
MOD_JSON="$(python3 "$CHECK_SCRIPT" "$MODIFIED" 2>/dev/null || true)"

if [[ -z "$ORIG_JSON" ]]; then
  echo "Error: check_skill_structure.py failed on original: ${ORIGINAL}" >&2
  exit 1
fi
if [[ -z "$MOD_JSON" ]]; then
  echo "Error: check_skill_structure.py failed on modified: ${MODIFIED}" >&2
  exit 1
fi

# Extract scores
orig_score="$(echo "$ORIG_JSON" | jq -r '.score')"
orig_max="$(echo "$ORIG_JSON" | jq -r '.max_score')"
orig_valid="$(echo "$ORIG_JSON" | jq -r '.valid')"
mod_score="$(echo "$MOD_JSON" | jq -r '.score')"
mod_max="$(echo "$MOD_JSON" | jq -r '.max_score')"
mod_valid="$(echo "$MOD_JSON" | jq -r '.valid')"

# Extract line counts
orig_lines="$(echo "$ORIG_JSON" | jq -r '.checks.line_count.detail // "unknown"')"
mod_lines="$(echo "$MOD_JSON" | jq -r '.checks.line_count.detail // "unknown"')"

# Extract frontmatter names
orig_name="$(echo "$ORIG_JSON" | jq -r '.checks.frontmatter_fields.detail // ""' | grep -oP 'name=[^,]+' | sed 's/^name=//' || echo "unknown")"
mod_name="$(echo "$MOD_JSON" | jq -r '.checks.frontmatter_fields.detail // ""' | grep -oP 'name=[^,]+' | sed 's/^name=//' || echo "unknown")"

# Collect all check keys from both reports
all_checks="$(echo "$ORIG_JSON $MOD_JSON" | jq -rs '[.[].checks | keys[]] | unique | .[]')"

# --- Quality Gates ---
GATE_PASS=0
GATE_FAIL=0
GATE_RESULTS=()

# Gate 1: Modified must have >= sections as original
orig_section_count="$(echo "$ORIG_JSON" | jq '[.checks | to_entries[] | select(.key | startswith("has_")) | select(.value.pass == true)] | length')"
mod_section_count="$(echo "$MOD_JSON" | jq '[.checks | to_entries[] | select(.key | startswith("has_")) | select(.value.pass == true)] | length')"
if [[ "$mod_section_count" -ge "$orig_section_count" ]]; then
  GATE_RESULTS+=("✓|Section count|${orig_section_count} → ${mod_section_count}|Sections preserved or added")
  GATE_PASS=$((GATE_PASS + 1))
else
  GATE_RESULTS+=("✗|Section count|${orig_section_count} → ${mod_section_count}|Sections were removed")
  GATE_FAIL=$((GATE_FAIL + 1))
fi

# Gate 2: No section deletions — all passing sections in original must pass in modified
deleted_sections=""
while IFS= read -r check_key; do
  orig_pass="$(echo "$ORIG_JSON" | jq -r --arg k "$check_key" '.checks[$k].pass // false')"
  mod_pass="$(echo "$MOD_JSON" | jq -r --arg k "$check_key" '.checks[$k].pass // false')"
  if [[ "$orig_pass" == "true" && "$mod_pass" != "true" ]]; then
    deleted_sections="${deleted_sections}${check_key}, "
  fi
done <<< "$(echo "$ORIG_JSON" | jq -r '.checks | to_entries[] | select(.key | startswith("has_")) | .key')"

if [[ -z "$deleted_sections" ]]; then
  GATE_RESULTS+=("✓|No section deletions|—|All original sections preserved")
  GATE_PASS=$((GATE_PASS + 1))
else
  deleted_sections="${deleted_sections%, }"
  GATE_RESULTS+=("✗|No section deletions|${deleted_sections}|Sections were deleted")
  GATE_FAIL=$((GATE_FAIL + 1))
fi

# Gate 3: Line count — modified must be < 500
mod_line_num="$(echo "$mod_lines" | grep -oP '^\d+' || echo "0")"
if [[ "$mod_line_num" -lt 500 ]]; then
  GATE_RESULTS+=("✓|Line count < 500|${mod_lines}|Within limit")
  GATE_PASS=$((GATE_PASS + 1))
else
  GATE_RESULTS+=("✗|Line count < 500|${mod_lines}|Exceeds limit")
  GATE_FAIL=$((GATE_FAIL + 1))
fi

# Gate 4: Frontmatter name preserved
if [[ "$orig_name" == "$mod_name" ]] || [[ "$orig_name" == "unknown" ]]; then
  GATE_RESULTS+=("✓|Name preserved|${orig_name} → ${mod_name}|Unchanged")
  GATE_PASS=$((GATE_PASS + 1))
else
  GATE_RESULTS+=("✗|Name preserved|${orig_name} → ${mod_name}|Name was changed")
  GATE_FAIL=$((GATE_FAIL + 1))
fi

# --- Score delta ---
score_delta=$((mod_score - orig_score))
if [[ "$score_delta" -gt 0 ]]; then
  delta_display="+${score_delta}"
  delta_verdict="improved"
elif [[ "$score_delta" -lt 0 ]]; then
  delta_display="${score_delta}"
  delta_verdict="degraded"
else
  delta_display="0"
  delta_verdict="unchanged"
fi

# --- Generate Report ---
OVERALL="PASS"
if [[ "$GATE_FAIL" -gt 0 ]]; then
  OVERALL="FAIL"
fi

cat <<EOF
# Baseline Comparison Report

## Files

- **Original**: \`${ORIGINAL}\`
- **Modified**: \`${MODIFIED}\`

## Score Summary

| Metric | Original | Modified | Delta |
|--------|----------|----------|-------|
| Score | ${orig_score}/${orig_max} | ${mod_score}/${mod_max} | ${delta_display} (${delta_verdict}) |
| Valid | ${orig_valid} | ${mod_valid} | — |
| Lines | ${orig_lines} | ${mod_lines} | — |

## Check-by-Check Comparison

| Check | Original | Modified | Change |
|-------|----------|----------|--------|
EOF

while IFS= read -r check_key; do
  orig_pass="$(echo "$ORIG_JSON" | jq -r --arg k "$check_key" 'if .checks[$k] then (if .checks[$k].pass then "✓" else "✗" end) else "—" end')"
  mod_pass="$(echo "$MOD_JSON" | jq -r --arg k "$check_key" 'if .checks[$k] then (if .checks[$k].pass then "✓" else "✗" end) else "—" end')"
  if [[ "$orig_pass" == "$mod_pass" ]]; then
    change="—"
  elif [[ "$orig_pass" == "✗" && "$mod_pass" == "✓" ]]; then
    change="🟢 fixed"
  elif [[ "$orig_pass" == "✓" && "$mod_pass" == "✗" ]]; then
    change="🔴 regressed"
  else
    change="changed"
  fi
  echo "| \`${check_key}\` | ${orig_pass} | ${mod_pass} | ${change} |"
done <<< "$all_checks"

cat <<EOF

## Quality Gates

| Result | Gate | Detail | Note |
|--------|------|--------|------|
EOF

for gate_line in "${GATE_RESULTS[@]}"; do
  IFS='|' read -r result gate detail note <<< "$gate_line"
  echo "| ${result} | ${gate} | ${detail} | ${note} |"
done

cat <<EOF

## Verdict: **${OVERALL}**

- Gates passed: ${GATE_PASS}/$(( GATE_PASS + GATE_FAIL ))
- Score delta: ${delta_display} (${delta_verdict})
EOF

if [[ "$GATE_FAIL" -gt 0 ]]; then
  echo "- ⚠ **${GATE_FAIL} gate(s) failed** — modification did not pass quality standards"
fi

# Exit code reflects verdict
if [[ "$OVERALL" == "PASS" ]]; then
  exit 0
else
  exit 1
fi
