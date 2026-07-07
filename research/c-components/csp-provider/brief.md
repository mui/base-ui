# CSP Provider — utility research brief

Tier 3 utils floor (protocol steps 1–2 + quick issue search). Mined 2026-07-06 from source (`packages/react/src/csp-provider/`), docs (`docs/src/app/(docs)/react/utils/csp-provider/page.mdx`), `_mining/handbook-extracts.md`, `_mining/issues-prs.md`, and a `gh` issue search. Evidence tags: [E]/[I]/[G].

## 1. Identity

- **Name / subpath**: `CSPProvider` — `@base-ui/react/csp-provider`. Single component; renders no DOM of its own — a bare `CSPContext.Provider` (`CSPProvider.tsx`).
- **Exports**: `CSPProvider` + `CSPProvider.Props`/`.State` types (`index.ts`). Props: `children`, `nonce`, `disableStyleElements` (default `false`).
- **Status**: stable; recent addition — PR [mui/base-ui#3553](https://github.com/mui/base-ui/pull/3553) "[csp provider] Add `CSPProvider`" (post-v1.0).
- **Taxonomy / purpose**: environment/configuration provider. Docs subtitle: "Configures CSP-related behavior for inline tags rendered by Base UI components." Set once near the app root.

## 2. Intention

- [E] **Origin**: issue [#3550](https://github.com/mui/base-ui/issues/3550) "Incompatibility with strict CSPs" — "Scroll Area does not work with strict CSPs as there's inline styles" (v1.0.0) → PR [#3553](https://github.com/mui/base-ui/pull/3553).
- [E] **Why inline tags exist at all**: "Some Base UI components render inline `<style>` or `<script>` tags for functionality such as removing scrollbars or pre-hydration behavior. Under a strict Content Security Policy (CSP), these tags may be blocked unless they include a matching nonce attribute" (`page.mdx`). Concretely: `<ScrollArea.Viewport>` and `<Select.Popup>`/`<Select.List>` with `alignItemWithTrigger` inject a scrollbar-hiding `<style>`; a pre-hydration `<script>` exists for opt-in behaviors (source consumers of `CSPContext`: `internals/PrehydrationScript.tsx`, `scroll-area/root/ScrollAreaRoot.tsx`, `select/popup/SelectPopup.tsx`).
- [E] **Design**: "`CSPProvider` allows configuring this behavior globally for all Base UI components within its tree" (`page.mdx`) — one provider instead of per-part `nonce` props.
- [I] Non-goal: covering inline `style=""` *attributes* — explicitly out of scope; the docs delegate that to `style-src-attr` strategy (§6).

## 3. When to use

- [E] Your app enforces a CSP whose `style-src`/`style-src-elem` or `script-src` lacks `'unsafe-inline'`: generate a per-request nonce, put it in the CSP header, pass the same nonce to `<CSPProvider nonce>` (`page.mdx` "Supplying a nonce", 3-step server recipe).
- [E] You'd rather ship no injected style tags at all: `disableStyleElements` + copy the documented `.base-ui-disable-scrollbar` CSS into your own stylesheet (`page.mdx` "Disable inline style elements" shows the exact rules).
- [I] Environments hostile to runtime DOM `<style>` injection generally (strict extension/e-commerce platform CSPs) — same mechanism applies.

## 4. When not to use + alternatives

- [E] No strict CSP → unnecessary; components render their inline tags by default (test: "renders inline style tags by default", `CSPProvider.test.tsx`).
- [E] Your CSP also blocks style *attributes* (`style-src-attr`): CSPProvider can't help; the three documented options are (1) relax `style-src-attr`/use `style-src-elem`, (2) client-only render the affected components, (3) manually unset inline styles per part (`<ScrollArea.Viewport style={{ overflow: undefined }}>` — "you'll need to ensure you vet upgrades for any new inline styles") (`page.mdx` "Inline style attributes"; the unset idiom also blessed in [#1110](https://github.com/mui/base-ui/issues/1110), atomiks).
- [E] Wanting to suppress inline `<script>` tags: no flag exists — "`<script>` tags across all components are opt-in… A `nonce` is required if any component uses inline scripts" (`page.mdx`).

## 5. Anatomy & composition

- [E] Wrap once around the app or a subtree: `<CSPProvider nonce="…">{app}</CSPProvider>` (`page.mdx` Anatomy). No parts; nesting a second provider overrides the context below it [I from plain React context semantics in `CSPProvider.tsx`].

## 6. Behavior ("How it works")

- [E] Provides `{ nonce, disableStyleElements }` via `CSPContext`; consumers read it with the internal `useCSPContext()` which falls back to `{ disableStyleElements: false }` outside a provider (`internals/csp-context/CSPContext.ts`).
- [E] With `nonce`: every Base UI-rendered inline `<style>`/`<script>` gets the nonce attribute so the browser admits it under the header policy (`page.mdx`; test "applies nonce to inline style tags").
- [E] With `disableStyleElements`: ScrollArea/Select style tags are simply not rendered — scrollbar hiding becomes your CSS's job (tests: "does not render inline style tags…", "does not render Select inline style tags…").
- [E] SSR relevance: the nonce must be identical between the HTTP header and the server-rendered markup — "Generate a random nonce per request… Pass the same nonce into CSPProvider during rendering" (`page.mdx`); inline scripts serve "pre-hydration behavior" (`page.mdx`; see also v1.4.0's "Skip client-only prehydration scripts", `_mining/handbook-extracts.md` SSR section).

## 7. Accessibility contract

- [G] n/a — non-rendering configuration provider; no ARIA/keyboard surface (checked source + docs).

## 8. Prop-level guidance

- **`nonce`** — "The nonce value to apply to inline `<style>` and `<script>` tags" (`CSPProvider.tsx` JSDoc). Use whenever a CSP requires nonces; must be random per request and mirrored in `style-src-elem`/`script-src`.
- **`disableStyleElements`** (default `false`) — "Whether inline `<style>` elements created by Base UI components should not be rendered. Instead, components must specify the CSS styles via custom class names or other methods" (JSDoc). Use to avoid nonce plumbing entirely; you then own the `.base-ui-disable-scrollbar` rules. Does not affect `<script>` tags (`page.mdx`).

## 9. Decision log

- 2025/2026 — [#3550](https://github.com/mui/base-ui/issues/3550) reported ScrollArea broken under strict CSP → PR [#3553](https://github.com/mui/base-ui/pull/3553) added `CSPProvider` (nonce + `disableStyleElements`), commit `8e096be39`.
- Precedent — [#1110](https://github.com/mui/base-ui/issues/1110): keep only minimal functional inline styles, avoid `<style>`-tag style delivery where possible, allow per-prop unsetting (atomiks) — the philosophy the "Inline style attributes" docs section operationalizes.
- Related friction — [#2619](https://github.com/mui/base-ui/issues/2619) (closed): ScrollArea's injected scrollbar-disabling style tag surprised a Tiptap NodeView integration — evidence that style-tag injection has non-CSP side effects too.
- [G] No open feature requests found against CSPProvider itself (search: "CSP", 2 results, both above).

## 10. Pitfalls & FAQ

- [E] **Nonce mismatch**: header nonce ≠ rendered nonce → tags still blocked; the recipe requires the *same* per-request value in both places (`page.mdx`).
- [E] **Expecting it to fix `style=""` attribute violations** — it "does not cover inline style attributes"; that's `style-src-attr` territory with its own three workarounds (`page.mdx`).
- [E] **`disableStyleElements` without replacement CSS** → ScrollArea/Select show native scrollbars; you must add the documented `.base-ui-disable-scrollbar` rules yourself [I consequence; CSS given in `page.mdx`].
- [E] **Assuming `disableStyleElements` also silences scripts** — script tags have "no disable flag"; nonce is mandatory if any inline script is used (`page.mdx`).
- [I] **Placing the provider below the components that inject tags** → those subtrees fall back to the no-nonce default (`useCSPContext` fallback); wrap at the root.

## 11. Real-world patterns observed

n/a per brief §11.1 — utils carry no D data.

## 12. Story plan

See [story-plan.md](./story-plan.md) — MDX-only, no story (nothing visual to render).
