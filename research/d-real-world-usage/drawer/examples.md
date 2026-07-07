# Drawer — top real-world examples

Mined 2026-07-07/08. Starting point was thin (5 candidates, 2 of which turn out on inspection to be false positives — see below). This pass ran one new GitHub code search targeting the special-knowledge hint in the brief — `"Drawer.SwipeArea"` (`_cache/code-pattern-drawer-swipearea-p1.json`, `total_count` 92, all 92 items fetched — small enough to fetch in full) — plus grepped the registry-tree caches already fetched for other components (`_cache/registry-trees/*.txt`) for drawer/sheet-shaped paths. 12 candidates recorded in `candidates.json` (2 corrected to false positives on inspection); 10 genuine Base UI Drawer usages ranked in `ranked.json`.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans nested drawers, mobile off-canvas navigation, form-integrated real features, a peer project's own Storybook stories, published component-library Storybooks, breadth-of-examples, dual shadcn-naming, and an honest "unskinned primitive" signal.

---

## 1. Dify (langgenius/dify) — the only usage of nested-drawer Indent/IndentBackground

- **Permalink:** https://github.com/langgenius/dify/blob/abd720146d09e71bf8f153b4fddbf1c78d1af038/packages/dify-ui/src/drawer/index.tsx
- **Live:** https://dify.ai
- **License / reuse:** no SPDX license detected / link-only. 147.9k stars, active daily.
- **Parts:** Provider, Indent, IndentBackground, Trigger, SwipeArea, Portal, Title, Description, Close, Backdrop, Viewport, Popup, Content, `createHandle`.
- **Why ranked #1:** The only wrapper found using `Drawer.Indent`/`Drawer.IndentBackground` — the parts that visually recede an already-open drawer when a second, nested drawer opens on top of it — with a full four-direction `swipeDirection` implementation via `data-[swipe-direction=…]` Tailwind transforms. This is first-party evidence of the nested-drawer visual language Base UI's own docs describe, exercised in a real, large product.
- **Story recomposition notes:** *Nested drawers*: open a first drawer, then a second from inside it; interaction shows the first drawer shrink/recede (Indent/IndentBackground) while the second opens on top; closing the second reveals the first restored to full size. Feeds the Anatomy section's Indent/IndentBackground documentation directly.

## 2. Unified Climbing Projects (edouardmisset) — the canonical mobile nav drawer, live

- **Permalink:** https://github.com/edouardmisset/unified-climbing-projects/blob/0d238c2fb56a75d896dc2f596ac2e1898c09ff6b/src/app/_components/navigation/navigation.tsx
- **Live:** https://unified-climbing-projects.vercel.app (mobile nav — resize to a narrow viewport)
- **License / reuse:** no SPDX license detected / link-only. 2 stars, active.
- **Parts:** Root, SwipeArea, Portal, Backdrop, Popup, Title, Close.
- **Why ranked #2:** A real, live site's mobile off-canvas navigation: `swipeDirection='left'`, a `SwipeArea` rendered as a sibling of the trigger so users can swipe open from the screen edge, a `Backdrop`, and a `Popup` holding the full nav list plus a theme toggle. This is the single most relatable, most commonly-needed Drawer use case in the entire set — and it's screenshot-able on a live URL with a narrow viewport.
- **Story recomposition notes:** *Off-canvas mobile nav*: resize the story viewport to mobile width, click the hamburger trigger (or drag from the edge to simulate SwipeArea), assert the nav list and Close button render, click Close (or swipe back) to dismiss. Feeds the "recreation with interaction" real-world story slot directly — arguably the best default hero-style Drawer story.

## 3. Pricey (Julchu) — a real feature: pantry drawer + createHandle + react-hook-form

- **Permalink:** https://github.com/Julchu/pricey/blob/769f03d3567bd754f97fe7949c88e77435e63a58/src/components/pantry/pantry-drawer.tsx
- **Live:** not deployed publicly (personal project; no homepage listed)
- **License / reuse:** MIT / code-ok. 0 stars, active.
- **Parts:** `createHandle`, Root, SwipeArea, Portal, Backdrop, Viewport, Popup.
- **Why ranked #3:** `Drawer.createHandle()` decouples "who owns the open state" from "who renders the trigger" — this pantry-tracking feature uses the handle pattern together with `react-hook-form`, resetting the form to the latest pantry-store snapshot every time the drawer reopens via `onOpenChange`. It is a genuine feature (not a styled shell) showing Drawer composed with external form/state libraries and CSS-variable-driven swipe-progress opacity on the backdrop.
- **Story recomposition notes:** *Handle + form reset*: open the drawer via a handle from an unrelated trigger location, edit a field, close without saving, reopen — assert the form shows the original (not edited) value. Feeds a composition/handbook note on `createHandle` for decoupled triggers plus a state-reset gotcha worth documenting.

## 4. Buckethub (ironbyte0x) — a peer project's own Storybook stories for Drawer

- **Permalink:** https://github.com/ironbyte0x/buckethub/blob/a90b27240202621eb2cbde419dd742e5a1417472/libs/ui/src/components/drawer/drawer.tsx (stories: `drawer.stories.tsx` alongside it)
- **Live:** none found
- **License / reuse:** MIT / code-ok. 1 star, active.
- **Parts:** Root, Trigger, Portal, Backdrop, Viewport, Popup, Header, Title, Description, Close, SwipeArea, `createHandle`.
- **Why ranked #4:** An S3-management platform's UI library wraps Drawer into a `position`-aware compound component (left/right/top/bottom mapped to matching `swipeDirection`s) with iOS-Safari floating-bar height compensation — and, notably, ships its **own `drawer.stories.tsx`**. A peer project already doing exactly the kind of Storybook authoring this project is doing for Base UI's own Drawer is directly useful prior art to consult while writing this project's Drawer stories.
- **Story recomposition notes:** *Position variants*: a controls-driven story cycling `position` through left/right/top/bottom, each opening with its mapped swipe direction — a good "variant matrix" story pattern to borrow structurally (not verbatim, license is MIT/code-ok but still an external project's code).

## 5. Propel (makeplane) — Plane's own component library, with a published Storybook

- **Permalink:** https://github.com/makeplane/propel/blob/4dc5b9530282eab6573cde3686259b904efbce61/packages/propel/src/components/drawer/drawer.tsx (+ `drawer-swipe-area.tsx`)
- **Live:** https://storybook.propel.plane.so — a live, published Storybook for this exact component library
- **License / reuse:** AGPL-3.0 / link-only. Part of Plane, a well-known open-source Linear/Asana-style project-management tool.
- **Parts:** Root, SwipeArea (documented 1:1 mappings; other parts live in a sibling `elements/drawer` styled layer not fetched in this pass).
- **Why ranked #5:** Propel is Plane's own internal component library, and its homepage is a **live, published Storybook** — the most directly relevant prior art found for this project's own Storybook effort, from a real, notable open-source product. Its Drawer file is a clean 1:1 behavior-only re-export with an explicit code comment on the "behavior-only role... lives in `components`; the styled parts live in `elements/drawer`" architecture split, worth citing in a composition/architecture decision note.
- **Story recomposition notes:** Visit the live Storybook directly as a reference for story structure and controls conventions before authoring this project's own Drawer stories; a story here would mirror Propel's minimal Root/SwipeArea composition as the "headless behavior only" baseline example.

---

### Also ranked (6–10, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | nauvalazhar/selia | Broadest example breadth: 9 demo files (direction, nesting, non-modal, scrolling, settings) in one repo | MIT / code-ok |
| 7 | cosscom/coss | Dual `drawer.tsx`/`sheet.tsx` naming, plus a real consumer example (Cal.com-style settings drawer) in its own examples app | AGPL-3.0 / link-only |
| 8 | keenthemes/reui | Same dual naming, with a parallel Radix-backed twin registry style in the same repo — rare same-repo Base-UI-vs-Radix comparison | MIT / code-ok |
| 9 | cloudflare/kumo | Honest "not skinned yet" signal — ships only the bare `export * from "@base-ui/react/drawer"` primitive | MIT / code-ok |
| 10 | baseui-cn/baseui-cn | Weakest-evidence entry — description-only, never file-verified; kept for completeness | MIT / code-ok |

### Diversity coverage of the top set

design-system-embedded product (nested drawers), live mobile-navigation site, real feature with form-library integration, a peer project's own Storybook stories, a well-known OSS product's published component-library Storybook, broadest single-repo example set, dual shadcn-style naming (×2, one with a real consumer), and an honest unskinned-primitive signal.

### Notable non-candidates / false positives (verified and excluded)

- `australia/mobtranslate.com` (`packages/ui/src/components/drawer/drawer.tsx`) and `xuerzong/redis-dash` (`app/src/client/components/ui/Drawer/index.tsx`) — both files are literally named "drawer"/"Drawer" but on inspection import **`Dialog`** from `@base-ui-components/react/dialog`, not Base UI's `Drawer` at all. Both are hand-rolled drawer-like sheets built on the generic Dialog primitive (plausibly predating Drawer's addition to Base UI, given the historical package name). Kept in `candidates.json` with corrected notes for honesty, excluded from `ranked.json`.
- `borabaloglu/9ui` (`apps/www/src/components/ui/drawer.tsx`) — imports `Drawer` from **`vaul-base`**, not `@base-ui/react/drawer` directly. `vaul-base` may itself wrap Base UI's Drawer (the brief's "vaul-successor" framing is suggestive), but that one further hop was not verified in this pass, so it was excluded rather than assumed.
- `chakra-ui/ark` (`website/src/components/ui/primitives/drawer.tsx`) — a coincidental name/API match: it is Ark UI's **own** Drawer (`@ark-ui/react/drawer`), which independently converged on a similarly-named `SwipeArea` part. Not a Base UI usage; excluded.
