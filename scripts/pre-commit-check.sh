#!/bin/bash
# Pre-commit validation script for Meta-Skill-Engineering
# Run this before committing to catch common errors

set -e

echo "=========================================="
echo "Pre-Commit Validation Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Get repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "📁 Repository: $REPO_ROOT"
echo ""

# 1. Validate skill structure
echo "1️⃣ Validating skill structures..."
if [ -f "./scripts/validate-skills.sh" ]; then
    if ./scripts/validate-skills.sh > /tmp/validate-output.txt 2>&1; then
        echo -e "${GREEN}✓${NC} Skill validation passed"
    else
        echo -e "${YELLOW}⚠${NC} Skill validation warnings:"
        cat /tmp/validate-output.txt
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} validate-skills.sh not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 2. Check eval file syntax
echo "2️⃣ Checking eval file syntax..."
for jsonl in $(find . -name "*.jsonl" -path "*/evals/*" | head -20); do
    if ! python3 -c "import json; [json.loads(l) for l in open('$jsonl')]" 2>/dev/null; then
        echo -e "${RED}✗${NC} Invalid JSONL: $jsonl"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All eval files valid"
fi
echo ""

# 3. Check for deferred-work markers in staged files
echo "3. Checking for deferred-work markers..."
DEFERRED_MARKER="TO""DO"
FIX_MARKER="FIX""ME"
if git diff --cached --name-only | xargs grep -l "$DEFERRED_MARKER\\|$FIX_MARKER" 2>/dev/null; then
    echo -e "${YELLOW}!${NC} Deferred-work markers found in staged files (review before commit)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}OK${NC} No deferred-work markers"
fi
echo ""

# 4. Check for missing SKILL.md
echo "4️⃣ Checking skill packages have SKILL.md..."
for skill_dir in $(ls -d skill-* 2>/dev/null | head -20); do
    if [ ! -f "$skill_dir/SKILL.md" ]; then
        echo -e "${RED}✗${NC} Missing SKILL.md: $skill_dir"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All skill packages have SKILL.md"
fi
echo ""

# 5. Validate manifest.yaml if present
echo "5️⃣ Validating manifest.yaml files..."
for manifest in $(find . -name "manifest.yaml" -path "*/skill-*/*" | head -20); do
    if ! python3 -c "import yaml; yaml.safe_load(open('$manifest'))" 2>/dev/null; then
        echo -e "${RED}✗${NC} Invalid YAML: $manifest"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All manifest files valid"
fi
echo ""

# 6. Check Tauri build surfaces
echo "6. Checking Tauri project..."
if [ -d "src-tauri" ] && command -v npm &> /dev/null && command -v cargo &> /dev/null; then
    if npm run build >/tmp/meta-skill-tauri-web.txt 2>&1 && (cd src-tauri && cargo check >/tmp/meta-skill-tauri-rust.txt 2>&1); then
        echo -e "${GREEN}OK${NC} Tauri project checks passed"
    else
        echo -e "${YELLOW}!${NC} Tauri project check failed"
        cat /tmp/meta-skill-tauri-web.txt /tmp/meta-skill-tauri-rust.txt 2>/dev/null || true
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}!${NC} Skipping Tauri project check (npm, cargo, or src-tauri missing)"
fi
echo ""

# Summary
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) - commit allowed but review recommended${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s), $WARNINGS warning(s) - fix before committing${NC}"
    exit 1
fi
