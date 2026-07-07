# Direction Provider — utility research brief

Tier 3 utils floor (protocol steps 1–2 + quick issue search). Mined 2026-07-06 from source (`packages/react/src/direction-provider/`), docs (`docs/src/app/(docs)/react/utils/direction-provider/page.mdx`), `_mining/handbook-extracts.md`, `_mining/issues-prs.md`, and a `gh` issue search. Evidence tags: [E]/[I]/[G].

## 1. Identity

- **Name / subpath**: `DirectionProvider` — `@base-ui/react/direction-provider`. Context provider (no DOM of its own) plus a public hook.
- **Exports**: `DirectionProvider`, `useDirection()`, type `TextDirection` (`'ltr' | 'rtl'`) (`index.ts`). Props: `children`, `direction` (default `'ltr'`).
- **Status**: stable; founding-era — PR [mui/base-ui#931](https://github.com/mui/base-ui/pull/931) "[core] Add DirectionProvider"; `useDirection` made public in PR [#3082](https://github.com/mui/base-ui/pull/3082).
- **Taxonomy / purpose**: environment/configuration provider (i18n). Docs subtitle: "Enables RTL behavior for Base UI components." Wraps the app or an RTL subtree.

## 2. Intention

- [E] **Origin decision** — issue [#831](https://github.com/mui/base-ui/issues/831) (internal): "We have decided that RTL setup should be: 1. Use a `DirectionProvider` to configure RTL component behavior for an app (or part of an app), and 2. Set `dir="rtl"` accordingly in the html to affect styling, ideally in the `<html>` tag… We do not set the `dir` attribute on components by default, but users are free to do so if they wish." Implemented in PR [#931](https://github.com/mui/base-ui/pull/931).
- [E] **Behavior-only by design**: "`<DirectionProvider>` enables child Base UI components to adjust behavior based on RTL text direction, but does not affect HTML and CSS. The `dir="rtl"` HTML attribute or `direction: rtl` CSS style must be set additionally by your own application code" (`page.mdx`). Reaffirmed when challenged in [#3041](https://github.com/mui/base-ui/issues/3041): "setting the `dir` attribute is all or nothing… we decided to not set it to separate the HTML/CSS concerns from configuring the behavior" (maintainer comment).
- [E] **`useDirection` rationale** (PR [#3082](https://github.com/mui/base-ui/pull/3082)): "Since we intentionally do not set the `dir` attribute, providing this hook seems the best way to handle the issue with portalled components and makes building custom wrapping components easier" — closes #3041.
- [I] The intention in one line: a single declarative source of truth for *logical* direction (keyboard semantics, positioning sides) while leaving *visual* direction (HTML/CSS) entirely to the app.

## 3. When to use

- [E] Any app or subtree rendered in an RTL language: wrap it so composite keyboard behavior and positioning flip (hero demo: a Slider under `<div dir="rtl">` + `<DirectionProvider direction="rtl">`, `demos/hero`).
- [E] Per-section mixing: it configures "an app (or part of an app)" (#831) — wrap only the RTL region.
- [E] `useDirection()` when you need the current direction outside the styled tree — "useful for wrapping portaled components that may be rendered outside your application root and are unaffected by the `dir` attribute set within" (`page.mdx`), e.g. setting `dir` on a `Tooltip.Popup` yourself, and for custom wrapper components (PR #3082).
- [I] Direction-aware components consuming it internally today include Slider, Composite (arrow-key navigation), Menu, Select, ScrollArea, NavigationMenu, Combobox, OTPField, and anchored positioning (`grep useDirection` across `packages/react/src`, ~15 non-test files) — if you use any of these in RTL, you need the provider.

## 4. When not to use + alternatives

- [E] It is NOT a layout tool: to flip visuals use `dir="rtl"` on `<html>` (or the region) and CSS logical properties/`:dir()` — the provider "does not affect HTML and CSS" (`page.mdx`; #831 recommends both together, always).
- [I] LTR-only apps: unnecessary; every consumer defaults to `'ltr'` without a provider (`DirectionContext.ts` fallback; pinned by test "defaults useDirection to ltr outside a provider").
- [I] Reading `document.dir` at runtime as an alternative: not equivalent — Base UI components read only the context, not the DOM attribute, so the provider is the sole behavioral switch [I from source: `useDirection` reads context only].

## 5. Anatomy & composition

- [E] `<DirectionProvider direction="rtl">…</DirectionProvider>` wrapped around the app/subtree, paired with your own `dir` attribute (`page.mdx` Anatomy; hero demo pairs both). Nested providers override for their subtree [I — plain React context in `DirectionProvider.tsx`].

## 6. Behavior ("How it works")

- [E] Provides `{ direction }` through `DirectionContext`; `useDirection()` returns `context?.direction ?? 'ltr'` (`internals/direction-context/DirectionContext.tsx`).
- [E] Consumers adjust *interaction* semantics: e.g. arrow-key direction in composite widgets, slider thumb movement, and logical popup sides — RTL gaps were fixed per component over time (ScrollArea didn't read it: [#1189](https://github.com/mui/base-ui/issues/1189), closed; Tabs RTL keyboard navigation: [#59](https://github.com/mui/base-ui/issues/59), closed; logical `side` prop: [#951](https://github.com/mui/base-ui/issues/951), closed).
- [E] No DOM output, no `dir` attribute written — ever (#831, #3041).
- [G] SSR: nothing direction-specific found in source/docs; plain context should be SSR-inert.

## 7. Accessibility contract

- [G] n/a as a widget — no ARIA/roles. Its a11y weight is indirect: correct arrow-key direction for RTL users in composite widgets (the reason it exists, #831/#59); the app still owns `dir` so screen readers and the browser see true document directionality (`page.mdx`).

## 8. Prop-level guidance

- **`direction`** (`'ltr' | 'rtl'`, default `'ltr'`) — "The reading direction of the text" (`DirectionProvider.tsx` JSDoc). Set `'rtl'` together with your own `dir="rtl"`/CSS; setting only one desynchronizes behavior from layout (see Pitfalls).
- **`useDirection()`** — read-only accessor; primary uses: apply `dir` to portaled popups manually, build direction-aware custom components (PR #3082, `page.mdx`).

## 9. Decision log

- 2024 — [#831](https://github.com/mui/base-ui/issues/831): two-part RTL setup decided (provider = behavior; `dir`/CSS = presentation; no auto-set `dir`). Landed via PR [#931](https://github.com/mui/base-ui/pull/931), commit `0559f51db`.
- 2024–2025 — per-component RTL adoption fixes: [#59](https://github.com/mui/base-ui/issues/59) (tabs keyboard), [#1189](https://github.com/mui/base-ui/issues/1189) (scroll area ignored provider), [#951](https://github.com/mui/base-ui/issues/951) (logical `side` values for menus).
- 2025 — [#3041](https://github.com/mui/base-ui/issues/3041) "Should DirectionProvider set `dir` on portalled elements?" → no; instead `useDirection` exported publicly (PR [#3082](https://github.com/mui/base-ui/pull/3082)).
- Open — [#4402](https://github.com/mui/base-ui/issues/4402): logical values for `swipeDirection` (drawer/toast) — RTL logical-value work continues.

## 10. Pitfalls & FAQ

- [E] **Expecting layout to flip**: provider alone changes behavior only; visuals stay LTR until you set `dir="rtl"`/CSS yourself (`page.mdx`; #831).
- [E] **Portaled popups don't inherit your `dir` attribute**: a `Tooltip.Popup`/`Menu.Popup` portaled to `<body>` escapes the `dir` region; the provider deliberately won't set it — read `useDirection()` and set `dir` on the popup yourself; maintainers themselves note "it is a bit annoying to have to manually set this on every nested positioner level" ([#3041](https://github.com/mui/base-ui/issues/3041) + the `rtl.tsx` experiment it references).
- [I] **Inverse pitfall — `dir="rtl"` without the provider**: layout flips but arrow keys/slider dragging keep LTR semantics, since components read only the context. Symptom: "keyboard moves the wrong way in RTL". Correction: always pair both (#831's two-step setup).
- [E] **Assuming all components honor it**: coverage was patched per component (#1189) and logical-value gaps remain (#4402, open) — verify per component in RTL.
- [G] No misuse reports found beyond the above (search: "DirectionProvider", 6 results, all accounted for).

## 11. Real-world patterns observed

n/a per brief §11.1 — utils carry no D data.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 1 story (RTL flip of a composite component).
