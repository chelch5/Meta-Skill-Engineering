#!/usr/bin/env bash
# run-corpus-eval.sh — Test meta-skills against the target skill corpus
#
# Layer 1: Did the meta-skill produce valid output? (structural checks)
# Layer 2: Does the rewritten skill perform better? (eval comparison)
#
# Usage:
#   ./scripts/run-corpus-eval.sh <meta-skill> [corpus-tier]
#   ./scripts/run-corpus-eval.sh skill-improver weak
#   ./scripts/run-corpus-eval.sh skill-anti-patterns adversarial
#   ./scripts/run-corpus-eval.sh skill-improver --all
#
# Requires: jq, python3

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORPUS_DIR="${REPO_ROOT}/corpus"
RESULTS_DIR="${REPO_ROOT}/eval-results"
CHECK_SCRIPT="${REPO_ROOT}/scripts/check_skill_structure.py"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  echo "Usage: $0 <meta-skill> [corpus-tier]"
  echo ""
  echo "Arguments:"
  echo "  meta-skill    Name of the meta-skill to evaluate (e.g. skill-improver)"
  echo "  corpus-tier   One of: weak, strong, adversarial, --all (default: --all)"
  echo ""
  echo "Examples:"
  echo "  $0 skill-improver weak"
  echo "  $0 skill-anti-patterns adversarial"
  echo "  $0 skill-improver --all"
  exit 1
}

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[PASS]${NC}  $1"; }
log_fail()  { echo -e "${RED}[FAIL]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# --- Argument parsing ---
[[ $# -lt 1 ]] && usage
META_SKILL="$1"
TIER="${2:---all}"

# Validate meta-skill exists
if [[ ! -d "${REPO_ROOT}/${META_SKILL}" ]] || [[ ! -f "${REPO_ROOT}/${META_SKILL}/SKILL.md" ]]; then
  echo "Error: meta-skill '${META_SKILL}' not found (no ${META_SKILL}/SKILL.md)" >&2
  exit 1
fi

# Validate tier
TIERS=()
case "$TIER" in
  --all)
    for t in weak strong adversarial; do
      [[ -d "${CORPUS_DIR}/${t}" ]] && TIERS+=("$t")
    done
    ;;
  weak|strong|adversarial)
    if [[ ! -d "${CORPUS_DIR}/${TIER}" ]]; then
      echo "Error: corpus tier '${TIER}' not found at ${CORPUS_DIR}/${TIER}" >&2
      exit 1
    fi
    TIERS=("$TIER")
    ;;
  *)
    echo "Error: unknown tier '${TIER}'. Use weak, strong, adversarial, or --all" >&2
    exit 1
    ;;
esac

# Validate dependencies
if ! command -v python3 &>/dev/null; then
  echo "Error: python3 is required but not found" >&2
  exit 1
fi
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not found" >&2
  exit 1
fi
if [[ ! -f "$CHECK_SCRIPT" ]]; then
  echo "Error: check_skill_structure.py not found at ${CHECK_SCRIPT}" >&2
  exit 1
fi

mkdir -p "$RESULTS_DIR"

# --- Main evaluation loop ---
TOTAL_SKILLS=0
TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_WARN=0

for tier in "${TIERS[@]}"; do
  TIER_DIR="${CORPUS_DIR}/${tier}"
  REPORT_FILE="${RESULTS_DIR}/corpus-${META_SKILL}-${tier}-${TIMESTAMP}.md"
  TIER_PASS=0
  TIER_FAIL=0
  TIER_WARN=0

  log_info "Evaluating tier: ${tier} (meta-skill: ${META_SKILL})"

  # Start the report
  {
    echo "# Corpus Evaluation: ${META_SKILL} → ${tier}"
    echo ""
    echo "- **Meta-skill**: \`${META_SKILL}\`"
    echo "- **Tier**: \`${tier}\`"
    echo "- **Timestamp**: ${TIMESTAMP}"
    echo "- **Mode**: Layer 1 structural evaluation (pre-scores)"
    echo ""
    echo "## Results"
    echo ""
    echo "| Skill File | Score | Max | Valid | Issues |"
    echo "|------------|-------|-----|-------|--------|"
  } > "$REPORT_FILE"

  for skill_file in "${TIER_DIR}"/*.md; do
    [[ -f "$skill_file" ]] || continue
    skill_basename="$(basename "$skill_file")"
    TOTAL_SKILLS=$((TOTAL_SKILLS + 1))

    # Create temp working directory
    WORK_DIR="$(mktemp -d)"
    trap "rm -rf '$WORK_DIR'" EXIT

    # Copy to temp dir as baseline
    cp "$skill_file" "${WORK_DIR}/original.md"
    cp "$skill_file" "${WORK_DIR}/working.md"

    # Run structural checks (Layer 1) — pre-scores
    PRE_JSON="$(python3 "$CHECK_SCRIPT" "$skill_file" 2>/dev/null || true)"

    if [[ -z "$PRE_JSON" ]]; then
      log_fail "${tier}/${skill_basename}: check_skill_structure.py produced no output"
      echo "| \`${skill_basename}\` | - | - | ERROR | checker error |" >> "$REPORT_FILE"
      TIER_FAIL=$((TIER_FAIL + 1))
      rm -rf "$WORK_DIR"
      continue
    fi

    # Extract scores from JSON
    pre_score="$(echo "$PRE_JSON" | jq -r '.score // 0')"
    pre_max="$(echo "$PRE_JSON" | jq -r '.max_score // 0')"
    pre_valid="$(echo "$PRE_JSON" | jq -r '.valid')"
    pre_warnings="$(echo "$PRE_JSON" | jq -r '.warnings | length')"

    # Collect failing checks
    failing_checks="$(echo "$PRE_JSON" | jq -r '[.checks | to_entries[] | select(.value.pass == false) | .key] | join(", ")')"
    [[ -z "$failing_checks" ]] && failing_checks="none"

    # Strong tier gate: structural degradation is not acceptable
    if [[ "$tier" == "strong" ]]; then
      if [[ "$pre_valid" != "true" ]]; then
        log_fail "${tier}/${skill_basename}: strong-tier skill is not valid (score: ${pre_score}/${pre_max})"
        echo "| \`${skill_basename}\` | ${pre_score} | ${pre_max} | ✗ FAIL | ${failing_checks} |" >> "$REPORT_FILE"
        TIER_FAIL=$((TIER_FAIL + 1))
      else
        log_ok "${tier}/${skill_basename}: valid (score: ${pre_score}/${pre_max})"
        echo "| \`${skill_basename}\` | ${pre_score} | ${pre_max} | ✓ | ${failing_checks} |" >> "$REPORT_FILE"
        TIER_PASS=$((TIER_PASS + 1))
      fi
    else
      # Weak/adversarial: record baseline state, expect issues
      if [[ "$pre_valid" == "true" ]]; then
        log_ok "${tier}/${skill_basename}: valid (score: ${pre_score}/${pre_max})"
        echo "| \`${skill_basename}\` | ${pre_score} | ${pre_max} | ✓ | ${failing_checks} |" >> "$REPORT_FILE"
        TIER_PASS=$((TIER_PASS + 1))
      else
        log_warn "${tier}/${skill_basename}: issues found (score: ${pre_score}/${pre_max}) — expected for ${tier} tier"
        echo "| \`${skill_basename}\` | ${pre_score} | ${pre_max} | ✗ | ${failing_checks} |" >> "$REPORT_FILE"
        TIER_WARN=$((TIER_WARN + 1))
      fi
    fi

    # Save detailed JSON for this skill
    echo "$PRE_JSON" | jq '.' > "${WORK_DIR}/pre-check.json"

    # --- Harness preparation ---
    # The actual meta-skill invocation requires copilot CLI (interactive).
    # We prepare the harness: baseline is recorded, post-invocation comparison
    # can be run via run-baseline-comparison.sh.
    #
    # To complete the eval loop manually:
    #   1. Run the meta-skill on ${WORK_DIR}/working.md
    #   2. Run: ./scripts/run-baseline-comparison.sh ${WORK_DIR}/original.md ${WORK_DIR}/working.md

    rm -rf "$WORK_DIR"
  done

  # Tier summary in report
  {
    echo ""
    echo "## Tier Summary: ${tier}"
    echo ""
    echo "- **Pass**: ${TIER_PASS}"
    echo "- **Fail**: ${TIER_FAIL}"
    echo "- **Warnings**: ${TIER_WARN}"
    echo ""
    if [[ "$tier" == "strong" && "$TIER_FAIL" -gt 0 ]]; then
      echo "> **⚠ Strong-tier failure**: ${TIER_FAIL} strong-tier skill(s) have structural issues."
      echo "> Strong-tier skills should always be structurally valid. Investigate corpus integrity."
    fi
    if [[ "$tier" == "weak" ]]; then
      echo "> **Note**: Weak-tier skills are expected to have issues. These are targets for the meta-skill to fix."
    fi
    if [[ "$tier" == "adversarial" ]]; then
      echo "> **Note**: Adversarial-tier skills contain format traps, injection attempts, and contradictions."
      echo "> The meta-skill should handle these gracefully without producing worse output."
    fi
    echo ""
    echo "---"
    echo ""
    echo "## Next Steps"
    echo ""
    echo "To complete Layer 2 evaluation (post-meta-skill comparison):"
    echo ""
    echo '```bash'
    echo "# 1. Run the meta-skill on a corpus skill:"
    echo "#    copilot -s '${META_SKILL}: improve this skill' < corpus/${tier}/<skill>.md > /tmp/improved.md"
    echo ""
    echo "# 2. Compare before/after:"
    echo "#    ./scripts/run-baseline-comparison.sh corpus/${tier}/<skill>.md /tmp/improved.md"
    echo '```'
  } >> "$REPORT_FILE"

  TOTAL_PASS=$((TOTAL_PASS + TIER_PASS))
  TOTAL_FAIL=$((TOTAL_FAIL + TIER_FAIL))
  TOTAL_WARN=$((TOTAL_WARN + TIER_WARN))

  log_info "Tier '${tier}' report written to: ${REPORT_FILE}"
done

# --- Final summary ---
echo ""
echo "=============================="
echo " Corpus Evaluation Summary"
echo "=============================="
echo -e " Meta-skill: ${CYAN}${META_SKILL}${NC}"
echo -e " Tiers:      ${CYAN}${TIERS[*]}${NC}"
echo -e " Skills:     ${TOTAL_SKILLS}"
echo -e " Pass:       ${GREEN}${TOTAL_PASS}${NC}"
echo -e " Fail:       ${RED}${TOTAL_FAIL}${NC}"
echo -e " Warnings:   ${YELLOW}${TOTAL_WARN}${NC}"
echo ""

if [[ "$TOTAL_FAIL" -gt 0 ]]; then
  echo -e "${RED}FAIL${NC} — ${TOTAL_FAIL} failure(s)"
  exit 1
else
  echo -e "${GREEN}PASS${NC} — all checks passed (${TOTAL_WARN} warning(s))"
  exit 0
fi
