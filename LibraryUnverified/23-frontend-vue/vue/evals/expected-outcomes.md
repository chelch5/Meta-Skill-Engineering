# Expected Outcomes

A valid Vue skill response must:

1. **Trigger correctly** — Only fire when task involves Vue 3, Composition API, or Vue-specific patterns (components, Pinia, Vue Router).
2. **Include all output sections** — Response must contain: `Detected Stack Signals`, `Chosen Pattern`, `Implementation Notes`, `Validation`.
3. **Stay scoped** — Keep advice within Vue/frontend domain; defer backend, styling-only, or framework migration questions to appropriate skills.
4. **Provide actionable code** — Give TypeScript-typed examples using `<script setup>`, proper `defineProps`/`defineEmits` typing, and composable patterns.
5. **Include validation steps** — Specify concrete verification: type check (`vue-tsc --noEmit`), dev server test, build check.
6. **Address failures** — When errors occur, diagnose: type errors, reactivity issues, store/router setup problems, composable misuse, or build failures.
7. **Signal uncertainty** — When project context is incomplete, explicitly state assumptions and request missing information.
