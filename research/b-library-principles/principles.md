# Base UI — library-wide principles

Phase B synthesis (2026-07-06). Inputs: the four mining files in [`_mining/`](./_mining/) — `handbook-extracts.md` (in-repo docs), `discussions.md` (support Q&A corpus), `issues-prs.md` (project-level decisions), `history.md` (release/git archaeology). Every principle follows the same shape: **statement** → **evidence** ([E] direct, [I] inference, [G] acknowledged gap, with exact citations) → **implication for documentation**, referencing section numbers of the [documentation Definition of Done](../a-documentation-standard/documentation-definition-of-done.md) as "DoD §N". `#NNNN` resolves at https://github.com/mui/base-ui (GitHub redirects between `/issues/` and `/pull/`). The deduplicated citation pool is [sources.md](./sources.md); the vocabulary is [glossary.md](./glossary.md). Phase C briefs cross-reference principles as **B-P\<n\>** and misuse themes as **B-M\<n\>**.

Two honesty notes up front:

- GitHub Discussions is effectively unused on mui/base-ui: 4 threads ever, one a placeholder (discussions.md; a commenter in #4008 noted Discussions are disabled). The "support corpus" cited throughout is GitHub **issues** triaged as `support: question` / `type: expected behavior` / `has workaround` (~226 deduped issues).
- Where the mining files tell different stories, the divergence is flagged inline rather than smoothed over (see B-P12 on merge-order phrasing, B-P40 on `unstable-`).

## 1. Project goals & positioning

### B-P1. Headless, accessible, composable — in that register

**Statement.** Base UI is an unstyled ("headless") React component library whose stated priorities are accessibility, performance, and developer experience; it defines itself by exactly three features: Headless, Accessible, Composable.

- [E] "Base UI is an unstyled UI component library for building accessible user interfaces" (`README.md`); "Our focus is on accessibility, performance, and developer experience"; the About page's three feature H2s are Headless / Accessible / Composable (`docs/src/app/(docs)/react/overview/about/page.mdx`).
- [E] Headless: "components are unstyled, don't bundle CSS, and don't prescribe a styling solution. You retain complete control over your application's CSS layer." Composable: "Component APIs are fully open, so you have direct access to each node" (same page).

**Implication for documentation.** Identity strips and features bullets (DoD §1, §3) lead with behavior delivered, never appearance; a styled hero (DoD §2) is required precisely because the library ships nothing visible.

### B-P2. Pedigree and the MUI relationship

**Statement.** Base UI is built inside the MUI organization by the creators of Radix, Floating UI, and Material UI — and is deliberately re-thought, not "Material UI minus CSS"; Floating UI is absorbed, not depended on.

- [E] "From the creators of Radix, Floating UI, and Material UI…" (`README.md`); team members credited by prior project (Radix, Floating UI, Material UI, Fluent UI) on the About page; "Base UI is an open-source project of the MUI organization… `mui/base-ui` imports the code infrastructure from `mui/material-ui`" (`CONTRIBUTING.md`).
- [E] "We usually don't just remove the styling from Material UI components but also take the opportunity to rethink the API surface or rewrite the internals" (michaldudak, #10); `@floating-ui/react` was vendored in-tree (#2002, commit 77af56c77, 2025-06-23).
- [E] The deciding maintainers on record: michaldudak (tech lead), atomiks, colmtuite, mj12albert, vladmoroz, mnajdova, oliviertassinari, aarongarciah, LukasTy, flaviendelangle, Janpot (issues-prs.md roster).

**Implication for documentation.** Migration/interop notes (DoD §28) translate Radix/Material idioms rather than assuming 1:1 equivalence; decision logs (DoD §18) can quote named maintainers.

### B-P3. Foundation layer, never a theme

**Statement.** Base UI positions itself as the unstyled foundation that styled systems (shadcn/ui and a dozen others) build on; shipping a styled/theme tier is explicitly ruled out.

- [E] "We still have no plans for anything like Radix Themes / Material UI / Chakra / Mantine / Hero UI etc." (colmtuite, #2292); "We feel like increasing the component portfolio would bring more value than delving into theming" (LukasTy, #4008).
- [E] "shadcn/ui… uses Base UI as its unstyled foundation", plus a named ecosystem (Kumo/Cloudflare, coss ui/cal.com, 9ui, …) (`docs/src/app/(docs)/react/overview/community/page.mdx`; quick-start page).

**Implication for documentation.** All styling in stories/demos is explicitly userland example code, not API — say so on every page (DoD §2, §10); related sections may point at the styled ecosystem (DoD §21).

### B-P4. A stated scope test gates components

**Statement.** A primitive ships only where (a) HTML lacks the functionality, (b) the HTML element can't be styled, or (c) no good HTML primitive exists; CSS-replaceable and role-only wrappers are rejected, and community upvotes gate new scope.

- [E] colmtuite articulated the (a)/(b)/(c) test in the Button debate (#2138, #2225); Button was first rejected, then reversed on accessibility grounds — `focusableWhenDisabled`, Enter/Space normalization on non-native tags, browser-bug patching (PR #2363).
- [E] AspectRatio rejected: "CSS now supports this natively" (colmtuite, #2189, labeled `not planned`); ButtonGroup rejected: "just `role='group'` around some normal buttons… there isn't anything that a headless lib could add" (mj12albert, #4008).
- [E] The `waiting for 👍` label is the explicit upvote gate; the Feb-2026 proposal batch #4779–#4801 (Kanban, Gantt, Rich Text Editor, …) sits at 0–1 comments each (issues-prs.md).

**Implication for documentation.** "When not to use" (DoD §5) can cite rejections as first-class evidence and provide compose-it-yourself recipes for intentionally missing components.

### B-P5. One lean, tree-shakable monopackage

**Statement.** A single package with per-component subpath imports is a deliberate, defended architecture, and bundle leanness is maintained work; support targets are React 17+ and Baseline Widely Available browsers.

- [E] "All components are included in a single package. Base UI is tree-shakable" (quick-start page); per-component packages rejected — Radix's separate packages caused version-mismatch bugs described as nightmarish (atomiks, #1700); subpaths made explicit in #870 (commit 3ec78abb3).
- [E] Ongoing leanness work: prop-types removed (#1760), error messages minified (#1463), shared chunk reduced (#4336), grid navigation made tree-shakeable (#4943), closed-popup mount/unmount perf improved by up to 50%/85% (#4661, v1.5.0); bundle umbrella #1246.
- [E] "Base UI supports React 17 and newer"; browser features must be Baseline Widely Available at the last major release (About page; support updated in #3235).

**Implication for documentation.** Identity strips (DoD §1) always show the subpath import (`@base-ui/react/<slug>`); performance notes (DoD §27) may cite the lean-core promise but never speculate beyond cited PRs.

### B-P6. Docs are a product with an explicit AI audience — and an admitted depth gap

**Statement.** The docs ship machine-readable twins (`llms.txt`, per-page `.md`) and the team optimizes against LLM misuse of Radix idioms; maintainers themselves say the current content lacks substance.

- [E] "View as Markdown" links on every page and an `llms.txt` (quick-start page; PR #1738); an official skills.sh Skill was rejected in favor of an AGENTS.md notice pattern pointing at `https://base-ui.com/llms.txt` and stating "There is no `asChild` prop" (atomiks, #4042); Radix-compat props rejected partly because "AI will keep using it instead of learning the Base UI way" (michaldudak, #601); LLMs hallucinating Radix APIs remains an open issue (#2262).
- [E] Janpot's self-critique of the generated docs: "even for humans these docs lack substance" (#1738 thread); a Reference-vs-Guides split was proposed in-thread.

**Implication for documentation.** The Storybook is the depth layer maintainers say is missing; use Base UI's exact vocabulary everywhere ([glossary.md](./glossary.md)) and include explicit anti-Radix-hallucination callouts (DoD §28).

### B-P7. Errors must explain themselves

**Statement.** Every public error message must say what happened, why it's a problem, and how to solve it — prefixed `Base UI:`, with a docs link where applicable — and errors are code-minified for production.

- [E] The three-part error contract and `Base UI:` prefix are house law; `pnpm extract-error-codes` maintains `docs/src/error-codes.json` (`AGENTS.md`, rules added in #3864, commit 6583c18f0); error messages were made consistent library-wide in #2049; render-prop error messages hardened in #3779.

**Implication for documentation.** Troubleshooting content can quote real error strings verbatim (they are stable, documented API surface); pitfalls sections (DoD §16, §19) should reproduce the error a misuse triggers.

## 2. The API grammar

### 2.1 Root/part namespaces

#### B-P8. One component per DOM node, coordinated by a Root

**Statement.** Every component is a namespace of parts — one component per rendered DOM node — with a stateful Root sharing logic to descendants through private context; this replaced the Material-era `slots`/`slotProps` model.

- [E] The origin RFC proposed exactly "component-per-DOM-node + a `render` prop for element replacement" (michaldudak, discussion #157); Switch was the first component rewritten to the model (#135, commit fe6814c7e, 2024-03-25).
- [E] Types mirror the grammar: every part exposes `Props` and `State` in its namespace, e.g. `Tooltip.Root.Props` (`docs/src/app/(docs)/react/handbook/typescript/page.mdx`); "If two components can share logic…, define the logic/handlers in the parent and share it through a context to the child" (`AGENTS.md`); docs formally distinguish single-part vs multi-part components (`CONTRIBUTING.md`).

**Implication for documentation.** The anatomy section (DoD §6) *is* the API map — every part, what it renders, which parts are optional; API reference stays per-part (DoD §22).

### 2.2 The render prop

#### B-P9. `render` is permanent; `asChild` was rejected with a full rationale

**Statement.** Composition happens through the `render` prop — element form or `(props, state) => element` function form — and the direct proposal to switch to Radix's `asChild` was rebuffed.

- [E] "it is unlikely we'll change this API. I'll keep the issue open, though, to measure sentiment" (michaldudak, #3983). Recorded rationale: `render` is explicit (the prop belongs to the element being replaced); the function form avoids soft-deprecated `cloneElement` and is faster; `asChild` changes how children are interpreted and is easy to forget, causing button-in-button bugs; react-aria-components also adopted a render prop (#3983).
- [E] Custom components "must forward the `ref`, and spread all the received props on its underlying DOM node"; render props "can be nested as deeply as necessary" — the canonical triple-nesting example is `Tooltip.Trigger render={<Dialog.Trigger render={<Menu.Trigger render={<MyButton/>}/>}/>}` (`docs/src/app/(docs)/react/handbook/composition/page.mdx`).
- [E] Intended altitude: "primarily designed for composing event handlers and behavioral props. In most cases it should render the same tag as the default element" (`docs/src/app/(docs)/react/utils/use-render/page.mdx`).

**Implication for documentation.** Every composition example uses `render`; each component page carries a "there is no `asChild`" note near its first `render` example (DoD §16, §28) — a documented LLM/muscle-memory failure mode (#2262).

#### B-P10. Rules of render (the footguns)

**Statement.** The render function is not a React component: it may not contain hooks; only `render={<Component />}` and `render={(props, state) => …}` are valid; and rendering a different tag needs an explicit signal (`nativeButton`) because element identity must be known before hydration.

- [E] `render={Component}` crashes during React reconciliation when hooks are inside; the asker called it "a pretty big footgun" that TypeScript cannot catch (#4039). Runtime warnings were added (#4077, commit cafc25a9d) and tuned twice (#4324, #4363); async components and lazy elements hardened separately (#2859, #3856).
- [E] "Since the component can't know what element `render` will produce at render time and before hydration, props like these need an explicit signal. This is why Base UI's Button provides a `nativeButton` prop" (`use-render` page); the `nativeButton` convention arrived in #1909, alongside the span-root work (#3205).
- [E] "Each Base UI component renders the most appropriate element by default, and in most cases, rendering a different element is recommended only on a case-by-case basis" (composition page).

**Implication for documentation.** The composition doc needs a loud "rules of render" box (DoD §16); every tag-swapping example sets `nativeButton`; overlay pages show the function form together with `mergeProps` (DoD §7, §12).

#### B-P11. The extension points are enumerated — and contexts are not among them

**Statement.** The sanctioned ways to read or extend a component are exactly: the render prop's `state` argument, `className`/`style` state functions, data attributes, controlled props, and `eventDetails` — not exported hooks, not public contexts.

- [E] Public Root context hooks declined for v1: "We don't support this in favor of the render prop… for [state-observer components] use controlled mode… unlikely we will do so in v1" (mj12albert, #4329 — the highest-reaction open ask in the support corpus, 13 comments + 10 reactions).
- [E] `@mui/base`-style hooks are gone by design: "no hooks in the new library — being refactored away; compose instead" (mj12albert, #1814).
- [E] Acknowledged tension: the upcoming Calendar experiments with `Calendar.useContext()`; "The last thing I want is to end up with DX that vary randomly across components" (flaviendelangle, #4329) — unification promised before its release.

**Implication for documentation.** Publish a "how to read component state" mapping (need → mechanism) once at principles level and reference it from behaviors sections (DoD §7, §12); never document private contexts.

### 2.3 mergeProps / useRender contracts

#### B-P12. `useRender` + `mergeProps` are the public protocol, with precise merge semantics

**Statement.** Consumers make their own components speak the render-prop grammar with `useRender` (a hook was chosen over a Radix-style `<Slot/>`), and `mergeProps` defines exact, load-bearing merge semantics.

- [E] "We discussed this among the team and decided that a hook may be a better abstraction than `<Slot/>`" (mj12albert, #1315 → PR #1418); `mergeProps` shipped separately at atomiks' insistence and became a public util in v1.1.0 (#3642); `useRender` was rewritten to return the element directly and `refs` renamed to `ref` (#1934).
- [E] Merge semantics (`docs/src/app/(docs)/react/utils/merge-props/page.mdx`): rightmost value wins; `className` strings concatenate right-to-left; `style` objects merge with rightmost keys winning; "`ref` is not merged. Only the rightmost ref is kept"; event handlers all run, rightmost (user) first — which is what lets `event.preventBaseUIHandler()` stop Base UI's internal logic before it runs (synthetic events only); function arguments *replace* accumulated props ("you must call them manually" to chain); `mergeProps` takes up to 5 objects, `mergePropsN` beyond that. Divergence note: the `use-render` page phrases the same ordering as "merges objects from left to right, so that subsequent objects' properties… overwrite previous ones" — the same semantics narrated from the other end, not a contradiction (both captured in handbook-extracts.md).
- [E] React-version contract: React 19 needs no `forwardRef` ("the external ref prop is already contained inside `props`"); React 17/18 require it, adding the forwarded ref to the `ref` array (`use-render` page).

**Implication for documentation.** Wrapper-component guidance (DoD §12, §22) demos `useRender`, never a home-made Slot; document the merge order and `preventBaseUIHandler` with its synthetic-only caveat.

### 2.4 Data-attributes doctrine

#### B-P13. Boolean attributes, duplicated on every part

**Statement.** Styling state is exposed as boolean data attributes (`data-open`, `data-checked`, …) — never a Radix-style `data-state="…"` value — and every state attribute is duplicated onto every part so styles never depend on DOM structure.

- [E] `data-state` was split into boolean attributes "for naming consistency, better TW support, and easier Radix migration" (colmtuite, #717).
- [E] Root-only attributes + descendant selectors rejected: "It's generally a bad idea to have your styles rely on DOM structure… It's standard practice to provide style hooks per component. We want to enable devs, not restrict them. There is also the TW experience to consider" (colmtuite, #625).
- [E] Deliberately parallel attributes stay separate: `data-pressed` (pressed toggle) vs `data-popup-open` (its popup is open), so a Tooltip and a Menu attached to one button style independently (atomiks, #3036); attributes and CSS hooks are forced into the generated per-part API reference (#543, #1004 → PR #818).

**Implication for documentation.** A per-part state → selector table is required on every page (DoD §10); demos never use descendant selectors for state; Tailwind `data-*` variants are shown as first-class.

### 2.5 CSS variables

#### B-P14. Measurements travel as CSS variables

**Statement.** Dynamic numeric values (available space, anchor size, transform origin) are delivered as per-part CSS variables — the numeric complement to the boolean state attributes.

- [E] "Components expose CSS variables to aid in styling, often containing dynamic numeric values to be used in sizing or transform calculations" — e.g. `--available-height` and `--anchor-width` on Popover's Popup, used as `max-height: var(--available-height)` (`docs/src/app/(docs)/react/handbook/styling/page.mdx`); the canonical animation recipe uses `transform-origin: var(--transform-origin)` (animation page); panel-size variables extended the set (#2774).

**Implication for documentation.** The styling contract section (DoD §10) lists each variable with meaning and one worked usage; popup animation examples must use `--transform-origin` (DoD §11).

### 2.6 State, events, and the ChangeEventDetails pattern

#### B-P15. Uncontrolled by default; controlled via `x`/`onXChange`/`defaultX` triplets

**Statement.** Components manage their own state unless you hand them state: controlled props always come in value/handler/default triplets, and value-first callback signatures are a defended convention (`onValueChange={setValue}` works).

- [E] "Components are uncontrolled by default, meaning that they manage their own state internally"; controlled = external state via `open`/`value` plus its change handler (`docs/src/app/(docs)/react/handbook/customization/page.mdx`).
- [E] Native-`onChange(event)` signatures were rejected in favor of value-first `onValueChange(value, …)` — it matches the paired prop and lets setters pass directly (atomiks, #600); the renames landed as early as alpha.2 (`onChange` → `onCheckedChange`/`onValueChange`, #465/#464).
- [E] Even identity props avoid boilerplate: `value` on Tabs/Accordion items stayed optional with a `useId`-generated fallback rather than becoming required (#1880 → PR #2124 closed unmerged → #3373; Tabs later required `value` at rc.0 to fix `keepMounted`, #3372 — the exception that was measured first).

**Implication for documentation.** Simple demos stay uncontrolled; every controlled example shows the full triplet; per-prop guidance explains *when* controlling is warranted (DoD §7, §12) — and B-P17's handles cover most "I need control" cases.

#### B-P16. Every change carries `eventDetails`: reason, event, cancel

**Statement.** Every change callback is `(value, eventDetails)` where `eventDetails` exposes `.reason` (a typed string union that narrows the DOM event), `.event`, `.cancel()` (veto the state change while staying uncontrolled), and `.allowPropagation()`.

- [E] PR #2382 unified all callbacks from `(value, event, reason)` to `(value, eventDetails)`; the design moved off mutating native events after vladmoroz's API feedback; refined in #2698, made generic in #2796 (`BaseUIChangeEventDetails`); callbacks with no reason get `reason: 'none'`; every component exports `ChangeEventReason`/`ChangeEventDetails` types (issues-prs.md; typescript page).
- [E] Reason vocabulary standardized at beta.0: `hover` → `trigger-hover`, `click` → `trigger-press`, `focus` → `trigger-focus` (#1782; beta.0 release notes).
- [E] Documented shape: `{ reason, event, cancel(), allowPropagation(), isCanceled, isPropagationAllowed }`; canceling "lets you leave the component uncontrolled as its internal state is prevented from updating"; Esc propagation is stopped by default "so parent popups don't close simultaneously", opt out via `allowPropagation()` (`docs/src/app/(docs)/react/handbook/customization/page.mdx`).

**Implication for documentation.** Every `onXChange` doc shows reading `reason` and calling `cancel()` (DoD §7 names this contract explicitly); component pages enumerate their reason strings — support threads show this is the least-discovered high-value API (B-M4).

### 2.7 The createHandle / payload pattern

#### B-P17. Handles are the sanctioned imperative surface

**Statement.** Detached triggers connected through `createHandle()` — with typed per-trigger `payload` and imperative `open`/`openWithPayload`/`close` — are the modern answer to "open it from anywhere", superseding both a `{ open, setOpen }` state interface and a dialog manager.

- [E] The RFC to expose `{ open, setOpen }` from Root (#2069) was rejected: controlled mode "works in more scenarios and it's better to restrict this to one unified API" (atomiks); Trigger/Close parts exist chiefly for accessibility wiring — `aria-haspopup`/`aria-expanded`/`aria-controls` (michaldudak, #2069).
- [E] Handles then answered the need architecturally: Popover #2336, Menu #3170, Dialog/AlertDialog #2974 — "This should make the controlled mode almost unnecessary" (michaldudak); the toast-style dialog-manager request was closed by it (#2802); store infrastructure enabled it (#2834, #3037, #2868, #3464).
- [E] Trigger-owned interaction config: `openOnHover`/`delay`/`closeDelay` moved Root → Trigger in beta.5, and popups accept multiple triggers (#3170, #3071, #3182, #2336); typed payloads via `createHandle<T>()` (`docs/src/app/(docs)/react/components/menu/page.mdx`).

**Implication for documentation.** Teach three tiers — uncontrolled parts → controlled props → handles for detached/imperative/payload cases (DoD §7, §12); "open a dialog from anywhere" recipes use handles, not controlled-state boilerplate.

### 2.8 Portal / Positioner / Popup layering grammar

#### B-P18. Popup anatomy is explicit, and Portal is mandatory

**Statement.** The popup skeleton is Root → Trigger → Portal → Positioner → Popup: Portal is required and throws when missing, `keepMounted` lives on Portal, positioning config (and any unavoidable `z-index`) belongs to Positioner, and `container` is set only on the root portal. Required parts are spelled out rather than implied — a library-wide "explicit anatomy" doctrine.

- [E] Every popup component requires its own `<X.Portal>`; a missing Portal throws at render time — it "ensures the whole app doesn't render and lets them know the tree is invalid in a very obvious way"; `keepMounted` consolidated onto Portal (PR #1222, over michaldudak's bundle-size challenge).
- [E] Positioning config belongs to Positioner: `Root.alignItemToTrigger` → `Positioner.alignItemWithTrigger` (#1713); "don't set z-index at all… if you must, it belongs on `Positioner` (the positioned element), never `Popup`" (#2450); nested portals automatically append inside their parent's tree, so `container` goes only on the root `Portal` (#1930); `container` semantics are load-bearing: `null` = wait for the element, `undefined` = use the default and don't re-check (#2780).
- [E] The explicit-anatomy doctrine repeats across components: ScrollArea gained a required `Content` part (#1607), Toast gained a `Portal` part (#1962), nested menus must use `Menu.SubmenuRoot` "to avoid ambiguity" (#2042), Select gained `Select.List` (#2596).
- [E] The recommended app shell — a `.root` element with `isolation: isolate` — exists so "popups always appear above the page contents, and any `z-index` property in your styles won't interfere"; when users asked to remove the setup step, atomiks defended it as what enables layering "without any z-index war" (quick-start page; #2293).

**Implication for documentation.** Anatomy sections (DoD §6) annotate the layering grammar and mark mandatory parts; one canonical stacking-model doc is required site-level with every overlay page linking it (B-M1).

### 2.9 The TypeScript grammar

#### B-P19. Namespaced types are part of the public API

**Statement.** Every part publishes `Props` and `State`; roots add `ChangeEventDetails`/`ChangeEventReason` and (for popups) `Actions`; `useRender.ComponentProps` vs `useRender.ElementProps` distinguish public and private prop layers — these types are documented API, not internals.

- [E] "Every component has two core interfaces: `Props` (such as `Tooltip.Root.Props`) [and] `State`"; `ChangeEventDetails`/`ChangeEventReason` per component; `Menu.Root.Actions` types `actionsRef`; `Toast.Root.ToastObject` for the toast object (`docs/src/app/(docs)/react/handbook/typescript/page.mdx`).
- [E] `useRender.ComponentProps` types "a component's external (public) props… the `render` prop and HTML attributes"; `useRender.ElementProps` types "HTML attributes alone" (`use-render` page); generic handles: "Provide a type argument to `createHandle()` to strongly type the payload" (menu page).
- [E] Limits are acknowledged: generics can't cross React context in compound components — the combobox docs document a typed-wrapper pattern instead (#3951); the common generic `value` type question is still open (#1076).

**Implication for documentation.** Wrapper examples type themselves with the namespace types (DoD §12, §22); a TypeScript-patterns section covers the typed-wrapper workaround with its issue citation (B-M5).

## 3. Styling philosophy

### B-P20. Exactly four style hooks, two of them state-functions

**Statement.** The styling API is CSS classes, data attributes, CSS variables, and the style prop — nothing else — and both `className` and `style` accept functions of the component's `state`.

- [E] The styling handbook enumerates exactly these four hooks; "The prop can also be passed a function that takes the component's state as an argument" — e.g. `className={(state) => state.checked ? 'checked' : 'unchecked'}`; the same for `style` (`docs/src/app/(docs)/react/handbook/styling/page.mdx`); style-as-function landed in #3038 (commit 7bdbfcb16).
- [E] The state object's public name is `state` — the Material-era `OwnerState` was renamed away (#864).

**Implication for documentation.** DoD §10 is required on every page; show at least one `className={(state) => …}` example library-wide so the function form is discoverable.

### B-P21. Two demo dialects — CSS Modules and Tailwind — as policy

**Statement.** Docs demos ship in exactly two styling variants, CSS Modules and Tailwind, and requests to add more were declined; styling-engine neutrality is expressed through the handbook, not through more demo dialects.

- [E] Demos are built with `createDemo`/`createDemoWithVariants` in CSS Modules + Tailwind twins (`CONTRIBUTING.md`); a contributor's offer to add Linaria/CSS-in-JS variants was declined for maintenance ROI (mj12albert/colmtuite, #3668).
- [E] Neutrality remains explicit — "you can use CSS-in-JS, plain CSS, or any other styling solution you prefer" (quick-start page) — and the CSS-in-JS *approach* is documented once via `@emotion/styled` wrapping (styling page).
- [E] Internal demo rules encode the aesthetic contract: follow the component's hero demo, raw color values from the Tailwind `@theme` block (e.g. `oklch(14.5% 0 0deg)`), `-webkit-user-select` alongside `user-select` (`AGENTS.md`).

**Implication for documentation.** Storybook stories mirror the hero-demo CSS (per the brief); where both dialects appear they must stay pattern-identical (DoD §2, §8).

### B-P22. "Unstyled" has audited exceptions, governed by CSPProvider

**Statement.** A few functional inline styles and exactly two injected `<style>` tags ship out of necessity; all are removable, and `CSPProvider` (nonce or `disableStyleElements`) governs them under strict CSP.

- [E] Minimal functional inline styles are kept (e.g. `outline: 0`, popup `max-height`), removable via `style={{ prop: undefined }}`; `@layer`/`<style>`-tag delivery for functional styles was rejected (atomiks, #1110).
- [E] The injected style tags are `<ScrollArea.Viewport>` and `<Select.Popup>`/`<Select.List>` when `alignItemWithTrigger` is enabled — they "inject a style tag to disable native scrollbars"; `CSPProvider` supplies a nonce, `disableStyleElements` removes the tags; inline `<script>` tags are opt-in and always need a nonce; unsetting inline styles means "you'll need to ensure you vet upgrades" (`docs/src/app/(docs)/react/utils/csp-provider/page.mdx`; CSPProvider shipped v1.1.0, #3553).

**Implication for documentation.** ScrollArea and Select pages must disclose their injected styles and the override/CSP path (DoD §10, §19, §25); "unstyled" claims elsewhere can then be absolute.

## 4. Animation philosophy

### B-P23. Transitions over keyframes, because transitions cancel

**Statement.** CSS transitions are the recommended animation path because they can be smoothly cancelled midway; the transition hooks are `[data-starting-style]`/`[data-ending-style]`, the keyframe hooks `[data-open]`/`[data-closed]`.

- [E] "Transitions are recommended over CSS animations, because a transition can be smoothly cancelled midway. For example, if the user closes a popup before it finishes opening…" ; both attribute pairs defined on the same page (`docs/src/app/(docs)/react/handbook/animation/page.mdx`).

**Implication for documentation.** Every animatable component gets one working transition example on these attributes (DoD §11); keyframes are presented as the alternative, not the default.

### B-P24. Unmount-on-close is the default; exit animation is an explicit contract

**Statement.** Popups unmount from the DOM when closed; exit animations therefore require CSS ending styles, or — for JS libraries — `keepMounted` on the Portal plus a controlled `open`, with `actionsRef.current.unmount()` as the manual escape hatch; completion is detected via `element.getAnimations()`.

- [E] "Most popup components like Popover, Dialog, Tooltip, and Menu are unmounted from the DOM when they are closed by default"; Motion recipes for both lifecycles; "If `opacity` isn't part of your animation… animate it using a value close to `1` (such as `opacity: 0.9999`), so that Base UI can detect the animation"; manual unmounting via `actionsRef`; Select needs a mix of both approaches (animation page).
- [E] Unmount detection watches the Popup's animations — conditionally rendering only `Dialog.Popup` strands the Portal; render the whole portal tree conditionally, or drive `actionsRef` (atomiks, #2186); `actionsRef` may be `null` (#3682).

**Implication for documentation.** Exit-animation guidance is mandatory for every popup (DoD §11) — a top support theme (B-M2) — including the `getAnimations()`/opacity detection contract and the conditional-rendering rule.

### B-P25. One-frame attribute semantics, honestly imprecise docs, no RFC

**Statement.** `data-starting-style` exists for exactly one frame (the transition source state) — a semantics users consistently misread; maintainers concede the docs wording is imprecise, and no standalone animation RFC ever existed.

- [E] A user expected `data-starting-style` to persist through the opening animation; maintainers explained the one-frame model and atomiks conceded a docs sentence "is definitely imprecise and should be updated" (#4915); library-wide wording fixes landed (#5151, commit 4cc8e31ca; missing transition attributes documented in #4098).
- [G] Searches for an animation-API RFC ("transitionStatus", "starting-style" in titles) returned nothing — the API was designed inside component PRs and the handbook (issues-prs.md, honest-gaps section).

**Implication for documentation.** Provide a frame-by-frame lifecycle diagram (starting-style frame → open → ending-style → unmount) and an `onOpenChangeComplete`-based "style during animation" recipe (DoD §11).

### B-P26. Animation footguns are environmental and named

**Statement.** The known failure modes come from the environment: Tailwind v4's `[hidden]{display:none!important}` reset defeats JS animation libraries, and non-popup components (Tabs, Collapsible panels) lack the popup animation machinery.

- [E] Tailwind v4 reset vs Motion's inline styles; workaround `hidden={undefined}` on the panel (mj12albert, #1608); Tabs + Motion: the animation docs target popups, and conditionally-rendered panels unmount instantly despite `keepMounted` (#1494); a genuine exit-animation race existed and was fixed (#3099 → #2985/#3101); a Preact double-render variant persisted until Preact 10.29.0 (#4127).

**Implication for documentation.** A named "Tailwind v4 + JS animation" callout in animation guidance; Tabs/Collapsible/Accordion pages need their own animation notes instead of pointing at popup guidance (DoD §11, §28).

## 5. Accessibility stance

### B-P27. A two-sided contract

**Statement.** The library guarantees ARIA attributes, roles, pointer/keyboard interactions, and focus management; the consumer owes visible focus styles, color contrast (APCA recommended), and accessible names.

- [E] "Base UI components handle many complex accessibility details including ARIA attributes, role attributes, pointer interactions, keyboard navigation, and focus management"; the page explicitly frames "ways **you need to augment the library**"; "it's the developer's responsibility to visually indicate focus" (`:focus-visible`); "consider adhering to APCA" unless strict standards compliance is required; components "adhere to the WAI-ARIA Authoring Practices" and are "tested on a broad spectrum of browsers, devices, platforms, screen readers" (`docs/src/app/(docs)/react/overview/accessibility/page.mdx`).
- [E] RTL is behavior-only via `DirectionProvider`: "does not affect HTML and CSS. The `dir="rtl"` HTML attribute or `direction: rtl` CSS style must be set additionally by your own application code" (`docs/src/app/(docs)/react/utils/direction-provider/page.mdx`).

**Implication for documentation.** DoD §9 must split "library guarantees" vs "you must provide" on every page — this split is Base UI's own framing; RTL notes follow the same two-sided shape (DoD §26).

### B-P28. Policy by argued decision, and WCAG beats "feel"

**Statement.** There is no accessibility policy document; policy is the accumulated record of argued decisions — and when WCAG conflicted with perceived responsiveness, WCAG won.

- [E] Tab activation flipped from mousedown to click after oliviertassinari's WCAG 2.5.2 (pointer cancellation) case beat colmtuite's "feels more responsive… nothing to cancel" defense; `activateOnFocus` default flipped to `false` (#1323, #2006 → PR #3176, beta.5, breaking).
- [E] Valid-HTML labeling forced Checkbox/Radio/Switch roots from `<button>` to `<span role=…>` with a hidden input (#3205, with in-thread VoiceOver/WAVE verification); a confirmed WCAG failure — no accessible name from a wrapping label, verified across NVDA/Narrator/JAWS — was fixed by auto-linking `aria-labelledby` (#4122 → #4142).
- [E] `focusableWhenDisabled` follows a composite-vs-standalone rule: roving-tabindex composites keep disabled items focusable, standalone controls don't (michaldudak, #656); a coordinated external audit wave (Feb–Mar 2026, #4169–#4253) was triaged and largely fixed. [G] No single a11y policy meta-issue exists (issues-prs.md).
- [E] Per-component "Accessibility" docs sections are an acknowledged, still-open gap (oliviertassinari, #2765).

**Implication for documentation.** Per-component keyboard/ARIA sections (DoD §9) and honest known-issues sections (DoD §19) fill a maintainer-acknowledged hole; decision logs date the a11y-driven flips (DoD §18).

### B-P29. Single tab stop, roving highlight, virtual focus — on purpose

**Statement.** Composite widgets take one Tab stop with arrow-key movement inside; in input-driven popups DOM focus never leaves the input and `data-highlighted` unifies hover and keyboard — users report these as bugs, maintainers defend them as ARIA-driven design.

- [E] `Combobox.Clear` has `tabIndex={-1}` on purpose — one tab stop per field; Esc/Delete clear via keyboard; matches the ARIA combobox pattern and screen-reader expectations (mnajdova/atomiks, #3630).
- [E] Combobox items are never DOM-focused — the input keeps focus (virtual focus); a single unified `data-highlighted` mirrors Select and Google Search behavior; keyboard-vs-pointer style differentiation is possible but discouraged (#2731).
- [E] Space activation fires on `keydown` for composite widgets, aligning with react-aria/Fluent after the menu-link Space/Enter debate (#1746 → #4053, commit bf3096970); disabled items stay focusable inside composites for discoverability (#656).

**Implication for documentation.** Keyboard tables (DoD §9) document the *rationale* ("fewer tab stops is more accessible"), and highlight styling targets `data-highlighted`, not `:focus` (DoD §10).

### B-P30. ARIA semantics draw the component boundaries

**Statement.** What separates look-alike components is interaction semantics, not appearance — and the best statements of those boundaries are maintainer answers currently stranded in closed issues.

- [E] A tooltip "labels a tool" — optional visual hint, never essential content, never shown on touch (iOS has no OS-level tooltips; long-press conflicts with native context menus); use Popover for essential content (atomiks, #3530).
- [E] ToggleGroup implements the toggle-button pattern (`aria-pressed`, deselectable); a single-select-you-can't-clear widget *is* a RadioGroup; making a toggle announce as a radio is semantically wrong (mj12albert, #3525); the legacy Popper/Popover split was resolved by merging them in the rewrite (atomiks, discussion #553).

**Implication for documentation.** "When to use / when not to use" (DoD §4, §5) and the Phase C cluster notes argue from semantics and quote these answers verbatim with citations — they are documentation-grade prose that already exists.

## 6. Forms philosophy

### B-P31. Extend native constraint validation; participate via hidden inputs

**Statement.** Form components extend the native constraint validation API rather than replacing it, and they join real `<form>` submission through hidden inputs whose placement affects native validation bubbles.

- [E] "Base UI form control components extend the native constraint validation API"; native attributes supported: `required`, `minLength`/`maxLength`, `pattern`, `step`; "Base UI form components use a hidden input to participate in native form submission and validation. To anchor the hidden input… ensure the component has been given a `name`, and wrap controls in a relatively positioned container" (`docs/src/app/(docs)/react/handbook/forms/page.mdx`).
- [E] Native alignment increased over time: Checkbox/Switch stopped submitting `"off"` when unchecked unless `uncheckedValue` is set (#3406, rc.0); Slider focuses its native `input type="range"` — thumb styling moved to `:has(:focus-visible)` (#2578); a "form won't submit" support case resolved to `noValidate` plus the default `step=1` `stepMismatch` (#3552).

**Implication for documentation.** DoD §13 documents hidden-input mechanics explicitly (name, positioning wrapper, `uncheckedValue`, bubble anchoring) — support issues prove they surprise users.

### B-P32. Validation: native first, then `validate`; `onSubmit` default; errors self-clear

**Statement.** The `validate` function runs after native validation passes; the default mode is `onSubmit` (with revalidation on change afterwards); server errors merge in via the `errors` prop; and errors clear automatically when a field's value changes.

- [E] `validate` is sync or async, runs "after native validations have passed", returns a message (or array) when invalid and `null` when valid; modes: "`onSubmit` (default)… `onBlur`… `onChange`", plus `validationDebounceTime`; server-side errors passed to `errors` "will be cleared from the field state" once the field's value changes; `useActionState` wiring shown for React Server Functions (forms page).
- [E] The `onSubmit` default was a deliberate beta.5 flip from `onBlur` (#3013); `Form.onClearErrors` was removed because clearing became automatic (#3136); `Field.Error`'s `forceShow` was consolidated into `match` (#1919).

**Implication for documentation.** Enumerate failure states per form component, one story per state (DoD §14); `validationMode` is a flagship per-prop guidance entry (DoD §12).

### B-P33. Field is the labeling backbone, and the DOM shape follows label validity

**Statement.** Labeling strategy is per-control-type doctrine — `Field.Label` (or enclosing controls in it) for input-like controls, component-specific Labels for trigger-based controls, `aria-label` when nothing is visible, `Fieldset.Legend` + `Field.Item` for groups — and the components' DOM shapes exist to keep labels valid HTML.

- [E] The forms handbook prescribes the full strategy table, including implicit labeling by enclosure, `<Select.Label>`/`<Combobox.Label>` for trigger-based controls, per-thumb `aria-label` on multi-thumb sliders, `<Field.Item>` around each checkbox/radio option, and "If no visible label is rendered, provide `aria-label` on the actual form control" (forms page).
- [E] The DOM shape is labeling-driven: a `<label>` can't validly wrap both a button and the hidden input — hence span roots (#3205), the `:hover`-on-label behavior change users reported (#3263, where the enclosing-label pattern from the docs keeps `:hover` working), and the accessible-name failure fixed by `aria-labelledby` (#4122 → #4142).

**Implication for documentation.** Every form-control page names its correct labeling strategy (DoD §9, §15) and explains *why the DOM looks like this* where the span-root change altered CSS/labeling behavior.

### B-P34. Third-party form libraries are first-class

**Statement.** React Hook Form and TanStack Form have documented, field-level mappings onto Field parts; ref forwarding is the stated prerequisite for focus-on-error; Base UI's own `<Form>` steps aside when a form library owns state.

- [E] The forms handbook maps RHF `<Controller>` onto `Field.Root`/`Field.Control` (`onChange`→`onValueChange`, `isTouched`→`touched`, `isDirty`→`dirty`), warns "you must ensure that any wrapping components forward the `ref`" for RHF's focus-on-invalid, and states "The Base UI `<Form>` component is not needed when using TanStack Form" (forms page; forms handbook added in #2989, commit 422a4deb8).
- [E] An RHF guide was among the oldest docs requests (#21, 2024, mj12albert); custom controls integrate via `Field.Control render={<textarea/>}` plus the documented state attributes (`data-dirty`/`data-touched`/`data-filled`/`data-focused`) — the asker explicitly requested a guide (#1996).

**Implication for documentation.** DoD §13 includes an RHF example for every form control; a "custom Field.Control" recipe belongs on Field's page (maintainer-confirmed gap, #1996).

## 7. SSR / hydration stance

### B-P35. No consolidated SSR doc exists — the stance must be assembled, honestly

**Statement.** Base UI treats SSR correctness as internal table stakes (pre-hydration scripts, `useId`, hydration-safe defaults) rather than a consumer-facing topic; there is no SSR page, and per-component claims must trace to release notes.

- [G] No dedicated SSR/hydration page exists in overview, handbook, or utils (handbook-extracts.md checked all three).
- [E] Assembled evidence: inline `<script>` tags exist for "pre-hydration behavior" and are opt-in (csp-provider page); `nativeButton` exists because element identity must be knowable "at render time and before hydration" (use-render page); "Add `suppressHydrationWarning` to hidden inputs" and "Skip client-only prehydration scripts" (v1.4.0 notes); "Fix autofocus in SSR environments" (v1.2.0); "Fix ARIA attributes during SSR" (v1.3.0); Select's `placeholder` became required partly to prevent a hydration flash (beta.0 notes); fallback ids use React `useId` (#2664, #3373); the `NoSsr` helper was deleted the day before rc.0 rather than stabilized (#3398, commit 620ab1403); internally `useIsoLayoutEffect` is mandatory (`AGENTS.md`).
- [I] Inference: consumers rarely need SSR-specific code, but CSP and SSR interact (nonces for injected tags), and the fix history names which components had SSR edges.

**Implication for documentation.** Keep DoD §25 optional and evidence-limited; state this assembled stance once at principles level; per-component SSR notes require a release-note citation — never speculation.

### B-P36. React-only, widely compatible, shadow-DOM-safe

**Statement.** React 17–19 are supported (19 removes `forwardRef` needs); Next.js/RSC issues get fixed fast; Preact bugs get fixed without first-class support; non-React ports are community territory; and shadow-DOM/multi-realm correctness is an enforced internal rule.

- [E] React 17+ (About page); React 19 ref-in-props vs 17/18 `forwardRef` (use-render page); fixes for React ≤18 `props.ref` access (#3257), Next.js 16 crash (#3231), missing `use client` directives (#3408); Preact double-render closed as external, fixed in Preact 10.29.0 (#4127); framework requests all uncommitted (Solid #2200, Svelte #3450, Angular #3938, Vue #3503, React Native #2612, Preact #1995); unofficial SolidJS/Vue ports listed on the Community page.
- [E] Shadow-DOM-safe DOM utilities (`contains`, `getTarget`, `activeElement`, `ownerDocument`/`ownerWindow`) were adopted library-wide and written into AGENTS.md in the same commit (#4412, commit d1eb968ed); follow-ups fixed synthetic event targets (#4516) and virtual-arrow document handling (#4662).

**Implication for documentation.** An environment-support note lives at principles level (DoD §1 carries the React range); per-component pages mention frameworks or shadow DOM only with a cited issue (DoD §28).

## 8. Versioning & stability semantics

### B-P37. Three package names — all still in the wild

**Statement.** The package was renamed twice: `@base_ui/react` (alpha.0, Apr 15 2024) → `@base-ui-components/react` (Nov 20 2024, pre-public-alpha) → `@base-ui/react` (v1.0.0, Dec 11 2025); code and tutorials exist under all three names.

- [E] The chain and dates: `[core] Rename package to @base_ui/react` (#287); commit 92326aa1a (#842, 2024-11-20); the org rename was v1.0.0's *only* breaking change — "The package name has changed from `@base-ui-components/react` to `@base-ui/react`" (#3462, commit 9aedea051; v1.0.0 release notes / `CHANGELOG.md`); `@base-ui/utils` was extracted earlier (#2167, commit cbfd8811b) and versions independently (0.3.0, #5018).
- [E] The naming confusion was itself a support theme during the transition (#719, #1176).

**Implication for documentation.** State the current name and warn that `@base-ui-components/*` (or `@base_ui/*`) code found online is pre-1.0 (DoD §1, §28); Phase D usage mining must query all three specifiers.

### B-P38. Breaking changes were front-loaded; post-1.0 is strict monthly minors

**Statement.** The beta phase deliberately concentrated the churn (beta.5 alone carried ~20 breaking entries); v1.0.0 changed nothing but the package name, shipped exactly on its milestone date, and post-1.0 breaking changes touch only preview-tier components.

- [E] colmtuite framed the beta phase as "more about stability, refining APIs, and consolidating APIs library-wide to minimise the risk of future breaking changes" (#2485); beta.5 (Nov 17 2025) was the single biggest breaking release — detached triggers, `disable*` renames, native-element defaults (history.md).
- [E] v1.0.0 merged 2025-12-11 (PR #3500), exactly on the milestone due date; rc.1/rc.2 "contain the same code as v1.0.0"; minors landed monthly — Jan 15 through Jun 18 2026 (v1.1.0–v1.6.0: #3729, #4057, #4300, #4562, #4850, #5064); release notes rigorously label "**Breaking change:**" per component (release pages; handbook-extracts.md).
- [E] Post-1.0 additions arrive as non-breaking minors (handles, Drawer #3680/#4293, OTP Field #4365, temporal Calendar #1973) (issues-prs.md).

**Implication for documentation.** Decision logs (DoD §18) can date any API by release; status lines say "since v1.x" (DoD §20); pre-1.0 samples found in the wild need a compatibility caveat.

### B-P39. Maturity signals: Preview suffix, [New] tag, canaries

**Statement.** Pre-stable components ship as `Preview`-suffixed namespace exports with a `[Preview]` docs tag; "unmarking preview" is itself logged as a breaking change; `[New]` tags mark recent stabilizations; canaries publish per commit and per PR.

- [E] Drawer shipped as `DrawerPreview` in v1.2.0 (#3680, commit 5bbe076fd) and was unmarked in v1.3.0 — "`Drawer` is now stable and should be imported as `{ Drawer }`" (#4293, commit bb8140e1c); OTP Field shipped as `OTPFieldPreview` in v1.4.0 (#4365) and was unmarked in v1.6.0 (#5029); both unmarkings are flagged "Breaking change" in release notes.
- [E] `[New]`/`[Preview]` tags live in the docs page indexes (`CONTRIBUTING.md`); "A canary release is published for every master commit and pull request… Canary releases may contain breaking changes" via pkg.pr.new (releases index page; policy set in #351/#1865).

**Implication for documentation.** Every page carries a one-line status — stable / Preview + since-version — and Preview pages state that minors may break them (DoD §20).

### B-P40. `unstable-` is a subpath convention the docs never explain; naming elsewhere is systematic

**Statement.** Experimental exports use `unstable-` *subpaths* (never `unstable_` prop prefixes) — a convention visible only in git history, not documentation; everywhere else naming is predictable: `on<StateName>Change`, false-by-default booleans, `disable*` for on-by-default behavior, one `multiple` prop.

- [E] `grep unstable_ packages/react/src` is empty; the subpath mechanism dates to #870; two ever existed — `unstable-no-ssr` (deleted before rc.0, #3398) and `unstable-use-media-query` (still exported in `packages/react/package.json` at v1.6.0, never promoted) (history.md). Divergence note: handbook-extracts.md records that **no meta-doc states this convention** — the docs are silent; only history reveals it.
- [E] Convention sweeps: booleans default false unless the inverted name is worse (#930); one `multiple` prop across multi-active components (#1075; accordion's default flipped false in #3141); on-by-default booleans spell the off-switch — `loop`→`loopFocus` (#3186), `trackAnchor`→`disableAnchorTracking` (#3188), `dismissible`→`disablePointerDismissal` (#3190), `hoverable`→`disableHoverablePopup` (#3178, all beta.5). [G] The common generic `value` type remains unresolved (#1076).

**Implication for documentation.** Define `unstable-` in the glossary/principles layer since the docs don't (DoD §20); prop guidance can teach the convention itself ("`disable*` means it's on by default") (DoD §12).

## 9. Common misuse patterns observed

Each theme: what users do → the maintainer-consistent correction → citations → what documentation must therefore do. These feed Do/Don't (DoD §16) and pitfalls/FAQ content directly.

**B-M1 — Stacking, portals, and z-index (the #1 support magnet).** Users fight the `isolation: isolate` setup, put `z-index` on Popup instead of Positioner, and find third-party overlays above/below Base UI layers. Corrections: don't set z-index at all; if unavoidable it goes on Positioner (#2450); keep external overlay libraries *outside* the isolate root, where any z-index wins (#2938, #1935); portal into third-party containers via `container` (#2854, #3725); custom `container` only on the root portal (#1930); `container` null/undefined semantics matter (#2780). LukasTy proposed an interop/stacking FAQ — "This is a second or third issue related to the same root cause" (#3725); atomiks sold the isolate-root philosophy in #2293.
→ **Docs:** one canonical stacking-model page linked from every overlay component (DoD §5, §7, site-level); the setup step must be explained, not just prescribed.

**B-M2 — Exit animations silently fail.** Causes users hit: unmount-on-close without ending styles; conditional rendering of inner parts breaking unmount detection (#2186); the one-frame `data-starting-style` misread (#4915); Tailwind v4's `[hidden]!important` defeating Motion (#1608); non-popup components lacking the machinery (#1494); a real race, since fixed (#3099 → #2985/#3101); Preact quirks (#4127).
→ **Docs:** required animation section per popup with a lifecycle diagram and a JS-library recipe (DoD §11); Tabs/Collapsible get their own animation notes.

**B-M3 — Invisible DOM machinery breaks user CSS and integrations.** Focus-guard `<span>`s break `:nth-child` striping and Tailwind `space-x-*` (#3693 — the guards are required a11y so touch screen-reader users can escape); an internal backdrop ate `:hover`/`onClick` on triggers and user backdrops (#2940, #1965 — later given a cutout, which also enabled trigger hover styles while open); `data-base-ui-inert` marks DOM outside popups and tripped ProseMirror/tiptap mutation observers (#3950, marking moved to top-level nodes in #3955, which also preserves `aria-live` regions).
→ **Docs:** a "what Base UI adds to your DOM" disclosure per component so users can debug what they can't see (DoD §3, §19); warn editor/mutation-observer integrators (DoD §28).

**B-M4 — The escape-hatch layer is powerful but nearly invisible.** Maintainers resolve a dozen recurring threads with the same tools users never found on their own: `eventDetails.reason` + `cancel()` (keep a tooltip open after click, #1311; ignore a Firefox extension popup's spurious resize-close, #3546), `preventBaseUIHandler()` (#1746, #2152), `actionsRef.unmount()` (#2186), and "use `onOpenChange`, not trigger `onClick`" (#1965).
→ **Docs:** a dedicated "controlling and canceling behavior" page plus per-component reason-string tables (DoD §7, §12); each escape-hatch example cites the support case it resolves.

**B-M5 — Composition-model friction.** `render={Component}` crashes when hooks are inside — only `render={<Component/>}` / `render={(props) => …}` are valid (#4039); ex-`@mui/base` users ask for hooks and are told to compose instead (#1814); the top-reaction open ask is for context hooks, answered "use render-prop `state` or controlled mode" (#4329); combobox generics can't cross React context — a typed-wrapper pattern is the documented answer (#3951); custom `Field.Control` integration is undocumented folklore (#1996).
→ **Docs:** the "rules of render" callout (DoD §16), a TypeScript-patterns section (B-P19), and a custom-control recipe under Field (DoD §12, §13).

**B-M6 — Third-party interop is the norm, not the edge case.** Radix/vaul overlays set `pointer-events: none` on `<body>`, freezing Base UI popups inside them — fix via `Portal container` into the overlay content (#2854, #3725); toast libraries render under Base UI backdrops — move the toaster outside the isolate root (#2938, #1935); ProseMirror/tiptap resync on inert marking (#3950); Firefox extension popups fire resize events that close Select — `eventDetails.cancel()` or `alignItemWithTrigger={false}` (#3546); bundler/monorepo import crashes are environment, not library (#3194); shadcn-style forms + NumberField need `noValidate`/`step`/`format` awareness (#3552).
→ **Docs:** the maintainer-endorsed interop FAQ (#3725) covering named ecosystems; per-component "works inside X" notes only where a cited issue exists (DoD §28).

**B-M7 — "Which component do I use?" has no home.** Tooltip vs Popover on touch (#3530); ToggleGroup vs RadioGroup semantics (#3525); missing ButtonGroup → Toolbar/`role="group"` recipes (#4008); Select-vs-Combobox boundary questions (#2734); the historical Popper/Popover merge (discussion #553).
→ **Docs:** mandatory "when to use / when not to use + alternatives" sections (DoD §4, §5) and shared cluster notes, quoting the maintainer taxonomy answers (B-P30).

**B-M8 — Mobile Safari / touch caveats are real, maintainer-acknowledged, and undocumented.** iOS scroll-locking is a minefield only truly fixed by iOS 26.4; a user noted "it isn't documented that this is broken on iOS" and atomiks agreed "we may need to document it" (#1893); tooltips never open on touch by design (#3530); iOS 26+ Safari requires `position: absolute` backdrops plus `body { position: relative }` in global styles (quick-start page).
→ **Docs:** a mobile-caveats note on modal/overlay pages, and the backdrop environment rule wherever backdrops are documented (DoD §7, §19).

## Cross-cutting summary for Phase C writers

- Five ideas a brief can assume as library-wide background (link here; don't re-explain per component): parts + render prop (B-P8–B-P10), data-attribute/CSS-variable styling (B-P13–B-P14, B-P20), eventDetails (B-P16), Portal grammar + stacking (B-P18, B-M1), the a11y contract split (B-P27).
- Recurring evidence genres worth mining per component: beta.5 renames (B-P40), reason-string vocabularies (B-P16), hidden-DOM disclosures (B-M3), maintainer taxonomy prose (B-P30), release-note SSR/a11y fixes (B-P35, B-P28).
- Honesty conventions carry over: [G] marks stay visible; preview-tier components state their instability (B-P39); anything inferred from API shape rather than a maintainer statement is [I].
