---
name: consult-natural-history
description: Reference Hildegard von Bingen's Physica for natural history knowledge — plants, stones, animals, fish, birds, elements, trees, reptiles, and metals with their hot/cold/warm/cool temperament, medicinal uses, and symbolic properties. Triggers on queries about Hildegard's medieval natural history system, Physica book contents, temperament-based remedies, or cross-referencing natural items across categories.
license: MIT
allowed-tools: Read
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: hildegard
  complexity: intermediate
  language: natural
  tags: hildegard, physica, natural-history, stones, animals, plants, elements
---

# Consult Natural History

Reference Hildegard von Bingen's *Physica* for natural history knowledge — properties of plants, stones, animals, fish, birds, elements, and trees with their medicinal, symbolic, and practical applications.

## When to Use

- You need to understand a specific plant, stone, or animal from Hildegard's perspective
- You want to explore symbolic or medicinal properties of natural objects in *Physica*
- You are researching medieval natural history and cosmology
- You need to cross-reference properties across categories (e.g., a plant and a stone with similar temperament)
- You want to integrate *Physica*'s knowledge into health, spiritual, or creative practice
- You are studying the relationship between nature and theology in Hildegard's thought

## When NOT to Use

- **Modern medical advice**: Hildegard's *Physica* is medieval natural history, not evidence-based modern medicine. Do not use for diagnosing conditions or prescribing treatments without consulting healthcare professionals.
- **Scientific taxonomy**: Do not use when the user needs Linnaean classification, chemical composition, or contemporary botanical accuracy. *Physica* uses pre-scientific temperament theory (hot/cold, moist/dry), not modern chemistry or biology.
- **General herbal reference**: Do not use for modern herbal medicine or supplement guidance. Use only when the user explicitly asks for Hildegard's medieval framework.
- **Lifestyle or diet planning**: Do not use for contemporary nutrition science, exercise regimens, or wellness trends unless specifically researching Hildegard's medieval dietary recommendations within her historical context.
- **Historical accuracy disputes**: Do not use to verify claims about medieval Europe broadly. This skill covers only Hildegard's *Physica*; other medieval sources may differ.

## Inputs

- **Required**: Category to consult (plants, stones, animals, fish, birds, elements, trees, reptiles, metals)
- **Required**: Specific item or property inquiry (e.g., "emerald", "fennel", "properties of fire element")
- **Optional**: Application context (medicinal, symbolic, liturgical, practical)
- **Optional**: Related temperament or ailment (to guide property interpretation)
- **Optional**: Cross-reference request (e.g., "plants and stones for cold temperament")

## Procedure

### Step 1: Identify the Category in Physica

Determine which of the nine books of *Physica* contains the requested knowledge.

```
Physica — Nine Books of Natural History:

┌──────┬────────────────┬──────────────┬─────────────────────────┐
│ Book │ Title          │ # Entries    │ Focus                   │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ I    │ PLANTS         │ 230 entries  │ Herbs, grains, spices,  │
│      │ (Plantae)      │              │ vegetables — medicinal  │
│      │                │              │ and dietary properties  │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ II   │ ELEMENTS       │ 7 entries    │ Fire, air, water, earth,│
│      │ (Elementa)     │              │ wind, stars, sun/moon   │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ III  │ TREES          │ 27 entries   │ Oak, apple, willow,     │
│      │ (Arbores)      │              │ birch — wood, fruit,    │
│      │                │              │ leaves, symbolic meaning│
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ IV   │ STONES         │ 26 entries   │ Gems and minerals —     │
│      │ (Lapides)      │              │ healing, protection,    │
│      │                │              │ spiritual properties    │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ V    │ FISH           │ 37 entries   │ Freshwater & saltwater  │
│      │ (Pisces)       │              │ fish — dietary guidance │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ VI   │ BIRDS          │ 72 entries   │ Domestic & wild birds — │
│      │ (Aves)         │              │ meat properties, eggs,  │
│      │                │              │ symbolic meanings       │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ VII  │ ANIMALS        │ 45 entries   │ Mammals — domestic &    │
│      │ (Animalia)     │              │ wild, medicinal uses of │
│      │                │              │ parts (bones, organs)   │
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ VIII │ REPTILES       │ 16 entries   │ Snakes, frogs, worms —  │
│      │ (Reptilia)     │              │ medicinal (external) and│
│      │                │              │ symbolic (often negative│
├──────┼────────────────┼──────────────┼─────────────────────────┤
│ IX   │ METALS         │ 8 entries    │ Gold, silver, iron,     │
│      │ (Metalla)      │              │ copper — practical and  │
│      │                │              │ medicinal applications  │
└──────┴────────────────┴──────────────┴─────────────────────────┘

Lookup Process:
1. Identify which category the inquiry falls under
2. Locate the entry within that book (alphabetical or grouped by type)
3. Extract properties: temperature, moisture, medicinal use, contraindications
4. Note symbolic or theological associations if relevant
```

**Expected:** Correct book/category identified for the inquiry with evidence:
- Book number and Latin title stated (e.g., "Book IV Lapides (Stones)")
- Entry count and focus area noted from the table
- At least one specific entry cited as example from that category

**On failure:** If category is uncertain, apply disambiguation protocol:
1. List all candidate categories that might contain the item
2. State Hildegard's known classification when documented (e.g., "willow → Book III Trees per Physica")
3. If truly ambiguous, check Books I and III for plants/trees, Books IV and IX for stones/metals
4. Choose the most specific category: prefer "Trees" over "Plants" for woody perennials
5. Note the ambiguity explicitly in output so user understands classification uncertainty

### Step 2: Extract Properties and Applications

Retrieve the specific properties Hildegard attributes to the item.

```
Property Categories in Physica:

TEMPERATURE (Hot/Warm/Temperate/Cool/Cold):
- Hot: Generates heat, dries moisture, stimulates (e.g., ginger, fire, gold)
- Warm: Gently heating, balances cold conditions (e.g., fennel, cinnamon)
- Temperate: Balanced, neither heating nor cooling (e.g., spelt, emerald)
- Cool: Mildly cooling, calms heat (e.g., lettuce, cucumber)
- Cold: Strongly cooling, can suppress activity (e.g., ice, certain stones)

MOISTURE (Moist/Dry):
- Moist: Softens, lubricates, adds fluidity (e.g., butter, water element)
- Dry: Firms, dries dampness, removes excess moisture (e.g., rye, certain stones)

MEDICINAL USE:
- Internal: Eaten, drunk, or taken as tincture (plants, fish, some stones
  powdered in wine)
- External: Poultice, salve, amulet, or ritual use (stones, animal parts)
- Specific ailments: Digestive, respiratory, skin, heart, mental/spiritual

SYMBOLIC/THEOLOGICAL:
- Virtue associations (emerald = chastity; sapphire = divine contemplation)
- Biblical references (cedar = Temple; dove = Holy Spirit)
- Cosmological role (elements as building blocks; metals as earthly reflection
  of heavenly order)

Example Entries:

FENNEL (Book I, Chapter 1):
- Temperature: Warm
- Moisture: Moderately moist
- Use: "However it is consumed — raw, cooked, or as spice — it brings gladness
  and gives pleasant warmth, good digestion, and gentle sweat."
- Application: Digestive aid, carminative, mood-lifting
- Contraindications: None noted (generally safe)

EMERALD (Book IV, Chapter 10):
- Temperature: Temperate (neither hot nor cold)
- Symbolic: Chastity, purity, protection against impure thoughts
- Use: "If someone is tormented by impure thoughts, let them hold an emerald
  in their hand, warm it with their breath, moisten it with saliva, and place
  it over their heart. The impurity will leave."
- Application: Spiritual/psychological (calms lust, stabilizes emotions)

FIRE ELEMENT (Book II, Chapter 1):
- Temperature: Hot and dry
- Cosmological: "Fire is in all things; it gives life, light, and warmth."
- Medicinal: Fire (heat) is essential for digestion, circulation, vitality
- Symbolic: Holy Spirit, divine love, transformative power
- Caution: Excess fire → inflammation, fever, anger

OAK TREE (Book III, Chapter 5):
- Temperature: Warm and dry
- Parts: Bark (astringent, stops bleeding), acorns (not for human food —
  too dry and bitter), wood (durable for building)
- Symbolic: Strength, endurance, steadfastness
- Medicinal: Oak bark decoction for diarrhea, wounds (external)
```

**Expected:** Properties extracted with specific structure:
- Temperature stated using Hildegard's terms (Hot/Warm/Temperate/Cool/Cold)
- Moisture stated (Moist/Dry) when mentioned
- Medicinal use categorized as internal/external/both with specific application method
- Symbolic/theological associations quoted directly from Hildegard where available
- Contraindications noted explicitly (e.g., "avoid in pregnancy," "not for hot temperaments")
- At least one direct quote from *Physica* provided to ground the property claim

**On failure:** If *Physica* entry is brief or unclear:
1. State explicitly what Hildegard does and does not say about this item
2. Apply temperamental inference only when clearly justified: warm → treats cold; cool → treats heat
3. Use analogy to similar items in same category only when temperamental properties match
4. Flag inferred properties with "[inferred from temperamental logic]" so user distinguishes documented from inferred
5. If entry is completely absent, state: "This item does not appear in Physica's nine books" and suggest related items that are documented

### Step 3: Cross-Reference Between Categories (Optional)

Identify related items across categories that share properties or work synergistically.

```
Cross-Referencing Patterns:

BY TEMPERAMENT:
Cold/Damp Conditions → Warming/Drying Agents:
- PLANTS: Fennel, ginger, galangal, yarrow (Book I)
- STONES: Carnelian, jasper (Book IV) — warm stones worn as amulets
- ELEMENTS: Fire (Book II) — exposure to sunlight, warmth
- ANIMALS: Lamb (Book VII) — warming meat

Hot/Dry Conditions → Cooling/Moistening Agents:
- PLANTS: Lettuce, cucumber, violet, plantain (Book I)
- STONES: Emerald, sapphire (Book IV) — cooling stones for inflamed conditions
- ELEMENTS: Water (Book II) — hydration, cool baths
- FISH: Most fish are cooling and moistening (Book V)

BY AILMENT:
Digestive Issues:
- PLANTS: Fennel (warming), yarrow (drying), ginger (stimulating)
- STONES: Sapphire worn over stomach (Hildegard: "calms stomach pain")
- ANIMALS: Lamb (easy to digest), avoid pork (heavy, cold)
- ELEMENTS: Fire (supports digestion through bodily heat)

Respiratory Congestion:
- PLANTS: Lungwort, elecampane, hyssop (Book I)
- STONES: Beryl (Hildegard: "good for lungs and liver")
- BIRDS: Chicken broth (nourishing, light)
- ELEMENTS: Air (fresh air, avoid damp environments)

BY SYMBOLIC THEME:
Purity/Chastity:
- PLANTS: Lily (white, pure) — though not extensively discussed in Physica
- STONES: Emerald (see above), crystal (clarity, purity)
- ANIMALS: Dove (Book VI) — symbol of Holy Spirit, innocence
- ELEMENTS: Water (purification through baptism)

Strength/Endurance:
- PLANTS: Oak (Book III), chestnut (strong, nourishing)
- STONES: Jasper (fortifies heart), agate (strengthens)
- ANIMALS: Ox (Book VII) — strength, labor
- METALS: Iron (Book IX) — fortitude, weapon-making
```

**Expected:** Cross-references provided with linking rationale:
- Minimum 2-3 items from different categories identified as related
- Explicit statement of shared property (e.g., "Both warm and dry temperament")
- Synergistic application described if applicable (e.g., "Use together for cold/damp conditions")
- No cross-references claimed where no clear connection exists

**On failure:** If cross-references are unclear or absent:
1. State explicitly: "No documented cross-category connections found for this item in Physica"
2. Provide single-category information completely rather than forcing false connections
3. Suggest related items only when temperamental match is clear (e.g., both marked "warm")
4. Offer to search for thematic connections (e.g., "purity") if user requests, but qualify as interpretive, not documented
5. Return to Step 2 and complete single-category lookup thoroughly before attempting cross-reference again

### Step 4: Application Guidance

Provide practical or symbolic guidance for using the knowledge.

```
Application Types:

1. MEDICINAL APPLICATION:
Scenario: User has cold/damp digestive upset
Consultation:
- PLANTS (Book I): Fennel infusion (warming, carminative)
- STONES (Book IV): Wear carnelian over stomach (warming stone)
- DIETARY (Books I, V, VII): Favor warming foods (ginger, lamb, cooked
  vegetables); avoid cold/damp (raw salads, pork, cold water)
Guidance: "Prepare fennel infusion (1 tbsp seeds per cup, steep 10 min),
drink after meals. Wear carnelian as pendant or in pocket over stomach area.
Adjust diet to warming foods for 1-2 weeks. Reassess."

2. SYMBOLIC/SPIRITUAL APPLICATION:
Scenario: User seeks support for contemplative prayer or chastity
Consultation:
- STONES (Book IV): Emerald (chastity, pure thoughts) — hold during prayer
- PLANTS (Book I): Violet (humility, modesty) — wear or place on altar
- ELEMENTS (Book II): Water (purification) — ritual washing before prayer
Guidance: "Hold emerald during morning prayer, focusing on purity of intention.
Place fresh violets (or dried) on prayer space. Begin prayer with ritual hand
washing as symbolic purification."

3. SEASONAL/ECOLOGICAL APPLICATION:
Scenario: User wants to align health practices with seasonal elements
Consultation:
- Spring (Air rising): Light, greening plants (Book I); fresh air walks
- Summer (Fire peak): Cooling plants (lettuce, cucumber); avoid excess heat
- Autumn (Earth settling): Root vegetables (Book I), grounding practices
- Winter (Water depth): Warming plants (ginger, galangal); rest more
Guidance: "In winter, favor Book I warming plants (fennel, ginger) in teas
and meals. Reduce raw foods. Align with Water element (rest, reflection).
Wear warming stones (carnelian, jasper) if feeling cold."

4. RESEARCH/STUDY APPLICATION:
Scenario: Scholar researching Hildegard's cosmology
Consultation:
- Elements (Book II): Foundational cosmology (fire, air, water, earth)
- Cross-reference to theological works (*Scivias*, *Liber Divinorum Operum*)
- Note how *Physica* integrates natural and divine order
Guidance: "Read Book II (Elements) first to understand Hildegard's cosmological
framework. Then see how she applies elemental theory to plants (Book I) and
stones (Book IV). Compare to *Scivias* Book I for theological integration of
creation and redemption."
```

**Expected:** Application guidance with concrete actions:
- Specific preparation method stated with quantities where known (e.g., "1 tbsp seeds per cup")
- Duration or frequency specified (e.g., "drink after meals for 1-2 weeks")
- Route of use explicit (internal/external/both) with safety qualifier when relevant
- Expected outcome described in measurable terms where possible
- Safety warning included for any risky application (e.g., "do not ingest stones")

**On failure:** If application cannot be determined from *Physica*:
1. Quote the relevant *Physica* text verbatim so user has source material
2. State explicitly: "Hildegard does not specify preparation/application details for this entry"
3. Provide temperamental context only (e.g., "warm item, so would theoretically be used for cold conditions")
4. Offer modern research citations if available, clearly labeled as "[modern research, not Physica]"
5. Direct user to scholarly sources or critical editions of *Physica* for deeper analysis

### Step 5: Contextualize within Hildegard's Holistic System

Integrate *Physica* knowledge with broader Hildegardian health and spiritual practice.

```
Integration with Other Hildegardian Practices:

PHYSICA + CAUSAE ET CURAE (Temperament):
- Use *Physica* plants/stones to rebalance temperament identified in
  *Causae et Curae*
- Example: Melancholic (cold/dry) → Book I warming plants + Book IV
  warming stones

PHYSICA + VIRIDITAS PRACTICE:
- Recognize *Physica* as catalog of viriditas expressions
- Each plant, stone, animal is a manifestation of the greening power
- Meditation: Contemplate a plant's properties as expression of divine creativity

PHYSICA + SACRED MUSIC:
- Many of Hildegard's chants reference *Physica* themes
- Example: "O viridissima virga" (O greenest branch) — Virgin Mary as
  supreme viriditas
- Use *Physica* knowledge to deepen understanding of chant imagery

PHYSICA + LITURGICAL CALENDAR:
- Seasonal recommendations in *Physica* align with church year
- Spring (Easter) → greening plants, renewal
- Autumn (All Souls) → harvest, release, preparation for winter rest
- Winter (Advent/Lent) → warming plants, introspection, waiting

Holistic Health Framework:
┌─────────────────────┬────────────────────────────────────┐
│ Component           │ Hildegardian Source                │
├─────────────────────┼────────────────────────────────────┤
│ Herbal remedies     │ Physica Book I (Plants)            │
│ Dietary guidance    │ Physica Books I, V, VII + Causae   │
│ Temperament assess. │ Causae et Curae                    │
│ Spiritual practice  │ Scivias, Viriditas meditation      │
│ Seasonal rhythm     │ Physica + Liturgical calendar      │
│ Music as healing    │ Symphonia (sacred chants)          │
│ Stones/amulets      │ Physica Book IV (Stones)           │
└─────────────────────┴────────────────────────────────────┘

Hildegard's medicine is NOT isolated remedies but integrated practice:
Body (herbs, diet), Soul (prayer, music), Nature (seasons, viriditas)
```

**Expected:** Holistic integration with specific connections:
- *Physica* entry linked to at least one other Hildegardian practice (temperament from *Causae et Curae*, viriditas meditation, liturgical season, or sacred music)
- Specific chant or text cited if referenced (e.g., "O viridissima virga" for viriditas themes)
- Practical exercise suggested that combines *Physica* knowledge with other practice
- Distinction made between *Physica* as natural history catalog and other works as theological/musical

**On failure:** If holistic integration is unclear or entry lacks theological connections:
1. Complete Step 4 (application guidance) thoroughly as priority
2. State: "This entry does not have explicit documented connections to Hildegard's other works"
3. Provide general context about *Physica* as part of her larger corpus without forcing false connections
4. Suggest related skills (`practice-viriditas`, `assess-holistic-health`) for users seeking broader integration
5. Defer complex theological integration to scholarly resources or Hildegardian studies specialists

## Validation Checklist

Before delivering output, verify each item:

**Categorical Accuracy**
- [ ] Book number (I–IX) and Latin title explicitly stated
- [ ] Entry count from catalog table referenced
- [ ] At least one specific *Physica* entry quoted or cited with chapter number

**Property Completeness**
- [ ] Temperature classified using Hildegard's terms (Hot/Warm/Temperate/Cool/Cold)
- [ ] Moisture noted when mentioned (Moist/Dry)
- [ ] Medicinal use categorized: internal/external/both with application method
- [ ] Symbolic/theological associations quoted directly or noted as absent
- [ ] Contraindications explicitly stated or "none noted" declared

**Application Clarity**
- [ ] Preparation method specified with quantities/duration where known
- [ ] Safety warning included for any hazardous application (stone ingestion, toxic plants)
- [ ] Expected outcome described in concrete terms
- [ ] Historical context disclaimer included: "medieval natural history, not modern science"

**Cross-Category Integration (if requested)**
- [ ] Minimum 2 items from different categories identified
- [ ] Shared property explicitly stated as linkage rationale
- [ ] No false connections claimed where documentation is absent

**Holistic Context**
- [ ] *Physica* positioned within Hildegard's broader system (*Causae et Curae*, *Scivias*, etc.)
- [ ] At least one connection to temperament, viriditas, liturgical season, or sacred music
- [ ] Distinction maintained between *Physica* as natural catalog vs. theological works

## Common Pitfalls

1. **Modern Scientific Overlay**: *Physica* is pre-scientific natural history (1150s). Do not apply Linnaean taxonomy, chemical composition analysis, or contemporary botanical accuracy standards. Hildegard's "plants" and "stones" are categorized by perceived virtue and temperament, not by modern scientific classification.

2. **Literal Ingredient Substitution**: Medieval plants, stones, and animal products differ from modern equivalents. Fennel in the 12th century was not the same cultivar as modern fennel. Do not assume identical properties. Always qualify: "Hildegard's fennel (Book I) is described as..."

3. **Ignoring Temperament Context**: Hildegard's properties are expressed through the hot/cold/warm/cool and moist/dry framework, not through chemical constituents. Every recommendation depends on the user's temperament and condition. A "warming" plant is inappropriate for someone with excess heat.

4. **Isolated Remedy Extraction**: *Physica* is not a modern herbal compendium. Entries must be read within Hildegard's holistic framework integrating *Causae et Curae* (temperament diagnosis), viriditas spirituality, and liturgical seasonality. Never extract a remedy without noting the temperamental context.

5. **Ethical Adaptation Required**: Some *Physica* entries prescribe animal parts (organs, bones, etc.) or toxic substances. Modern practice requires ethical substitution or explicit omission with explanation: "Hildegard recommends [substance]; modern ethics/safety suggest [alternative or omission]."

6. **Stone and Mineral Safety**: Multiple *Physica* remedies involve powdering stones/minerals in wine or water for ingestion. **Modern safety directive**: Never recommend ingesting stones, minerals, or metallic substances. Present historical content with explicit warning: "[Historical practice only — do not ingest stones/minerals]."

7. **Symbolic-Practical Integration**: *Physica*'s symbolic meanings (emerald = chastity, fire = Holy Spirit) are inseparable from Hildegard's theological framework. Do not extract "practical" medicinal advice while discarding "spiritual" symbolism. Both are part of the medieval therapeutic system.

## Related Skills

- `formulate-herbal-remedy` — Uses *Physica* Book I (Plants) as primary source
- `assess-holistic-health` — *Physica* properties align with temperament system in *Causae et Curae*
- `practice-viriditas` — *Physica* as catalog of viriditas expressions in creation
- `compose-sacred-music` — Many chants reference *Physica* natural imagery
- `heal` (esoteric domain) — *Physica* remedies as part of holistic healing modalities
- `prepare-soil` (gardening domain) — Growing *Physica* medicinal plants
