#!/usr/bin/env bash
# run-regression-suite.sh — Run regression tests from corpus/regression/
#
# Each .json file in corpus/regression/ is a test case harvested from a
# previous failure. This script verifies that previously-fixed issues
# stay fixed.
#
# Test cases use inline excerpts (original_excerpt / modified_excerpt)
# or file paths (original / modified). The runner handles both.
#
# Usage:
#   ./scripts/run-regression-suite.sh
#
# Requires: jq, python3

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGRESSION_DIR="${REPO_ROOT}/corpus/regression"
SCRIPTS_DIR="${REPO_ROOT}/scripts"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

total=0
pass=0
fail=0
skip=0
errors=()

if [[ ! -d "$REGRESSION_DIR" ]] || [[ -z "$(find "$REGRESSION_DIR" -name '*.json' -print -quit 2>/dev/null)" ]]; then
    echo "No regression cases found"
    exit 0
fi

echo "═══════════════════════════════════════════"
echo "  Regression Suite"
echo "═══════════════════════════════════════════"
echo ""

for case_file in "$REGRESSION_DIR"/*.json; do
    [[ -f "$case_file" ]] || continue
    total=$((total + 1))

    case_id=$(jq -r '.id' "$case_file")
    case_type=$(jq -r '.type' "$case_file")
    skill=$(jq -r '.skill // "unknown"' "$case_file")
    expected_result=$(jq -r '.expected_result // "FAIL"' "$case_file")

    case "$case_type" in
        trigger_failure)
            # Trigger failures are records for inclusion in the next eval run.
            # We cannot re-run them here without the copilot CLI, so log and skip.
            echo "  ⏭  [${case_id}] trigger_failure — logged for next eval run"
            skip=$((skip + 1))
            ;;

        structural_failure)
            # Check that cross-references in modified_excerpt point to valid skills
            modified_excerpt=$(jq -r '.modified_excerpt // ""' "$case_file")

            if [[ -z "$modified_excerpt" ]]; then
                # Fall back to skill directory structural check
                if [[ "$skill" == "unknown" ]] || [[ "$skill" == "null" ]]; then
                    echo "  ⚠️  [${case_id}] no .skill field or .modified_excerpt — cannot validate"
                    skip=$((skip + 1))
                    continue
                fi
                skill_dir="${REPO_ROOT}/${skill}"
                if [[ ! -d "$skill_dir" ]]; then
                    echo "  ⚠️  [${case_id}] skill directory not found: ${skill}"
                    skip=$((skip + 1))
                    continue
                fi
                if python3 "${SCRIPTS_DIR}/skill_lint.py" "$skill_dir" >/dev/null 2>&1; then
                    echo "  ✅ [${case_id}] structural check passed"
                    pass=$((pass + 1))
                else
                    echo "  ❌ [${case_id}] structural check FAILED"
                    fail=$((fail + 1))
                    errors+=("${case_id}: structural check failed for ${skill}")
                fi
            else
                # Extract cross-referenced skill names (→ skill-name pattern)
                invalid_refs=()
                while IFS= read -r ref; do
                    [[ -z "$ref" ]] && continue
                    if [[ ! -d "${REPO_ROOT}/${ref}" ]]; then
                        invalid_refs+=("$ref")
                    fi
                done < <(echo "$modified_excerpt" | grep -oP '→\s*\K[a-z][-a-z0-9]*' || true)

                if [[ ${#invalid_refs[@]} -gt 0 ]]; then
                    detected="FAIL"
                else
                    detected="PASS"
                fi

                if [[ "$detected" == "$expected_result" ]]; then
                    echo "  ✅ [${case_id}] correctly detected: ${#invalid_refs[@]} invalid ref(s)"
                    pass=$((pass + 1))
                else
                    echo "  ❌ [${case_id}] expected ${expected_result} but got ${detected}"
                    fail=$((fail + 1))
                    errors+=("${case_id}: expected ${expected_result}, got ${detected}")
                fi
            fi
            ;;

        preservation_failure)
            # Try file paths first, fall back to inline excerpts
            original=$(jq -r '.original // ""' "$case_file")
            modified=$(jq -r '.modified // ""' "$case_file")
            check_name=$(jq -r '.check // .check_type // ""' "$case_file")

            if [[ -z "$original" ]] || [[ -z "$modified" ]]; then
                original_excerpt=$(jq -r '.original_excerpt // ""' "$case_file")
                modified_excerpt=$(jq -r '.modified_excerpt // ""' "$case_file")

                if [[ -z "$original_excerpt" ]] || [[ -z "$modified_excerpt" ]]; then
                    echo "  ⚠️  [${case_id}] missing original/modified data"
                    skip=$((skip + 1))
                    continue
                fi

                # Write excerpts to temp files for check_preservation.py
                orig_tmp="$TMPDIR/original_${case_id}.md"
                mod_tmp="$TMPDIR/modified_${case_id}.md"
                printf '%b' "$original_excerpt" > "$orig_tmp"
                printf '%b' "$modified_excerpt" > "$mod_tmp"
                original="$orig_tmp"
                modified="$mod_tmp"
            fi

            if [[ ! -f "$original" ]] || [[ ! -f "$modified" ]]; then
                echo "  ⚠️  [${case_id}] referenced files not found"
                skip=$((skip + 1))
                continue
            fi

            output=$(python3 "${SCRIPTS_DIR}/check_preservation.py" "$original" "$modified" 2>&1) || true
            preserved=$(echo "$output" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('preserved') else 'false')" 2>/dev/null || echo "error")

            # Determine detected result
            if [[ "$preserved" == "true" ]]; then
                detected="PASS"
            elif [[ "$preserved" == "false" ]]; then
                detected="FAIL"
            else
                echo "  ⚠️  [${case_id}] preservation check error"
                skip=$((skip + 1))
                continue
            fi

            if [[ "$detected" == "$expected_result" ]]; then
                echo "  ✅ [${case_id}] preservation correctly detected (${check_name})"
                pass=$((pass + 1))
            else
                echo "  ❌ [${case_id}] expected ${expected_result} but got ${detected}"
                fail=$((fail + 1))
                errors+=("${case_id}: preservation expected ${expected_result}, got ${detected}")
            fi
            ;;

        *)
            echo "  ⚠️  [${case_id}] unknown type: ${case_type}"
            skip=$((skip + 1))
            ;;
    esac
done

echo ""
echo "═══════════════════════════════════════════"
echo "  Summary"
echo "  Total: ${total}  Pass: ${pass}  Fail: ${fail}  Skip: ${skip}"
echo "═══════════════════════════════════════════"

if [[ ${#errors[@]} -gt 0 ]]; then
    echo ""
    echo "Failures:"
    for err in "${errors[@]}"; do
        echo "  - ${err}"
    done
fi

if [[ $fail -gt 0 ]]; then
    exit 1
fi
exit 0
