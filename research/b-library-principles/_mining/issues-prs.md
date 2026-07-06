# mui/base-ui project-level issues & PRs mining

Mined 2026-07-06 via `gh` CLI (read-only). Raw JSON cached in `_cache/` (labels, milestones, all searches, and per-issue/PR full bodies+comments as `issue-N.json` / `pr-N.json`).

Maintainer logins seen deciding things: **michaldudak** (tech lead), **atomiks** (floating-ui author; popups/positioning), **colmtuite** (product/API design, ex-Radix founder), **mj12albert**, **vladmoroz** (design/API polish, ex-Radix), **mnajdova**, **aarongarciah** (docs), **oliviertassinari** (MUI co-founder; challenges/records decisions), **LukasTy**, **flaviendelangle** (temporal/pickers), **Janpot** (infra/llms.txt).

## Label set

Actual labels that matter for project-level archaeology (full list in `_cache/labels.json`):

- **`RFC`** ("Request For Comments") — rare; only 3 issues ever: #2069, #859, #22. Base UI does not run a heavy RFC process; API debates happen in ordinary issues/PRs and an internal Notion doc that gets referenced ("our unresolved Notion doc", #2225).
- **`breaking change`** — the richest vein: every API overhaul PR carries it (~100 PRs). Used through alpha/beta to mark churn.
- **`umbrella`** — "for grouping multiple issues to provide a holistic view": #10 (original component progress), #1246 (bundle size), #1615/#2766 (docs feedback), #1709 (pickers primitives), #2765 (a11y docs), #3027 (more demos).
- **`discussion`** — where scope/philosophy debates live (integration requests, component proposals, Radix comparisons).
- **`waiting for 👍`** — explicit community-upvote gate for new scope; the mechanism by which "should we build X?" is decided.
- **`not planned`** — "problem seems valid, but we don't intend to fix it (won't fix)" — small but precious (#2189).
- **`accessibility`**, **`design`**, **`scope: all components`**, **`scope: new proposal`**, **`internal`**, **`release`**, **`v0.x`/`v1.x`**, **`package: @mui/base` (legacy)**, **`the great shave off`** (bundle-size bounty program).
- Per-component labels (`component: *`) for ~40 components including future ones (`component: otp field`, `scope: temporal`, `component: drawer`).

[G] `v1.x`-labeled issue search returned zero results — the label exists but is effectively unused; there is no "2.0 parking lot" label yet.

## Decision catalog

### #10 — Base UI components progress (issue, umbrella, closed, 51 comments)
- Proposed: (2021, opened by michaldudak in the material-ui era, transferred) umbrella tracker for building unstyled versions of Material UI components.
- Decided: prioritize by docs-page traffic; and crucially "We usually don't just remove the styling from Material UI components but also take the opportunity to rethink the API surface or rewrite the internals" (michaldudak).
- Decider(s): michaldudak, mnajdova, oliviertassinari.
- Implication for usage: Base UI is a re-thought library, not "Material UI minus CSS" — APIs deliberately diverge from Material UI.
- Implication for docs: historical origin story; don't map Base UI concepts 1:1 to Material UI.

### #1315 → PR #1418 — Slot component vs useRender hook (issue closed / PR merged, 9+26 comments)
- Proposed: a public helper (like Radix `<Slot/>`) so users can build their own components supporting `render`.
- Decided: ship a **hook, `useRender`**, not a Slot component — "We discussed this among the team and decided that a hook may be a better abstraction than `<Slot/>`" (mj12albert). Renamed `useRenderer` → `useRender` (colmtuite). Kept `state` support ("let's make the render prop fully featured", michaldudak); deferred `customStyleHookMapping`/className-callback extras to keep API minimal; `mergeProps` shipped separately at atomiks' insistence.
- Decider(s): mnajdova (author), michaldudak, colmtuite, atomiks, aarongarciah (docs).
- Implication for usage: the blessed way to make *your own* components render-prop-capable is `useRender` + `mergeProps` from `@base-ui/react/use-render` / `merge-props`.
- Implication for docs: any custom-component story should demo `useRender`, not a home-made Slot.

### #3983 — Deprecate `render` prop, use `asChild` (issue, open, 8 comments, breaking change label)
- Proposed: switch to Radix's `asChild`+children composition for type safety and easier migration.
- Decided: **NO** — "Considering the reasons stated above and the fact that we've received good feedback for the render prop, it is unlikely we'll change this API. I'll keep the issue open, though, to measure sentiment" (michaldudak). Recorded team rationale (via atomiks quoting colmtuite/michaldudak): `render` is explicit (the prop belongs to the element being replaced); function form avoids soft-deprecated `cloneElement` and is faster; `asChild` changes how children are interpreted and is easy to forget, causing button-in-button bugs; one-liner vs three lines. react-aria-components also adopted a `render` prop (community note).
- Decider(s): michaldudak, colmtuite, atomiks.
- Implication for usage: `render` is a permanent, load-bearing convention; `asChild` does not exist.
- Implication for docs: every composition example must use `render` (element form merges everything; function form gives control but you own the spreading). Explicitly warn AI/Radix muscle-memory users.

### PR #2382 — [all components] Base UI event details (merged 2025-08, 15 comments, breaking change)
- Proposed: replace `(value, event, reason)` callback args with a single always-defined details object.
- Decided: all change callbacks are `(value, eventDetails)` where `eventDetails` has `.reason` (string union, narrowing `.event` to the right DOM event type), `.event` (falls back to `new Event('base-ui')` outside handlers), `.cancel()` (cancel Base UI's action while staying uncontrolled), `.allowPropagation()`. Every component exports `ChangeEventReason` / `ChangeEventDetails` types. Callbacks that had no reason get `reason: 'none'`. Design evolved in-thread from `preventBaseUIHandler()` after feedback from vladmoroz: methods live on a separate object rather than mutating native events.
- Decider(s): atomiks (author), vladmoroz (API feedback).
- Implication for usage: you can veto/customize built-in behavior (e.g. keep a popup open on a specific reason) without switching to controlled mode.
- Implication for docs: `onOpenChange`/`onValueChange` stories should show reading `eventDetails.reason` and calling `eventDetails.cancel()`.

### #600 — onChange API / API convention (issue, closed, 2 comments)
- Proposed (oliviertassinari): match native `onChange(event)` convention shared with Material UI.
- Decided: keep **`onValueChange(value, ...)`** — matches the controlled prop it pairs with (`value`/`onValueChange`, `open`/`onOpenChange`), allows `onValueChange={setValue}` directly, event demoted to secondary argument (atomiks). This is the value-first convention that #2382 later formalized.
- Decider(s): atomiks; consistency-with-Material-UI argument explicitly not adopted.
- Implication for usage/docs: controlled props always come in `x`/`onXChange`/`defaultX` triplets; setters can be passed directly.

### #717 — Collapse `data-state` into multiple attrs (issue, closed)
- Decided (stated as fait accompli by colmtuite, Oct 2024): replace Radix-style `data-state="open"` with **boolean attributes** `data-open`, `data-closed`, `data-checked`, `data-unchecked`, `data-indeterminate` — "for naming consistency, better TW support, and easier Radix migration".
- Implication for usage: style with `[data-open]`, `.data-[open]:` in Tailwind; there is no `data-state`.
- Implication for docs: state styling examples hinge on these attributes; each component's docs list them (see #1004/#543).

### #625 — Attribute duplication on every part (issue, closed, 6 comments)
- Proposed (oliviertassinari): put `data-orientation` only on the root; use descendant selectors.
- Decided: **NO** — duplicate state attributes on every part. "It's generally a bad idea to have your styles rely on DOM structure… It's standard practice to provide style hooks per component. We want to enable devs, not restrict them. There is also the TW experience to consider" (colmtuite).
- Implication for usage/docs: every part is directly styleable via its own data attributes; demos should never rely on descendant selectors for state.

### #3036 — Consolidate `data-open` and `data-pressed` (issue, closed unchanged, 3 comments)
- Proposed (mnajdova): unify trigger states.
- Decided: keep **`data-pressed`** (button pressed state) and **`data-popup-open`** (its popup is open) separate — intentional so a Tooltip and Menu attached to the same button can be styled independently (atomiks).
- Implication for docs: trigger styling recipes should demonstrate both attributes and why they differ.

### #864 — Finish renaming `OwnerState` to `State` (issue, closed)
- Decided: public naming is `State` (types) / `state` (render-callback arg) everywhere, retiring Material-UI-era `ownerState` (vladmoroz).
- Implication for docs: the second argument of `render`/`className` callbacks is always called `state`.

### #488 → PR #3462 — Rename npm org `@base-ui-components` → `@base-ui` (closed/merged, breaking)
- Decided: once MUI obtained the npm org, packages became `@base-ui/react` and `@base-ui/utils` (landed between rc and v1.0.0).
- Decider(s): oliviertassinari drove; atomiks closed via #3462.
- Implication for docs: imports must use `@base-ui/react/<component>` subpaths; old `@base-ui-components/*` is pre-1.0 legacy (a known LLM failure mode, see #2262).

### #1700 — Individual npm packages per component? (discussion, closed, 4 comments)
- Decided: **NO — deliberate monopackage.** "We discussed this in detail before deciding on the monopackage… Treeshaking and sub-path imports eliminate issues associated with monopackages"; Radix itself moved to a monopackage because of version-mismatch bugs (atomiks).
- Implication for docs: one dependency, per-component subpath imports; tree-shaking is a stated guarantee (see also #1246, #4336, #4943).

### PR #1222 — Require `Portal` part for popups (merged, 8 comments, breaking)
- Proposed: shared optional portal vs explicit part.
- Decided: every popup component **requires its own `<X.Portal>` part**; `keepMounted` lives on Portal (single home); missing Portal throws at render time ("ensures the whole app doesn't render and lets them know the tree is invalid in a very obvious way"). michaldudak challenged on bundle size; atomiks' explicitness argument won.
- Implication for docs: canonical popup skeleton is Root → Trigger → Portal → Positioner → Popup; `keepMounted` shown on Portal.

### #485 — Use native `<dialog>` element (issue, OPEN since 2022, 15 comments)
- Decided (so far): **NO for a general-purpose library** — third-party extension content (Grammarly etc.) renders under the top layer and becomes inaccessible: "The dialog component needs to be fully general in that it interops with everything correctly" (atomiks); react-spectrum reached the same conclusion (oliviertassinari cites: top-layer interop, animation limits, background scroll).
- Implication for usage/docs: Base UI dialogs are `div role="dialog"` + focus/scroll management by design; interop-with-everything beats platform purity. Related: #4760 (native Popover API, closed), #3905 (CloseWatcher, open).

### #2138 / #2225 → PR #2363 — The Button component arc (closed issues / merged PR)
- Proposed: add a Button primitive (repeatedly requested).
- Debated: colmtuite articulated the scope test for a headless library — provide primitives only where (a) HTML lacks functionality, (b) the HTML element can't be styled, or (c) no good HTML primitive exists; `<button>` fails all three. Initially rejected.
- Decided: **reversed** — Button added for `focusableWhenDisabled` (accessible disabled/loading state, since `disabled` hides buttons from AT), Enter/Space normalization on non-native tags, and browser-bug patching (atomiks, aarongarciah, oliviertassinari's phrasing-content/link-as-button arguments).
- Implication for docs: Button exists for a11y-of-disabled/pending and polymorphism, not styling sugar; the (a)/(b)/(c) scope test is the library's stated philosophy — quote it.

### #4008 — Why no Button Group? (question, closed, 16 comments)
- Decided: **not a component** — "'button group' (non-toggles) is just `role='group'` around some normal buttons, so there isn't anything that a headless lib could add"; use ToggleGroup (roving focus) or Toolbar (mixed buttons) (mj12albert). LukasTy restated no-themes stance: "We feel like increasing the component portfolio would bring more value than delving into theming."
- Implication for docs: map Material-UI-style expectations (ButtonGroup, Stack) to native HTML + CSS.

### #2189 — Implement AspectRatio (issue, closed, `not planned`)
- Decided: **NO** — "it's not necessary, since CSS now supports this natively [aspect-ratio]. So you can just wrap a div and provide your own CSS API" (colmtuite).
- Implication for docs: perfect example of the don't-wrap-what-CSS-does rule.

### #2292 — Radix Themes-like styled version (discussion, OPEN, 7 comments)
- Decided (current stance): **no plans** — "We still have no plans for anything like Radix Themes / Material UI / Chakra / Mantine / Hero UI etc." — shadcn/ui's Base UI support is the pointed-to alternative (colmtuite). Kept open to collect use cases.
- Implication for docs: Base UI ships zero theme; all styling in demos is userland (docs use CSS Modules + Tailwind twins).

### #601 — Radix-compat deprecated props (discussion, closed, 4 comments)
- Decided: **NO** — "We haven't seen any community interest… I'm afraid if we add Radix API, AI will keep using it instead of learning the Base UI way" (michaldudak). Related rejected easing: codemod #2970 (open, low activity), pain-points inventory #1239.
- Implication for docs: migration content should translate Radix → Base UI idioms rather than shim them.

### #2069 (RFC) → PR #2336 → PR #2974 — Public state interface → detached triggers & handles (closed / merged / merged)
- Proposed (RFC #2069): Root children as a function exposing `{ open, setOpen }` ("public state interface").
- Debated: atomiks — render-prop on Trigger covers most cases; controlled mode "works in more scenarios and it's better to restrict this to one unified API". michaldudak — Trigger/Close exist chiefly for accessibility (`aria-haspopup`/`aria-expanded`/`aria-controls`), so bypassing them loses a11y.
- Decided: solved via **`createHandle()`**: Popover (#2336, merged 2025-10) then Dialog/AlertDialog (#2974) support triggers outside Root via a `handle`, multiple triggers with typed `payload` per trigger, and imperative `open/openWithPayload/close` methods — "This should make the controlled mode almost unnecessary" (michaldudak). Planned for Menu (#3170 merged) and Tooltip; other components case-by-case, additive post-1.0.
- Implication for usage: three tiers — uncontrolled parts → controlled props → handles for detached/imperative/payload cases.
- Implication for docs: this is the modern answer to "open a dialog from anywhere"; supersedes controlled-state boilerplate in examples.

### #2802 — Dialog manager (issue, closed by #2974, 16 comments)
- Proposed: toast-manager-style imperative dialog API.
- Decided: no dedicated manager — imperative-API staleness concerns (closures over state) and dialogs' unbounded complexity vs toasts (atomiks); handles from #2974 are the sanctioned imperative surface.
- Implication for docs: don't teach a `dialogManager.confirm()` pattern; teach handles + payloads.

### #1880 → PR #2124 (closed unmerged) → PR #3373 — `value` required? arc
- Proposed: make `value` required on Accordion.Item/Tabs.Tab/Panel to fix keepMounted/SSR/animation bugs (mj12albert; Radix requires it).
- Debated: atomiks resisted degrading the API ("I don't like that we need to change to a worse API to support [React 17]"); community liked optional value DX.
- Decided: keep `value` **optional** with a `useId`-generated fallback (#3373); explicit `value` needed only to control or set initial state (mj12albert: "We discussed this and decided to use useId to generate the fallback value").
- Implication for docs: simple Tabs/Accordion demos may omit `value`; any controlled/deep-link story must set it.

### #930 / #1075 / #1076 — Prop-convention sweeps (closed / closed / OPEN)
- #930: audit props defaulting to `true`; mnajdova flipped applicable ones to false-by-default unless the inverted name was worse (booleans should default false).
- #1075: converge on a single **`multiple`** prop for multi-active components (accordion/select/toggle group); accordion's `multiple` later made false-by-default (#3141, breaking).
- #1076 (OPEN): common generic `value` type — `any` vs `unknown` vs generics still unresolved; RadioGroup at least loosened to `any` (atomiks). Generics landed piecemeal (#3173 toggle group, #1241 slider callbacks).
- Implication for docs: expect `multiple`, false-default booleans; TS generics coverage is uneven — worth flagging per component.

### #656 — Audit `focusableWhenDisabled` (issue, closed, 8 comments)
- Decided (michaldudak, refining colmtuite's earlier ARIA-based rule): components in **roving-tabindex composites** (menu items, radios, tabs) stay focusable when disabled; **standalone** controls (buttons, checkboxes, switches) do not; behavior initially not customizable — later surfaced as the `focusableWhenDisabled` prop on Button/Toolbar parts.
- Implication for docs: disabled-state stories should mention discoverability of disabled items inside composite widgets.

### #1323 + #2006 → PR #3176 — Tab activation timing (a11y policy fight)
- Proposed: activate tabs on `click`, not `mousedown` (oliviertassinari, citing WCAG 2.5.2 Pointer Cancellation).
- Debated: colmtuite defended mousedown ("feels more responsive… nothing to cancel"); precedent from react-aria's configurable behavior cited.
- Decided: default flipped — activation on click; `activateOnFocus` default changed to `false`; opting into `activateOnFocus` restores pointer-down activation (#3176, breaking).
- Implication for docs: WCAG compliance won over perceived responsiveness; a repeatable pattern for judging interaction defaults.

### PR #3205 — Checkbox/Radio/Switch root renders `<span>` not `<button>` (merged 2025-11, breaking, 15 comments)
- Decided: `<label>` can't validly wrap both a `<button>` and the hidden `<input>`; roots became `<span role="checkbox|radio|switch">` with the hidden input handling label/focus forwarding (mj12albert, atomiks). Extensive VoiceOver/WAVE verification in-thread.
- Related: #1909 added the **`nativeButton`** prop convention — when your `render` changes the tag away from the documented default, you must declare `nativeButton={boolean}` so ARIA/keyboard handling adapts.
- Implication for docs: wrapping-label pattern is first-class; render-prop demos that swap tags must set `nativeButton`.

### #3950 — `data-base-ui-inert` DOM mutation complaints (issue, closed, 12 comments)
- Decided: the outside-marking exists to keep third-party extension popups (injected after mount) clickable without closing popovers, and `aria-hidden` marking preserves `aria-live` regions; mitigation PR #3955 moved marking to the highest-level nodes to stop breaking ProseMirror-style DOM observers (atomiks).
- Implication for docs: explains surprising DOM side-effects around modal popups; worth a note when embedding editors.

### #47 — Remove workarounds for unsupported browsers (issue, closed)
- Decided: Base UI targets modern evergreen browsers; IE/legacy-Safari-era polyfills deleted (michaldudak). Complementary open thread: #1726 polyfilling CSS pseudo-classes via `usePress`-like normalization.
- Implication for docs: no legacy-browser caveats needed; browser-bug patches (e.g. Safari quirks) are still in scope per-component.

### #351 — Canary releases (issue, closed → #1865)
- Decided: publish canaries continuously ("release after each merged PR" strategy, michaldudak); every merged PR bot-comments a `pkg.pr.new` install line.
- Implication for docs: unreleased fixes are installable immediately; changelogs per stable release.

### #1246 — Bundle size umbrella (issue, closed, 7 comments)
- Decided: remove `prop-types` from the published build entirely; minify error messages (error-code extraction, #1463, now a repo rule); dedupe Floating UI logic; later `#4336` reduced shared chunk, `#4943` made grid navigation tree-shakeable.
- Implication for docs: "lean headless core" is a maintained promise, not marketing.

### #1110 — Functional styles (issue, closed)
- Decided: keep the few unavoidable functional styles inline (e.g. `outline: 0`, popup `max-height`), avoid `@layer`/`<style>`-tag delivery; removable via `style={{ prop: undefined }}` (atomiks).
- Implication for docs: document which parts ship critical inline styles and how to override them.

### #2262 + PR #1738 + #4042 — the AI/LLM documentation arc (open / merged / closed)
- Problem: Claude Code et al. hallucinate Radix APIs (`asChild`, `data-state`) and the old package name into Base UI code (#2262, still open).
- Decided: ship `llms.txt` + a `.md` twin of every docs page (`/react/components/X.md`, PR #1738 by Janpot); **rejected** publishing an official skills.sh Skill (#4042) — "AGENTS.md was found to be more effective than skills because it forcefully injects the notice on every request" (atomiks), including a recommended AGENTS.md snippet: point at `https://base-ui.com/llms.txt`, state "There is no `asChild` prop… the `render` prop is used".
- Janpot's self-critique: generated llms.txt "lack substance… even for humans these docs lack substance" — an acknowledged docs gap (proposal in-thread: Reference vs Guides split).
- Implication for docs: a Storybook docs set that adds usage depth (compositions, integrations, edge cases) fills the gap the maintainers themselves identified.

### #4329 — Export Root context hooks (issue, OPEN, 13 comments)
- Proposed: public `useCheckboxRootContext()` etc. for custom subcomponents (react-aria precedent).
- Decided (for v1): **NO** — "We don't support this in favor of the render prop… for [state-observer components] use controlled mode… unlikely we will do so in v1" (mj12albert). Tension acknowledged: the upcoming Calendar exposes `Calendar.useContext()`; flaviendelangle: "The last thing I want is to end up with DX that vary randomly across components" — unification promised before its release.
- Implication for docs: reading part state = `render`/`className` callbacks' `state` arg; app-level state = controlled props; contexts are private.

### #22 — [RFC] Base UI Tailwind plugin (issue, OPEN since 2024)
- Status: perennial; no plugin shipped. Tailwind is instead served by the boolean data-attribute convention (#717) working with `data-[open]:` variants out of the box.
- [G] No decisive maintainer verdict found in search results; treat as unresolved.

## Convention arcs

### The render-prop convention (#1315 → #1418 → #993 → #2859/#3779/#4039 → #3983 → #4329)
Base UI inherited a `render` prop (element or function form) instead of Radix's `asChild` and doubled down on it in stages. First it was made user-extensible: #1315 weighed a `<Slot/>` component against a hook and the team chose `useRender` (PR #1418), deliberately shipping it minimal with `mergeProps` alongside. Semantics were sharpened in #993 (element form merges className/props; function form hands you raw `props` and you own the spread) and hardened against async components (#2859), reconciliation crashes (#4039), and bad error messages (#3779). The direct challenge to replace it with `asChild` (#3983, Feb 2026) was rebuffed with the fullest statement of rationale on record (explicitness, no `cloneElement`, children always mean children), and #4329 extended the doctrine: no public context hooks because `render`'s `state` argument plus controlled props are the sanctioned extension points.

### The event-details pattern (#600 → #1782 → #2382 → #2726/#2682)
The `onValueChange(value)` value-first signature was defended against native-`onChange` traditionalism in #600 (setter-passing ergonomics). PR #1782 refined `OpenChangeReason` into structured reason strings; PR #2382 then unified everything: `(value, eventDetails)` with typed reasons that narrow the event type, an always-present synthetic-fallback event, and `cancel()`/`allowPropagation()` control — replacing the "make it controlled to veto changes" idiom. Follow-ups aligned components to it (NumberField with Slider #2726; Combobox correct-DOM-event fixes #2682). Every component now exports `ChangeEventReason`/`ChangeEventDetails`.

### Data attributes as the styling API (#717 → #625 → #864 → #543/#1004 → #3036 → #1110)
Colm Tuite's #717 set the cornerstone: split `data-state` into boolean `data-open`/`data-checked`/… attributes for Tailwind ergonomics. #625 established that state attributes are duplicated onto **every part** so no style ever depends on DOM structure ("enable devs, not restrict them"). #864 unified the naming of the state object (`State`, not `OwnerState`), #543 + #1004 forced data attributes and CSS-state hooks into generated per-component API reference (PR #818), #3036 confirmed `data-pressed` vs `data-popup-open` stay distinct on purpose, and #1110 settled that only minimal functional inline styles ship, individually removable. Net: CSS selectors on documented data attributes are the official theming interface; CSS variables (`--available-height`, `--positioner-*`, panel sizes #2774) extend it for measurements.

### Detached triggers & handles — the post-1.0 composability story (#2069 → #2283 → #2336 → #3170 → #2974, closing #2802)
The 2025 RFC asking Roots to expose `{ open, setOpen }` was initially rejected in favor of "one unified API" (controlled mode) and a11y-bearing Trigger parts. But the underlying need — triggers far from the Root, multiple triggers, imperative open — was accepted and answered architecturally: `createHandle()` + `handle` prop on Popover (#2336), Menu (#3170), Dialog/AlertDialog with typed per-trigger `payload` and imperative `open/openWithPayload/close` (#2974) — explicitly positioned as making "controlled mode almost unnecessary" and shipped additively after v1.0 because it broke nothing. It also absorbed the dialog-manager request (#2802). Store infrastructure (#2834, #3037, #2868, #3464) was the internal enabler.

### The 1.0 stabilization (#10 → alpha Dec 2024 → betas 2025 → rc → v1.0.0 on 2025-12-11)
From the 2021 umbrella (#10) through `v1.0.0-alpha.0` (milestone due 2024-12-13) the library was assembled; 2025's beta phase was a deliberate consolidation sweep — false-by-default booleans (#930), a single `multiple` prop (#1075), `value` fallback semantics (#3373), span-rooted form controls (#3205), Select.List (#2596), required Portal (#1222), tabs activation a11y (#3176), event details (#2382) — colmtuite framing it: "it's more about stability, refining APIs, and consolidating APIs library-wide to minimise the risk of future breaking changes" (#2485). The npm org rename to `@base-ui/*` (#3462) landed between rc and stable; v1.0.0 merged 2025-12-11 (PR #3500), exactly on the milestone due date, followed by minor releases through v1.6.0 (June 2026). Post-1.0 additions (handles, Drawer #3680/#4293, OTP Field #4365, temporal Calendar #1973) arrive as non-breaking minors.

### Accessibility policy in practice (#656, #1323/#2006/#3176, #3205, #1909, #4169–#4253, #2765)
There is no single a11y policy document; the policy is enforced through arguments won in issues: focusable-when-disabled rules by composite-vs-standalone role (#656); WCAG 2.5.2 pointer cancellation overturning mousedown activation (#1323→#3176); valid-HTML label wrapping forcing span roots (#3205); `nativeButton` making polymorphism a11y-safe (#1909). A coordinated external audit wave (Feb–Mar 2026: #4169–#4253, screen-reader announcements, contrast, toast timing) was triaged and largely fixed. #2765 (open, oliviertassinari) proposes a per-component "Accessibility" docs section — an acknowledged docs gap.

### AI-era documentation (#2262 → #1738 → #4042 → #601/#3009)
Users report LLMs writing Radix-flavored Base UI (#2262). Responses: markdown twins of all docs pages + llms.txt (#1738); refusal to add Radix-compat props because "AI will keep using it instead of learning the Base UI way" (#601); refusal of an official Skill in favor of an AGENTS.md notice pattern (#4042); an admitted content gap ("even for humans these docs lack substance", Janpot) and an open request for a Radix-comparison page (#3009).

## Milestones & roadmap signals

- **Milestone 1: `v1.0.0-alpha.0`** — closed; 45 issues; due 2024-12-13; created by mnajdova.
- **Milestone 2: `v1.0.0` "v1 stable release"** — due 2025-12-11; v1.0.0 shipped that exact day (PR #3500); milestone still shows 9 open issues (post-release stragglers). Created by mj12albert.
- Release ladder (all `[release]`-labeled PRs cached): alpha.0 #291 (Dec 2024) → beta.0 #1986 (~mid-2025) → beta.7 #3331 → rc.0–rc.2 #3402/#3494/#3497 → **v1.0.0 #3500 (2025-12-11)** → v1.1.0 #3729 → v1.2.0 #4057 → v1.3.0 #4300 → v1.4.0 #4562 → v1.5.0 #4850 → v1.6.0 #5064 (June 2026). `@base-ui/utils` versions independently (0.3.0, #5018).
- New-scope pipeline is upvote-driven (`waiting for 👍`): top-reacted asks include richer Color Picker #3351, Dropzone/File Upload #1492, slider marks #462, draggable dialogs #2689, focusable-outside modals #3750, standalone Portal export #1524, Breadcrumbs #2852. A Feb-2026 batch of `[discussion] Add X component?` issues (#4779–#4801: Kanban, Gantt, Rich Text Editor, PDF viewer, Carousel…) — nearly all sit at 0–1 comments, signaling the scope boundary in practice.
- Actively developed next-wave scope: **temporal primitives** (Calendar #1973 merged with 69 comments; Date/Time fields #3666; umbrella #1709), Drawer (#3680, unmarked from preview in #4293), OTP Field (#4365), Menubar (#1684), Navigation Menu semantic overhaul (#2526).
- Framework expansion repeatedly requested, none committed: SolidJS #2200, Svelte #3450, Angular #3938, Vue #3503, React Native #2612, Preact #1995 (bugs fixed, no first-class support). Base UI MCP server floated (#3322, open).
- Docs roadmap signals: docs-feedback umbrellas #588/#2766, demos revamp #4676, props table #2135, handbook pages #1141, releases timeline #3713, "add more demos" #3027 (open), a11y sections #2765 (open), Radix comparison #3009 (open).

## Dead ends / rejected proposals

- **`asChild` composition** (#3983): "unlikely we'll change this API" — `render` is permanent; issue open only "to measure sentiment" (michaldudak).
- **Radix-compat deprecated props** (#601): rejected — cumbersome across parts and would train AI on the wrong API (michaldudak).
- **Per-component npm packages** (#1700): rejected — monopackage was a deliberate decision; Radix's separate packages caused "nightmarish" version-mismatch bugs (atomiks).
- **Native `<dialog>`/top layer** (#485, #4760): not viable for a general-purpose library while third-party content can't join the top layer (atomiks, oliviertassinari); revisitable as the platform evolves.
- **AspectRatio component** (#2189, `not planned`): CSS `aspect-ratio` makes it unnecessary (colmtuite).
- **ButtonGroup component** (#4008): `role="group"` + your buttons; nothing for a headless library to add — use Toolbar/ToggleGroup (mj12albert).
- **Radix-Themes-style styled layer** (#2292): "no plans for anything like Radix Themes / Material UI / Chakra…"; shadcn/ui integration is the answer (colmtuite).
- **Official skills.sh Skill** (#4042): closed — AGENTS.md + llms.txt preferred; "If the position regarding the Skills ever changes, we can revisit" (LukasTy).
- **Public Root context hooks** (#4329): not in v1 — render prop + controlled mode are the extension points (mj12albert); Calendar's `useContext` inconsistency to be reconciled before its release (flaviendelangle).
- **Dialog manager** (#2802): no toast-style manager for dialogs — imperative handles (#2974) are the sanctioned alternative (atomiks).
- **Required `value` on Tabs/Accordion** (PR #2124): closed unmerged — `useId` fallback chosen instead (#3373).
- **Consolidating `data-pressed`/`data-popup-open`** (#3036): kept separate deliberately for multi-popup triggers (atomiks).
- **Functional styles via `@layer`/`<style>` tags** (#1110): rejected; minimal inline styles retained (atomiks).
- **Root-only data attributes + descendant selectors** (#625): rejected; per-part style hooks are the contract (colmtuite).
- **Slot component** (#1315): rejected in favor of the `useRender` hook.
- **`onChange(event)`-first signatures** (#600): rejected in favor of value-first `onValueChange`.

## Honest gaps [G]

- [G] Searches for "philosophy", "transitionStatus", "starting-style" (in titles), "eventDetails" (issues, not PRs), and `v1.x`-labeled issues returned nothing usable — the animation API (`data-starting-style`/`data-ending-style`, `transitionStatus`) appears to have been designed inside component PRs and the docs handbook rather than a standalone RFC; closest public artifacts are #1494 (Motion + Tabs), #3099/#4915/#4553 (transition edge-case bugs), and the `keepMounted` + `AnimatePresence` guidance in the animation handbook page referenced from #1494.
- [G] No dedicated "accessibility policy" meta-issue exists; the policy is distributed across the decisions cataloged above.
- [G] `gh search` OR-phrase queries silently return empty; all searches were re-run as single terms (cached).
- [G] GitHub Discussions are disabled on the repo (noted by a user in #4008); issues carry all debate.
