# mergeProps — utility research brief

Tier 3 utils floor (protocol steps 1–2 + quick issue search). Mined 2026-07-06 from source (`packages/react/src/merge-props/`), docs (`docs/src/app/(docs)/react/utils/merge-props/page.mdx`), `_mining/handbook-extracts.md`, `_mining/issues-prs.md`, and a `gh` issue search. Evidence tags: [E]/[I]/[G].

## 1. Identity

- **Name / subpath**: `mergeProps` (+ `mergePropsN`) — `@base-ui/react/merge-props`. Pure functions, no React rendering, no hook rules.
- **Exports**: `mergeProps` (up to 5 args, overloaded), `mergePropsN` (array form) (`mergeProps.ts`, `index.ts`).
- **Status**: stable; public since PR [mui/base-ui#1535](https://github.com/mui/base-ui/pull/1535) "[mergeProps] Convert as a top level import and export publicly".
- **Taxonomy / purpose**: composition utility — the prop-merging half of the render-prop protocol. Docs subtitle: "A utility to merge multiple sets of React props."

## 2. Intention

- [E] **Why it exists**: the function form of the `render` prop hands you raw props and merges nothing — "When using the function form of the `render` prop, props are not merged automatically. You can use `mergeProps` to combine Base UI's props with your own" (`page.mdx`). It is the same merger Base UI's own parts use internally (`internals/useRenderElement.tsx` imports it), exposed so userland merging behaves identically.
- [E] **Shipped deliberately alongside `useRender`**: in the #1315→#1418 Slot-vs-hook decision, "`mergeProps` shipped separately at atomiks' insistence" — a standalone primitive rather than a hook feature (`_mining/issues-prs.md`).
- [E] **Design center**: "It behaves like `Object.assign` (rightmost wins) with a few special cases, so common React patterns work as expected" (`page.mdx`) — predictability over configurability.
- [I] Non-goal: smart className deduplication/conflict resolution (e.g. tailwind-merge) — plain concatenation only; a custom-merger hook remains an open request ([#2674](https://github.com/mui/base-ui/issues/2674)).

## 3. When to use

- [E] Inside the function form of any Base UI part's `render` prop, to combine Base UI's `props` with your own (`page.mdx` example; `prevent-base-ui-handler` demo).
- [E] When authoring custom components with `useRender`: `props: mergeProps(defaultProps, userProps)` so internal defaults yield to consumers (use-render `page.mdx` TypeScript example).
- [E] To cancel a Base UI internal handler: merge a rightmost handler that calls `event.preventBaseUIHandler()` — "Calling it prevents Base UI's internal logic from running. This does not call `preventDefault()` or `stopPropagation()`" (`page.mdx`).
- [E] More than 5 prop sets → `mergePropsN` ("slightly less efficient… only use it when you need to merge more than 5 sets", `page.mdx`).

## 4. When not to use + alternatives

- [E] Element-form `render` (`render={<button />}`): merging is automatic — calling `mergeProps` yourself is redundant (composition handbook; use-render brief §6).
- [E] Merging refs: **never** this utility — "`ref` is not merged. Only the rightmost ref is kept" (`page.mdx`; source JSDoc `@important`). Use `useRender`'s `ref` array instead.
- [E] Vetoing *change events* (`onOpenChange` etc.): prefer `eventDetails.cancel()` — `preventBaseUIHandler` "should be used as an escape hatch in cases where there isn't a prop yet to customize the behavior" (customization handbook; eventDetails design in PR [#2382](https://github.com/mui/base-ui/pull/2382)).
- [I] Simple one-off overrides with no handler/className collisions: plain spread order suffices.

## 5. Anatomy & composition

- [G] n/a — no parts, no DOM; a pure function `mergeProps(a, b, c?, d?, e?)` returning one props object (checked `mergeProps.ts`).

## 6. Behavior ("How it works") — the merge contract

- [E] Rightmost wins for ordinary keys: `mergeProps({ id: 'a' }, { id: 'b' })` → `{ id: 'b' }` (`page.mdx`).
- [E] **Event handlers are chained, executed right-to-left** (rightmost first). In `mergeProps(internal, user)` the *user* handler runs before Base UI's — that ordering is what makes `preventBaseUIHandler()` able to stop the internal one (`mergeEventHandlers` in `mergeProps.ts`; `_mining/handbook-extracts.md`).
- [E] `preventBaseUIHandler` exists only for React **synthetic** events (detected via `'nativeEvent' in event`); "For non-synthetic events (custom events with primitive/object values), this mechanism isn't available and all handlers always execute" (`page.mdx`; `isSyntheticEvent`).
- [E] `className` concatenated right-to-left: `mergeProps({className:'a'},{className:'b'})` → `'b a'` (`page.mdx`; `mergeClassNames`).
- [E] `style` objects merged per-key, rightmost overwrites (`page.mdx`; `mergeObjects`).
- [E] `ref` untouched — rightmost kept (`page.mdx`).
- [E] **Function arguments (props getters)**: a function receives the props merged so far (left→right) and its return value "completely replaces the accumulated props up to that point. If you want to chain event handlers from the previous props, you must call them manually" (`page.mdx`). Getter-returned handlers are also *not* auto-prevented — "They must check `event.baseUIHandlerPrevented` themselves" (`mergeProps.ts` JSDoc).
- [E] Handler detection is name-based: keys matching `on[A-Z]…` whose value is function/undefined (`isEventHandler`, char-code check).
- [E] All extra handler arguments are forwarded (fixed in PR [#4598](https://github.com/mui/base-ui/pull/4598); pinned by `mergeProps.test.ts` "forwards additional arguments…").

## 7. Accessibility contract

- [G] n/a — no rendering, no ARIA (checked source + docs). Indirect a11y relevance: careless rightmost props can overwrite internally-set ARIA attributes [I].

## 8. Prop-or-API guidance

- **Argument order is the API**: put Base UI/internal props LEFT, your overrides RIGHT. Rightmost = wins conflicts = handler runs first = can cancel. Defaults you want overridable go leftmost (use-render docs pattern `mergeProps(defaultProps, props)`).
- **Type parameter**: call as `mergeProps<'button'>(…)` to type the merged result against the target element (docs examples throughout).
- **`preventBaseUIHandler()`** — cancellation escape hatch; no effect where Base UI listens to native events (customization handbook). Sets `event.baseUIHandlerPrevented = true` for downstream checks (`makeEventPreventable`).
- **`mergePropsN(array)`** — only for >5 sets; same semantics.

## 9. Decision log

- 2025 — extracted to a public top-level import in PR [#1535](https://github.com/mui/base-ui/pull/1535), following the #1315/#1418 decision to ship it separately from `useRender` (`_mining/issues-prs.md`).
- 2025-08 — PR [#2382](https://github.com/mui/base-ui/pull/2382) introduced `eventDetails` with `.cancel()`; `preventBaseUIHandler` remains the raw-DOM-handler escape hatch, `eventDetails.cancel()` the change-event surface (design evolved "from `preventBaseUIHandler()` after feedback from vladmoroz").
- 2026 — PR [#4330](https://github.com/mui/base-ui/pull/4330) "[all components] Fix `preventBaseUIHandler` runtime wrapping"; PR [#4598](https://github.com/mui/base-ui/pull/4598) fixed multi-argument handler forwarding (issue [#4597](https://github.com/mui/base-ui/issues/4597): merged handlers received `undefined` args).
- Open: [#2674](https://github.com/mui/base-ui/issues/2674) custom className merging; [#3545](https://github.com/mui/base-ui/issues/3545) TS error with `data-*` attributes; [#3240](https://github.com/mui/base-ui/issues/3240) (closed) generic inference with `Combobox.Root`.

## 10. Pitfalls & FAQ

- [E] **Expecting refs to merge** → only the rightmost survives; symptom: internal or external ref silently dead. Correction: `useRender`'s `ref` array (`page.mdx`).
- [E] **Wrong mental order**: "executed right-to-left" surprises people twice — rightmost handler runs *first*, and rightmost className appears *first* in the string (`'b a'`) (`page.mdx`; tests "merges classNames with rightmost first").
- [E] **Assuming the getter form auto-chains** → a function argument replaces accumulated props; previous handlers vanish unless you call `props.onClick?.(event)` yourself (`page.mdx` "Manually chaining handlers").
- [E] **`preventBaseUIHandler()` on non-synthetic/native paths does nothing** — "In various cases, native events are used instead of React events, so this method has no effect" (customization handbook); same for custom value-events (`page.mdx`).
- [E] **Tailwind class conflicts**: concatenation doesn't resolve `p-2` vs `p-4`; users ask for a tailwind-merge hook ([#2674](https://github.com/mui/base-ui/issues/2674), open). Correction today: pre-merge classNames yourself before passing.
- [E] **Handler args were dropped in a past release** ([#4597](https://github.com/mui/base-ui/issues/4597), fixed by [#4598](https://github.com/mui/base-ui/pull/4598)) — upgrade rather than work around.

## 11. Real-world patterns observed

n/a per brief §11.1 — utils carry no D data.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 1 story (handler order + preventBaseUIHandler with visible log).
