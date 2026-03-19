#!/usr/bin/env bash
# run-evals.sh — Execute JSONL trigger and behavior test cases against skills
#
# Usage:
#   ./scripts/run-evals.sh [skill-name]       # Run evals for one skill
#   ./scripts/run-evals.sh --all              # Run evals for all skills with evals/
#   ./scripts/run-evals.sh --dry-run [skill]  # Show test cases without running
#
# Requires: copilot CLI, jq
#
# The script reads evals/trigger-positive.jsonl, evals/trigger-negative.jsonl,
# and evals/behavior.jsonl. Trigger tests check skill routing (precision/recall).
# Behavior tests check output format compliance (required patterns, forbidden
# patterns, minimum length).
#
# ROUTING DETECTION MODES:
#
# --fast (default): Checks whether the skill name appears in the copilot CLI
#   response. This is a proxy for skill activation, not a direct measurement.
#   False positives occur when the model mentions the skill name without
#   actually activating it. False negatives occur when the skill activates
#   but the response doesn't include the skill name verbatim.
#
# --strict: Differential testing — runs each prompt twice: once with the
#   skill's SKILL.md present and once with it temporarily hidden. If outputs
#   differ meaningfully, the skill was activated. Slower (2x prompts) but
#   credible. Set EVAL_ROUTING=strict or pass --strict flag.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_DIR="${REPO_ROOT}/eval-results"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DRY_RUN=false
TARGETS=()
MODEL="${EVAL_MODEL:-claude-sonnet-4.5}"
TIMEOUT="${EVAL_TIMEOUT:-60}"
ROUTING_MODE="${EVAL_ROUTING:-fast}"
JSON_OUTPUT=false

# Gate tracking globals (set by test functions, read by run_gates)
GATE_POS_PASS=0
GATE_POS_TOTAL=0
GATE_NEG_PASS=0
GATE_NEG_TOTAL=0
GATE_BEH_PASS=0
GATE_BEH_TOTAL=0
CURRENT_REPORT=""
OVERALL_FAIL=0

usage() {
  echo "Usage: $0 [--all | --dry-run | --strict | --json] [skill-name ...]"
  echo ""
  echo "Options:"
  echo "  --all       Run evals for all skills that have evals/ directories"
  echo "  --dry-run   List test cases without executing them"
  echo "  --strict    Use differential routing (with/without skill); slower but credible"
  echo "  --json      Emit machine-readable JSON summary to stdout after report"
  echo "  --model X   Override model (default: claude-sonnet-4.5)"
  echo "  --timeout N Seconds per prompt (default: 60)"
  exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      for d in "${REPO_ROOT}"/*/evals; do
        skill="$(basename "$(dirname "$d")")"
        TARGETS+=("$skill")
      done
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --strict)
      ROUTING_MODE="strict"
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      TARGETS+=("$1")
      shift
      ;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  echo "Error: specify skill name(s) or --all"
  usage
fi

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo "Error: jq is required"; exit 1; }

mkdir -p "$RESULTS_DIR"

run_trigger_tests() {
  local skill="$1"
  local jsonl_file="$2"
  local test_type="$3"  # "positive" or "negative"
  local total=0
  local pass=0
  local fail=0
  local errors=()

  if [[ ! -f "$jsonl_file" ]]; then
    echo "  ⏭  No ${test_type} test file: $(basename "$jsonl_file")"
    return
  fi

  local case_count
  case_count=$(wc -l < "$jsonl_file")
  echo "  Running ${case_count} ${test_type} cases..."

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    total=$((total + 1))

    local prompt expected
    prompt=$(echo "$line" | jq -r '.prompt')
    expected=$(echo "$line" | jq -r '.expected')
    local category
    category=$(echo "$line" | jq -r '.category // .better_skill // "unknown"')

    if $DRY_RUN; then
      echo "    [${total}] ${expected}: ${prompt}"
      continue
    fi

    # Run the prompt through copilot CLI
    local response
    response=$(timeout "$TIMEOUT" copilot -p "$prompt" \
      --model "$MODEL" \
      --reasoning-effort low \
      --allow-all \
      --autopilot 2>/dev/null || echo "ERROR: timeout or failure")

    # Check if the target skill was activated
    local skill_mentioned=false
    if [[ "$ROUTING_MODE" == "strict" ]]; then
      # Differential testing: run again with skill hidden, compare outputs
      local skill_dir="${REPO_ROOT}/${skill}"
      local skill_md="${skill_dir}/SKILL.md"
      local hidden_md="${skill_dir}/.SKILL.md.hidden"
      if [[ -f "$skill_md" ]]; then
        mv "$skill_md" "$hidden_md"
        local response_without
        response_without=$(timeout "$TIMEOUT" copilot -p "$prompt" \
          --model "$MODEL" \
          --reasoning-effort low \
          --allow-all \
          --autopilot 2>/dev/null || echo "ERROR: timeout or failure")
        mv "$hidden_md" "$skill_md"
        # If outputs differ meaningfully (>20% character difference), skill was active
        local len_with=${#response}
        local len_without=${#response_without}
        if [[ "$response" != "$response_without" ]]; then
          local diff_chars
          diff_chars=$(diff <(echo "$response") <(echo "$response_without") | wc -c)
          local avg_len=$(( (len_with + len_without) / 2 ))
          if [[ $avg_len -gt 0 ]] && [[ $((diff_chars * 100 / avg_len)) -gt 20 ]]; then
            skill_mentioned=true
          fi
        fi
      else
        # Fallback to name-grep if SKILL.md not found
        if echo "$response" | grep -qi "$skill"; then
          skill_mentioned=true
        fi
      fi
    else
      # Fast mode: name-grep proxy
      if echo "$response" | grep -qi "$skill"; then
        skill_mentioned=true
      fi
    fi

    local test_passed=false
    if [[ "$expected" == "trigger" ]] && $skill_mentioned; then
      test_passed=true
    elif [[ "$expected" == "no_trigger" ]] && ! $skill_mentioned; then
      test_passed=true
    fi

    if $test_passed; then
      pass=$((pass + 1))
      echo "    ✅ [${total}] PASS (${category}): ${prompt:0:60}..."
    else
      fail=$((fail + 1))
      errors+=("    ❌ [${total}] FAIL (${category}): ${prompt:0:60}... [expected=${expected}, mentioned=${skill_mentioned}]")
      echo "${errors[-1]}"
    fi
  done < "$jsonl_file"

  if $DRY_RUN; then
    echo "    Total: ${total} cases (dry run)"
    return
  fi

  echo ""
  echo "  ${test_type} results: ${pass}/${total} passed (${fail} failed)"

  # Write results to file
  {
    echo "## ${test_type^} trigger tests: ${skill}"
    echo ""
    echo "| Metric | Value |"
    echo "|--------|-------|"
    echo "| Total  | ${total} |"
    echo "| Passed | ${pass} |"
    echo "| Failed | ${fail} |"
    if [[ $total -gt 0 ]]; then
      local rate=$((pass * 100 / total))
      echo "| Rate   | ${rate}% |"
    fi
    echo ""
    if [[ ${#errors[@]} -gt 0 ]]; then
      echo "### Failures"
      for err in "${errors[@]}"; do
        echo "$err"
      done
      echo ""
    fi
  } >> "$CURRENT_REPORT"

  # Expose counts for gate calculation
  if [[ "$test_type" == "positive" ]]; then
    GATE_POS_PASS=$pass
    GATE_POS_TOTAL=$total
  else
    GATE_NEG_PASS=$pass
    GATE_NEG_TOTAL=$total
  fi
}

run_behavior_tests() {
  local skill="$1"
  local jsonl_file="$2"
  local total=0
  local pass=0
  local fail=0
  local errors=()

  if [[ ! -f "$jsonl_file" ]]; then
    echo "  ⏭  No behavior test file"
    return
  fi

  local case_count
  case_count=$(wc -l < "$jsonl_file")
  echo "  Running ${case_count} behavior cases..."

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    total=$((total + 1))

    local prompt
    prompt=$(echo "$line" | jq -r '.prompt')
    local min_lines
    min_lines=$(echo "$line" | jq -r '.min_output_lines // 10')

    if $DRY_RUN; then
      local sections
      sections=$(echo "$line" | jq -r '.expected_sections // [] | join(", ")')
      echo "    [${total}] behavior: ${prompt:0:60}..."
      echo "           expected: ${sections}"
      continue
    fi

    # Run the prompt through copilot CLI
    local response
    response=$(timeout "$TIMEOUT" copilot -p "$prompt" \
      --model "$MODEL" \
      --reasoning-effort low \
      --allow-all \
      --autopilot 2>/dev/null || echo "ERROR: timeout or failure")

    local response_lines
    response_lines=$(echo "$response" | wc -l)
    local section_pass=true
    local pattern_pass=true
    local forbidden_pass=true
    local length_pass=true
    local fail_reasons=()

    # Check minimum output length (protocol compliance)
    if [[ $response_lines -lt $min_lines ]]; then
      length_pass=false
      fail_reasons+=("protocol: too short (${response_lines} < ${min_lines} lines)")
    fi

    # Check required patterns (protocol compliance)
    while IFS= read -r pattern; do
      [[ -z "$pattern" ]] && continue
      if ! echo "$response" | grep -qi "$pattern"; then
        pattern_pass=false
        fail_reasons+=("protocol: missing required: ${pattern}")
      fi
    done < <(echo "$line" | jq -r '.required_patterns // [] | .[]')

    # Check forbidden patterns (protocol compliance)
    while IFS= read -r pattern; do
      [[ -z "$pattern" ]] && continue
      if echo "$response" | grep -qi "$pattern"; then
        forbidden_pass=false
        fail_reasons+=("protocol: contains forbidden: ${pattern}")
      fi
    done < <(echo "$line" | jq -r '.forbidden_patterns // [] | .[]')

    # Check expected sections (protocol compliance)
    while IFS= read -r section; do
      [[ -z "$section" ]] && continue
      if ! echo "$response" | grep -qi "$section"; then
        section_pass=false
        fail_reasons+=("protocol: missing section: ${section}")
      fi
    done < <(echo "$line" | jq -r '.expected_sections // [] | .[]')

    if $section_pass && $pattern_pass && $forbidden_pass && $length_pass; then
      pass=$((pass + 1))
      echo "    ✅ [${total}] PASS: ${prompt:0:60}..."
    else
      fail=$((fail + 1))
      local reason_str
      reason_str=$(printf '%s; ' "${fail_reasons[@]}")
      errors+=("    ❌ [${total}] FAIL: ${prompt:0:60}... [${reason_str}]")
      echo "${errors[-1]}"
    fi
  done < "$jsonl_file"

  if $DRY_RUN; then
    echo "    Total: ${total} cases (dry run)"
    return
  fi

  echo ""
  echo "  behavior results: ${pass}/${total} passed (${fail} failed)"

  {
    echo "## Behavior tests: ${skill}"
    echo ""
    echo "| Metric | Value |"
    echo "|--------|-------|"
    echo "| Total  | ${total} |"
    echo "| Passed | ${pass} |"
    echo "| Failed | ${fail} |"
    if [[ $total -gt 0 ]]; then
      local rate=$((pass * 100 / total))
      echo "| Rate   | ${rate}% |"
    fi
    echo ""
    if [[ ${#errors[@]} -gt 0 ]]; then
      echo "### Failures"
      for err in "${errors[@]}"; do
        echo "$err"
      done
      echo ""
    fi
  } >> "$CURRENT_REPORT"

  # Expose counts for gate calculation
  GATE_BEH_PASS=$pass
  GATE_BEH_TOTAL=$total
}

run_gates() {
  local skill="$1"

  if $DRY_RUN; then
    return
  fi

  local precision=0
  local recall=0
  local beh_rate=0
  local precision_status="FAIL"
  local recall_status="FAIL"
  local beh_status="FAIL"
  local struct_status="FAIL"
  local struct_detail="not checked"

  # Precision: positive trigger pass rate
  if [[ $GATE_POS_TOTAL -gt 0 ]]; then
    precision=$((GATE_POS_PASS * 100 / GATE_POS_TOTAL))
  fi
  [[ $precision -ge 80 ]] && precision_status="PASS"

  # Recall: negative trigger pass rate (true negative rate)
  if [[ $GATE_NEG_TOTAL -gt 0 ]]; then
    recall=$((GATE_NEG_PASS * 100 / GATE_NEG_TOTAL))
  fi
  [[ $recall -ge 80 ]] && recall_status="PASS"

  # Behavior pass rate
  if [[ $GATE_BEH_TOTAL -gt 0 ]]; then
    beh_rate=$((GATE_BEH_PASS * 100 / GATE_BEH_TOTAL))
  fi
  [[ $beh_rate -ge 80 ]] && beh_status="PASS"

  # Structural validity
  local skill_md="${REPO_ROOT}/${skill}/SKILL.md"
  if [[ -f "$skill_md" ]]; then
    local struct_json
    struct_json=$(python3 "${REPO_ROOT}/scripts/check_skill_structure.py" "$skill_md" 2>/dev/null || true)
    if [[ -n "$struct_json" ]]; then
      local valid score max_score
      valid=$(echo "$struct_json" | jq -r '.valid')
      score=$(echo "$struct_json" | jq -r '.score')
      max_score=$(echo "$struct_json" | jq -r '.max_score')
      struct_detail="${score}/${max_score}"
      [[ "$valid" == "true" ]] && struct_status="PASS"
    else
      struct_detail="checker error"
    fi
  else
    struct_detail="SKILL.md not found"
  fi

  # Overall verdict
  local verdict="PASS"
  if [[ "$precision_status" == "FAIL" ]] || [[ "$recall_status" == "FAIL" ]] || \
     [[ "$beh_status" == "FAIL" ]] || [[ "$struct_status" == "FAIL" ]]; then
    verdict="FAIL"
    OVERALL_FAIL=$((OVERALL_FAIL + 1))
  fi

  # Append gate table
  {
    echo "## Gates"
    echo ""
    echo "| Gate | Status | Detail |"
    echo "|------|--------|--------|"
    echo "| Trigger precision ≥ 80% | ${precision_status} | ${precision}% |"
    echo "| Trigger recall ≥ 80% | ${recall_status} | ${recall}% |"
    echo "| Behavior pass rate ≥ 80% | ${beh_status} | ${beh_rate}% |"
    echo "| Structural validity | ${struct_status} | ${struct_detail} |"
    echo ""
    echo "## Verdict: ${verdict}"
    echo ""
  } >> "$CURRENT_REPORT"

  echo "  Gate verdict: ${verdict}"
}

# Main loop
echo "═══════════════════════════════════════════"
echo "  Meta-Skill Eval Runner"
echo "  Model: ${MODEL}"
echo "  Routing: ${ROUTING_MODE}"
echo "  Mode: $(if $DRY_RUN; then echo 'DRY RUN'; else echo 'LIVE'; fi)"
echo "═══════════════════════════════════════════"
echo ""

for skill in "${TARGETS[@]}"; do
  skill_dir="${REPO_ROOT}/${skill}"

  if [[ ! -d "$skill_dir" ]]; then
    echo "⚠️  Skill not found: ${skill}"
    continue
  fi

  if [[ ! -d "$skill_dir/evals" ]]; then
    echo "⚠️  No evals/ directory: ${skill}"
    continue
  fi

  echo "━━━ ${skill} ━━━"

  # Set up timestamped report file
  CURRENT_REPORT="${RESULTS_DIR}/${skill}-${TIMESTAMP}.md"
  > "$CURRENT_REPORT"
  echo "# Eval Results: ${skill}" >> "$CURRENT_REPORT"
  echo "Date: $(date -Iseconds)" >> "$CURRENT_REPORT"
  echo "Model: ${MODEL}" >> "$CURRENT_REPORT"
  echo "" >> "$CURRENT_REPORT"

  # Reset gate tracking
  GATE_POS_PASS=0; GATE_POS_TOTAL=0
  GATE_NEG_PASS=0; GATE_NEG_TOTAL=0
  GATE_BEH_PASS=0; GATE_BEH_TOTAL=0

  run_trigger_tests "$skill" "$skill_dir/evals/trigger-positive.jsonl" "positive"
  run_trigger_tests "$skill" "$skill_dir/evals/trigger-negative.jsonl" "negative"
  run_behavior_tests "$skill" "$skill_dir/evals/behavior.jsonl"

  run_gates "$skill"

  # Symlink to latest
  ln -sf "${skill}-${TIMESTAMP}.md" "${RESULTS_DIR}/${skill}-eval.md"

  echo ""
  echo "  Results saved: eval-results/${skill}-${TIMESTAMP}.md"
  echo "  (symlinked from eval-results/${skill}-eval.md)"
  echo ""
done

echo "═══════════════════════════════════════════"
echo "  All eval results in: ${RESULTS_DIR}/"
if [[ $OVERALL_FAIL -gt 0 ]]; then
  echo "  ❌ OVERALL: FAIL (${OVERALL_FAIL} skill(s) failed gates)"
else
  echo "  ✅ OVERALL: PASS"
fi
echo "═══════════════════════════════════════════"

# JSON summary output (for run-baseline-comparison.sh and other tooling)
if $JSON_OUTPUT; then
  echo "{"
  echo "  \"timestamp\": \"${TIMESTAMP}\","
  echo "  \"model\": \"${MODEL}\","
  echo "  \"routing_mode\": \"${ROUTING_MODE}\","
  echo "  \"overall\": \"$(if [[ $OVERALL_FAIL -gt 0 ]]; then echo FAIL; else echo PASS; fi)\","
  echo "  \"skills_failed\": ${OVERALL_FAIL},"
  echo "  \"skills_tested\": ${#TARGETS[@]},"
  echo "  \"results_dir\": \"${RESULTS_DIR}\""
  echo "}"
fi

exit $(( OVERALL_FAIL > 0 ? 1 : 0 ))
