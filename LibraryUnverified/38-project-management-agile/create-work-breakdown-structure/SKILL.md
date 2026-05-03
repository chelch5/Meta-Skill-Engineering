---
name: create-work-breakdown-structure
description: |
  Create a Work Breakdown Structure (WBS) and WBS Dictionary from approved project
  charter deliverables. Produces hierarchical work package decomposition with WBS codes,
  effort estimates, dependency mapping, and critical path identification.
  Triggers on: "create WBS", "work breakdown structure", "decompose project scope",
  "define work packages", "WBS dictionary", "estimate project effort".
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: project-management
  complexity: intermediate
  language: multi
  tags: project-management, wbs, work-breakdown-structure, classic, waterfall, planning
---

# Create a Work Breakdown Structure

Decompose project scope into a hierarchical set of work packages that can be estimated, assigned, and tracked. The WBS provides the foundation for effort estimation, resource planning, and schedule development by breaking down complex deliverables into manageable components.

## When to Use

Use this skill when:
- A project charter has been approved with defined scope and deliverables
- Planning a classic/waterfall project requiring hierarchical scope decomposition
- Breaking down a large initiative (>2 weeks duration or >3 team members) into manageable work packages
- Establishing basis for effort estimation, resource planning, and critical path analysis
- Creating shared understanding of all required work for stakeholder alignment

## When NOT to Use

Do not use this skill when:
- Planning a pure agile/Scrum project using only user stories and epics (use `manage-backlog` instead)
- The project charter is not yet approved or scope is undefined (use `draft-project-charter` first)
- Creating a simple task list for work under 1 week duration (use basic task breakdown)
- Requirements are changing daily and scope is exploratory (use adaptive planning methods)

## Inputs

Required:
- Approved project charter with explicit scope and deliverables sections (path or content)
- Project methodology: classic/waterfall or hybrid approach using WBS for planning phase

Optional:
- Historical effort data from similar projects for estimation calibration
- Team composition and available skills for assignment feasibility
- Organizational WBS templates or standards to follow
- Project constraints (budget, timeline, quality) that affect decomposition depth

If charter is not available, exit and request: "Please provide the approved project charter or run `draft-project-charter` first."

## Procedure

### Step 1: Extract Deliverables from Charter

**Action:** Read the project charter using available tools (Read or file access).

**Procedure:**
1. Identify all deliverables listed in the charter scope section
2. Extract acceptance criteria for each deliverable
3. Group related deliverables into 3-7 logical categories
4. These categories become your WBS Level 1 elements
5. Record the document ID format: `WBS-[PROJECT]-[YYYY]-[NNN]`

**Expected Output:**
- List of 3-7 Level 1 WBS elements matching charter deliverables
- Document ID established
- Deliverable-to-category mapping documented

**Failure Handling:**
- **If charter lacks clear deliverables:** Exit with message: "Charter scope section incomplete. Run `draft-project-charter --refine-scope` to add specific deliverables before creating WBS."
- **If charter has >10 distinct deliverables:** Group into 5-7 categories or suggest sub-project split

### Step 2: Decompose into Work Packages

**Action:** Create hierarchical decomposition using Write tool to produce WBS.md file.

**Procedure:**
1. For each Level 1 element, decompose into sub-elements (Level 2, Level 3+)
2. Apply the 100% rule: child elements must represent 100% of the parent's scope
3. Stop decomposing when work packages meet all three criteria:
   - Estimable: effort can be assigned in person-hours or days
   - Assignable: one person or cohesive team owns it
   - Measurable: clear done/not-done criteria exists
4. Apply WBS numeric coding (1.1.1, 1.1.2 format)
5. Maintain 3-5 levels maximum depth
6. Always include "Project Management" branch (planning, monitoring, closure)

**File Output - WBS.md:**
```markdown
# Work Breakdown Structure: [Project Name]
## Document ID: WBS-[PROJECT]-[YYYY]-[NNN]
## Created: [Date]
## Version: 1.0

### WBS Hierarchy

1. [Level 1: Deliverable Category A]
   1.1 [Level 2: Sub-deliverable]
      1.1.1 [Level 3: Work Package]
      1.1.2 [Level 3: Work Package]
   1.2 [Level 2: Sub-deliverable]
      1.2.1 [Level 3: Work Package]
2. [Level 1: Deliverable Category B]
   2.1 [Level 2: Sub-deliverable]
      2.1.1 [Level 3: Work Package]
3. [Level 1: Project Management]
   3.1 Planning
   3.2 Monitoring & Control
   3.3 Closure

---
## Decomposition Notes
- Total work packages: [count]
- Decomposition depth: [max levels]
- 100% rule verification: [pass/fail]
```

**Expected Output:**
- WBS.md file created with 15-50 work packages
- Every work package has unique WBS code
- All leaf nodes meet estimable/assignable/measurable criteria

**Failure Handling:**
- **If decomposition exceeds 5 levels:** Exit with message: "Scope too granular at level [X]. Consolidate or split into sub-projects. Review work packages deeper than level 5."
- **If <10 total work packages:** Suggest deeper decomposition: "Consider decomposing [specific categories] further to reach estimable work packages"
- **If "Project Management" branch missing:** Add it with sub-elements for planning, monitoring, reporting, closure

### Step 3: Write WBS Dictionary

**Action:** Create WBS-DICTIONARY.md file with Write tool containing entry for every leaf-node work package.

**Procedure:**
1. Identify all leaf nodes from WBS.md (nodes with no children)
2. For each leaf node, document:
   - **Description**: What deliverable/artifact this work package produces (noun phrase)
   - **Acceptance Criteria**: Specific, measurable verification criteria (3-5 bullet points)
   - **Responsible**: Named role or team assignment
   - **Estimated Effort**: Numeric estimate with unit (person-hours, person-days, or t-shirt size)
   - **Dependencies**: Specific WBS codes this package requires as input (or "None")
   - **Assumptions**: Constraints or prerequisites (2-3 items maximum)

**File Output - WBS-DICTIONARY.md:**
```markdown
# WBS Dictionary: [Project Name]
## Document ID: WBS-DICT-[PROJECT]-[YYYY]-[NNN]
## Created: [Date]
## Version: 1.0
## Total Entries: [count]

### WBS 1.1.1: [Work Package Name]
| Field | Value |
|-------|-------|
| **Description** | [What this produces] |
| **Acceptance Criteria** | 1. [Criterion 1] \n 2. [Criterion 2] |
| **Responsible** | [Role/Team] |
| **Estimated Effort** | [X person-days / T-shirt size] |
| **Dependencies** | [WBS codes or "None"] |
| **Assumptions** | [Key assumptions] |

### WBS 1.1.2: [Work Package Name]
...

---
## Dictionary Summary
- Total entries: [count]
- All leaf nodes documented: [yes/no]
- Entries with effort estimates: [count/%]
```

**Expected Output:**
- WBS-DICTIONARY.md file with entry for every leaf-node work package
- Every entry has non-empty Description and Acceptance Criteria
- Documented effort estimates for 100% of entries

**Failure Handling:**
- **If leaf nodes lack clear acceptance criteria:** Flag for refinement: "WBS [code] missing measurable acceptance criteria. Add 2-3 specific verification points."
- **If dictionary entries < leaf nodes in WBS:** Identify missing entries with list and request completion before proceeding

### Step 4: Estimate Effort

**Action:** Update WBS-DICTIONARY.md with effort estimates; create EFFORT-SUMMARY.md.

**Procedure:**
1. Select estimation method based on project phase and available data:
   - **T-shirt sizing** (XS=1-2d, S=3-5d, M=1-2w, L=2-4w, XL=1-2mo): Early planning, high uncertainty
   - **Person-days**: Detailed planning, known scope, historical data available
   - **Three-point estimate** (optimistic/most likely/pessimistic): High uncertainty, risk-averse planning
2. Assign estimate and confidence level (High/Medium/Low) to each work package
3. Calculate total effort by summing all estimates
4. Note estimation assumptions and constraints

**File Output - EFFORT-SUMMARY.md:**
```markdown
# Effort Summary: [Project Name]
## Document ID: WBS-EFFORT-[PROJECT]-[YYYY]-[NNN]
## Estimation Method: [t-shirt/person-days/three-point]
## Total Effort: [X person-days / range]

| WBS Code | Work Package | Estimate | Method | Confidence | Notes |
|----------|-------------|----------|--------|------------|-------|
| 1.1.1 | [Name] | 5 pd | person-days | High | [Notes] |
| 1.1.2 | [Name] | M | t-shirt | Medium | [Notes] |
| 1.2.1 | [Name] | 3/5/8 pd | three-point | Low | Uncertain requirements |

## Summary Statistics
- Total work packages: [count]
- Packages with High confidence: [count] ([%])
- Packages with Medium confidence: [count] ([%])
- Packages with Low confidence: [count] ([%])
- Estimation basis: [historical data / expert judgment / analogous estimation]
```

**Expected Output:**
- Every work package in dictionary has effort estimate with stated confidence
- EFFORT-SUMMARY.md with totals and confidence distribution
- Method documented and consistent within categories

**Failure Handling:**
- **If >30% of packages have Low confidence:** Create REFINEMENT-NEEDED.md listing high-uncertainty packages and recommend SME review session
- **If estimation method varies within a category:** Standardize method per Level 1 branch (e.g., all 1.x use person-days)
- **If total effort exceeds charter constraints:** Flag for scope review: "Total effort [X] exceeds charter budget/timeline. Review scope or add contingency."

### Step 5: Identify Dependencies and Critical Path Candidates

**Action:** Create DEPENDENCIES.md mapping all inter-work-package relationships and identifying critical path.

**Procedure:**
1. For each work package, identify predecessor work packages using dependency types:
   - **Finish-to-Start (FS)**: Predecessor must finish before successor starts (most common)
   - **Start-to-Start (SS)**: Predecessor must start before successor starts
   - **Finish-to-Finish (FF)**: Predecessor must finish before successor finishes
   - **Start-to-Finish (SF)**: Predecessor must start before successor finishes (rare)
2. Document the nature of each dependency (deliverable handoff, shared resource, etc.)
3. Identify the longest chain of dependent work packages by effort sum
4. This chain represents the critical path candidate (zero float path)

**File Output - DEPENDENCIES.md:**
```markdown
# Dependencies and Critical Path: [Project Name]
## Document ID: WBS-DEPS-[PROJECT]-[YYYY]-[NNN]

## Dependency Table
| WBS Code | Work Package | Depends On | Type | Reason |
|----------|-------------|------------|------|--------|
| 1.2.1 | [Name] | 1.1.1 | Finish-to-Start | Output of 1.1.1 is required input |
| 2.1.1 | [Name] | 1.1.2, 1.2.1 | Finish-to-Start | Multiple prerequisites |

## Critical Path Candidate
**Path**: [WBS codes in sequence, e.g., 1.1.1 → 1.1.2 → 1.2.1 → 2.1.1]
**Total Effort**: [sum of estimates on path]
**Percentage of Total**: [% of project effort]
**Risk**: Any delay on this path delays project completion

## Dependency Network Notes
- Total dependencies mapped: [count]
- Cross-branch dependencies: [count]
- High-risk dependencies: [list any external or uncertain dependencies]
```

**Expected Output:**
- DEPENDENCIES.md with complete dependency table
- Critical path identified with total effort calculation
- No circular dependencies detected

**Failure Handling:**
- **If circular dependency detected:** Exit with error: "Circular dependency detected: [cycle description]. Review WBS decomposition in Step 2 to eliminate cycle."
- **If critical path >80% of total effort:** Flag: "Critical path dominates schedule. Consider parallel work or risk mitigation."
- **If no dependencies identified:** Verify: "All work packages truly independent? Confirm for large projects or add external dependencies."

### Step 6: Review and Baseline

**Action:** Perform final validation, create REVIEW-CHECKLIST.md, and prepare for stakeholder sign-off.

**Procedure:**
1. Verify 100% rule at every WBS level: sum of children scope = parent scope
2. Cross-check all leaf nodes have dictionary entries with complete fields
3. Validate effort estimates cover 100% of work packages
4. Confirm dependency network has no cycles and critical path identified
5. Ensure Project Management branch included with reasonable effort allocation (typically 10-20%)
6. Check WBS depth does not exceed 5 levels anywhere
7. Create review package for stakeholder approval

**File Output - REVIEW-CHECKLIST.md:**
```markdown
# WBS Review Checklist: [Project Name]
## Document ID: WBS-REVIEW-[PROJECT]-[YYYY]-[NNN]
## Review Date: [Date]

### Structural Validation
- [ ] WBS.md file exists with proper document ID
- [ ] 3-7 Level 1 elements defined matching charter scope
- [ ] 100% rule verified at all levels (children fully represent parent)
- [ ] WBS depth ≤5 levels throughout hierarchy
- [ ] All WBS codes unique and follow 1.1.1 format

### Content Validation
- [ ] WBS-DICTIONARY.md exists with entry for every leaf node
- [ ] Every dictionary entry has Description and Acceptance Criteria
- [ ] All work packages have effort estimates in dictionary
- [ ] EFFORT-SUMMARY.md created with total effort calculation
- [ ] DEPENDENCIES.md created with dependency table
- [ ] Critical path identified and documented
- [ ] Project Management branch included (planning, monitoring, closure)

### Sign-off Status
- [ ] Technical review completed
- [ ] Stakeholder review completed
- [ ] Baseline approved: [date]
- [ ] Version locked for execution

## Review Notes
[Document any findings, required changes, or stakeholder feedback]
```

**Expected Output:**
- All 4 deliverable files created: WBS.md, WBS-DICTIONARY.md, EFFORT-SUMMARY.md, DEPENDENCIES.md
- REVIEW-CHECKLIST.md with all items validated
- Package ready for stakeholder sign-off

**Failure Handling:**
- **If 100% rule violations found:** List specific violations: "Level [X].[Y] children do not fully represent parent scope. Missing: [description]."
- **If stakeholder identifies missing scope:** Create CHANGE-LOG.md tracking additions, update affected estimates and dependencies
- **If Project Management effort <5% or >25%:** Flag for review: "PM effort at [X]% appears outside normal range. Verify planning, reporting, and closure scope."

## Output Contract

### Deliverable Files
1. **WBS.md** — Hierarchical decomposition with WBS codes and structure
2. **WBS-DICTIONARY.md** — Definition of done for every leaf-node work package
3. **EFFORT-SUMMARY.md** — Estimates, confidence levels, and total effort
4. **DEPENDENCIES.md** — Dependency table and critical path analysis
5. **REVIEW-CHECKLIST.md** — Validation checklist and sign-off status

### Quality Gates (All Must Pass)
| Gate | Criterion | Verification Method |
|------|-----------|---------------------|
| Structure | 3-7 Level 1 elements, depth ≤5 levels | Visual inspection of WBS.md |
| Completeness | 100% rule at every level | Parent scope = sum of children scope |
| Dictionary | Every leaf node has entry | Count entries = count leaf nodes |
| Estimation | 100% of packages have estimates | Review EFFORT-SUMMARY.md |
| Dependencies | No circular references, critical path identified | Trace dependency chains in DEPENDENCIES.md |
| PM Work | Project Management branch with 10-20% effort | Check WBS branch and EFFORT-SUMMARY |

### Success Criteria
- WBS package is ready for resource planning and schedule development
- Stakeholders can trace any scope item to its work package and acceptance criteria
- Critical path provides early warning for schedule risk
- 80%+ of effort estimates have High or Medium confidence

## Failure Handling

### Charter Issues
| Symptom | Cause | Response |
|---------|-------|----------|
| Vague deliverables | Charter scope incomplete | Exit and request charter refinement via `draft-project-charter` |
| >10 distinct deliverables | Scope too broad for single WBS | Suggest sub-project split or major category consolidation |

### Decomposition Issues
| Symptom | Cause | Response |
|---------|-------|----------|
| Depth exceeds 5 levels | Scope too granular | Consolidate sub-elements or split into sub-projects |
| <10 total work packages | Decomposition too shallow | Decompose Level 1 elements further until estimable |
| Missing Project Management branch | PM work not recognized | Add 3.0 branch with planning, monitoring, closure |
| 100% rule violations | Scope gaps or overlaps | List specific violations and request correction |

### Dictionary Issues
| Symptom | Cause | Response |
|---------|-------|----------|
| Entries < leaf nodes | Incomplete documentation | Identify missing entries and complete before proceeding |
| Missing acceptance criteria | Definition of done unclear | Add 2-3 specific, measurable verification criteria |

### Estimation Issues
| Symptom | Cause | Response |
|---------|-------|----------|
| >30% Low confidence | High uncertainty | Create refinement list and recommend SME session |
| Total effort exceeds constraints | Scope/estimation mismatch | Flag for scope review or add contingency |
| PM effort outside 10-20% | PM scope misestimated | Verify planning, reporting, and closure scope |

### Dependency Issues
| Symptom | Cause | Response |
|---------|-------|----------|
| Circular dependencies | Decomposition errors | Exit with cycle description; revisit Step 2 |
| Critical path >80% of total | Sequential dependency chain | Flag for schedule risk; suggest parallel work |

## Common Pitfalls

| Pitfall | Prevention |
|---------|------------|
| **Confusing deliverables with activities** | WBS elements are nouns (deliverables), not verbs. Use "User Authentication Module" not "Implement Authentication". |
| **Violating the 100% rule** | At every level, verify children scope sums to parent scope. Document any exclusions explicitly. |
| **Too shallow or too deep** | Target 3-5 levels. 2 levels is too vague; 6+ is micromanagement. |
| **Skipping Project Management branch** | PM work is real effort. Include planning, monitoring, and closure activities. |
| **Estimating before decomposing** | Estimate at work package level (leaf nodes), not categories. Level 1 estimates are unreliable. |
| **No dictionary** | Dictionary provides definition of done. Without it, WBS is just labels. |
| **Missing critical path** | Dependencies drive schedule. Map them to identify the longest path and schedule risk.

## Next Steps

### Upstream (Prerequisites)
| Skill | Transition Condition |
|-------|---------------------|
| `draft-project-charter` | Use when charter is vague or scope undefined |

### Downstream (Consumers)
| Skill | Transition Condition |
|-------|---------------------|
| `manage-backlog` | After WBS baseline, translate work packages to backlog items for Agile tracking |
| `generate-status-report` | Report progress as WBS % complete during execution |
| `plan-sprint` | For hybrid approach, plan sprints using WBS work packages as input |
| `conduct-retrospective` | Post-delivery, review estimation accuracy and decomposition quality |
