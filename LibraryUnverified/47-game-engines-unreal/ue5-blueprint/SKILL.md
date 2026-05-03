---
name: ue5-blueprint
description: UE5 Blueprint visual scripting for Actor/Pawn/Character/GameMode/Widget/AnimBP class selection, event graph wiring, Blueprint-C++ interfaces (UFUNCTION macros), inter-Blueprint communication (interfaces, dispatchers, casting), Enhanced Input, GAS abilities, widget binding, and Blueprint optimization/debugging. Triggers on explicit mentions of "Blueprint", "UE5 Blueprint", "Unreal Blueprint", or when the task involves Blueprint graph construction, Blueprint-C++ integration, or Blueprint-specific debugging in Unreal Engine 5.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: ue5-blueprint
  maturity: draft
  risk: low
  tags: [ue5, blueprint, visual-scripting, unreal]
---

# Purpose

Provide concrete guidance for UE5 Blueprint visual scripting: choosing the right Blueprint class, wiring event graphs, exposing C++ to Blueprints, inter-Blueprint communication, and optimizing graph performance.

# When to use

Trigger when the user explicitly mentions:
- "UE5 Blueprint", "Unreal Blueprint", "Blueprint graph", "Blueprint class", "Blueprint visual scripting"
- Creating or modifying specific Blueprint types: Actor Blueprint, Pawn Blueprint, Character Blueprint, GameMode Blueprint, Widget Blueprint, Animation Blueprint (AnimBP)
- Blueprint-specific tasks: wiring event graphs, BeginPlay events, Tick events, collision/overlap handlers, custom events in Blueprint
- Blueprint-C++ integration: `UFUNCTION(BlueprintCallable)`, `BlueprintImplementableEvent`, `BlueprintNativeEvent`, exposing C++ to Blueprints
- Blueprint communication patterns: Blueprint Interfaces, Event Dispatchers, Cast nodes, Blueprint communication
- Blueprint input systems: Enhanced Input in Blueprints, InputAction assets, InputMappingContext in Blueprint
- Blueprint GAS: Gameplay Ability System abilities in Blueprint, gameplay effects, gameplay tags in Blueprint
- Blueprint UI: Widget Blueprints, UMG binding, widget animations in Blueprint
- Blueprint debugging or optimization: Blueprint Debugger, Print String, Blueprint performance

# When NOT to use

- The task is pure C++ with no Blueprint involvement — use `unreal-engine` instead
- The task is about lore, narrative, or world data — use `worldbuilding-lore-systems`
- The project targets Unity, Godot, or another engine — use the appropriate engine skill
- The request is about general game design without specific Blueprint implementation details — use `game-design-systems`

# Procedure

## 1. Class Selection
Determine the appropriate Blueprint parent class based on the entity's role:
- **Actor**: World-placed objects (pickups, triggers, environmental elements) that do not need to be possessed
- **Pawn**: Entities that can be possessed by a PlayerController but do not use CharacterMovementComponent (vehicles, spectator cameras)
- **Character**: Player or AI entities using CharacterMovementComponent with built-in movement modes (walking, falling, jumping, flying)
- **GameMode**: Match rules, spawn logic, game state transitions — exactly one per level
- **GameState**: Replicated game-wide data (score, match timer, round state)
- **PlayerState**: Per-player replicated data (kills, deaths, player name, team assignment)
- **PlayerController**: Input handling, camera management, HUD ownership — persists across pawn possession changes
- **ActorComponent**: Reusable logic modules that can be attached to any Actor (health system, interaction component)
- **AnimInstance (AnimBP)**: Animation state machines, blend graphs, animation notifications
- **UserWidget**: UI elements, HUDs, menus, inventory screens

## 2. Event Graph Construction
Build the execution flow with these patterns:
- **Lifecycle events**: BeginPlay (one-time initialization), EndPlay (cleanup), OnDestroyed (resource disposal)
- **Tick avoidance**: Disable Tick in Class Defaults unless required; use `Set Timer by Event/Function Name` with 0.1–0.5s intervals for periodic updates
- **Input events**: Use Enhanced Input Action events rather than legacy Input bindings
- **Collision events**: Component Begin/End Overlap with object type or tag filtering before logic execution
- **Custom events**: Named events for cross-Blueprint communication; use "Call [EventName]" nodes to trigger

## 3. Data Flow Management
Structure variables and execution:
- **Instance variables**: Promote pins to variables for state persistence; use meaningful Category names
- **Local variables**: Scope variables to functions for temporary calculation data
- **Pure functions**: Use pure functions (no execution pins) for calculations; chain into execution wires for automatic evaluation
- **Exec chain length**: Limit visible execution chains to 15–20 nodes; extract longer sequences into functions or macros with descriptive names

## 4. Communication Pattern Selection
Choose coupling strength from lightest to tightest:
- **Blueprint Interface**: Define interface in Content Browser (Blueprint Interface asset), implement in Blueprint Class Settings, call via Message node for polymorphic behavior
- **Event Dispatcher**: Create dispatcher variable, Bind event in listener Blueprint, Call dispatcher in broadcaster; ideal for UI decoupling from gameplay
- **Direct reference**: Store typed reference variable only when ownership is explicit and lifetime is managed
- **Cast node**: Use `Cast To [Class]` only when concrete type access is required; always validate with `Is Valid` check before accessing cast result

## 5. C++ to Blueprint Exposure
Implement the C++ side with correct UFUNCTION specifiers:
```cpp
// Callable from Blueprint, defined in C++
UFUNCTION(BlueprintCallable, Category="MyCategory")
void MyFunction();

// Implemented in Blueprint, declared in C++
UFUNCTION(BlueprintImplementableEvent, Category="MyCategory")
void OnEventOccurred();

// C++ default implementation, overridable in Blueprint
UFUNCTION(BlueprintNativeEvent, Category="MyCategory")
void OnNativeEvent();
virtual void OnNativeEvent_Implementation();  // C++ implementation
```

## 6. Enhanced Input Setup
Configure modern input system:
- Create **InputAction** assets in Content Browser (Right-click > Input > Input Action) for each discrete action (Jump, Fire, Interact)
- Create **InputMappingContext** asset grouping related actions
- In PlayerController or Character Blueprint, use `Add Mapping Context` node in BeginPlay, targeting `Get Player Controller` > `Get Enhanced Input Local Player Subsystem`
- Bind actions using `EnhancedInputAction [ActionName]` nodes with Triggered/Started/Completed/Ongoing pins
- Support multiple contexts by priority (e.g., UI context at priority 1 overrides gameplay context at priority 0)

## 7. Gameplay Ability System (GAS) in Blueprint
Implement GAS workflows:
- **Grant abilities**: Use `Give Ability` node on AbilitySystemComponent with ability class specified
- **Activate abilities**: `Try Activate Ability By Class` or `Try Activate Ability By Tag` with explicit check for success return value
- **Apply effects**: `Apply Gameplay Effect to Self`/`Target` for stat modifications (health, damage, buffs)
- **Tag queries**: `Has Matching Gameplay Tag` or `Has Any Matching Gameplay Tags` for state checks
- **Ability tasks**: Use Blueprint-exposed Ability Tasks (Wait Input Press, Wait Target Data, Play Montage And Wait)

## 8. Widget Blueprint Patterns
Implement UI with proper data binding:
- **Property binding**: In Designer tab, bind text/progress bar values to Blueprint functions returning the correct type; function name should describe the data source
- **Animation control**: Use `Play Animation`/`Play Animation Reverse` with target widget self-reference; check `Is Animation Playing` before triggering
- **Focus management**: `Set Focus` on interactive widgets; implement `On Focus Received`/`On Focus Lost` for styling changes
- **Navigation**: Configure explicit navigation rules in Widget Details > Navigation, or use `Set User Focus` with custom logic
- **Widget lifecycle**: Create widgets with `Create Widget` node, add to viewport with `Add to Viewport`, remove with `Remove from Parent`

## 9. Optimization
Apply performance-focused patterns:
- **Tick disable**: In Class Defaults, uncheck "Start with Tick Enabled" for actors that do not need per-frame updates
- **Flow control**: Use `DoOnce` for one-time initialization, `Gate` for conditional execution blocks, `MultiGate` for sequence switching
- **Nativization**: For hot paths identified via profiling, convert to C++ or enable Blueprint Nativization in project settings
- **Construction script**: Avoid spawning actors, heavy math, or complex logic in Construction Script; use it only for visual preview updates
- **Component optimization**: Set collision presets correctly; disable collision on purely visual components

## 10. Debugging
Use Unreal's debugging tools effectively:
- **Blueprint Debugger**: Enable via Window > Debug > Blueprint Debugger; set breakpoints with F9 on nodes, use Step Over/Into/Out controls
- **Print String**: Use with Duration parameter for transient logging; include identifying prefix in String input
- **Visual Logger**: `VisLog` category for spatial debugging visible in Visual Logger tool (Window > Developer Tools > Visual Logger)
- **Variable watching**: Pin variables to Watch panel during PIE debugging; observe values without Print String overhead
- **Blueprint Profiler**: Window > Developer Tools > Blueprint Profiler to identify expensive Blueprint graphs

# Decision rules

- **Graph size threshold**: If a single Blueprint function or event graph exceeds 30–40 visible nodes, extract into sub-functions with descriptive names; at 50+ nodes, consider C++ implementation with BlueprintCallable exposure
- **Interface vs Cast**: Use Blueprint Interface (Message call) when the caller only needs to invoke behavior without accessing properties; use Cast only when concrete class properties are required
- **Dispatcher vs Direct reference**: Use Event Dispatcher when the broadcaster does not know its listeners (UI events, quest notifications); use direct reference variables only with explicit ownership and documented lifetime
- **Blueprint vs C++ boundary**: Keep Blueprint for rapid iteration of gameplay logic; move to C++ when: (a) algorithmic complexity exceeds Blueprint readability, (b) frame-budget profiling identifies hot path, (c) logic needs reuse across multiple Blueprint types, (d) extensive math/physics calculations required
- **Widget data patterns**: Never poll data in Widget Tick; use property binding with Blueprint function getters, or drive updates via Event Dispatcher from gameplay code
- **Tick elimination checklist**: Before enabling Tick, verify the logic cannot be implemented via: Timer by Event, Event Dispatcher, Interface call, collision overlap, animation notify, or timeline update
- **Replication scope**: Replicated variables belong in Actor (world state), PlayerState (player-specific), or GameState (game-wide); avoid replicating Component variables directly

# Output contract

Every Blueprint implementation response must include:

1. **Creative Goal** — What the Blueprint system achieves in player or developer experience terms (e.g., "Enable double-jump with coyote-time forgiveness")

2. **Implementation Plan** — Blueprint-specific deliverables:
   - **Blueprint Class** — Specific parent class (Actor/Pawn/Character/GameMode/UserWidget/AnimInstance) with rationale for selection
   - **Event Graph** — Key events wired (BeginPlay, Enhanced Input events, collision overlaps) with execution flow description
   - **Variables** — Instance variables needed with types and replication status
   - **Communication Pattern** — Chosen coupling mechanism (Interface/Dispatcher/Direct Reference/Cast) with justification
   - **C++ Interface** — Any UFUNCTION macros needed with complete specifiers (BlueprintCallable, BlueprintImplementableEvent, BlueprintNativeEvent)
   - **Widget/Data binding** — For UI: property binding functions, animation triggers
   - **GAS elements** — If applicable: Ability classes, Effect classes, Tag queries

3. **Optimization Notes** — Specific performance decisions:
   - Tick enabled/disabled with justification
   - Timer intervals for periodic updates
   - Nativization candidates identified
   - Graph complexity assessment (node count, extraction candidates)

4. **Validation** — Concrete verification steps:
   - PIE test scenarios with expected outcomes
   - Blueprint debugger breakpoints to set (function names, variable watches)
   - Edge cases to verify (input timing, rapid fire, error conditions)

5. **Iteration Notes** — Documented uncertainty and next steps:
   - Explicit callouts where implementation details depend on project context
   - Recommended next iteration for refinement
   - Alternative approaches considered and rejected with rationale

# Next steps

After applying this skill, consider these workflow continuations:

- **`unreal-engine`** — When the Blueprint-C++ boundary requires C++ implementation or when moving hot paths from Blueprint to C++ for performance
- **`blueprint-patterns`** — When identifying reusable Blueprint architecture patterns across multiple systems or projects
- **`game-design-systems`** — When the Blueprint implementation needs to align with higher-level game design documentation and systems design

# References

- [UE5 Blueprint Visual Scripting documentation](https://docs.unrealengine.com/5.0/en-US/blueprints-visual-scripting-in-unreal-engine/)
- [Enhanced Input System in Unreal Engine](https://docs.unrealengine.com/5.0/en-US/enhanced-input-in-unreal-engine/)
- [Gameplay Ability System for Unreal Engine](https://docs.unrealengine.com/5.0/en-US/gameplay-ability-system-for-unreal-engine/)
- [UMG UI Designer for Unreal Engine](https://docs.unrealengine.com/5.0/en-US/umg-ui-designer-for-unreal-engine/)
- [Blueprint Communication](https://docs.unrealengine.com/5.0/en-US/blueprint-communications-in-unreal-engine/)

# Failure handling

## Blueprint-C++ Boundary Uncertainty
**Symptom**: Unclear whether logic should be in Blueprint or C++.
**Resolution**: Default to Blueprint for rapid prototyping. Document as `Nativization Candidate` with specific trigger conditions (node count, profiler identification, complexity threshold). Provide path for future C++ extraction.

## Cast Node Failures
**Symptom**: Cast returns invalid/null, downstream execution fails or crashes.
**Recovery steps**:
1. Add `Is Valid` macro check immediately after Cast node
2. Verify the source actor implements the expected class hierarchy (check Class Settings > Parent Class)
3. Use Blueprint Interface instead of Cast if only behavior invocation is needed
4. Enable "Print String" debug output showing actual class of cast source using `Get Class` > `Get Display Name`

## Enhanced Input Not Firing
**Symptom**: InputAction events do not trigger during PIE.
**Recovery steps**:
1. Verify InputMappingContext was added via `Add Mapping Context` node in BeginPlay
2. Confirm target subsystem is `Get Player Controller` > `Get Enhanced Input Local Player Subsystem`
3. Check InputAction asset references are valid (not "None")
4. Verify PlayerController has EnhancedInputComponent (not legacy InputComponent)
5. Check that context priority is higher than conflicting contexts
6. Test with simple `Print String` node on Triggered pin to isolate logic issues

## GAS Ability Activation Failures
**Symptom**: `Try Activate Ability` returns false or ability does not execute.
**Recovery steps**:
1. Confirm AbilitySystemComponent exists on the actor (Add Component if missing)
2. Verify ability was granted with `Give Ability` before activation attempt
3. Check ability tags: activation might be blocked by `Activation Blocked Tags`
4. Verify ability class is correctly set in `Give Ability` node (not abstract/default)
5. Add `Print String` before activation to log AbilitySystemComponent validity
6. Check server/client authority: some abilities require server activation

## Widget Binding Not Updating
**Symptom**: UI text/progress bars show stale or default values.
**Recovery steps**:
1. Verify property binding function is marked `Pure` (green pin) if used in binding
2. Check that data source actor reference in Widget Blueprint is valid and set
3. Use `Print String` in binding function to verify it is being called
4. Replace binding with explicit event-driven update via Event Dispatcher
5. Verify widget has been added to viewport (`Add to Viewport` was called)

## Blueprint Compilation Errors
**Symptom**: Blueprint fails to compile with red error nodes.
**Recovery steps**:
1. Identify error node by red outline; hover for tooltip message
2. Check for type mismatches on pin connections (float vs int, object vs class)
3. Verify variable types match pin requirements
4. Ensure all exec paths have valid termination (Return nodes, complete chains)
5. For circular dependency errors, break reference cycles via Interface or Dispatcher

## Performance Issues (Frame Drops)
**Symptom**: PIE shows low FPS or hitch when Blueprint logic runs.
**Recovery steps**:
1. Use `stat game` console command to identify Blueprint time
2. Disable Tick on actors that do not need per-frame updates
3. Replace Tick logic with Timer by Event (0.1s or longer intervals)
4. Use Blueprint Profiler to identify expensive graphs
5. Move hot paths to C++ with BlueprintCallable exposure
6. Check for expensive operations in Construction Script (executes in editor)
