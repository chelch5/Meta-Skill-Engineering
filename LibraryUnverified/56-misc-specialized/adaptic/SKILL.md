---
name: adaptic
description: >-
  Apply the 5-step synoptic cycle for multi-domain panoramic synthesis when a
  problem spans 3+ domains and cross-domain interactions matter more than depth
  in any single domain. Produces unified emergent understanding through Clear
  (meditate), Open (expand awareness), Perceive (cross-domain patterns),
  Integrate (gestalt formation), and Express (communicated insight). Use when
  sequential analysis produces compromise rather than integration, domain
  experts disagree on fundamentals, or before major architectural decisions with
  multiple stakeholder concerns. Do not use for single-domain problems,
  well-understood trade-offs, or wellness/self-care contexts.
license: MIT
allowed-tools: Read Write Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: synoptic
  complexity: advanced
  language: natural
  tags: synoptic, adaptic, panoramic, synthesis, gestalt, meta-skill
---

# Adaptic

Compose the 5-step synoptic cycle to achieve panoramic synthesis across multiple domains. Where sequential analysis produces compromise ("a little of each"), the synoptic cycle produces integration — a unified understanding that holds all domains simultaneously and finds the emergent whole.

## When to Use

- A problem genuinely spans 3+ domains and the *interactions between domains* matter more than depth in any one
- Sequential analysis (polymath style) has been tried but the synthesis feels like compromise rather than integration
- Existing approaches feel like "a little of each" rather than a unified vision
- Before major architectural decisions affecting multiple stakeholders
- When domain experts disagree and the resolution lies *between* their perspectives, not within any one

## When NOT to Use

- Single-domain problems — use the domain agent directly
- Well-understood trade-offs where polymath-style sequential analysis suffices
- Self-care or wellness contexts — use the tending team instead
- When speed matters more than depth — the full cycle requires sustained attention

## Inputs

- **Required**: The problem or question requiring multi-domain synthesis
- **Optional**: Explicit list of domains to hold (default: auto-detect from problem context)
- **Optional**: Depth setting — `light`, `standard`, or `deep` (default: `standard`)
- **Optional**: Expression form — `narrative`, `diagram`, `table`, or `recommendation` (default: `auto`)

## Configuration

```yaml
settings:
  depth: standard          # light (skip meditate), standard, deep (extended perceive)
  domains: auto            # auto-detect or explicit list
  expression_form: auto    # narrative, diagram, table, recommendation
```

## Procedure

### Step 1: Clear — Empty the Workspace

Apply the `meditate` pattern to clear prior context, assumptions, and single-domain bias.

1. Prepare: Acknowledge current context and set aside recent problem-solving mode
2. Anchor: Establish a neutral, receptive stance toward the problem
3. Observe distractions: Notice if any domain framing or premature solutions are asserting themselves
4. Close: Explicitly release domain bias — state "No domain has priority" before proceeding
5. If `depth: light` is set, abbreviate to a 1-2 sentence context-clearing pause rather than the full meditation

**Quality gate:** State explicitly which domain (if any) you were most recently working in, and confirm you have released that framing.

**Expected:** The workspace is empty. No domain has priority. No solution has been pre-selected. The agent is in a neutral, receptive state ready to hold multiple perspectives simultaneously.

**On failure:**
- **Symptom:** A particular domain keeps asserting itself as "the real problem."
- **Action:** Name that bias explicitly: "I notice I am framing this as primarily a [domain] problem." Naming the bias loosens its grip.
- **Decision rule:** If the same domain re-asserts 3+ times after naming, the problem may genuinely be single-domain — stop and reconsider whether synoptic treatment is needed.
- **Symptom:** You find yourself proposing solutions before completing all 5 steps.
- **Action:** Record the premature solution, set it aside with the note "pre-synoptic proposal — validate after integration," and return to Step 1.4.

### Step 2: Open — Enter Panoramic Mode

Apply the `expand-awareness` pattern to shift from narrow focus to wide-field perception.

1. List all domains relevant to the problem — minimum 3 domains required; do not pre-filter or rank them
2. For each domain, note in 1 sentence: (a) core concerns, (b) key constraints, (c) primary values
3. State explicitly: "I am holding [domain A], [domain B], [domain C] in simultaneous awareness" — listing the domains together confirms panoramic mode is active
4. Resist the pull to "start solving" — this step is purely about opening the field of view; if you catch yourself evaluating trade-offs, you have narrowed focus
5. If domains were provided explicitly in the inputs, use those as the starting set but remain open to discovering 1-2 additional relevant domains

**Quality gate:** You can name 3+ relevant domains without describing any one in depth. You have not yet made any evaluative judgment about which domain matters most.

**Expected:** A panoramic field is open. All relevant domains are held in awareness simultaneously. The agent can sense the full landscape without zooming into any single domain. The feeling is spacious rather than overwhelming.

**On failure:**
- **Symptom:** The domain list feels incomplete or shallow.
- **Action:** Ask explicitly: "What perspective is missing that would change the picture?" If no answer emerges after 2 attempts, proceed with the current set and flag uncertainty in Step 5.
- **Symptom:** Simultaneous awareness collapses into sequential scanning (domain A, then B, then C).
- **Action:** Slow down and restate all domains in a single sentence: "I hold together [A's concerns about X], [B's constraints on Y], and [C's values around Z]." If collapse recurs 2+ times, the domains may be too dissimilar for synoptic treatment.
- **Symptom:** More than 7 domains are active.
- **Action:** Group related domains into 3-5 clusters (e.g., "technical domains," "business domains," "user domains") to reduce cognitive load while maintaining breadth.

### Step 3: Perceive — Notice Cross-Domain Patterns

While maintaining panoramic awareness, apply the `observe` and `awareness` patterns to notice patterns, tensions, and resonances *across* all visible domains.

1. Hold the panoramic field open from Step 2 — do not narrow focus; if you catch yourself analyzing one domain deeply, you have lost panoramic mode
2. Apply `observe` to notice what is actually present across the field:
   - What patterns repeat across 2+ domains?
   - What tensions exist where domains pull in opposite directions?
   - What resonances connect seemingly unrelated concerns?
3. Apply `awareness` to notice what is *not* being seen:
   - Which domains are being subtly ignored?
   - What blind spots exist where the problem is not being addressed?
   - What assumptions are operating below the surface?
4. Record exactly 4 cross-domain observations using these labels:
   - **Tensions** (min. 1): where domains pull in opposite directions — these are the integration points
   - **Resonances** (min. 1): where domains reinforce or echo each other — these are the alignment points
   - **Gaps** (min. 1): where no domain addresses a concern that the whole picture reveals — these are the innovation opportunities
   - **Surprises** (min. 1): where a domain contributes something unexpected to the picture — these are the emergent insights
5. If `depth: deep` is set, extend this step — cycle through observe and awareness 2-3 times, allowing subtler patterns to surface

**Critical discipline:** Perceive across all domains simultaneously, not each domain in turn. The test: your observations should reference 2+ domains in each item (e.g., "Domain A's speed concern creates tension with Domain B's safety requirement"). Sequential perception loses the cross-domain patterns that are the entire point of the synoptic cycle.

**Quality gate:** All 4 observation categories (Tensions, Resonances, Gaps, Surprises) are populated with at least 1 item each. Each item references 2+ domains explicitly.

**Expected:** A rich set of cross-domain observations — tensions, resonances, gaps, and surprises. These observations span the boundaries between domains rather than living within any single one. The agent has noticed something that would not be visible from any single domain's perspective.

**On failure:**
- **Symptom:** Observations are all within single domains ("in domain A, I notice X").
- **Action:** The panoramic field has collapsed. Return to Step 2 and re-open. After 2 failed attempts, the problem may be genuinely decomposable — consider whether sequential domain analysis would suffice.
- **Symptom:** No cross-domain patterns emerge after 2 cycles of observe/awareness.
- **Action:** The problem may not require synoptic treatment — it may be genuinely decomposable into independent domain problems. Document: "No cross-domain tensions detected after 2 perception cycles. Recommendation: treat as independent domain problems."
- **Symptom:** Overwhelming number of observations (15+ items).
- **Action:** Prioritize exactly 3 tensions (they are where integration happens). Set aside other observations for potential inclusion in Step 4 if relevant to tension resolution.

### Step 4: Integrate — Form the Emergent Whole

Apply the `integrate-gestalt` pattern to synthesize cross-domain observations into a unified understanding.

1. Map the tensions identified in Step 3 — list each tension explicitly with the form: "[Domain A's X] vs [Domain B's Y]"
2. Hold tensions as creative constraints — do not resolve them prematurely by averaging or compromise
3. Find the figure: what unified understanding emerges when all observations are held together? This is not a compromise or average — it is a new pattern that includes but transcends the individual domain perspectives
4. Test the whole against 3 criteria:
   - Does the integrated understanding honor each domain's core concerns? (Yes/No for each domain)
   - Does it resolve tensions or merely paper over them? (Resolved/Deferred/Unaddressed for each tension)
   - Can it be stated in one clear sentence? If no, integration is incomplete
5. Name the insight in one clear statement — maximum 2 sentences. If it cannot be stated simply, the integration is not yet complete
6. Verify emergence: state explicitly why this insight could NOT have been reached by analyzing domains sequentially

**Quality gate:** The insight is stated in 1-2 sentences. All domains are explicitly listed as "honored" or with noted exceptions. The emergence test is answered with specific reasoning, not "it just feels integrated."

**Expected:** A single integrated understanding that holds all domains simultaneously. The insight feels like discovery rather than construction — it emerged from the whole rather than being assembled from parts. Each domain's core concerns are honored, and the tensions between domains are resolved rather than compromised.

**On failure:**
- **Symptom:** Integration produces "a little of each domain" rather than a unified whole.
- **Action:** The gestalt has not formed. Return to Step 3 and look for the tensions that are being avoided — integration happens *through* tension, not around it. Specifically, check if you are averaging instead of synthesizing.
- **Symptom:** No gestalt forms after 2 attempts at integration.
- **Action:** Decompose: identify the 2-3 domains with the strongest tensions (from Step 3) and integrate those first, then expand to include remaining domains.
- **Symptom:** The emergence test fails — you cannot explain why sequential analysis would not have sufficed.
- **Action:** The synoptic cycle may not be adding value. Document this finding and recommend whether to proceed with the integrated insight or revert to sequential analysis.

### Step 5: Express — Communicate the Integrated Understanding

Apply the `express-insight` pattern to communicate the synthesis to the intended audience.

1. Assess the audience: what domains are they familiar with? what framing will make the integrated insight accessible? Record in 1-2 sentences.
2. Choose the expression form (or use the one specified in inputs):
   - **Narrative**: for audiences that need to understand the journey from parts to whole — structure as: context → tension → integration → insight
   - **Diagram**: for audiences that need to see structural relationships — use a simple visual showing domain nodes and integration edges
   - **Table**: for audiences that need to compare domain perspectives systematically — columns: Domain | Concern | How Integrated | Status
   - **Recommendation**: for audiences that need an actionable decision — lead with the decision, support with integration evidence
3. Express the integrated understanding with required transparency elements:
   - State which domains contributed (list them)
   - State where tensions were resolved (reference Step 3 tensions)
   - State what the emergent insight adds beyond any single perspective
4. Invite challenge: explicitly note which aspect of the integration is strongest and which is most speculative
5. Final check: the expression should center on the integrated insight from Step 4, with domain details as supporting evidence

**Quality gate:** The expression references the Step 4 insight statement directly. All 3 transparency elements (contributing domains, tension resolution, emergent value) are present. One aspect is flagged as "strongest" and one as "most speculative."

**Expected:** A clear, well-formed expression of the integrated understanding that is accessible to the intended audience. The expression shows its work — the audience can see how domain perspectives contributed to the whole. The form matches the audience's needs.

**On failure:**
- **Symptom:** The expression feels like a list of domain perspectives rather than an integrated whole.
- **Action:** The insight from Step 4 has been lost in translation. Return to the one-statement summary from Step 4 and rebuild the expression outward from that center, ensuring the insight statement appears verbatim in the output.
- **Symptom:** The audience framing is wrong or unclear.
- **Action:** Ask explicitly: "Who needs this output and what decision does it inform?" If no clear audience/decision emerges, default to Narrative form and flag that audience clarification is needed.

## Validation

Use these checkpoints to verify synoptic cycle completion:

### Step Completion Checklist
- [ ] **Step 1 (Clear)**: Explicitly named the most recently active domain and confirmed its bias was released
- [ ] **Step 2 (Open)**: Listed 3+ relevant domains with 1-sentence summaries of (concerns, constraints, values) for each
- [ ] **Step 3 (Perceive)**: Recorded 4 observations (Tensions, Resonances, Gaps, Surprises), each referencing 2+ domains
- [ ] **Step 4 (Integrate)**: Produced a 1-2 sentence insight statement that all domains are listed as "honored"
- [ ] **Step 5 (Express)**: Output contains the Step 4 insight verbatim and all 3 transparency elements (domains, tensions, emergent value)

### Quality Gates
- [ ] **Cross-domain test**: Every observation in Step 3 references at least 2 domains explicitly
- [ ] **Emergence test**: Can explain in 1 sentence why sequential analysis would not have produced this insight
- [ ] **Integration test**: Tensions are listed as "resolved" not "compromised" or "deferred"
- [ ] **Expression test**: The insight statement appears verbatim in the final output, not fragmented across paragraphs
- [ ] **No-regression test**: If asked "what about [domain X's concern]?" the output already addresses it

### Failure Recovery
If any quality gate fails:
1. Identify which step the failure originates from (e.g., cross-domain test fails → Step 3 issue)
2. Return to that step and re-execute with the quality gate criteria in mind
3. After maximum 2 recovery attempts, document the limitation and proceed with partial integration
4. In final output, explicitly note: "Synoptic integration incomplete — [specific domain/tension] remains unresolved"

## Common Pitfalls

- **Sequential masquerading as simultaneous**: Cycling through domains one at a time and then stapling the results together is not synoptic perception. The test: did the cross-domain *interactions* produce something new, or is the output just a concatenation of domain analyses?
- **Premature integration**: Jumping to a synthesis before the panoramic field has fully opened. Steps 2 and 3 build the perceptual foundation that makes genuine integration possible — rushing them produces shallow synthesis.
- **Compromise instead of emergence**: Averaging domain perspectives ("50% security, 50% usability") is compromise, not integration. True integration finds a frame where both concerns are *fully* met, or it honestly names the irreducible trade-off.
- **Overuse on single-domain problems**: Not every problem needs panoramic synthesis. If the problem lives cleanly in one domain, synoptic treatment adds overhead without value. The "When NOT to Use" criteria exist for a reason.
- **Losing the insight in expression**: Step 4 produces a clear gestalt, but Step 5 fragments it back into a domain-by-domain list. Keep the integrated insight as the center of expression; domain details are supporting evidence, not the main structure.
- **Domain inflation**: Artificially expanding the domain count to justify synoptic treatment. Three genuinely relevant domains produce better synthesis than seven domains where four are peripheral.

## Related Skills

- `meditate` — Step 1 of the cycle; clears context and establishes neutral starting state
- `expand-awareness` — Step 2 of the cycle; shifts from narrow focus to panoramic perception
- `observe` — used in Step 3; notices what is present across the field
- `awareness` — used in Step 3; notices what is not being seen, reveals blind spots
- `integrate-gestalt` — Step 4 of the cycle; forms the emergent whole from cross-domain patterns
- `express-insight` — Step 5 of the cycle; communicates the integrated understanding
