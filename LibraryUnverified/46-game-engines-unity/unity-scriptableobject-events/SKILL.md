---
name: unity-scriptableobject-events
description: Guide implementation of ScriptableObject-based event architecture in Unity for decoupled system communication. Use when the user asks about GameEvent channels, GameEventListener patterns, shared variable ScriptableObjects, or RuntimeSet collections to replace singletons and direct references between Unity systems.
---

# Purpose

Guide implementation of ScriptableObject-based event architecture in Unity, where ScriptableObject assets serve as event channels and shared data containers. This pattern enables decoupled communication between systems without singletons or direct references, based on Ryan Hipple's GDC 2017 talk "Game Architecture with ScriptableObjects."

# When to use

- The user asks about decoupled event communication in Unity without singletons
- Creating GameEvent ScriptableObjects as mediator channels between producers and consumers
- Building GameEventListener MonoBehaviours that subscribe to events and invoke UnityEvent responses
- Implementing shared variable ScriptableObjects (FloatVariable, IntVariable, BoolVariable) as observable data
- Creating RuntimeSet collections to track active objects (enemies, pickups, players) without FindObjectsOfType
- Comparing SO events vs C# events vs UnityEvents vs message buses for a specific use case
- Converting singleton-based communication to ScriptableObject event channels

# When NOT to use

- General Unity scripting without event architecture — use `unity`
- Unreal Engine delegate or dispatcher systems — use `unreal-engine`
- Network-replicated events for multiplayer — use `multiplayer-netcode`
- High-frequency events (1000+/frame) where C# events perform better — use standard C# events instead
- Simple single-object callbacks that do not need cross-scene communication — use UnityEvents directly

# Procedure

1. **Create the GameEvent ScriptableObject.**
   - Define a class extending `ScriptableObject` with `[CreateAssetMenu(menuName = "Events/GameEvent")]`
   - Add a private `List<GameEventListener> listeners = new List<GameEventListener>()`
   - Implement `public void Raise()` that iterates through listeners and calls each `OnEventRaised()`
   - Implement `RegisterListener(GameEventListener listener)` and `UnregisterListener(GameEventListener listener)`
   - Validate: The menu item appears in Unity's Create menu under Events/GameEvent

2. **Create the GameEventListener MonoBehaviour.**
   - Define a class extending `MonoBehaviour` with a public `GameEvent gameEvent` field
   - Add a public `UnityEvent response` field for inspector configuration
   - In `OnEnable()`, call `gameEvent.RegisterListener(this)` — check for null first
   - In `OnDisable()`, call `gameEvent.UnregisterListener(this)` — check for null first
   - Add `public void OnEventRaised()` that invokes `response?.Invoke()`
   - Validate: Listener auto-registers when enabled, unregisters when disabled

3. **Wire event producers and consumers in the Inspector.**
   - Create a GameEvent asset via right-click → Create → Events → GameEvent
   - On the producer GameObject: add a field referencing the GameEvent, call `gameEvent.Raise()` when the event occurs
   - On the consumer GameObject: add the GameEventListener component, drag the GameEvent asset into the slot, configure the UnityEvent response
   - Validate: Raising the event triggers all configured responses

4. **Implement the shared variable pattern (optional).**
   - Create `FloatVariable : ScriptableObject` with `[CreateAssetMenu(menuName = "Variables/Float")]`
   - Add a public `float Value` property with a setter that invokes `OnValueChanged?.Invoke()`
   - Add `public event Action<float> OnValueChanged` for code subscriptions
   - Use for HP, score, settings that multiple systems read
   - Validate: Changing the value triggers the event; multiple readers see the same value

5. **Implement the RuntimeSet pattern (optional).**
   - Create `RuntimeSet<T> : ScriptableObject` where T is a MonoBehaviour type
   - Add `public List<T> Items = new List<T>()`
   - Add `public void Add(T item)` and `public void Remove(T item)` methods
   - Objects call `myRuntimeSet.Add(this)` in `OnEnable` and `myRuntimeSet.Remove(this)` in `OnDisable`
   - Systems query the RuntimeSet instead of calling `FindObjectsOfType<T>()`
   - Validate: RuntimeSet count matches active objects; no null entries after objects destroy

6. **Create typed event variants for data-bearing events (optional).**
   - For events needing data (position, damage amount, player ID), create typed variants:
     - `IntGameEvent : ScriptableObject` with `Raise(int value)` and `UnityEvent<int>` response
     - `FloatGameEvent`, `Vector3GameEvent`, `StringGameEvent` following the same pattern
   - Create matching typed listeners with `UnityEvent<T>` responses
   - Validate: Typed data passes correctly from producer to all listeners

7. **Add debugging and validation utilities.**
   - Add `[TextArea] public string developerDescription` to GameEvent for documentation
   - Add a `[ContextMenu("Raise")]` method to GameEvent for testing in Edit mode
   - Log `Debug.Log($"Event raised with {listeners.Count} listeners")` during development
   - Validate: Inspector shows event raises correctly; logs show expected listener count

8. **Document architecture decisions.**
   - Write a brief comment or separate doc explaining why SO events were chosen over alternatives
   - Note the specific use case (cross-scene communication, designer wiring, decoupling)
   - Validate: Team members can understand the choice without asking

# Output contract

The agent must produce:

1. **Complete C# GameEvent ScriptableObject class**
   - `[CreateAssetMenu]` attribute with proper menu path
   - Listeners collection with thread-safe add/remove
   - Raise() method that safely iterates listeners
   - Registration methods for lifecycle management

2. **Complete C# GameEventListener MonoBehaviour class**
   - GameEvent reference field
   - UnityEvent response field
   - OnEnable/OnDisable registration lifecycle
   - OnEventRaised() callback method

3. **Setup instructions for the Unity Inspector**
   - Step-by-step asset creation process
   - Producer configuration (how to call Raise)
   - Consumer configuration (how to wire the UnityEvent response)

4. **Decision rationale**
   - Why SO events were chosen over C# events, UnityEvents, or singletons
   - Performance and maintainability tradeoffs for the specific use case

# Next steps

- `unity` — General Unity patterns for lifecycle, component architecture, or serialization
- `ai-npc-behavior` — AI systems that consume SO events for perception or stimulus
- `multiplayer-netcode` — When local SO events need network replication for multiplayer

# Decision rules

- Use SO events when designers need to wire connections in the inspector without code changes
- Use C# `event Action` when processing thousands of events per frame in code-only scenarios
- Use shared variable SOs over singletons for any data read by multiple systems (HP, score, settings)
- Use RuntimeSets over `FindObjectsOfType` — O(1) add/remove vs O(n) search every frame
- Create typed SO events (GameEvent<T>) when events carry data; avoid passing multiple parameters
- SO events survive scene loads if referenced by persistent objects or Addressables

# References

- [Ryan Hipple — Game Architecture with ScriptableObjects (GDC 2017)](https://www.youtube.com/watch?v=raQ3iHhE_Kk)
- [Unity ScriptableObject Manual](https://docs.unity3d.com/Manual/class-ScriptableObject.html)
- [CreateAssetMenu Attribute](https://docs.unity3d.com/ScriptReference/CreateAssetMenuAttribute.html)
- [UnityEvent Documentation](https://docs.unity3d.com/ScriptReference/Events.UnityEvent.html)

# Failure handling

**Listeners not receiving events:**
- Verify the GameEventListener has the correct GameEvent asset assigned in the Inspector
- Check that the same SO asset instance is referenced on both producer and consumer (not duplicates with same name)
- Confirm OnEnable/OnDisable are calling RegisterListener/UnregisterListener — add Debug.Log to verify
- Ensure the producer is actually calling Raise() — add Debug.Log before the Raise call

**SO values reset between scene loads:**
- Check that the SO asset is not being instantiated at runtime via ScriptableObject.CreateInstance
- Verify the SO is a project asset referenced directly, not a runtime-created instance
- For data that must persist, ensure the SO is referenced by a persistent DontDestroyOnLoad object or Addressable

**UnityEvent callbacks show as "Missing":**
- The target GameObject was destroyed but the listener wasn't unregistered
- Verify OnDisable calls UnregisterListener before the object destroys
- Check for null reference on gameEvent before calling UnregisterListener

**Event ordering problems:**
- SO events fire in registration order by default
- If ordering matters, document the expected order in developerDescription
- For strict ordering, add a priority field to GameEventListener and sort listeners by priority in Raise()

**Memory leaks or lingering references:**
- Ensure every RegisterListener has a matching UnregisterListener in OnDisable
- Check that destroyed objects are removed from RuntimeSets
- Use the Profiler to verify GameEventListener instances are garbage collected when GameObjects destroy

**Performance issues with many events:**
- Profile with Unity Profiler to confirm events are the bottleneck
- If raising >1000 events/frame, consider switching to C# events for that specific high-frequency system
- Avoid searching or iterating large RuntimeSets every frame — cache results or use events instead
