---
name: build-tcg-deck
description: >
  Build a competitive or casual trading card game deck from scratch. Use when the
  user explicitly asks to create, build, or construct a TCG deck, wants a deck
  list for Pokemon TCG/MTG/FaB, or needs help with archetype selection and card
  choices. Covers archetype selection, mana/energy curve analysis, win condition
  identification, meta-game positioning, and sideboard construction for Pokemon
  TCG, Magic: The Gathering, Flesh and Blood, and other major TCGs.

  Do NOT use for: card condition grading (use grade-tcg-card), collection
  inventory management (use manage-tcg-collection), rules questions, price
  checking, or explaining how a specific existing deck works without building it.
license: MIT
allowed-tools: Read Grep Glob WebFetch WebSearch
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: tcg
  complexity: intermediate
  language: natural
  tags: tcg, deck-building, pokemon, mtg, fab, strategy, meta, archetype
---

# Build TCG Deck

Construct a trading card game deck from archetype selection through final optimization, following a structured process that works across Pokemon TCG, Magic: The Gathering, Flesh and Blood, and other major TCGs.

## When to Use

Trigger this skill when the user explicitly requests:
- "Build me a [game] deck" or "Create a deck for [format]"
- "I need a deck list for [archetype/strategy]"
- "Help me construct a competitive deck"
- "What cards should I put in my [archetype] deck?"
- "Optimize my deck list" or "Improve this deck"

## When NOT to Use

Do NOT trigger this skill for:
- Card condition assessment or grading (use `grade-tcg-card` instead)
- Collection inventory tracking or management (use `manage-tcg-collection` instead)
- Rules questions about specific card interactions
- Price checking or market value inquiries
- Explaining how an existing tier deck works without modifying/building it
- Sideboard advice in isolation without main deck context
- Deck critique without the user asking for construction help

## Inputs

- **Required**: Card game (Pokemon TCG, MTG, FaB, etc.)
- **Required**: Format (Standard, Expanded, Modern, Legacy, Blitz, etc.)
- **Required**: Goal (competitive tournament, casual play, budget build)
- **Optional**: Preferred archetype or strategy (aggro, control, combo, midrange)
- **Optional**: Budget constraints (maximum spend, cards already owned)
- **Optional**: Current meta-game snapshot (top decks, expected field)

## Procedure

### Step 1: Define the Archetype

Choose the deck's strategic identity. Gather missing inputs through direct user questions if not provided.

1. Confirm required inputs by asking the user if not provided:
   - "What TCG are you building for?"
   - "What format (Standard, Expanded, Modern, etc.)?"
   - "Is this for competitive play, casual, or budget?"

2. Identify available archetypes in the current format by researching recent tournament results:
   - Use WebSearch to find "[game] [format] tier list" or "[game] [format] meta [current month/year]"
   - Document the top 5 archetypes with brief descriptions

3. Select an archetype based on:
   - Player preference and playstyle (ask: "Do you prefer aggressive, controlling, or combo strategies?")
   - Meta-game positioning (what beats the top 3 most played decks?)
   - Budget constraints (combo decks often need specific expensive cards)
   - Format legality (check ban lists and rotation status via WebSearch if needed)

4. Identify 1-2 primary win conditions by answering:
   - What specific game state ends the game in the deck's favor?
   - What is the earliest realistic turn the win condition can be achieved?
   - What cards are essential for the win condition to function?

5. State the archetype selection and win condition in this format:
   - Archetype: [Aggro/Control/Combo/Midrange/Tempo]
   - Win Condition: [Specific description of how the deck wins]
   - Key Cards: [2-4 cards that enable the win condition]

**Expected:** A clear archetype with defined win conditions stated in the specified format. The strategy is specific enough to guide card selection.

**On failure:**
- If the user is unsure about archetype preference, present the top 3 meta archetypes with one-sentence summaries and ask them to pick
- If the format is unclear, search for current rotation/ban list and present the most common competitive format
- If no archetype feels right after research, identify the 3 strongest individual cards legal in the format and build around those as "good stuff" midrange

### Step 2: Build the Core

Select the cards that define the deck's strategy using search tools to identify current staples.

1. Research the core engine cards:
   - Use WebSearch to find "[archetype] [game] [format] deck list" and "[key card name] deck [current year]"
   - Identify 12-20 cards that directly enable the win condition
   - List maximum legal copies of each core card (typically 3-4 copies per card depending on game rules)
   - Verify each core card is legal in the specified format via search or card database

2. Add support cards (8-15 cards) by searching for:
   - Card draw, search, or tutor effects that find core pieces
   - Protection effects (counters, shields, prevention)
   - Setup cards that accelerate the win condition
   - Filter effects (cards that dig through the deck)

3. Add interaction cards (8-12 cards):
   - Search for "[format] removal" and "[format] disruption" for the specific game
   - Include answers to common threats in the current meta
   - Balance between proactive disruption and reactive answers based on archetype

4. Fill the resource base based on game:
   - **MTG**: Use WebSearch to find "[archetype] land count [format]" or use 24-26 lands for 60-card decks
   - **Pokemon**: Research energy requirements for key attackers; typically 8-12 basic energy + 2-4 special energy
   - **FaB**: Balance pitch values (aim for 20-25 red, 15-20 yellow, 10-15 blue in 60-card deck)

5. Format the deck list as:
   ```
   CORE ENGINE (X cards):
   - Card Name x[quantity]
   - ...

   SUPPORT (X cards):
   - Card Name x[quantity]
   - ...

   INTERACTION (X cards):
   - Card Name x[quantity]
   - ...

   RESOURCES (X cards):
   - Card Name x[quantity]
   - ...
   ```

**Expected:** A complete deck list organized by function, at or near minimum deck size. Each section lists card names with quantities. The total card count is clearly stated.

**On failure:**
- If the deck exceeds minimum deck size by >5 cards: Identify the 5 lowest-impact support cards and remove them
- If the core engine requires >25 cards: Consolidate by keeping only cards that appear in 70%+ of online deck lists found in search
- If a key card is banned/illegal: Search for "[card name] replacement [format]" and substitute with the most commonly suggested alternative
- If budget constraints are violated: Search for "budget [archetype] [game]" and replace expensive cards with budget alternatives

### Step 3: Analyze the Curve

Verify the deck's resource distribution supports its strategy with quantitative analysis.

1. Calculate and display the **cost curve breakdown**:
   - Count cards at each cost point (0, 1, 2, 3, 4, 5+)
   - Present as a simple text histogram or list
   - Example format: "Cost 0: 4 cards | Cost 1: 12 cards | Cost 2: 16 cards..."

2. Validate curve against archetype targets:
   - **Aggro**: 40%+ of non-resource cards should cost 1-2; <10% should cost 5+
   - **Midrange**: Peak at costs 2-3 (30-35% of non-resource cards); 15-20% at 4-5
   - **Control**: Flat distribution with 25% at 1-2, 25% at 3-4, 20% at 5+
   - **Combo**: 50%+ of cards at the combo's key cost points (typically 2-4)

3. Analyze resource distribution by game:
   - **MTG**: Calculate color pie (count mana symbols on cards; land count should match color intensity)
   - **Pokemon**: Count energy requirements per type; ensure energy base covers highest-cost attack
   - **FaB**: Count pitch values; verify hero's weapon requirements are met

4. Check card type ratios:
   - Non-resource cards should break down approximately:
     - Creatures/Attackers: 40-50%
     - Spells/Trainers/Actions: 30-40%
     - Other: 10-20%

5. Identify curve problems by flagging:
   - Costs with 0 cards (potential gaps)
   - Costs with >30% of non-resource cards (potential clumping)
   - Any 5+ cost cards in an aggro deck
   - <15% early plays (cost 1-2) in any archetype

**Expected:** A curve analysis showing the distribution at each cost point, identified deviations from archetype targets, and a clear statement of whether the curve supports the strategy.

**On failure:**
- If curve peaks at wrong cost for archetype: Replace cards at the wrong cost with cheaper/more expensive alternatives from the same functional category
- If color/resource requirements exceed base capacity: Add more resources of the strained type, or replace the most color-intensive card with a single-color alternative
- If gaps exist at critical costs (no 2-drops in midrange): Search "[format] best 2-drop [game]" and add 2-3 cards from results
- If too many high-cost cards: Cut 5+ cost cards down to 1-2 copies or replace with lower-cost alternatives that serve similar functions

### Step 4: Meta-Game Positioning

Evaluate the deck against the expected field using current tournament data.

1. Research the current meta:
   - Search for "[game] [format] meta [current month year]" or "[game] [format] tier list [current season]"
   - Identify the top 5 most played decks with their approximate meta share percentages
   - Note the dominant archetype of each (aggro, control, combo, etc.)

2. Evaluate matchups systematically:
   - For each of the top 5 decks, assess: Is it favorable (+1), even (0), or unfavorable (-1)?
   - Document the reasoning in one sentence per matchup (e.g., "Aggro loses to our early removal suite")
   - If unsure about a matchup, search "[your archetype] vs [their archetype] [game] [format]"

3. Calculate weighted positioning:
   - Multiply each matchup score by the opponent's meta share percentage
   - Sum to get expected win rate against the field
   - Format: "Expected win rate: X% (calculated from weighted matchups)"

4. Present matchup analysis as:
   ```
   META POSITIONING ANALYSIS:
   Deck 1 (XX% of meta): [Favorable/Even/Unfavorable] - [reason]
   Deck 2 (XX% of meta): [Favorable/Even/Unfavorable] - [reason]
   ...
   Expected win rate: XX%
   Positioning: [Strong/Moderate/Weak]
   ```

5. If positioning is poor (<55% expected win rate):
   - Identify the 2 worst matchups
   - Search for "[archetype] sideboard [opposing deck]" or "[archetype] tech cards vs [strategy]"
   - Flag interaction slots that could be swapped to improve these matchups

**Expected:** A formatted matchup table showing the top 5 decks, their meta share, matchup assessment with reasoning, calculated expected win rate, and positioning verdict.

**On failure:**
- If current meta data is unavailable: State "Meta data unavailable — building for versatility" and ensure the interaction package includes at least 2 cards effective against each major archetype (aggro, control, combo)
- If the deck shows <50% expected win rate against top 5: Recommend a different archetype or major strategy pivot, explaining which 2-3 cards to swap first
- If specific matchup data can't be found: Use archetype-level analysis (e.g., "Aggro generally beats Combo, loses to Control") and note this is theoretical

### Step 5: Build the Sideboard

Construct sideboard/side deck for format-specific adaptation if the format supports it.

1. First, verify the format supports sideboards:
   - **MTG**: 15-card sideboard allowed (most Constructed formats)
   - **Pokemon TCG**: No sideboard in most formats — skip this step
   - **FaB**: Sideboard size varies by format — search "[format] sideboard rules"
   - If sideboard not applicable: State "[Format] does not use sideboards — proceeding to validation"

2. For each unfavorable matchup identified in Step 4:
   - Search for "[your archetype] sideboard guide [opposing archetype] [game]"
   - Identify 2-4 cards that specifically counter that strategy
   - Prioritize cards that:
     - Directly answer the opponent's key cards
     - Can be cast through the opponent's disruption
     - Don't require significant curve adjustments

3. Format the sideboard with explicit swap instructions:
   ```
   SIDEBOARD (X cards):
   Card Name x[quantity]
     - Against: [List specific matchups]
     - Replaces: [Card(s) from main deck]
     - Reason: [Why this improves the matchup]
   ```

4. Verify each sideboard card meets efficiency criteria:
   - Covers at least 2 different matchups, OR
   - Is so critical to one matchup that it single-handedly flips it from unfavorable to favorable
   - Does not increase the deck's average converted mana cost by >0.5 when boarded in

5. Count and validate:
   - Total sideboard cards ≤ format limit
   - Every card has documented "Against" and "Replaces" fields
   - At least one card addresses each unfavorable matchup from Step 4

**Expected:** A formatted sideboard list with each card showing: quantity, applicable matchups, specific main deck cards it replaces, and reasoning. Total count within format limits.

**On failure:**
- If sideboard exceeds format limit: Remove the card with the narrowest matchup coverage first
- If a sideboard card only addresses one fringe deck: Replace it with a card that covers that deck plus another matchup
- If sideboard can't address an unfavorable matchup: Flag this as a deck strategy issue, not a sideboard issue — recommend 2-3 main deck swaps to improve that matchup instead
- If no sideboard guides or data available: Build a "generic" sideboard with 2-3 anti-aggro cards, 2-3 anti-control cards, and 2-3 versatile interaction pieces

## Validation Checklist

Validate the completed deck before presenting to the user:

1. **Archetype Clarity**
   - [ ] Archetype is stated explicitly (Aggro/Control/Combo/Midrange/Tempo)
   - [ ] Win condition is described in one clear sentence
   - [ ] 2-4 key enabling cards are identified

2. **Format Legality**
   - [ ] Card count is at or above minimum, at or below maximum for the format
   - [ ] No cards on the format's ban list (verify via search if uncertain)
   - [ ] All cards are legal in the specified format (rotation status checked)

3. **Card Role Definition**
   - [ ] Each card is tagged as Core, Support, Interaction, or Resource
   - [ ] No card lacks a clear functional role
   - [ ] Core cards are at maximum legal copies

4. **Curve Validation**
   - [ ] Cost distribution histogram is provided
   - [ ] Archetype targets are met (see Step 3 thresholds)
   - [ ] No critical gaps (0 cards at a key cost) exist

5. **Resource Adequacy**
   - [ ] Resource count is within format norms (MTG: 24-26 lands; Pokemon: 8-12 energy; FaB: pitch balance)
   - [ ] Color/type requirements can be met by the resource base
   - [ ] Highest-cost card can be played consistently by the resource base

6. **Meta Positioning**
   - [ ] Top 5 meta decks are identified with sources
   - [ ] Matchup assessments include reasoning
   - [ ] Expected win rate is calculated and stated

7. **Sideboard Completeness** (if applicable)
   - [ ] Sideboard size is within format limits
   - [ ] Each sideboard card has documented "Against" matchups
   - [ ] Each sideboard card has documented "Replaces" main deck cards
   - [ ] Each unfavorable matchup from Step 4 is addressed

8. **Budget Compliance** (if applicable)
   - [ ] Deck cost is within user-specified budget
   - [ ] If over budget, budget alternatives are suggested

**Validation Failure Protocol:**
If any checklist item fails:
- State which item failed and why
- Either fix the issue and re-validate, OR
- Present the deck with the failure clearly noted and explain the limitation to the user

## Common Pitfalls

Avoid these construction errors:

1. **Too Many Win Conditions**: A deck with 3+ distinct win conditions usually does none well. If more than 2 win conditions are identified, consolidate by removing the least consistent one and its supporting cards.

2. **Curve Blindness**: Adding powerful 5+ cost cards to an aggro deck, or too many 1-drops to control. If the curve analysis shows >10% deviation from archetype targets, flag this and propose specific swaps.

3. **Ignoring the Meta**: Building without checking the top 5 decks. If meta data is unavailable, state this explicitly and build for versatility with broad interaction.

4. **Emotional Card Inclusion**: Keeping "pet" cards that don't serve the strategy. When reviewing the deck, ask for each card: "Does this directly advance the win condition, protect it, or enable it?" If no, remove it.

5. **Sideboard Afterthought**: Filling sideboard with "leftover" cards. Each sideboard slot must have documented matchups and swap targets. If any sideboard card lacks this documentation, it must be removed or documented.

6. **Over-Teching**: Including >4 cards that only answer specific narrow strategies. If the interaction section contains narrow answers, replace half with broader interaction or main deck threats.

7. **Resource Mismatch**: Resource count that doesn't match archetype speed. Aggro decks with <20 lands in MTG, or control with >25, should be flagged immediately.

## Output Contract

The final output must include:

1. **Deck Summary** (at the top):
   - Game, Format, Archetype stated clearly
   - Win condition described in one sentence
   - Total card count and positioning statement ("This deck is well-positioned against aggro but struggles against combo")

2. **Deck List** formatted as:
   ```
   CORE ENGINE (X cards):
   - Card Name x[quantity]

   SUPPORT (X cards):
   - Card Name x[quantity]

   INTERACTION (X cards):
   - Card Name x[quantity]

   RESOURCES (X cards):
   - Card Name x[quantity]
   ```

3. **Curve Analysis**:
   - Text histogram showing card count at each cost
   - Statement of whether curve supports archetype

4. **Meta Positioning**:
   - List of top 5 meta decks with matchup assessments
   - Expected win rate calculation

5. **Sideboard** (if applicable):
   - Formatted list with "Against" and "Replaces" for each card

6. **Validation Note**:
   - Statement: "This deck has been validated against the checklist in this skill"
   - Or, if validation failed: "Validation note: [specific item failed] — [explanation]"

7. **Next Steps** (brief):
   - 1-2 sentences suggesting how to test the deck or what to watch for in early games

## Related Skills

- `grade-tcg-card` — Card condition assessment for tournament legality and collection value
- `manage-tcg-collection` — Inventory management for tracking which cards are available for deck building

## Next Steps

After deck construction, consider these follow-up actions:

1. **Test the deck** — Play test games focusing on the first 3 turns to verify curve smoothness and mulligan decisions.

2. **Evaluate sideboard performance** — Track which sideboard cards actually get boarded in during testing; remove unused slots.

3. **Iterate on meta shifts** — Return to Step 4 after 2-4 weeks of play to reassess positioning if the meta changes.

4. **Expand your collection** — If budget constraints prevented optimal card choices, use `manage-tcg-collection` to track needed acquisitions.

5. **Prepare for tournament** — Use `grade-tcg-card` to verify all cards are tournament-legal condition before competition.
