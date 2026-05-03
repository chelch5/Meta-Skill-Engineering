---
name: excalidraw-diagram-generator
description: 'Generate Excalidraw diagrams from natural language descriptions. Use when users explicitly request diagrams, flowcharts, mind maps, system architecture diagrams, ER diagrams, class diagrams, sequence diagrams, data flow diagrams, or business swimlane flows to be created as .excalidraw files. Triggers on phrases like "create a diagram", "make a flowchart", "generate an Excalidraw file", "draw system architecture", "visualize this process", or "create a mind map". Does NOT trigger on requests to edit existing diagrams, convert between diagram formats, explain diagram notation, or create diagrams in other tools (Mermaid, PlantUML, Draw.io).'
---

# Excalidraw Diagram Generator

Generate Excalidraw-format diagrams from natural language descriptions. Create visual representations of processes, systems, relationships, and ideas as `.excalidraw` JSON files ready to open in Excalidraw.

## Purpose

Transform text descriptions into structured visual diagrams using the Excalidraw format. Supports technical documentation, system design, process visualization, and concept mapping without manual drawing.

## When to use

Use this skill when users request:

- **Explicit creation requests**: "Create a diagram", "Make a flowchart", "Generate an Excalidraw file"
- **Visualization requests**: "Visualize the process", "Draw the system architecture", "Show the relationship between"
- **Specific diagram types**: "Create a mind map", "Diagram the workflow", "Draw a class diagram"
- **Entity relationships**: "Show how User relates to Post and Comment", "Map the database schema"

**Supported diagram types:**

| Type | Use Case | Trigger Keywords |
|------|----------|------------------|
| Flowchart | Sequential processes, workflows, decision trees | "workflow", "process", "steps", "flow" |
| Relationship Diagram | Entity connections, dependencies, associations | "relationship", "dependencies", "structure" |
| Mind Map | Concept hierarchies, brainstorming organization | "mind map", "concepts", "breakdown", "ideas" |
| Architecture Diagram | System design, module interactions | "architecture", "system", "components" |
| Data Flow Diagram (DFD) | Data movement, transformation processes | "data flow", "data processing" |
| Business Flow (Swimlane) | Cross-functional workflows, actor processes | "business process", "swimlane", "actors" |
| Class Diagram | Object-oriented design, class structures | "class diagram", "OOP", "inheritance" |
| Sequence Diagram | Object interactions, message flows over time | "sequence", "interaction", "messages" |
| ER Diagram | Database entity relationships | "ER diagram", "database", "entity" |

## When NOT to use

Do NOT use this skill when:

- **Editing existing diagrams**: User wants to modify an existing `.excalidraw` file → Use file editing tools directly
- **Format conversion**: User wants to convert Mermaid/PlantUML to Excalidraw → Requires different approach
- **Tool-specific output**: User requests output for Draw.io, Lucidchart, or other tools → Use appropriate tool format
- **Notation explanation**: User asks "What does this arrow mean?" or "Explain UML notation" → Answer directly without diagram generation
- **Code visualization**: User wants to visualize code structure → Use code analysis tools first
- **Image/PDF export**: User wants to export an existing diagram → Use Excalidraw's built-in export

## Prerequisites

Before generating a diagram, ensure you have:

1. **Clear subject matter**: The entities, steps, or concepts to visualize
2. **Relationship understanding**: How elements connect or flow (for non-trivial diagrams)
3. **Output location**: Where to save the `.excalidraw` file

If information is incomplete, ask clarifying questions before proceeding.

## Procedure

### 1. Analyze the request

Extract from user input:
- **Diagram type**: Match to supported types using trigger keywords
- **Key elements**: List all entities, steps, or concepts to include
- **Relationships**: Identify connections, flow direction, or hierarchy
- **Complexity estimate**: Count elements; if >20, propose simplification

### 2. Select diagram type

Match user intent to type using the table in "When to use". If ambiguous, ask:
> "Do you want a flowchart showing sequential steps, or a relationship diagram showing connections?"

### 3. Extract structured information

**Flowcharts:** List sequential steps, decision points (diamonds), start/end points.

**Relationship Diagrams:** Identify entities and connections (from → to, with labels).

**Mind Maps:** Define central topic, 3-6 main branches, optional sub-topics.

**Architecture Diagrams:** Identify components, layers, and interaction patterns.

**Data Flow Diagrams:** List external entities, processes, data stores, and data flows (left-to-right direction).

**Business Flow (Swimlane):** Define actors/roles as columns, activities within each lane.

**Class Diagrams:** List classes with attributes (+, -, #), methods, and relationships (inheritance, association, aggregation, composition).

**Sequence Diagrams:** Identify objects/actors, message sequence, synchronous vs asynchronous flows.

**ER Diagrams:** Define entities, attributes, primary/foreign keys, cardinality (1:1, 1:N, N:M).

### 4. Generate Excalidraw JSON

Create diagram elements with these properties:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "shape_1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100
    },
    {
      "id": "text_1",
      "type": "text",
      "x": 130,
      "y": 135,
      "text": "Start",
      "fontFamily": 5,
      "fontSize": 20
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

**Critical formatting rules:**
- All text elements MUST use `"fontFamily": 5` (Excalifont)
- Use consistent colors: primary `#a5d8ff`, secondary `#b2f2bb`, important `#ffd43b`, warning `#ffc9c9`
- Spacing: 200-300px horizontal, 100-150px vertical between elements
- Font size: 16-24px for readability
- Element IDs must be unique (use timestamp + random: `Date.now().toString(36) + Math.random().toString(36).substr(2)`)

### 5. Layout elements

**Flowcharts**: Left-to-right or top-to-bottom flow.

**Relationship diagrams**: Grid layout for clarity.
```javascript
const columns = Math.ceil(Math.sqrt(entityCount));
const x = startX + (index % columns) * horizontalGap;
const y = startY + Math.floor(index / columns) * verticalGap;
```

**Mind maps**: Radial layout from center.
```javascript
const angle = (2 * Math.PI * index) / branchCount;
const x = centerX + radius * Math.cos(angle);
const y = centerY + radius * Math.sin(angle);
```

### 6. Save and deliver

1. Write file as `<descriptive-name>.excalidraw`
2. Provide summary with: diagram type, element count, file path
3. Include opening instructions:
   - Visit https://excalidraw.com
   - Drag-and-drop file or use File → Open
   - Or use Excalidraw VS Code extension

**Example delivery format:**
```
Created: user-workflow.excalidraw
Type: Flowchart
Elements: 7 boxes, 6 arrows, 1 title (14 total)
Location: ./diagrams/user-workflow.excalidraw

To view: Visit https://excalidraw.com and open the file.
```

## Output contract

Every execution produces:

1. **File output**: Complete `.excalidraw` JSON file written to specified path
2. **Validation summary**: Element count, diagram type, and complexity assessment
3. **Usage instructions**: How to open and edit the diagram

**Quality thresholds:**
- Maximum 20 elements per diagram (propose multiple diagrams if exceeded)
- All text uses `fontFamily: 5` (Excalifont)
- No overlapping elements (minimum 100px spacing)
- Valid JSON structure (can be parsed by Excalidraw)

## Failure handling

| Failure Mode | Detection | Agent Action |
|--------------|-----------|--------------|
| Invalid JSON output | JSON parse error on validation | Regenerate with corrected syntax; validate before saving |
| Overlapping elements | Visual inspection or coordinate check | Increase spacing (minimum 200px horizontal, 100px vertical) and regenerate |
| Too many elements (>20) | Element count exceeds threshold | Stop and ask user: "This diagram would have 25+ elements. Should I create a high-level overview instead, or split into multiple focused diagrams?" |
| Missing fontFamily | Text elements lack `fontFamily: 5` | Add property to all text elements; validate before delivery |
| Ambiguous diagram type | Multiple types match keywords | Ask clarifying question with options; do not guess |
| Insufficient information | Missing entities or relationships | Request specific details: "What are the 3-5 main steps in this process?" |
| File write failure | OS error or path issue | Report error with path; suggest alternative location |

**On generation failure:**
1. Identify failure mode from table above
2. Apply corrective action
3. Re-validate output before delivery
4. If unresolvable, report: "Unable to generate valid diagram due to [reason]. Try simplifying the request or providing more structure."

## Next steps

After generating a diagram:

- **For diagram refinement**: Use direct file editing to adjust positions, colors, or labels
- **For related diagrams**: Create additional focused diagrams for subsystems
- **For icon enhancement**: Set up icon libraries (see references/excalidraw-schema.md) then use helper scripts
- **For diagram validation**: Run evals in `evals/` directory to verify output quality

Related workflows:
- `skill-creator`: If user requests a new diagram type not covered
- `skill-adaptation`: If user needs diagram format adapted to specific toolchains

## Complexity management

**Element count guidelines:**

| Diagram Type | Recommended | Maximum |
|--------------|-------------|---------|
| Flowchart | 3-10 steps | 15 |
| Relationship | 3-8 entities | 12 |
| Mind map | 4-6 branches | 8 branches |
| Architecture | 5-10 components | 15 |

**If request exceeds limits:**
> "Your request includes 18 components. For clarity, I recommend: (1) High-level architecture diagram with 6 main components, (2) Detailed sub-diagrams for each subsystem. Should I start with the high-level view?"

## Icon library integration (optional)

For professional diagrams with AWS/cloud icons:

1. **Check availability**: Look for `libraries/<library-name>/reference.md`
2. **If available**: Use helper scripts:
   ```bash
   python scripts/add-icon-to-diagram.py diagram.excalidraw EC2 400 300 --label "Web Server"
   python scripts/add-arrow.py diagram.excalidraw 300 250 500 300 --label "HTTPS"
   ```
3. **If not available**: Create using basic shapes and inform user about icon setup

**Setup instructions for users:**
1. Download `.excalidrawlib` from https://libraries.excalidraw.com/
2. Place in `libraries/<name>/`
3. Run: `python scripts/split-excalidraw-library.py libraries/<name>/`

See `scripts/README.md` for detailed script documentation.

## References

Bundled documentation:
- `references/excalidraw-schema.md` - Complete JSON schema specification
- `references/element-types.md` - Element type specifications and examples
- `templates/flowchart-template.excalidraw` - Starter flowchart structure
- `templates/relationship-template.excalidraw` - Starter relationship diagram
- `templates/mindmap-template.excalidraw` - Starter mind map
- `templates/class-diagram-template.excalidraw` - Starter class diagram
- `templates/sequence-diagram-template.excalidraw` - Starter sequence diagram
- `templates/er-diagram-template.excalidraw` - Starter ER diagram
- `templates/data-flow-diagram-template.excalidraw` - Starter DFD
- `templates/business-flow-swimlane-template.excalidraw` - Starter swimlane
- `scripts/split-excalidraw-library.py` - Library file splitter
- `scripts/add-icon-to-diagram.py` - Icon insertion helper
- `scripts/add-arrow.py` - Arrow insertion helper
- `scripts/README.md` - Script usage documentation

## Limitations

- Maximum 20 elements per diagram for clarity
- Straight or basic curved arrows only (no complex curves)
- Default roughness level (1)
- No embedded image support in generated files
- Manual collision detection (follow spacing guidelines)
- Icon libraries require separate user setup

---

**Validation Checklist** (verify before delivery):
- [ ] All elements have unique IDs
- [ ] No overlapping elements (coordinate check)
- [ ] Text readable (font size 16+)
- [ ] All text uses `fontFamily: 5`
- [ ] Arrows connect logically
- [ ] Colors follow consistent scheme
- [ ] Valid JSON structure
- [ ] Element count ≤ 20
