# useRender — utility research brief

Tier 3 utils floor (protocol steps 1–2 + quick issue search). Mined 2026-07-06 from source (`packages/react/src/use-render/`), docs (`docs/src/app/(docs)/react/utils/use-render/page.mdx`), `_mining/handbook-extracts.md`, `_mining/issues-prs.md`, and a `gh` issue search. Evidence tags: [E]/[I]/[G].

## 1. Identity

- **Name / subpath**: `useRender` — `@base-ui/react/use-render`. A **hook**, not a component; the only rendering primitive among the four utils.
- **Exports**: `useRender` plus types `HTMLProps`, `ComponentRenderFn` (`index.ts`); namespace types `useRender.ComponentProps`, `.ElementProps`, `.RenderProp`, `.Parameters`, `.ReturnValue`, `.State`.
- [E] **What it is in source**: a thin public wrapper over the internal engine every Base UI part uses — `useRenderElement(params.defaultTagName ?? 'div', params, params)` (`useRender.ts`). Consumers get the exact machinery of Base UI's own parts.
- **Status**: stable; public since PR [mui/base-ui#1418](https://github.com/mui/base-ui/pull/1418).
- **Taxonomy / purpose**: composition utility. Docs subtitle: "Hook for enabling a render prop in custom components" — it lets *your* components speak Base UI's composition protocol.

## 2. Intention

- [E] **Origin**: issue [#1315](https://github.com/mui/base-ui/issues/1315) asked for a Radix-`<Slot/>`-style helper so users could build their own render-prop-capable components. The team chose a **hook instead of a Slot component**: "We discussed this among the team and decided that a hook may be a better abstraction than `<Slot/>`" (mj12albert). Shipped in PR [#1418](https://github.com/mui/base-ui/pull/1418) (mnajdova); renamed `useRenderer` → `useRender` (colmtuite); `state` support kept ("let's make the render prop fully featured", michaldudak); `customStyleHookMapping`/className-callback extras deferred to keep the API minimal; `mergeProps` shipped separately at atomiks' insistence (`_mining/issues-prs.md` #1315→#1418 entry).
- [E] **Doctrine it serves**: the `render` prop is Base UI's permanent composition primitive — the `asChild` challenge ([#3983](https://github.com/mui/base-ui/issues/3983)) was rebuffed ("unlikely we'll change this API", michaldudak; rationale: explicitness, no `cloneElement`, children always mean children). `useRender` is the blessed way to extend that convention to userland; docs frame it directly as the Radix `Slot` migration target ("Radix UI uses an `asChild` prop, while Base UI uses a `render` prop", `page.mdx`).
- [E] **Intended altitude**: "The `render` prop is primarily designed for composing event handlers and behavioral props. In most cases it should render the same tag as the default element" (`page.mdx`).
- [I] Non-goal: a generic polymorphic `as`-prop system — polymorphism is possible but explicitly second-class and requires care (see Pitfalls).

## 3. When to use

- [E] Building your own design-system primitives (Text, Button, Card…) that must accept `render` like Base UI parts do — the docs' Text/Counter demos (`demos/render`, `demos/render-callback`).
- [E] Migrating a Radix `Slot`-based component: the docs give a line-for-line `Slot.Root` → `useRender` equivalence (`page.mdx` "Migrating from Radix UI").
- [E] When your component has internal state to expose to consumers' render callbacks: pass `state`; it is forwarded as the second argument and auto-converted to `data-*` attributes (`useRender.ts` JSDoc; tests pin boolean/number conversion and `stateAttributesMapping`).
- [E] Merging an internal ref with the consumer's ref: the `ref` option accepts an array, "letting both parties have access to the underlying DOM element" (`page.mdx` "Merging refs").

## 4. When not to use + alternatives

- [E] Consuming a Base UI component: use its built-in `render` prop; `useRender` is only for authoring *new* render-prop hosts (`page.mdx` framing).
- [E] Merging props inside a render callback: that's `mergeProps` alone — no hook needed ([merge-props brief](../merge-props/brief.md)).
- [E] Reading Base UI part state from outside: use the `render`/`className` callbacks' `state` arg or controlled props — public context hooks were rejected ([#4329](https://github.com/mui/base-ui/issues/4329), mj12albert).
- [I] Don't reach for it to render a static element with no `render` prop in its API — plain JSX suffices; the hook's value is the protocol.

## 5. Anatomy & composition

- One hook call returning a `React.ReactElement` (or `null` when `enabled: false`); no parts. Canonical shape (docs TypeScript example): destructure `{ render, ...props }`, build `defaultProps: useRender.ElementProps<'button'>`, call `useRender({ defaultTagName, render, state, props: mergeProps(defaultProps, props) })`, return the element.
- [E] React version split: React 19 needs no `forwardRef` ("the external ref prop is already contained inside `props`"); React 17/18 need `forwardRef` plus the forwarded ref in the `ref` array (`page.mdx` "Merging refs").

## 6. Behavior ("How it works")

- [E] **Element form** (`render={<a />}`): props merged via `mergeProps` (handlers chained, className/style joined), Base UI's merged ref wins deliberately (`mergedProps.ref = props.ref`, `internals/useRenderElement.tsx`).
- [E] **Function form** (`render={(props, state) => …}`): called as a plain function; nothing is merged for you — "props are not merged automatically" (merge-props `page.mdx`); you own the spread.
- [E] `state` → `data-*` attributes automatically; explicit props override state-derived attributes; `stateAttributesMapping` customizes conversion (tests in `useRender.test.tsx`).
- [E] Default-tag safety nets from the shared engine: `defaultTagName: 'button'` auto-adds `type="button"`; `img` auto-adds `alt=""` (`useRenderElement.tsx` `renderTag`).
- [E] Dev-only guardrails: an invalid element passed to `render` throws "Base UI: The `render` prop was provided an invalid React element…" (error hardened in [#3779](https://github.com/mui/base-ui/pull/3779)); an uppercase-named function triggers a console warning that a component was passed as `render={Component}` and "can break the Rules of Hooks during reconciliation" (`warnIfRenderPropLooksLikeComponent`, added after [#4039](https://github.com/mui/base-ui/issues/4039)).
- [G] SSR: no util-specific SSR notes beyond the library-wide "element identity must be knowable before hydration" rationale (`_mining/handbook-extracts.md`, SSR section).

## 7. Accessibility contract

- [G] n/a as a widget — renders whatever you tell it to; the a11y-relevant behaviors are the `type="button"`/`alt=""` defaults (§6) and the library's `nativeButton` polymorphism signal (§10). No ARIA managed here (checked source + docs).

## 8. Prop-level guidance (hook parameters)

- **`render`** — element or `(props, state) => element`. Use the element form by default (auto-merge); use the function form for spread control or state-dependent output ("If you are working in an extremely performance-sensitive application…", composition handbook).
- **`props`** — "merged with the internal props of the component, so that event handlers are merged, `className` strings and `style` properties are joined, while other external props overwrite the internal ones" (`useRender.ts` JSDoc). Pre-merge defaults with user props via `mergeProps(defaultProps, otherProps)` — defaults leftmost so user props win.
- **`ref`** — single ref or **array of refs to merge**; this is the sanctioned ref-merging path (contrast: `mergeProps` never merges refs).
- **`state`** — second arg to render callbacks + auto `data-*`; pair with `useRender.ComponentProps<'tag', State>` for typing (docs Counter demo).
- **`enabled`** — `false` skips internal logic and returns `null`; "useful for rendering a component conditionally" (`useRender.ts` JSDoc).
- **`defaultTagName`** — default `'div'`; optional since [#2690](https://github.com/mui/base-ui/issues/2690) was resolved.
- **Types**: `useRender.ComponentProps<'tag', State>` for the public props (includes `render`); `useRender.ElementProps<'tag'>` for internal element props (`page.mdx` TypeScript section).

## 9. Decision log

- 2024-12 — [#1315](https://github.com/mui/base-ui/issues/1315): Slot component rejected; hook chosen. Shipped as `useRender` in PR [#1418](https://github.com/mui/base-ui/pull/1418) (2025), deliberately minimal, `mergeProps` split out.
- 2025 — hardened: async/lazy components ([#2859](https://github.com/mui/base-ui/issues/2859), lazy-element unwrap workaround visible in `useRenderElement.tsx`); better error messages ([#3779](https://github.com/mui/base-ui/pull/3779)); missing type exports ([#3565](https://github.com/mui/base-ui/pull/3565)).
- 2026 — [#4039](https://github.com/mui/base-ui/issues/4039) (closed): `render={Component}` crashes during React reconciliation → dev warning added (§6).
- Open: [#3879](https://github.com/mui/base-ui/issues/3879) stronger optional type safety; [#3258](https://github.com/mui/base-ui/issues/3258) extending component state when wrapping useRender-powered primitives.

## 10. Pitfalls & FAQ

- [E] **Passing a component instead of a callback**: `render={MyButton}` → React treats each call as a new function identity; hooks inside crash during reconciliation ([#4039](https://github.com/mui/base-ui/issues/4039)). Correction: `render={<MyButton />}` or `render={(props) => <MyButton {...props} />}`; never call hooks inside a render function (dev warning text, `useRenderElement.tsx`).
- [E] **Forgetting to spread props in the function form** → component silently loses handlers/refs; the custom component contract is "forward the `ref`, and spread all the received props" (composition handbook).
- [E] **Polymorphism without a signal**: switching tags can leave invalid defaults (`type="button"` on an `<a>`); Base UI's Button solves this with `nativeButton` — mirror that pattern in your own components (`page.mdx` "Render prop and polymorphism"; [#1909](https://github.com/mui/base-ui/pull/1909) convention).
- [E] **Nesting a useRender element into another `render` prop** historically failed ([#3461](https://github.com/mui/base-ui/issues/3461), closed) — compose via nested `render` props instead.
- [E] **TS friction**: `data-*` attributes erroring on `ElementProps` ([#2370](https://github.com/mui/base-ui/issues/2370) closed, [#3545](https://github.com/mui/base-ui/issues/3545) open); `exactOptionalPropertyTypes` ergonomics ([#1916](https://github.com/mui/base-ui/issues/1916)).

## 11. Real-world patterns observed

n/a per brief §11.1 — utils carry no D data.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 2 stories (custom render-prop component; typed state + render callback).
