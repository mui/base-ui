# Base UI glossary

Base UI's own vocabulary, grounded in its docs, source conventions, and issue record. Definitions give the *Base UI sense* of each term (not the generic web sense). Citations: repo-relative docs paths or `#NNNN` (resolves at https://github.com/mui/base-ui). Companion to [principles.md](./principles.md); evidence detail lives in [`_mining/`](./_mining/). Storybook docs must use these terms exactly — consistent vocabulary is itself an anti-hallucination measure (#2262, #4042).

## Anatomy & parts

- **part** — One named subcomponent of a multi-part component (`Menu.Trigger`, `Switch.Thumb`); each part renders one DOM node and accepts `className`/`style`/`render`. Docs formally distinguish single-part from multi-part components. (`docs/src/app/(docs)/react/handbook/styling/page.mdx`; `CONTRIBUTING.md`)
- **root** — The stateful coordinating part (`Dialog.Root`, `Field.Root`): owns controlled/uncontrolled state (`open`/`onOpenChange`, `value`/`onValueChange`), `actionsRef`, and the private context descendant parts read. The state boundary of the component. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`)
- **trigger** — The interactive part that opens or controls a popup; "most triggers render a `<button>` by default." Since beta.5, hover config (`openOnHover`, `delay`, `closeDelay`) lives on the trigger, popups may have several triggers, and triggers can be detached (see *handle*). Beyond styling, Trigger/Close parts exist chiefly to carry ARIA wiring (`aria-haspopup`/`aria-expanded`/`aria-controls`). (`docs/src/app/(docs)/react/handbook/composition/page.mdx`; #3170, #2336, #2069)
- **popup** — The floating element itself (`Popover.Popup`): target of the animation attributes and CSS variables; unmounted from the DOM when closed by default. (`docs/src/app/(docs)/react/handbook/animation/page.mdx`)
- **positioner** — The part that computes and applies a popup's position relative to its anchor; owns positioning props (`sideOffset`, `alignItemWithTrigger`) and state (`side`, `align`, `anchorHidden`). If you must set `z-index`, it goes here — never on Popup. (`docs/src/app/(docs)/react/handbook/typescript/page.mdx`; #1713, #2450)
- **portal** — The part that renders the popup subtree elsewhere in the DOM. Mandatory for every popup component — omitting it throws (#1222). Home of `keepMounted`. Its `container` prop: `null` = wait for the element; `undefined` = use the default and don't re-check; nested portals auto-append inside their parent, so set `container` only on the root portal. (#2780, #1930)
- **backdrop** — The overlay layer behind modal popups; a styleable part. An *internal* backdrop also exists in modal mode (it once swallowed hover/click on triggers, later given a cutout). On iOS 26+ Safari, backdrops need `position: absolute` plus `body { position: relative }`. (#2940, #1965; `docs/src/app/(docs)/react/overview/quick-start/page.mdx`)
- **arrow** — Optional pointer part of an anchored popup (`Popover.Arrow`), rendered inside the popup and positioned against the anchor. (`docs/src/app/(docs)/react/components/popover/page.mdx`)
- **anchor** — The element a popup is positioned in relation to (usually the trigger); surfaces as the `--anchor-width` variable and `anchorHidden` positioner state; tracking is configurable via `disableAnchorTracking` (formerly `trackAnchor`). (`docs/src/app/(docs)/react/handbook/styling/page.mdx`; #3188)
- **viewport** — Two senses: `Dialog.Viewport`/`AlertDialog.Viewport` is the outer scroll/positioning container for scrollable dialogs; `ScrollArea.Viewport` is the scroll container that injects the scrollbar-hiding style tag. (`docs/src/app/(docs)/react/components/dialog/page.mdx`; `docs/src/app/(docs)/react/utils/csp-provider/page.mdx`)
- **thumb** — The draggable part of a Slider (`Slider.Thumb`). Note: Base UI does *not* call this a "handle" — that word is reserved for detached-trigger connectors. (#981; `docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-5/page.mdx`)
- **hero demo** — The canonical first demo on each component docs page; new demos are expected to follow its styles (CSS Modules + Tailwind twins). (`AGENTS.md`)

## Composition & rendering

- **render prop** — Base UI's composition primitive, replacing Radix's `asChild` (rejected in #3983): element form `render={<a href/>}` (props merged automatically) or function form `render={(props, state) => …}` (you own the spreading). "Primarily designed for composing event handlers and behavioral props." The function is *not* a component — no hooks inside (#4039). (`docs/src/app/(docs)/react/handbook/composition/page.mdx`; `docs/src/app/(docs)/react/utils/use-render/page.mdx`)
- **useRender** — Public hook for building your own components that offer a `render` prop — the blessed alternative to a Radix-style `<Slot/>` (#1315 → #1418). Pairs with `useRender.ComponentProps` (public props) and `useRender.ElementProps` (private element props). (`docs/src/app/(docs)/react/utils/use-render/page.mdx`)
- **mergeProps** — Utility merging prop objects: rightmost value wins; `className` strings concatenate; `style` objects merge; `ref` is not merged; event handlers all run, rightmost first. Up to 5 args; `mergePropsN` beyond. (`docs/src/app/(docs)/react/utils/merge-props/page.mdx`)
- **preventBaseUIHandler()** — Method Base UI adds to React synthetic events; calling it stops Base UI's internal handler without touching `preventDefault`/`stopPropagation`. Escape hatch only; no effect where native events are used. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`)
- **nativeButton** — Boolean prop declaring whether `render` produced a native `<button>`, so button-only defaults (like `type="button"`) and keyboard handling apply correctly — needed because the element can't be known before hydration. (#1909; `docs/src/app/(docs)/react/utils/use-render/page.mdx`)
- **state (component state)** — The internal per-part state object passed to `className`/`style`/`render` functions and typed as `Part.State` (e.g. `{ open, side, align, anchorHidden }`). The name is always `state` — `OwnerState` was retired (#864). (`docs/src/app/(docs)/react/handbook/typescript/page.mdx`)
- **handle** — Object created with `X.createHandle()` connecting *detached triggers* to a root rendered elsewhere; carries a typed payload and imperative `open`/`openWithPayload`/`close` methods. (`docs/src/app/(docs)/react/components/menu/page.mdx`; #2974)
- **payload** — Per-trigger data delivered through a handle to a shared popup; passed as a `payload` prop on each trigger, read via a function child on Root; typed with `createHandle<T>()`. (`docs/src/app/(docs)/react/components/menu/page.mdx`)
- **detached trigger** — A trigger living outside its Root's subtree (or one of several triggers for one popup), linked via a handle; introduced in beta.5. (`docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-5/page.mdx`; #2336, #3170)

## State & events

- **controlled / uncontrolled** — "Components are uncontrolled by default"; controlled = external state via `value`/`open` plus its change handler, with `defaultX` for initial uncontrolled state. Always a triplet: `x` / `onXChange` / `defaultX`. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`; #600)
- **eventDetails** — Second argument to every change handler: `{ reason, event, cancel(), allowPropagation(), isCanceled, isPropagationAllowed }`. Introduced library-wide in #2382. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`)
- **reason** — String on `eventDetails` naming why a change occurred (`trigger-press`, `trigger-hover`, `trigger-focus`, `escape-key`, `none`, …); typed as `ChangeEventReason`; narrows the `event` type. (#1782, #2382; `docs/src/app/(docs)/react/handbook/typescript/page.mdx`)
- **cancel()** — `eventDetails` method that stops the component from changing its internal state — a veto that keeps the component uncontrolled instead of forcing controlled mode. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`; #1311)
- **allowPropagation()** — `eventDetails` method opting out of the default where Esc keydown propagation is stopped so parent popups don't close simultaneously. (`docs/src/app/(docs)/react/handbook/customization/page.mdx`)
- **actionsRef** — Ref to a root's imperative actions object (notably `unmount()`), typed `X.Root.Actions`; used to unmount manually after JS animations. (`docs/src/app/(docs)/react/handbook/animation/page.mdx`; #2186)

## Styling & animation

- **data-attribute state** — Boolean per-state attributes (`data-open`, `data-closed`, `data-checked`, `data-highlighted`, …) — there is no `data-state="…"` (#717) — duplicated on **every part** so styles never rely on DOM structure (#625). Enumerated per part in each API reference.
- **data-popup-open vs data-pressed** — Deliberately separate trigger attributes: the trigger's popup is open vs a toggle is pressed — so a Tooltip and a Menu on one button style independently. (#3036)
- **CSS variable contract** — Per-part custom properties carrying dynamic measurements: `--available-height`, `--anchor-width`, `--transform-origin`, positioner/panel sizes. (`docs/src/app/(docs)/react/handbook/styling/page.mdx`; #2774)
- **starting style / ending style** — `[data-starting-style]` = "the initial style to transition from"; `[data-ending-style]` = "the final style to transition to". Each is present for essentially **one frame** — the transition source/target, not a phase that persists (#4915). (`docs/src/app/(docs)/react/handbook/animation/page.mdx`)
- **data-open / data-closed (animation sense)** — The CSS-keyframe hooks: style when the component becomes visible / before it becomes hidden. (`docs/src/app/(docs)/react/handbook/animation/page.mdx`)
- **transition status** — The internal mount/open lifecycle from which the animation attributes are mapped (release notes speak of "transition status mapping"). (`docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-1/page.mdx`)
- **keepMounted** — Portal-level prop keeping a closed popup in the DOM ("Components that specify `keepMounted` remain rendered in the DOM when they are closed"); prerequisite for JS-library exit animations. (`docs/src/app/(docs)/react/handbook/animation/page.mdx`; #1222)
- **onOpenChangeComplete** — Callback firing after the open/close transition finishes — the hook for "style during/after animation" needs that `data-starting-style` cannot serve. (#4915)
- **alignItemWithTrigger** — Select `Positioner` prop aligning the selected item over the trigger (macOS-select style); implies the popup position depends on list content and is the switch users flip (`false`) when that positioning misbehaves; formerly `Root.alignItemToTrigger`. (#1713, #1922, #3546; `docs/src/app/(docs)/react/utils/csp-provider/page.mdx`)

## Focus & interaction machinery

- **composite / roving focus / single tab stop** — List-like widgets (menus, radio groups, tabs, toolbars) occupy one Tab stop; arrow keys move a roving focus/highlight inside. Disabled items stay focusable within composites (discoverability) but not as standalone controls. (#656, #3630, #4008)
- **data-highlighted** — The attribute marking the active item in list-driven popups; deliberately unified across pointer hover and keyboard movement (no separate hover/focus states), mirroring Select and Google-Search behavior. (#2731)
- **focusableWhenDisabled** — Prop/behavior keeping disabled controls focusable so assistive technology can discover them; default follows the composite-vs-standalone rule, surfaced as a prop on Button/Toolbar parts. (#656; #2363)
- **list navigation** — The composite keyboard model: arrow keys, Home/End, and alphanumeric keys move through items. (`docs/src/app/(docs)/react/overview/accessibility/page.mdx`)
- **typeahead** — Jumping to list items by typing characters (Select, Menu); refined over releases (skips disabled items, resets on external blur). (`docs/src/app/(docs)/react/overview/accessibility/page.mdx`; `docs/src/app/(docs)/react/overview/releases/v1-6-0/page.mdx`)
- **virtual focus** — In input-driven popups (Combobox/Autocomplete), DOM focus stays on the input; the "focused" item is only marked via `data-highlighted`/ARIA — items are never DOM-focused. (#2731)
- **focus guard** — Invisible `<span>` elements rendered adjacent to triggers/popups so screen-reader users on touch devices can escape a popup. They are required a11y machinery — and they break DOM-position-dependent CSS like `:nth-child` striping. (#3693)
- **inert (`data-base-ui-inert`)** — Attribute Base UI applies to DOM *outside* an open modal popup so later-injected third-party content (extensions) stays usable and doesn't count as an outside click; marking is applied at top-level nodes only. Explains "why did Base UI touch my DOM". (#3950, #3955)
- **modal / modality** — The popup behavior tier controlling focus trapping and outside-interaction blocking; the `modal` prop also accepts `'trap-focus'` (focus trapped, page interaction allowed). Modal mode mounts the internal backdrop. (`docs/src/app/(docs)/react/overview/releases/v1-0-0-alpha-8/page.mdx`; #1965)
- **dismissal (outside press / escape)** — Closing a popup by clicking/pressing outside it or pressing Esc; each produces a distinct `reason`; pointer dismissal is disabled via `disablePointerDismissal` (formerly `dismissible`). (#3190; `docs/src/app/(docs)/react/handbook/customization/page.mdx`)
- **nested popups** — Popups inside popups: nested portals auto-append into their parent (#1930); nested menus require `Menu.SubmenuRoot` (#2042); dialogs expose `data-nested-dialog-open` (#1686); Esc closes only the innermost popup by default (see *allowPropagation*).
- **scroll lock** — Preventing body scroll while a modal popup is open; implemented partly via injected styles; iOS Safari is the historically hard case (only truly fixed by iOS 26.4). (#1893; `docs/src/app/(docs)/react/utils/csp-provider/page.mdx`)
- **collision avoidance / flipping** — Positioner behavior when the popup would overflow the viewport — flipping to the other side or shifting; configured via the `collisionAvoidance` prop (e.g. `side: 'flip'`). (`docs/src/app/(docs)/react/overview/releases/v1-0-0-beta-0/page.mdx`, `…/v1-2-0/page.mdx`)
- **initialFocus / finalFocus** — Props configuring where focus moves when a popup opens and returns when it closes (function values return the element directly since beta.3). (`docs/src/app/(docs)/react/overview/accessibility/page.mdx`; `…/releases/v1-0-0-beta-3/page.mdx`)

## Forms vocabulary

- **hidden input** — The `<input>` form components render to participate in native form submission and constraint validation; give the component a `name` and a relatively positioned wrapper so the native validation bubble anchors correctly. (`docs/src/app/(docs)/react/handbook/forms/page.mdx`)
- **constraint validation** — The native HTML validity API Base UI extends: `required`, `minLength`/`maxLength`, `pattern`, `step`; validity states like `valueMissing` drive `Field.Error match`. (`docs/src/app/(docs)/react/handbook/forms/page.mdx`)
- **validation mode** — When a field validates: `onSubmit` (default; then revalidate on change), `onBlur`, or `onChange`, with `validationDebounceTime` for async/typing cases. (`docs/src/app/(docs)/react/handbook/forms/page.mdx`; #3013)
- **touched / dirty / filled / focused** — Field state flags exposed as data attributes (`data-touched`, `data-dirty`, `data-filled`, `data-focused`) for styling and for mapping form-library state (RHF `isTouched`→`touched`, `isDirty`→`dirty`). (#1996; `docs/src/app/(docs)/react/handbook/forms/page.mdx`)
- **Field / Fieldset / Field.Item** — The labeling-and-validation backbone: `Field.Root` carries `name`/validation/state; `Field.Label`/`Field.Description`/`Field.Error` wire accessible names, descriptions, and messages; `Fieldset.Legend` labels control groups; `Field.Item` wraps each option in checkbox/radio groups. (`docs/src/app/(docs)/react/handbook/forms/page.mdx`)

## Lifecycle & stability

- **Preview (suffix)** — Pre-stable maturity tier: exported as a `Preview`-suffixed namespace (`DrawerPreview`, `OTPFieldPreview`) and tagged `[Preview]` in docs; unmarking renames the export and is logged as a breaking change. (#4293, #5029; `CONTRIBUTING.md`)
- **[New] tag** — Docs-index tag marking recently added/stabilized components. (`CONTRIBUTING.md`)
- **unstable- (subpath)** — Experimental *subpath exports* (`@base-ui/react/unstable-use-media-query`), not prop prefixes — no `unstable_` props exist. Only history documents the convention; the docs never explain it. (#870, #3398; history.md)
- **canary release** — Build published for every master commit and PR via pkg.pr.new; "may contain breaking changes." (`docs/src/app/(docs)/react/overview/releases/page.mdx`)

- **multiple** — The single converged prop name for multi-active behavior (Accordion, Select, ToggleGroup — replacing `openMultiple`/`toggleMultiple`); defaults to `false` per the booleans-default-false convention. (#1075, #2764, #3141)
- **subpath import** — The canonical import form, one subpath per component: `import { Menu } from '@base-ui/react/menu'` — the monopackage's tree-shaking contract. (#870, #1700; `docs/src/app/(docs)/react/overview/quick-start/page.mdx`)

## Environment providers

- **CSPProvider / nonce** — Provider applying a per-request nonce to Base UI's injected inline `<style>`/`<script>` tags under strict Content Security Policy; `disableStyleElements` removes the style tags entirely. (`docs/src/app/(docs)/react/utils/csp-provider/page.mdx`)
- **DirectionProvider / useDirection** — Enables RTL *behavior* only (arrow-key direction etc.); setting `dir="rtl"`/CSS `direction` remains the app's job; `useDirection` reads the direction, notably for portaled subtrees. (`docs/src/app/(docs)/react/utils/direction-provider/page.mdx`)

## Terms that do NOT exist in Base UI (disambiguation for writers and LLMs)

- **`asChild`** — Radix's composition prop; formally rejected. Use the `render` prop. (#3983, #4042)
- **`data-state="…"`** — Radix's stringly state attribute; Base UI uses boolean attributes (`data-open`, `data-checked`, …). (#717)
- **`slots` / `slotProps`** — The legacy `@mui/base` customization API; replaced wholesale by component-per-node + `render`. (discussion #157)
- **`ownerState`** — Material-UI-era name for the state object; renamed to `state`/`State`. (#864)
- **`useXxx` component hooks** — `@mui/base`-style hooks (e.g. `useNumberInput`) are gone by design; compose parts instead. Public contexts are likewise not exported. (#1814, #4329)
- **`unstable_` prop prefixes** — Never used in this library; instability is expressed via `unstable-` subpaths and `Preview` export suffixes. (history.md; #870)
- **"handle" as a slider part** — Sliders have *thumbs*; "handle" always means the detached-trigger connector object. (#981; `docs/src/app/(docs)/react/components/menu/page.mdx`)
