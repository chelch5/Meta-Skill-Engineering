---
name: vue
description: >-
  Build Vue 3 apps with TypeScript, Composition API, and <script setup>.
  Triggers when: (1) user mentions Vue/Vue 3 in context, (2) files end in .vue,
  (3) package.json contains vue dependency, (3) task involves creating or
  modifying Vue components/stores/routes. Does NOT trigger for: React,
  Angular, Svelte, generic CSS styling, or backend API work.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: vue
  maturity: draft
  risk: low
  tags: [vue, vue3, composition-api, script-setup, pinia, vue-router]
---

# Purpose

Build Vue 3 applications using Composition API with `<script setup>`, Pinia for state management, and Vue Router for navigation.

# When to use

- Writing Vue 3 components with `<script setup>` syntax
- Managing state with Pinia stores (replacing Vuex)
- Implementing Vue Router with navigation guards and dynamic routes
- Migrating from Options API to Composition API
- Project uses Vue dependency in package.json

# When NOT to use

- Building React apps — use `react-typescript`
- Building Svelte apps — use `svelte`
- Pure styling tasks without Vue components — use `tailwind-shadcn`
- Backend API development — use relevant backend skill

# Procedure

1. **Detect stack** — Verify Vue 3 in package.json or .vue files. Check if project uses TypeScript, Pinia, Vue Router.
2. **Create component** — Use `<script setup lang="ts">` for auto-imports and better type inference.
3. **Declare reactive state** — Use `const count = ref(0)` for primitives; `reactive()` for complex objects. Prefer `ref` for consistency across component boundaries.
4. **Computed values** — Use `const doubled = computed(() => count.value * 2)`. Dependencies auto-track.
5. **Watch effects** — Use `watch(source, callback)` for explicit dependency watching; `watchEffect()` for auto-tracking. Always clean up in `onUnmounted` if watchers have side effects.
6. **Set up Pinia** — Create stores with `defineStore('name', () => { ... })` using setup syntax. Keep store logic colocated with related components.
7. **Configure Router** — Define routes with `createRouter({ history: createWebHistory(), routes })`. Add `beforeEach` guards for auth checks. Use `meta` fields for route metadata.
8. **Composables** — Extract reusable logic into `use*` functions. Examples: `useFetch` for data fetching, `useLocalStorage` for persistence, `useDebounce` for input handling.
9. **Type props and emits** — Use `defineProps<{ title: string; count?: number }>()` for props. Use `withDefaults` for defaults. Type `defineEmits<{(e: 'update', value: number): void}>()` for events.
10. **Validate output** — Run `vue-tsc --noEmit` to check types. Run `npm run dev` or `npm run build` to verify no runtime errors.

# Script setup component

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  title: string;
  initialCount?: number;
}>(), { initialCount: 0 });

const emit = defineEmits<{
  (e: 'update', value: number): void;
}>();

const count = ref(props.initialCount);
const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
  emit('update', count.value);
}

onMounted(() => { console.log('Mounted'); });
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <button @click="increment">{{ count }} ({{ doubled }})</button>
  </div>
</template>
```

# Pinia store

```ts
// stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => user.value !== null);

  async function login(email: string, password: string) {
    user.value = await api.login(email, password);
  }

  function logout() {
    user.value = null;
  }

  return { user, isLoggedIn, login, logout };
});
```

# Vue Router with guards

```ts
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/Home.vue') },
    { path: '/dashboard', component: () => import('./pages/Dashboard.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});
```

# Decision rules

- Always use `<script setup>` — less boilerplate, better type inference, auto-imports.
- `ref` for primitives, `reactive` for objects — prefer `ref` for consistency (unwrap with `.value`).
- Pinia setup syntax over options syntax — mirrors Composition API patterns.
- Lazy-load route components — `() => import('./Page.vue')` for code splitting.
- Extract shared logic into composables (`use*` functions) — do not duplicate across components.
- Include accessibility attributes (`aria-label`, `role`) on interactive elements.
- Handle loading and error states explicitly in UI — no happy-path-only components.

# Output contract

Every response must include:

1. **Detected Stack Signals** — Identify: Vue version (3.x), TypeScript presence, Pinia/Vue Router usage.
2. **Chosen Pattern** — State which pattern was selected: component structure, store setup, routing, or composable.
3. **Implementation Notes** — Provide code with TypeScript types, explain key decisions.
4. **Validation** — List verification steps: type check, dev server test, build check.

# Failure handling

- **Type errors in `defineProps`**: Verify TypeScript version >=4.5. Check `vue-tsc` is installed. Ensure `shims-vue.d.ts` exists if using older setups.
- **`ref` not reactive**: Confirm you are accessing `.value`, not the ref object directly. Check for accidental destructuring of reactive objects.
- **Pinia store not accessible**: Verify store is imported in component, not defined inline. Check `createPinia()` is called in main.ts before mounting app.
- **Router guards not firing**: Ensure `router` is passed to `app.use(router)` before `app.mount()`. Check guard is registered with `router.beforeEach()`, not `beforeEach` on individual routes.
- **Composables not working**: Verify composable is called at top level of `<script setup>`, not inside conditionals or async functions. Check for missing cleanup in `onUnmounted`.
- **Build failures**: Run `npm run build` and check error output. Common causes: missing `vue-tsc`, type mismatches in templates, circular imports.

# Next steps

After completing Vue work:

- For backend API integration — use relevant backend skill
- For state persistence across sessions — use `skill-adaptation` to customize composables
- For component library documentation — use relevant documentation skill

# References

- https://vuejs.org/guide/introduction.html
- https://pinia.vuejs.org/
- https://router.vuejs.org/
