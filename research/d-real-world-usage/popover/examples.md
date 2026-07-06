# Popover — top real-world examples

Mined 2026-07-06 from GitHub code search (both package names: `@base-ui/react/popover`, `@base-ui-components/react/popover`) + the shared corpus (`_corpus/repos.json`). 100 candidates recorded in `candidates.json`; top 15 ranked in `ranked.json` (dual criterion: illustrative quality × collective diversity, per PROMPT.md §9.2). Screenshots not attempted in this pass (`screenshot.status: "not-attempted"` throughout). All permalinks are commit-pinned.

Licenses: `code-ok` = permissive (code may be adapted into stories); `link-only` = cite/describe only, never copy code.

---

## 1. WordPress/gutenberg — the full-part design-system wrapper (popover-001)

- Permalink: https://github.com/WordPress/gutenberg/blob/73d48b46f8caa925fbaffb4e97246f02a1b3ce80/packages/ui/src/popover/root.tsx (siblings: `trigger.tsx`, `popup.tsx`, `positioner.tsx`, `portal.tsx`, `arrow.tsx`, `close.tsx`, `title.tsx`, `description.tsx`, `types.ts`)
- Live: https://wordpress.org/gutenberg/ | License: GPL dual-licensing (GitHub: NOASSERTION) → **link-only**
- Parts: Root, Trigger, Popup, Positioner, Portal, Arrow, Close, Title, Description, Backdrop
- Why ranked #1: the richest composition found anywhere. The new `@wordpress/ui` package wraps every popover part one-file-per-part and layers on: slot-overridable `portal={<Popover.Portal container={...}/>}` and `positioner={...}` (the editor canvas is an iframe — cross-document portaling is a first-class concern), an optional `Popover.Backdrop`, dev-time validation that a `Title` is present ("**required** heading that labels the popover for accessibility (can be visually hidden)"), a "Close **required** when `modal` is `true` or `'trap-focus'`" rule, and `useDeprioritizedInitialFocus` — a hook that skips `data-wp-ui-popover-close`-marked elements when resolving initial focus so focus lands on meaningful content instead of the close button.
- Story recomposition: (a) "popover with backdrop" story toggling `backdrop`; (b) "initial focus routing" story showing focus skipping the close button (play function asserts `document.activeElement`); (c) docs callout quoting their Title/Close accessibility rules (paraphrased — GPL, link-only). Feeds: anatomy, accessibility contract, `initialFocus`/`modal` prop guidance.

## 2. martpie/museeks — app-level usage with a decoupled anchor (popover-020)

- Permalink: https://github.com/martpie/museeks/blob/7163f6019a3184043c06352caeec0ed1bf6ccff5/src/components/Header.tsx
- Live: https://museeks.io | License: MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup
- Why ranked #2: genuine application code, not a wrapper. The play-queue popover in a Tauri music player's draggable title bar: `Popover.Trigger render={(triggerProps) => <ButtonIcon {...triggerProps} .../>}` composes the trigger over a custom icon button, while `Positioner anchor={queueAnchorRef}` aligns the popup to a wrapper `<div>` rather than the trigger itself (`side="bottom" align="end" alignOffset={-16}`), and StyleX drives a `[data-open]` display toggle.
- Story recomposition: "queue popover" — icon-button trigger via render prop, custom `anchor` ref, end-aligned panel listing items; interaction: click trigger → assert popup anchored to the wrapper, not the button. Feeds: `anchor` prop guidance, render-prop composition, desktop-app context.

## 3. opral/flashtype — form-in-popover inside a Toolbar (popover-015)

- Permalink: https://github.com/opral/flashtype/blob/1bf2e8e8779b3458f3b892c24a1f2d5dfa42d9a6/src/extensions/markdown/components/formatting-toolbar.tsx (popover at ~L413)
- Live: https://flashtype.com | License: MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Close (+ Toolbar, Tooltip, Select from Base UI in the same file)
- Why ranked #3: the best cross-component composition example. The markdown editor's link editor is `<Toolbar.Button render={<Popover.Trigger />} nativeButton={false}>` inside a roving-tabindex toolbar, with `openOnHover={false}` and `Popup initialFocus={linkInputRef}` so the URL input receives focus on open; the form submits/clears the link and closes.
- Story recomposition: "edit link" toolbar popover; play function: click toolbar button → type URL → Enter → assert popover closed and focus restored to the toolbar item. Feeds: composition handbook (popover × toolbar), `initialFocus`, `openOnHover` opt-out guidance.

## 4. langgenius/dify — flagship platform standardizes on Base UI popover (popover-002)

- Permalink: https://github.com/langgenius/dify/blob/fc01d112a06cc286f5b47d34112387c46503ddb2/packages/dify-ui/src/popover/index.tsx
- Live: https://dify.ai | License: custom (GitHub: NOASSERTION) → **link-only**
- Parts: Root, Trigger, Portal, Positioner, Popup, Close, Title, Description, createHandle
- Why ranked #4: the highest-star adopter in the corpus (147.9k). `dify-ui` compresses Positioner geometry behind a single `placement` prop parsed into `side`/`align`, re-exports `createHandle`, and shows the canonical `data-starting-style`/`data-ending-style` scale+opacity transition with `motion-reduce:transition-none`. Credibility citation for "production platforms build their design system's popover on Base UI".
- Story recomposition: a "placement playground" story mirroring their side/align abstraction; docs cite the animation classes as the idiomatic CSS transition contract. Feeds: styling/animation contract, createHandle mention, when-to-use.

## 5. egoist/takopi — triggerless mention-autocomplete popover (popover-021)

- Permalink: https://github.com/egoist/takopi/blob/027d2e142e24d7556cdbbb2b761948be5cb16662/src/components/mention-popover.tsx
- Live: none | License: Apache-2.0 → **code-ok**
- Parts: Root, Portal, Positioner, Popup (no Trigger at all)
- Why ranked #5: the cleanest detached-trigger evidence. An @-mention file autocomplete over a chat textarea: `Popover.Root open={open}` fully controlled, `Positioner anchor={textareaRef} side="top" align="start"`, and `Popup initialFocus={false} finalFocus={false}` so keyboard focus never leaves the textarea while the highlighted row is driven externally (mouseenter/arrow keys) and rows use `tabIndex={-1}` + `onMouseDown preventDefault`.
- Story recomposition: "mention autocomplete" — type `@` in a textarea, popup opens above the caret area, arrow keys move highlight, Enter selects; play function asserts focus stays in the textarea throughout. Feeds: detached trigger/anchor section, `initialFocus={false}`/`finalFocus` prop guidance, "popover vs combobox" boundary discussion.

## 6. gracefullight/krds — coach-mark onboarding tour on Popover (popover-019)

- Permalink: https://github.com/gracefullight/krds/blob/23d4f4d119274c826a8c23e60dc5cb8a3ddcae38/packages/krds-tw/src/components/coach-mark.tsx (also `contextual-help.tsx`)
- Live: https://krds.gracefullight.dev | License: none found → **link-only**
- Parts: Root, Trigger, Portal, Positioner, Popup
- Why ranked #6: a distinct archetype — sequential onboarding hints (coach marks) from a Tailwind port of KRDS, the Korean government design system. Always-open controlled `Popover.Root open`, a hidden zero-size Trigger whose `getBoundingClientRect` is **overridden** to the selector-resolved target element, step counter with `aria-live="polite"`, Escape-to-skip. Doubly instructive: Base UI's `anchor` prop (element/ref/virtual) could replace the rect override — exactly what "use the `anchor` prop when the popup must attach to an element that isn't the trigger" guidance should say.
- Story recomposition: 3-step product-tour story cycling anchors across page elements (using `anchor` idiomatically instead of the override); interaction: Next/Prev/Skip. Feeds: when-to-use (tours, contextual help), `anchor` guidance, controlled-open behavior.

## 7. Codennnn/Green-Wall — modern 1.x APIs (Viewport, createHandle) in a live MIT app (popover-012)

- Permalink: https://github.com/Codennnn/Green-Wall/blob/dbb5cdc8e1de3b7abcd3078759400e9b4f7fc036/src/components/ui/popover.tsx
- Live: https://green-wall.leoku.dev | License: MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Close, Title, Description, Viewport, createHandle
- Why ranked #7: a production app (GitHub-contributions poster generator) shipping the coss-lineage wrapper with the newest popover APIs: the `Popover.Viewport` part with `data-current`/`data-previous` transition targeting for animated content swaps, positioner sizing via `--positioner-width/height` CSS variables, `data-instant` handling, and a `tooltipStyle` variant — all under MIT, so story code may adapt it directly.
- Story recomposition: "viewport content transition" story where popup content swaps with width/height animation between two panels. Feeds: Viewport part docs, CSS-variable styling contract (`--popup-width`, `--available-height`, `--transform-origin`).

## 8. 1771-Technologies/lytenyte — popover frames anchored to data-grid cells (popover-027)

- Permalink: https://github.com/1771-Technologies/lytenyte/blob/0efae21e64f58cef11e42ad1223ff73aede9bbe4/documentation/examples/(components)/popover-frame/src/demo.tsx
- Live: https://www.1771technologies.com/ | License: none found (commercial grid docs) → **link-only**
- Parts: Root, Portal, Positioner, Popup
- Why ranked #8: popover as an infrastructure layer for a commercial React data grid: each "popover frame" is an always-open `Popover.Root` keyed per cell, anchored to the clicked cell's DOM node (`Positioner anchor={params.target}`), opened/closed through the grid's imperative API (`popoverFrameOpen/Close`). Best evidence of anchoring to arbitrary, dynamically-chosen elements and syncing popover lifecycle with an external system.
- Story recomposition: "cell popover" — table where clicking any cell opens a popover anchored to that cell (single Root, swapped anchor); play function clicks two cells and asserts re-anchoring. Feeds: `anchor` guidance, controlled-open + external-state integration.

---

## Ranked 9–15 (summary)

| # | Repo | Hook | Reuse |
|---|------|------|-------|
| 9 | bearlyai/OpenADE (popover-014) | MCP-server selector in an AI IDE's prompt bar; `Portal container={portalContainer}`, `side="top" align="end"` | link-only |
| 10 | MTI-System/MTI-site (popover-023) | react-day-picker hosted in a controlled popover; date committed on close via `onOpenChange` | link-only |
| 11 | vibe-stack/three-maps (popover-017) | "Generate Object" AI-prompt form popover with Title + Close in a 3D editor toolbar | code-ok (MIT) |
| 12 | Lay3rLabs/TrustGraph (popover-026) | **Labeled instructive misuse**: generic Tooltip built from `Popover.Root openOnHover delay={0}` + Arrow + Markdown — shows why teams choose popover for rich hover content and what tooltip semantics they give up; feeds the popover/tooltip/preview-card decision-boundary section | code-ok (MIT) |
| 13 | graphprotocol/hypergraph (popover-018) | Conditional composition: card renders `Popover.Root`/`Trigger` in view mode, `Fragment`/`Checkbox.Root` in selection mode; info popup with Arrow | code-ok (MIT) |
| 14 | cosscom/coss (popover-008) | Origin of the ecosystem's dominant wrapper lineage (createHandle + Viewport + tooltipStyle), by the cal.com team; copied nearly line-for-line into downstream apps (e.g. Green-Wall) | link-only (AGPL) |
| 15 | imskyleen/animate-ui (popover-010) | motion/react integration: Portal forced `keepMounted`, controlled-state context, AnimatePresence exit animations | link-only |

## Diversity coverage of the ranked set

design-system-wrapper (gutenberg, dify, coss) · app-level direct usage (museeks, OpenADE, three-maps) · form-in-popover (flashtype, three-maps) · detached/custom anchor (takopi, lytenyte, museeks, krds) · date-picker-host (MTI-site) · coach-mark/onboarding (krds) · popover-as-tooltip boundary case (TrustGraph) · data-grid integration (lytenyte) · animation-library integration (animate-ui) · registry/ecosystem standardization (coss, Green-Wall) · conditional composition (hypergraph) · public-sector (krds; also InseeFr/Pogues at popover-025, unranked) · desktop/Tauri (museeks) · AI-tool UIs (dify, OpenADE, takopi, three-maps).

## Notable unranked candidates

- amruthpillai/reactive-resume (popover-007, 39.4k, MIT, live) — flagship OSS app, but a standard Title/Description wrapper; sameness-penalized.
- PostHog/posthog (popover-003, 35.4k) — new "quill" primitives package popover; watch for growth.
- electric-sql/electric (popover-005, Apache-2.0) — wrapper exposing `modal: boolean | 'trap-focus'`.
- WordPress/gutenberg's `use-deprioritized-initial-focus.ts` deserves its own read for the a11y rationale.
- InseeFr/Pogues (popover-025, MIT) — INSEE questionnaire designer (French national statistics institute) with Arrow/Title/Description wrapper.
- nandanmen/NotANumber (popover-013, live nan.fyi) — interactive-blog popover with Arrow + collisionPadding.
- mui/mui-public (popover-034) — MUI's own org monorepo using popover in docs infra (first-party-adjacent; recorded, deliberately unranked).

## Exclusions applied (beyond the corpus-level ones)

Non-code or non-usage matches dropped from candidates: wenerme/wener (markdown notes), jackspace/ClaudeSkillz + majiayu000/claude-skill-registry-data + secondsky/claude-skills + Microck/opendots-microck (Claude-skill docs quoting Base UI), karakum-team/mui-kotlin (TODO list), simonknittel/sam (eslint no-restricted-imports config only), vibemafiaclub/argos (ADR markdown), ajanraj/OpenChat + Chilfish/anonTweet (vite manualChunks config only), msviderok/base-ui-solid (SolidJS port mirroring the base-ui repo/docs), baseui-cn/baseui-cn (docs translation mirror).

## Method notes

- Queries: cached `"@base-ui-components/react/popover"` (p1, 100 items) reused; new: `"@base-ui/react/popover"` p1+p2 (200 items) and one scoped search across 9 flagship corpus repos (20 items) — 3 new code-search calls total, ~7s apart, all responses cached in `_cache/` (`code-import-baseui-react-popover-p{1,2}.json`, `code-import-baseui-react-popover-scoped-toprepos.json`, `popover-merged-matches.json`, `popover-extra-meta.json`, `popover-graphql-meta-batch-*.json`, fetched files under `_cache/popover-files/`).
- 261 unique repos matched popover imports; 176 lacked corpus metadata and were resolved via 4 GraphQL batches (176/176 ok). 30 repos were deep-inspected (files fetched at pinned HEAD shas).
- No rate-limit incidents (code_search remaining ≥6 throughout).
