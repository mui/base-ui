# Microsoft Fluent 2 + Fluent UI React v9 — documentation anatomy

Research method note (honesty log): `fluent2.microsoft.design` usage pages fetched fine as HTML (server-rendered enough for heading extraction). The Storybook at `storybooks.fluentui.dev/react/` is a client-side SPA — fetching `iframe.html?viewMode=docs&id=...` returns only Storybook's no-JS skeleton ("No Preview" + placeholder props table), so rendered docs pages could NOT be scraped directly. What worked instead, and is arguably better evidence: (1) `/react/index.json` — the full story index (titles, ids, names, tags, importPaths); (2) `/react/llms.txt` and `/react/llms/<docs-id>.txt` — Fluent publishes every docs page as plain markdown (llmstxt.org format), which gives the exact rendered docs-page structure as text; (3) reading the source of truth in `github.com/microsoft/fluentui` (master): per-component `stories/` folders, the custom `react-storybook-addon` (including `FluentDocsPage.tsx`, the custom docs template), and the root/docsite `.storybook` configs. Structure below is machine-verified from those artifacts, not screenshots.

## The design-site / Storybook split  (which concerns live where, how they link)

Two properties, one hard rule: **design opinion lives on the design site; everything code lives in Storybook.** There is no "Code" tab on the design site at all (`/components/web/react/core/button/code` → 404).

- **fluent2.microsoft.design** (design site): per-component *usage* pages at `/components/web/react/core/<component>/usage`. Owns: when-to-use, variant taxonomy ("Types"), behavior rules, layout rules, design-level accessibility guidance, and microcopy/writing guidance ("Content"). Component catalog is a card grid; a platform toggle switches React ↔ Web Components; the same component exists per-platform (Web/iOS/Android/Windows in the site nav).
- **Storybook** (`react.fluentui.dev`, deployed at `storybooks.fluentui.dev/react/`): owns props/slots API, one example story per feature, code-level Do/Don't best practices, screen-reader edge cases, SSR notes, per-component migration guides (v8→v9, v0→v9), per-component accessibility *specs*, theming, and utilities. Storybook is not a demo dump — it is the entire developer documentation site.
- **How they link, design → code**: every usage page opens with a live embedded example plus an "Open in CodeSandbox" link, and a **Resources** section whose links are deep links into Storybook Docs pages plus the relevant W3C pattern. For Dialog: React Storybook (`react.fluentui.dev/?path=/docs/components-dialog--docs`), Web Components Storybook, and the WAI-ARIA APG dialog pattern. So the design site treats a Storybook `?path=/docs/...` URL as the canonical code documentation URL.
- **How they link, code → design**: weakly. The Storybook `llms.txt` intro links back to fluent2.microsoft.design as "the design system", but component docs pages don't systematically link their design-site twin. The split is asymmetric: design → Storybook is a first-class affordance; the reverse is not.
- Both sides duplicate a *thin* slice of accessibility guidance (the design site's a11y section repeats a couple of prop-level notes like `inlinePopup`), but Do/Don't content is essentially disjoint: the design site's Do/Don'ts are visual/UX (image pairs), the Storybook Do/Don'ts are code-level (slots, aria attributes).

## Fluent 2 usage-page skeleton  (ordered section list with purposes)

Observed across button, checkbox, dialog, combobox, tooltip. Sections are H2s; topics inside them are H3s (occasionally H4). An "On this page" ToC lists the H2s. No tabs, no version badges; platform availability shown as small React/Web-Components icons.

1. **H1: component name + live Preview** — embedded rendered example with "Open in CodeSandbox". Purpose: show the thing before describing it.
2. **Resources** — outbound links: React Storybook docs page, Web Components Storybook docs page, W3C WAI-ARIA APG pattern. Purpose: route developers off the design site immediately.
3. **Types** *(optional — Button and Dialog have it; Checkbox/Combobox/Tooltip don't)* — the variant taxonomy (e.g. modal/non-modal/alert). Purpose: name the variants before giving rules about them.
4. **Behavior** — interaction rules, each as an H3 topic (Dialog: "Dismissal", "Scrolling", "Forms in dialogs"; Combobox: "Single select", "Multi-select", "Filtering and free form submission"). Do/Don't image pairs are embedded inline here where relevant.
5. **Layout** *(optional — Combobox lacks it)* — placement, arrangement, spacing rules in prose with example images (Dialog mentions exact paddings).
6. **Accessibility** — narrative with H3 subtopics; concrete even here (names props and aria attributes — e.g. Combobox's H3s include "The `text` prop" and "Optimize for screen readers").
7. **Content** — microcopy/writing guidance with very specific H3s (Button: "Apply versus Save", "Buttons to end a task: Done, Finish, Close…"; Checkbox: "Capitalize the first word and skip the period"). Purpose: Microsoft voice-and-tone applied per component. This is the most design-org-specific section.

Notable structural trait: heading text is written as *advice sentences*, not noun labels ("Give additional context in the body" rather than "Body text") — the ToC alone reads as a checklist.

## Storybook docs-page skeleton  (how a component's Docs tab is structured: sections, best-practices MDX, argTables, story organization per feature)

Verified two ways: the custom docs template (`react-storybook-addon/src/docs/FluentDocsPage.tsx`) and the live markdown export (`/react/llms/components-dialog.txt`). Storybook loads with `viewMode: 'docs'` — the Docs page is the landing page, canvas is secondary.

Rendered Docs tab, top to bottom:

1. **Title** (sidebar path, e.g. "Components/Dialog").
2. **Global toggles row** (custom): Fluent **theme picker** (light/dark/Teams/high-contrast), **direction switch** (LTR/RTL), and a **Copy-as-Markdown split button** that fetches this page's `/llms/<id>.txt` and copies it (or opens it in a tab) — an explicit "feed me to an LLM" affordance.
3. **Description block** — NOT hand-written MDX pages. The component meta concatenates plain markdown files into autodocs' description slot:
   `parameters.docs.description.component = [descriptionMd, bestPracticesMd, a11yMd, ssrMd].join('\n')`
   which renders as ordered sections: intro paragraph → `## Best practices` (`### Do` / `### Don't` bullets) → `## Accessibility` (numbered edge cases) → `## Server-Side Rendering` (only components that need it). Optional YouTube video-preview cards can sit beside the description (`parameters.videos`).
4. **Primary story** — divider, anchored H3 with the story name, then the `<Primary />` canvas. Source panel shows literal story source (`docs.source.type: 'code'`, decorators excluded). **Controls are globally disabled** (`controls: { disable: true }`) — the docs are reference material, not a knob playground; the "playground" need is covered by a custom **export-to-sandbox addon** that puts an "Edit in StackBlitz" button on stories and rewrites monorepo imports to published-package imports.
5. **ArgTypes table** for the root component (generated via `react-docgen-typescript`), followed by two auto-derived info cards: a "Native props are supported" card (computed from the `as` prop's element enum — tells you every HTML attribute of `<button>` etc. applies) and a "Customizing components with slots" card (shown when Slot-typed props are detected; links to the slots concept page). A type enhancer rewrites ugly docgen type summaries into `Slot<"div">` for readability.
6. **Subcomponent ArgTypes** — `meta.subcomponents = { DialogTrigger, DialogSurface, DialogTitle, DialogActions }` yields a prop table per compound part.
7. **Stories section** — every named export renders as: anchored heading + optional per-story description + canvas + source. **One feature per story, one story per file**: `DialogNonModal.stories.tsx` exports `NonModal` and wires `DialogNonModal.md` via `NonModal.parameters.docs.description.story`. An `index.stories.tsx` per component re-exports all stories and defines the meta — authoring is decentralized (each story file self-contained: code + its md), publication is one docs page.
8. **Right-rail sticky ToC** (custom `Toc.tsx`) generated **from story names** — the story list literally is the page's table of contents (hidden under 1000px).

Story naming/organization per feature (from `index.json`): `Default` first, then prop-named and scenario-named stories. Combobox (18): Default, ComplexOptions, CustomOptions, Controlled, Clearable, Filtering, Freeform, Multiselect, MultiselectWithTags, MultiselectWithValueString, Grouped, Appearance, Size, Disabled, Virtualizer, ActiveOptionChange, ControllingOpenAndClose. Dialog adds edge-case stories that read like an FAQ: NoFocusableElement, TriggerOutsideDialog, CustomTrigger, WithForm, KeepRenderedInTheDOM, ScrollingLongContent.

Sidebar information architecture (`storySort` with explicit top-level order, alphabetical within): **Concepts** (Introduction, Developer incl. Accessibility, Migration, Recipes) → **Theme** → **Components** → **Compat Components** → **Preview Components** → **Motion** → **Utilities** (focus-management hooks, ARIA-live utilities documented like components). Multi-component families nest one level: `Components/Button/{Button, CompoundButton, MenuButton, SplitButton, ToggleButton}`. Sibling Storybooks (icons, community "contrib", charts) are composed into the same sidebar via `refs` — one docs home spanning several deployments.

Docs live in each component's package (`packages/react-components/react-<x>/stories/src/<Component>/`), globbed into a docsite app — component code and its docs are versioned together. MDX is used only for unattached concept pages (tag `unattached-mdx`) and accessibility specs; component pages are pure autodocs + injected markdown. Addons: `addon-a11y` runs on every story; `addon-docs` with `remark-gfm` (tables in md); `addon-links` for story-to-story links; the custom Fluent addon (theme/dir/provider decorators + custom docs page).

**Versioning/status signaling**: no badge addon — status is encoded in the **sidebar taxonomy and package suffixes**. `-preview` packages render under "Preview Components/" (and Motion sections carry a literal "(preview)" suffix in the title); `-compat` packages (Calendar, DatePicker, TimePicker — v8-behavior ports) under "Compat Components/"; deprecated packages (react-alert, react-infobutton, react-virtualizer) are excluded from the build entirely rather than marked. Migration is a first-class docs section: per-component "X Migration" pages under `Concepts/Migration/from v8/Components/` and `from v0/Components/`, plus "Migration Shims/V8|V0" documenting shim components. The v9 Storybook thus carries its own back-compat story; the design site only footnotes "Fluent 1".

## Page dissections  (3 concrete pages: URL + exact headings/structure in order + notes)

### 1. Fluent 2 usage page — Dialog
URL: `https://fluent2.microsoft.design/components/web/react/core/dialog/usage`

- H1 Dialog (+ live preview, "Open in CodeSandbox")
- H2 Resources (3 links: React Storybook docs deep link, Web Components Storybook docs deep link, WAI-ARIA APG dialog pattern)
- H2 Types
- H2 Behavior
  - H3 Dismissal
  - H3 Scrolling
  - H3 Forms in dialogs
- H2 Layout
- H2 Accessibility
  - H3 Nesting dialogs
  - H3 Dialog focus
- H2 Content
  - H3 Communicate the main message in the title
  - H3 Give additional context in the body
  - H3 Buttons labels should respond to the title text

Notes: two Do/Don't paired-image blocks embedded in Behavior (single-sentence captions per image, e.g. do "stick with the necessary actions" vs don't "include redundant options"); accessibility is short narrative (focus trapping, nesting warning); "On this page" ToC lists exactly the H2s. Layout section states concrete numbers (24px padding case) without being a token table.

### 2. Storybook Docs page — Components/Dialog
URL: `https://storybooks.fluentui.dev/react/?path=/docs/components-dialog--docs` (structure verified via `https://storybooks.fluentui.dev/react/llms/components-dialog.txt`)

- H1 Components/Dialog
- (intro paragraph = `DialogDescription.md`, one paragraph defining the component in ARIA terms)
- H2 Best practices — H3 Do (5 bullets) / H3 Don't (3 bullets) — from `DialogBestPractices.md`
- H2 Accessibility — 5 numbered screen-reader edge cases — from `DialogA11y.md`
- H2 Server-Side Rendering — from `DialogSSR.md`
- H2 Props — table: Name | Type | Required | Default | Description (root Dialog: surfaceMotion, modalType, open, defaultOpen, onOpenChange, inertTrapFocus, unmountOnClose)
- H2 Subcomponents — H3 DialogTrigger / DialogSurface / DialogTitle / DialogActions, each: one-paragraph role description + H4 Props table
- H2 Examples — 18 H3s, one per story: Actions, Alert, Backdrop Appearance, Change Focus, Confirmation, Controlling Open And Close, Custom Trigger, Default, Fluid Actions, Keep Rendered In The DOM, Motion Custom, No Focusable Element, Non Modal, Scrolling Long Content, Title Custom Action, Title No Action, Trigger Outside Dialog, With Form — each with description (its own .md file where one exists) + full source

Notes: in the rendered SPA the same content carries the custom chrome (theme/dir toggles, copy-as-markdown, right-rail ToC of story names, StackBlitz buttons); Do bullets name slots and aria attributes (e.g. "Add a `aria-label`… on `DialogSurface` if there is no `DialogTitle`"); the a11y list names specific AT ("NVDA reads dialog information twice") and cross-links a sibling story by anchor ("see [with form](#with-form)").

### 3. Storybook accessibility spec — Checkbox Accessibility Spec
URL: `https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-checkbox--docs` (source: `packages/react-components/react-checkbox/stories/src/Checkbox/CheckboxAccessibilitySpec.mdx` — an MDX file living in the component package but mounted under Concepts/Developer/Accessibility/Components/)

- H1 Checkbox Accessibility Spec (+ 2 intro paragraphs grounding semantics in the actual DOM: native `<input type="checkbox">`, aria-hidden visual indicator)
- H2 Usage
  - H3 When to choose Checkbox
    - H4 Checkbox vs. Switch / H4 Checkbox vs. ToggleButton / H4 Checkbox vs. Radio / H4 Multiselect Dropdown vs. Checkboxes / H4 Tri-state (mixed) checkboxes
  - H3 Checkbox within other controls (composition constraints: which composite widgets it must NOT be nested in, and what to do instead)
  - H3 Implementing Checkbox
    - H4 Programmatic label (3 sanctioned labeling patterns with code) / H4 Visual label (WCAG 3.3.2 citation) / H4 Field integration (exact attributes the Field wrapper injects) / H4 Tri-state (mixed) (4-step numbered state-transition contract) / H4 Disabled / H4 Click target (WCAG 2.5.8 target-size citation)
- H2 Semantics — slot-by-slot table: Slot | Role | States and properties (root/input/indicator/label), plus focus-placement prose and a hard rule ("never set `aria-checked`…")
- H2 Keyboard interaction — table: Key | Result (with `<kbd>`), plus non-behavior called out (no Enter activation)
- H2 Windows contrast themes (high contrast mode)
- H2 Motion and animation (explicitly states nothing needs `prefers-reduced-motion` gating)

Notes: the longer Dropdown spec (`DropdownAccessibilitySpec.mdx`, 288 lines) extends the same skeleton: annotated anatomy diagrams whose numbered callouts key into role/state tables, keyboard tables *per interaction phase* (navigate to control → open popup → navigate options → select), behavior split "Single-selection" vs "Multiselection", and a closing H2 "Known issues". Only ~9 components have specs so far (Button, Checkbox, Dropdown, Input, MenuButton, RadioGroup, SpinButton, SplitButton, Textarea) — it's an aspirational tier, not yet universal.

## Do/Don't model  (how best-practice lists are structured and where they live)

Two disjoint models by audience:

- **Design site (visual model)**: paired image cards — a "do" example and a "don't" example side by side, each with a one-sentence caption — embedded *inline within the topic section they belong to* (Behavior/Layout), not collected into a standalone Best Practices page. Sparse: 0–2 pairs per page; some pages (Combobox, Tooltip) have none and use narrative only.
- **Storybook (bulleted model)**: one `<Component>BestPractices.md` per component with a fixed micro-schema — `## Best practices` → `### Do` (bulleted) → `### Don't` (bulleted) — injected as the second block of the Docs page via the meta's description concatenation. Bullets are code-actionable: they name slots, props, aria attributes, and alternatives ("consider a multi-step wizard… panels, sidebars, popovers" instead of nested dialogs). Some use a bold lead-sentence + explanation pattern per bullet (Combobox). Counts are small (Dialog 5/3, Combobox 1/1) — a curated contract, not a style guide.
- A third, softer tier: per-story `.md` descriptions sometimes carry `> Note:` blockquote caveats — Do/Don't-adjacent guidance placed exactly on the example it applies to.

## Accessibility content model  (what form the per-component a11y content takes)

Fluent's a11y content is unusually concrete because it is split into three escalating tiers, each with its own form:

1. **Design-site Accessibility section** (every usage page): short narrative with advice-sentence H3s; even here it names props (`aria-describedby`, `inlinePopup={true}`). Form: prose, no tables.
2. **Component Docs `A11y.md`** (inside the Storybook docs page, only where needed — Dialog has one, Combobox doesn't): a **numbered list of known AT edge cases** naming exact screen readers (NVDA, TalkBack, VoiceOver iOS/macOS) and the exact prop-level remedy, with anchor links to the story demonstrating the scenario. Form: numbered bullets, ~5 items.
3. **Accessibility Spec MDX pages** (per component, sidebar section `Concepts/Developer/Accessibility/Components/`): the rigorous tier. Form is a repeatable contract document: intro grounding semantics in the real DOM → "When to choose X vs Y" comparative H4s → composition restrictions → implementation rules with **WCAG citations** → **Semantics table** (slot | role | states/properties) → annotated anatomy **diagrams with numbered callouts** (and exemplary alt text) keyed into role/state tables → **keyboard tables per interaction phase** (Key | Result, `<kbd>` markup), split by mode (single vs multi select) → Windows high-contrast behavior → motion/`prefers-reduced-motion` statement → Known issues. Tables + numbered contracts dominate; narrative is only connective tissue.

Supporting apparatus: `addon-a11y` runs on every story; and a dedicated **"Accessibility Scenarios"** section of stories — realistic mini-flows (e.g. "Questionnaire about food (checkboxes)", "Profile menu") built specifically as screen-reader test scenarios, i.e. executable a11y documentation.

## Worth stealing for a headless React library's Storybook docs  (bulleted, with WHY — Storybook-embedding moves are the most valuable here)

- **Docs-first Storybook (`viewMode: 'docs'`)** — the Docs page is the landing page and the canonical per-component URL (`?path=/docs/<id>--docs`), stable enough that an external design site links to it. WHY: makes Storybook a documentation *home*, not a QA tool with docs bolted on.
- **Markdown-fragment injection instead of per-component MDX pages**: small, separately-authored `.md` files (Description / BestPractices / A11y / SSR) concatenated into `parameters.docs.description.component`. WHY: keeps autodocs (argTables, stories) fully automatic while prose stays modular, diff-able, and enforceable as a checklist ("does this component have a BestPractices.md?"); avoids hand-maintaining full MDX docs pages per component.
- **One story per feature, one file per story, `index.stories.tsx` aggregator, per-story `.md` via `parameters.docs.description.story`**. WHY: the story list becomes the feature index of the component; each example ships with its own explanation and stays copy-pasteable; edge cases get named, linkable homes (NoFocusableElement, TriggerOutsideDialog).
- **ToC generated from story names** (right rail). WHY: cheap self-maintaining navigation; forces good story naming discipline because names double as headings.
- **`subcomponents` → per-part prop tables**. WHY: Base UI components are compound (`Dialog.Root/Trigger/Popup/...`); one docs page with an argTable per part matches the API shape exactly.
- **Auto-derived info cards next to the argTable** ("native props supported on `<button>`…", "this component uses slots → concept link"). WHY: teaches the API *model* at the exact point of confusion; Base UI's analogs are `render`-prop composition and `data-*` state attributes — a generated "state attributes" card per part would be the equivalent move.
- **Best-practices micro-schema (`## Best practices` → `### Do` / `### Don't`, few, code-actionable bullets)**. WHY: trivially templatable across all components, renders fine in autodocs, and survives export to markdown/LLM formats; far cheaper than illustrated pairs and more enforceable in review.
- **The Accessibility Spec form** (semantics slot/role table + keyboard tables per interaction phase + "X vs Y — when to choose" + named-AT known issues + high-contrast + reduced-motion statements). WHY: for a *headless* library the a11y contract IS the product; this is the most rigorous, most copyable format found anywhere, and it lives in Storybook next to the component. Prefer mounting it on the component's docs page rather than a distant Concepts section (see below).
- **`llms.txt` export + Copy-as-Markdown button on every docs page**. WHY: 2026 table stakes — makes every docs page consumable by agents and paste-able into issues; Fluent derives it directly from the docs pages so it can't drift.
- **A11y addon on globally + "Accessibility Scenarios" stories**. WHY: turns a11y claims into executable, testable artifacts; scenarios double as integration examples.
- **Status via sidebar taxonomy** ("Preview Components/", "(preview)" suffixes, "Compat Components/", deprecated excluded from the build). WHY: zero-custom-code status signaling that's visible in every screenshot and URL; Base UI can mirror for experimental parts.
- **Per-component migration pages inside the Storybook sidebar** (`Concepts/Migration/from v8/Components/<X> Migration`). WHY: migration content stays adjacent to the docs users are already in; useful pattern for Base UI's Radix/MUI-migration positioning.
- **Explicit `storySort` top-level order** (Concepts → Theme → Components → Utilities). WHY: gives the sidebar a narrative (learn → reference) instead of alphabet soup.
- **Docs live in the component package, globbed by the docs app; sibling Storybooks composed via `refs`**. WHY: docs version with code; ecosystem (icons/community) attaches without one mega-build.
- **Export-to-sandbox with import-rewriting** (workspace imports → published package imports). WHY: with controls disabled, this is what keeps examples *playable*; the import-mapping trick is what makes monorepo stories runnable outside.

## Skip or heavily adapt  (bulleted, with WHY)

- **The two-site design/code split itself** — Fluent needs it because Fluent 2 spans four platforms and a design org; Base UI has no separate design-opinion property. ADAPT: fold the valuable design-site sections (when-to-use, behavior rules, a sane subset of layout guidance) into the Storybook docs page rather than standing up a second site.
- **"Content" (microcopy/voice) sections** — Microsoft-voice-specific rules ("Apply versus Save", capitalization rules). SKIP: a headless library shouldn't prescribe product copy beyond, at most, one accessibility-relevant labeling note.
- **Do/Don't paired-image blocks** — require illustration production and go stale with visual refreshes. SKIP in favor of the bulleted Storybook model; if visual comparisons are ever needed, render them as live do/don't *stories* instead of static images.
- **Fluent theme picker / FluentProvider decorator machinery** — token-system-specific. ADAPT: Base UI demos are unstyled/lightly styled; a docs-page dark-mode toggle may suffice. The **RTL direction switch is worth keeping** specifically for positioning-heavy components (popups, sliders).
- **Globally disabled controls** — Fluent disables them partly because slot-typed props make terrible controls. ADAPT, don't copy: for a headless library, controls on a curated playground story (booleans, enums like `side`/`align`) are genuinely useful; disable per-story rather than globally.
- **Slot-type argtable rewriting (`Slot<"div">` enhancer)** — solves a Fluent-specific type-noise problem. SKIP the mechanism; the *lesson* (post-process docgen types until prop tables read like documentation, not compiler output) applies to Base UI's `render`/`className` union types.
- **A11y specs parked under `Concepts/Developer/Accessibility/Components/<X>`** — the two-place problem: Dialog's a11y notes are on its docs page, Checkbox's spec is in a different sidebar tree; discoverability suffers. ADAPT: keep the spec *form*, but mount it on (or tab it into) the component's own docs page.
- **Alphabetical story order in the sidebar/export** — Dialog's Examples read Actions → Alert → … → Default buried in the middle. ADAPT: order stories pedagogically (Default → common features → edge cases) and sort only components alphabetically.
- **`parameters.videos` YouTube cards** — needs a video pipeline nobody will maintain. SKIP.
- **Migration Shims sections** — only meaningful with a huge v8 install base. SKIP (Base UI has no legacy of its own); keep only "migrating from other libraries" guides.
- **Composition `refs` on day one** — no sibling Storybooks exist yet for Base UI docs. DEFER until there's an icons/extensions story.

## URLs consulted

Fluent 2 design site (fetched, heading structure extracted):
- https://fluent2.microsoft.design/components/web/react/core/button/usage
- https://fluent2.microsoft.design/components/web/react/core/checkbox/usage
- https://fluent2.microsoft.design/components/web/react/core/dialog/usage (fetched twice; second pass for Resources/Preview/ToC detail)
- https://fluent2.microsoft.design/components/web/react/core/combobox/usage
- https://fluent2.microsoft.design/components/web/react/core/tooltip/usage
- https://fluent2.microsoft.design/components/web/react (component catalog)
- https://fluent2.microsoft.design/components/web/react/core/button/code (confirmed 404 — no code pages on design site)

Fluent UI React v9 Storybook (live endpoints):
- https://storybooks.fluentui.dev/react/index.json (full story index: titles, ids, names, tags, importPaths)
- https://storybooks.fluentui.dev/react/llms.txt (llms-format index of all docs pages)
- https://storybooks.fluentui.dev/react/llms/components-dialog.txt (full Dialog docs page as markdown)
- https://storybooks.fluentui.dev/react/llms/components-combobox.txt (heading skeleton)
- https://storybooks.fluentui.dev/react/iframe.html?viewMode=docs&id=components-dialog--docs (attempted; confirmed client-side-only shell — recorded as failed scrape)
- https://storybooks.fluentui.dev/ (404 — only sub-Storybooks exist)
- Canonical docs URLs referenced by the design site: https://react.fluentui.dev/?path=/docs/components-dialog--docs

microsoft/fluentui repo, master branch (source of truth for docs assembly):
- packages/react-components/react-dialog/stories/src/Dialog/ — index.stories.tsx, DialogDescription.md, DialogBestPractices.md, DialogA11y.md, DialogNonModal.md, DialogNonModal.stories.tsx (directory listing + file contents)
- packages/react-components/react-combobox/stories/src/Combobox/ — index.stories.tsx, ComboboxDescription.md, ComboboxBestPractices.md (directory listing + file contents)
- packages/react-components/react-checkbox/stories/src/Checkbox/CheckboxAccessibilitySpec.mdx
- packages/react-components/react-combobox/stories/src/Dropdown/DropdownAccessibilitySpec.mdx
- packages/react-components/react-storybook-addon/src/ — docs/FluentDocsPage.tsx, docs/Toc.tsx, docs/FluentDocsContainer.tsx, docs/CopyAsMarkdownButton.tsx (directory listings + contents)
- .storybook/main.js, .storybook/preview.js (root workspace Storybook config)
- apps/public-docsite-v9/.storybook/main.js, apps/public-docsite-v9/.storybook/preview.js (docsite config: refs, storySort, stories globs)
