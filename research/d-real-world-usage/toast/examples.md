# Toast — top real-world examples

Mined 2026-07-07. Starting point was thin (4 description/registry-inferred candidates from an earlier compressed pass). This pass ran one new GitHub code search — `"@base-ui/react/toast"` (`_cache/code-import-baseui-react-toast-p1.json`, `total_count` 1,074, 100 items fetched) — plus re-checked the registry trees already cached for `combobox`/`select` (`_cache/registry-trees/*.txt`) for toast-shaped paths. 12 candidates recorded in `candidates.json`; all 12 ranked in `ranked.json` (fewer than 15 exist, so all are kept and ranked honestly rather than padded further). Screenshots: not attempted (separate pass).

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans a design-system-embedded product, a per-toast-positioned research tool, layered-overlay architecture, imperative retrofits, a Figma-parity design system, an Arrow/Action archetype, a Material-Design-3 bridge, an alert-composition idiom, and a NASA credibility anchor.

---

## 1. Dify (langgenius/dify) — the richest Toast composition found

- **Permalink:** https://github.com/langgenius/dify/blob/abd720146d09e71bf8f153b4fddbf1c78d1af038/packages/dify-ui/src/toast/index.tsx
- **Live:** https://dify.ai
- **License / reuse:** no SPDX license detected / link-only. 147.9k stars, active daily.
- **Parts:** Provider, Portal, Viewport, Root, Content, Title, Description, Action, Close, `createToastManager`, `useToastManager`.
- **Why ranked #1:** Dify's in-house design-system Toast, used across its agentic-workflow-builder product. It layers four typed tones (success/error/warning/info) onto the base API, adds a `promise()` helper that mirrors sonner's `toast.promise` (loading → success/error), and drives the stacked-card visual entirely through CSS custom properties Base UI writes to each `Toast.Root` (`--toast-index`, `--toast-frontmost-height`, `--toast-scale`, `--toast-swipe-movement-x/y`, `--toast-peek`) — a complete worked example of the peek/expand/swipe-dismiss stack animation.
- **Story recomposition notes:** *Stack, expand, and dismiss*: fire 3–4 toasts of different tones via the typed helpers (`toast.success(...)`, `toast.error(...)`); interaction = hover to expand the stack, swipe/drag one card to dismiss, click another's `Toast.Close`. A second story drives `toast.promise()` against a fake async call and asserts the loading → success copy swap. Feeds the Behavior (stacking, swipe-to-dismiss) and prop-composition sections.

## 2. Network Canvas (complexdatacollective) — per-toast positioning, not a corner stack

- **Permalink:** https://github.com/complexdatacollective/network-canvas-monorepo/blob/7711c9b0e412beb65fc41dc20298c2a048dcf209/packages/interview/src/toast/InterviewToast.tsx
- **Live:** none verified (academic research software; no homepage on the repo)
- **License / reuse:** GPL-3.0 / link-only. 2 stars (young monorepo split), active.
- **Parts:** Root, Positioner, Content, Description, Close, Portal, Viewport, `useToastManager`.
- **Why ranked #2:** The only usage in this corpus that gives each toast its own `Toast.Positioner` (`sideOffset={12}`, `collisionPadding={24}`) anchored near interview navigation buttons, instead of stacking every toast in one global corner `Viewport`. It also auto-focuses each toast on mount and closes it on blur — a "contextual, per-toast-positioned, focus-driven" pattern that is a real (if rarely used) alternative to the default corner-stack archetype most other examples in this set use.
- **Story recomposition notes:** *Anchored toast*: render a button; on click, open a toast whose `Positioner` is anchored to that button (not the viewport corner); interaction = tab to the toast (auto-focus), tab away (auto-dismiss on blur). Feeds the Anatomy section's note that `Positioner` is optional and per-toast, not just per-viewport.

## 3. Bytebase — toasts that respect the app's own overlay layering

- **Permalink:** https://github.com/bytebase/bytebase/blob/70623e6179f4e8b5d83862457b6afd38371771be/frontend/src/react/components/ui/toaster.tsx (manager: `frontend/src/react/lib/toast.ts`)
- **Live:** https://www.bytebase.com
- **License / reuse:** no SPDX license detected (GitHub `NOASSERTION`) / link-only. 14.2k stars, active daily.
- **Parts:** Provider, Portal (custom `container`), Viewport, Root, Title, Description, Action, Close, `useToastManager`.
- **Why ranked #3:** Bytebase (a database DevSecOps platform) portals its `Toast.Viewport` into the same layer-root helper used by its other overlays (`getLayerRoot("overlay")`), so a toast correctly disappears behind a higher-priority "session expired" critical-layer surface instead of floating on top of it — real evidence for how to compose Toast's Portal `container` prop with an app-wide overlay-layering system. Also i18n'd via `react-i18next`.
- **Story recomposition notes:** *Layered viewport*: two toasts fire, then a modal "critical" overlay opens on top; interaction shows the toast now visually behind/obscured by the critical layer instead of overlapping it. Feeds a composition note on `Toast.Portal`'s `container` prop for multi-overlay apps.

## 4. Bitfocus Companion — an imperative ref API over the toast manager

- **Permalink:** https://github.com/bitfocus/companion/blob/aa1b1fbb424fae0a5dbfb1a9b7567f30a0ae44d3/webui/src/Components/Notifications.tsx
- **Live:** https://companion.free/
- **License / reuse:** no SPDX license detected / link-only. 2.2k stars, active.
- **Parts:** Provider, Portal, Viewport, Root, Content, Title, Close, `createToastManager`, `useToastManager`.
- **Why ranked #4:** Companion (Elgato Stream Deck / broadcast-switcher control software) wraps `createToastManager()` behind a `forwardRef` component exposing `show(title, message, duration, stickyId)` / `close(id)` — letting large pre-existing, non-React-context-aware code paths trigger notifications imperatively, including "sticky" (`timeout: 0`) toasts identified by a caller-supplied ID for idempotent updates. A common real-world integration shape when retrofitting Toast into an existing app.
- **Story recomposition notes:** *Imperative trigger*: a ref-driven "Notify" button calls `ref.current.show(...)`; a second click with the same `stickyId` proves the toast is reused/updated rather than duplicated. Feeds an "integrating with non-React/legacy call sites" composition note.

## 5. Cloudflare Kumo — Toast styling as a Figma-parity source of truth

- **Permalink:** https://github.com/cloudflare/kumo/blob/HEAD/packages/kumo/src/components/toast/toast.tsx
- **Live:** https://kumo-ui.com
- **License / reuse:** MIT / code-ok. 2.8k stars, active daily.
- **Parts:** Provider, Portal, Viewport, Root, Content, Title, Description, Close, `createToastManager`, `useToastManager`, `transitionStatus`.
- **Why ranked #5:** Cloudflare's official design system Toast has no user-facing variants, but the file documents its own `KUMO_TOAST_VARIANTS` style-constants table explicitly for consumption by a companion Figma-plugin generator — an unusual "design tool and code share one source of truth" pattern, distinct from every other purely-code-facing wrapper in this set.
- **Story recomposition notes:** *Design-tokens callout*: render the default toast and annotate which `KUMO_TOAST_VARIANTS` entry maps to which rendered part. Feeds a styling/theming section note about keeping design tools and component code in sync.

---

### Also ranked (6–12, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | patrick-xin/lumi-ui | Fullest anatomy: only wrapper combining `Toast.Action` + `Toast.Arrow` (anchored, actionable toast) | MIT / code-ok |
| 7 | otomatty/m3-baseui | Material Design 3 "Snackbar" bridge; documents a real `Toast.Portal` typing/portability gotcha in its own comments | none-found / link-only |
| 8 | rosen-bridge/ui | Renders a full pre-existing `Alert` component inside `Toast.Content` — "Toast as bare positioning shell" idiom | MIT / code-ok |
| 9 | NASA-AMMOS/MMGIS | A real NASA/JPL mapping tool (MMGIS) using Toast for map-status messages — government/science credibility anchor | Apache-2.0 / code-ok |
| 10 | devef-com/card-game-no-mercy-engine | The plainest, smallest faithful wrapper (CSS Modules) — a minimal "first Toast" reference | MIT / code-ok |
| 11 | vcode-sh/popser | A dedicated sonner-compatible toast *library* built entirely on Base UI (description-based, not file-inspected this pass) | MIT / code-ok |
| 12 | baseui-cn/baseui-cn | Weakest-evidence entry — description-only, never file-verified; kept for completeness, re-verify before citing | MIT / code-ok |

### Diversity coverage of the top set

design-system-embedded SaaS product, academic research software (per-toast positioning), enterprise devtool (layered overlay architecture), broadcast-control software (imperative ref retrofit), corporate design system (Figma-parity tooling), Arrow/Action anchored-toast archetype, Material-Design-3 bridge (typing gotcha), web3/crypto UI kit (Alert-in-Content composition), NASA/government science software, minimal CSS-Modules reference, a dedicated downstream library, and one honestly-flagged low-confidence entry.

### Notable non-candidates / false positives (verified and excluded)

- `lobehub/lobe-ui` (`src/base-ui/Toast/type.ts`) — only re-declares/extends the `ToastOptions` type surface; no `Toast.Root`/`Viewport`/Provider usage was found in the fetched file, so it was **not** added as a usage candidate (it would need a second file to confirm actual rendering).
- `martpie/museeks` (`src/lib/toast-manager.ts`) — genuinely imports `@base-ui/react/toast` and calls `createToastManager()`, but the file is 4 lines with no rendering component; too thin to rank on its own merit and was left out of the ranked top set (though it independently corroborates Museeks as a real Base UI adopter, also seen under navigation-menu).
