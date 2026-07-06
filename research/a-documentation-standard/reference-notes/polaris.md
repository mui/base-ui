# Shopify Polaris — documentation anatomy

Studied 2026-07-06. Note: `polaris.shopify.com` now 301-redirects to `polaris-react.shopify.com` (the React docs are preserved there while Polaris web components supersede the library). Source of truth used: `github.com/Shopify/polaris`, `polaris.shopify.com/content/**/*.mdx`, which path-mirrors URLs. All 110 component mdx files were downloaded and analyzed; counts below are measured, not estimated. This document records structure only — no Polaris guidance text is collected for reuse; the few quoted fragments are illustrations of form.

## Site-level information architecture

Top-level nav (verified on live site, in order): **Getting started, Foundations, Design, Content, Patterns, Components, Tokens, Icons, Contributing, Tools, Version guides, Previous releases**. Each section is a directory of mdx files; frontmatter `order` fields sequence the nav (Content is `order: 4`, Patterns `6`, Components `7`).

What belongs where — the four "guidance" sections are deliberately separated by *kind of rule*:

- **Getting started** — meta-docs about the system itself: `polaris-101`, `components-lifecycle` (formal Alpha → Beta → Stable → Legacy → Deprecated stages, each with "Requirements for X" / "What to expect during X"), `designing-with-a-system`.
- **Foundations** — durable product-design principles, not visuals: Experience values, Accessibility, Information architecture, Internationalization, Formatting localized currency.
- **Design** — the visual language: Colors, Typography, Icons, Layout, Motion, Depth, Illustrations, Sounds, Interaction states, Data visualizations, Pro design language (several are directories with subpages).
- **Content** — writing/microcopy, promoted to a co-equal top-level section (see below).
- **Patterns** — task-level compositions of components (see Patterns anatomy).
- **Components** — per-component reference, grouped by category (see below).
- **Tokens** — one page per token group: Border, Breakpoints, Color, Font, Height, Motion, Shadow, Space, Text, Width, Z-index.
- **Icons** — a single searchable gallery page (`icons.mdx`).
- **Contributing / Tools / Version guides / Previous releases** — process, tooling (VS Code extension, Figma libraries, etc.), migration guides per major version.

### The co-equal Content section

Content sits in the nav at the same rank as Design and Components. Its index describes the section as "How to use content to build a world-class user experience" and renders a card grid of pages. Current page list (file → displayed title):

1. `fundamentals.mdx` — **Fundamentals** (voice-level principles; H2s like "Keep it lean", "Write like merchants talk", "Inspire action")
2. `grammar-and-mechanics.mdx` — **Grammar** (mechanical rulebook; H2s: Addresses, Capitalization, Contractions, Formatting, Headings, Links, Lists, Numbers/dates/currency, Pronouns, Punctuation, Spelling; carries `keywords` frontmatter for search: "writing rules", "copy guidelines"…)
3. `error-messages.mdx` — **Error messages** (H2s: Design for clarity, Anatomy of an error message, Examples)
4. `naming.mdx` — **Naming** (H2s: Thoughtful naming, Does it need a branded name?, Descriptive vs evocative names, …, Components, Icons)
5. `alternative-text.mdx` — **Alternative text**
6. `inclusive-language.mdx` — **Inclusive language**

Historically the section was larger — **Voice and tone, Product content, Actionable language, Help documentation, Merchant-to-customer** each had their own page; `next.config.js` now permanently redirects all five to `/content/fundamentals` (a consolidation, not a demotion — component pages and pattern pages still deep-link into the section, e.g. Modal's title guidance links to the actionable-language headings anchor). Structural takeaway: content guidance is a *hub* the whole site links into, so component pages only carry component-specific microcopy rules and delegate the general rules.

### Component categories

URL scheme: `/components/<category>/<component>`. Verbatim categories (13 directories; 12 visible, ordered in the sidebar via `order` frontmatter, "Internal only" hidden behind `internalOnly: true`):

- **Actions** (3: account-connection, button, button-group)
- **Layout and structure** (14: bleed, block-stack, box, card, callout-card, divider, empty-state, form-layout, grid, inline-grid, inline-stack, layout, media-card, page)
- **Selection and input** (15: autocomplete, checkbox, choice-list, color-picker, combobox, date-picker, drop-zone, filters, form, index-filters, inline-error, radio-button, range-slider, select, tag, text-field)
- **Images and icons** (5: avatar, icon, keyboard-key, thumbnail, video-thumbnail)
- **Feedback indicators** (10: badge, banner, exception-list, progress-bar, skeleton-\*, spinner, toast…)
- **Typography** (1: text)
- **Tables** (1: index-table)
- **Lists** (7: action-list, description-list, list, listbox, option-list, resource-item, resource-list)
- **Navigation** (4: footer-help, link, pagination, tabs)
- **Overlays** (2: popover, tooltip)
- **Utilities** (3: app-provider, collapsible, scrollable)
- **Deprecated** (22 — a real category, listed last; see status signaling under Component-page skeleton)
- *Internal (shopifolk only)* (7, hidden from public nav: frame, modal, toast, navigation, top-bar, loading, contextual-save-bar — the App-Bridge-replaced set)

Each category has an `index.mdx` with a one-line Lede ("Choose or enter information using elements like checkboxes, text fields, and more.") and a preview-image card grid. Component cards carry `previewImg` thumbnails and `shortDescription` from frontmatter.

## Component-page skeleton

Every component page is one mdx file whose frontmatter is half the documentation model:

```yaml
title / category / shortDescription / previewImg
webComponent: {name, url, type}        # successor pointer (40 current components)
status: Deprecated                     # deprecated pages only (22 files)
keywords: [...]                        # search synonyms: "drop-down menu", "combo box"
examples:                              # ordered list; drives the rendered example tabs
  - fileName: select-default.tsx       # one standalone tsx file per example (461 files total)
    title: Default
    description: "Use only for cases where the select must fit on a single line…"
```

The per-example `description` is load-bearing: it is *when-to-use guidance for that variant*, not a caption ("Use when…", "Use to let merchants know…").

Rendered body order (verified against source and live page):

1. `# {title}` + `<Lede>` — 1–2 sentence definition that includes a usage threshold ("Consider select when you have 4 or more options…")
2. **Status/successor banner** — `<WebComponentBanner>` on current components ("Upgrade to Polaris Web Components… {Component} is now available as a framework-agnostic web component", 3 flavors: polaris / pattern / app-bridge) or `<StatusBanner>` on deprecated ones
3. `<Examples />` — tabbed live previews rendered from the frontmatter list; each tab shows the description, a live iframe, a code panel with React/HTML toggle and a CodeSandbox link
4. `<Props componentName={…} />` — props table auto-generated from the TypeScript source (never hand-written)
5. `## Best practices`
6. `## Content guidelines`
7. `## Related components` — each bullet framed as routing advice: "To present … , use the X component"
8. `## Accessibility` — typically with `### Structure`, `### Labeling`, `### Keyboard support` subsections
9. Footer: edit-on-GitHub / feedback links; right rail is an "On this page" TOC.

Sections are separated with `---` horizontal rules in the source.

Invariant vs conditional, measured across all 110 mdx files (incl. category indexes):

| Block | Files | Status |
|---|---|---|
| `<Lede>` | 110 | invariant |
| `<Examples />` / `<Props>` | 96 | invariant for real component pages |
| `## Best practices` | 83 | near-invariant |
| `## Related components` | 76 | near-invariant |
| `## Content guidelines` | 62 | conditional — only where the component owns text slots |
| `## Accessibility` | 49 | conditional — where behavior isn't trivially native |
| `<DoDont>` | 51 | conditional, inside CG/A11y |
| `## Required components` | 12 | composite components only (Frame, TopBar, Navigation…) |
| One-off H2s | ~15 | e.g. Text: "Variant tokens", "Mapping from previous type components"; AppProvider: "Using translations", "Using linkComponent", "Testing components"; IndexTable: "Purpose", "Build", per-subcomponent sections |

Dominant order is BP → CG → Related → A11y (by far the most common sequence; a handful of pages deviate — one puts Accessibility first, TopBar interleaves subcomponent sections — i.e., the template is strong but not enforced).

**Status signaling** (per-component): the type system defines `StatusName = New | Deprecated | Alpha | Beta | Information | Legacy | Warning | Internal`, but component frontmatter currently only uses `Deprecated` (all 22 in the Deprecated category). Signaling is three-layered: (a) `status:` frontmatter renders a colored `<StatusBanner>` whose body is a hand-written migration note — three observed flavors: point to a successor API ("no longer supported. Please use the App Bridge Modal API instead"), point to a replacement component (LegacyCard → Card + layout primitives, with a migration-guide link), or explain *why the pattern itself is bad* (Sheet's banner argues the component encourages poor UI); (b) the component is physically re-homed into the **Deprecated** category, whose index links the formal lifecycle policy; (c) superseded-but-live components got renamed with a `Legacy` prefix (LegacyCard, LegacyStack, LegacyTabs, LegacyFilters) so the name itself signals status in code. Meanwhile *every* current component carries the WebComponentBanner — whole-library succession is signaled per page, not just in a blog post.

## Content-guidelines model

The model on form components is: **one `###` subsection per text slot the component exposes, each with a "should:" rule list, each rule optionally proven by a `<DoDont>` block of literal microcopy strings.**

- Subsections are named after the slot, not abstract topics. Measured across Selection and input: Select → "Select label", "Select options"; Choice list → "List titles", "List choices", "Helper text and descriptions"; Radio button → "Radio button labels", "Toggle (Android and iOS only)"; Range slider → "Range label", "Designating optional fields", "Help text", "Validation error messages"; Drop zone → "Client-side validation error messages", "Server-side upload error messages"; Filters/Index filters → "Text field", "Filter badges". Modal (richest case) covers every slot: Title, Body content, Primary and secondary actions, Tertiary actions, Footer.
- Rules are mechanical and checkable: label length ("1–3 words"), casing (sentence case), punctuation bans, article bans, grammatical person, and i18n constraints (labels must be independent phrases, "not act as the first part of a sentence that is finished by the component's options").
- Templates appear as fill-in-the-blank grammar: modal titles "Use a clear {verb}+{noun} question or statement"; action labels use {verb}+{noun} "except in the case of common actions like Save, Close, Cancel, or OK".
- `<DoDont>` blocks contain **actual candidate strings**, paired: `#### Do` "Email address" / `#### Don't` "What is your email address?". Checkbox demonstrates per-rule granularity: each bullet ("Start with a capital letter", "Not use commas or semicolons…", "use the first person" for terms) is immediately followed by its own DoDont pair. Modal's tertiary-actions DoDont uses *screenshots* instead of strings — the same component handles text and image evidence.
- Delegation instead of duplication: Text field's entire Content guidelines section is one line pointing to a centralized "Text fields experience" page (`/patterns/text-fields`, now in `patterns-legacy`), which is organized first by anatomy slot (Field labels, Placeholder text, Help text) then by input type (Modeled / Free / Multiline text inputs, then per-domain: Titles names and descriptions, Codes and tracking numbers, Comments and notes) with 16 DoDont blocks. Component pages also deep-link into the Content section for general rules (headings-and-subheadings anchors, grammar #date anchor).

## Best-practices model

A fixed rhetorical formula: a stem sentence — "The select component should:" / "Checkboxes should:" / "Tooltips should:" — followed by 3–7 bullets. Framing characteristics:

- **Outcome- and behavior-oriented, not visual.** Rules govern when to use the component, defaults, interaction contracts, and information architecture — "Be used for selecting between 4 or more pre-defined options", "Have a default option selected whenever possible", "Only ask for information that's really needed", "Work independently from each other". Almost nothing about pixels.
- **Merchant-anchored.** Bullets are phrased around the end user's success (Polaris' persona is "merchants"), and microcopy examples are embedded inline in the bullet when it makes the rule concrete: "Be framed positively. For example, say 'Publish store' instead of 'Hide store'."
- **Negative rules ride along in the same list** ("Not be used to communicate critical information…", "Not contain any links or buttons", tooltip's "Be used sparingly. If you're building something that requires a lot of tooltips, work on clarifying the design…"). There are no `<DoDont>` components inside Best practices — those live in Content guidelines and Accessibility; Best practices stays prose bullets.
- **When-to-use paragraphs precede the list where scope needs framing** (Modal: use for confirmations and conditional changes; not for complex forms).
- **Deep technical guidance is allowed as `###` subsections of Best practices** rather than a separate section: Text field carries "Autocomplete" (with a 4-browser support table for `autocomplete="off"`, WHATWG/Chromium links, and explicit "Recommendation" callouts) and "Virtual keyboard" (inputMode screenshots). So the section spans from product judgment down to browser-quirk engineering advice.
- Cross-references route rule-adjacent decisions elsewhere: bullets link to Foundations (internationalization) and Related components handles "wrong component" cases.

## Patterns pages anatomy

Patterns are "Preferred solutions to common merchant goals" — a task layer above components. Current set: App settings layout, Card layout, Common actions, Date picking, New features, Resource details layout, Resource index layout; the Patterns landing page carries a StatusBanner admitting "The pattern documentation is evolving" with a GitHub Discussions link, plus an "Archived documentation" grid of legacy pattern pages (Loading, New badge, Pickers, Text fields). There is even a `variant.md.template` checked into the content directory — pattern docs are explicitly template-driven.

Structure is two-tier: a pattern **index** plus one page per **variant**, rendered as tabs.

**Index page** (`date-picking/index.mdx`, 25 lines): frontmatter holds title, description, lede, previewImg, `githubDiscussionsLink` (each pattern has a standing feedback thread), and an ordered `variants:` list (single-date, date-range, date-list). Body is just `<Variants …/>` (the tab strip) plus a shared `## Related resources` list linking an external engineering article, the Grammar page's #date anchor, and the actionable-language guidance — i.e. the pattern page is the junction between Components, Content, and the outside world.

**Variant page** (dissected: `date-picking/variants/single-date.mdx` and `resource-index-layout/variants/default.mdx` — both follow the template exactly):

1. One-sentence lede ("This enables merchants to type a specific date or pick it from a calendar.")
2. `<HowItHelps>` → `## How it helps merchants` — an annotated screenshot followed by a **numbered list keyed to callouts in the image** (resource index: 1 single-column hierarchy, 2 page-level title/actions, 3 index controls, 4 resource rows), then `<DefinitionTable>` → `### Use when merchants need to:` — a term:definition table of **task scenarios**, each definition giving concrete examples and citing where the pattern ships in the real product ("Found in: Product / transfers").
3. `<Usage>` → `## Using this pattern` — a sentence listing the exact components composed (each linked), then a single **complete, runnable code block** (~100–350 lines) marked `{"type":"livePreview"}`, with hidden `previewContext`/`sandboxContext` wrapper blocks so the rendered preview and the "Open in sandbox" (Playroom) version can differ from the copy-paste snippet.
4. `### Useful to know` → `<SideBySide>` — tip-plus-screenshot pairs for secondary advice (labeling, page width, when to duplicate the pattern).

So the pattern page answers, in order: what it is → why/when (task-indexed) → exactly how (one canonical composition, copy-pasteable) → edge advice. Guidance prose is thin; the code artifact is the center of gravity.

## Page dissections

### 1. Select — https://polaris-react.shopify.com/components/selection-and-input/select
Source: `polaris.shopify.com/content/components/selection-and-input/select.mdx` (127 lines). Exact structure in order:

- Frontmatter: 6 examples (Default; With inline label; Disabled; With prefix; With validation error; With separate validation error), 18 keywords, webComponent pointer
- `# Select` → `<Lede>` → `<WebComponentBanner>` → `<Examples />` → `<Props />`
- `## Best practices` (3 bullets, stem "The select component should:")
- `## Content guidelines` → `### Select label` (5 rules + 2 DoDont string pairs) → `### Select options` (4 rules, no DoDont)
- `## Related components` (2 task-framed bullets)

Notes: no Accessibility section (native `<select>` semantics assumed); "when to use" is split across the Lede (≥4 options threshold), example descriptions, and Related components ("less than 4 options → choice list"). Error-state guidance lives in example descriptions, not a section.

### 2. Text field — https://polaris-react.shopify.com/components/selection-and-input/text-field
Source: `.../selection-and-input/text-field.mdx` (256 lines). Exact structure:

- Frontmatter: **23 examples**, each description a mini usage rule (placeholder: "low-contrast, so don't rely on it for important information"; validation: validate on blur, clear errors as they type)
- `# Text field` → Lede → WebComponentBanner → Examples → Props
- `## Best practices` (4 bullets) → `### Autocomplete` (numbered explainer, "Recommendation" blockquote, `#### Turning autofill/autocomplete off` with a browser-support table) → `### Virtual keyboard` (screenshot + inputMode advice)
- `## Content guidelines` — single line delegating to the centralized text-fields experience page
- `## Related components` (3 bullets)
- `## Accessibility` → `### Structure` → `### Labeling` (includes 1 DoDont on label vs placeholder) → `### Keyboard support` (kbd-key notation) → `#### Automatically focusing` (an anti-autoFocus stance)

Notes: Related components appears *before* Accessibility (their common order); the Accessibility section documents props-to-ARIA mapping (`helpText`/`error` → `aria-describedby`). Amusing template-reuse artifact: the Labeling section says "purpose of the checkbox" on the text-field page — evidence these sections are written from a shared boilerplate.

### 3. Modal (deprecated) — https://polaris-react.shopify.com/components/deprecated/modal
Source: `.../deprecated/modal.mdx` (280 lines). Exact structure:

- Frontmatter: `category: Deprecated`, `status: Deprecated`, `shortDescription`, 10 examples
- `# Modal` → Lede → `<StatusBanner status>` ("This component is no longer supported. Please use the App Bridge Modal API instead." — banner heading is the status word, body is the migration note) → Examples → Props
- `## Best practices` (scope paragraph + 3 bullets incl. an interaction contract: closes on X / Cancel / Esc / outside click; ≤2 footer buttons)
- `## Content guidelines` → `### Title` ({verb}+{noun} template + DoDont) → `### Body content` (3 named qualities — Actionable / Structured for merchant success / Clear — with DoDont pairs per quality) → `### Primary and secondary actions` (Clear and predictable / Action-led / Scannable, DoDont each) → `### Tertiary actions` (screenshot DoDont) → `### Footer` — 9 DoDont blocks total on one page
- `## Related components` (3 alternatives framed by intent: expand in place → collapsible; non-blocking → popover; page-level attention → banner)
- `## Accessibility` (role=dialog, aria-labelledby via title, activator-based focus return) → `### Keyboard support`

Notes: deprecation does not truncate the docs — the full reference remains intact under the banner, so existing users aren't stranded. This is the best single page to study for per-slot content guidelines.

(Also dissected but not written up in full: Checkbox — BP → CG ("Lists with checkboxes", per-rule DoDonts) → Related → A11y with Labeling/Keyboard support; Tooltip — BP → CG ("Basic tooltips", 1 DoDont) → Related, no A11y section, and a duplicated `<Examples />` tag in source.)

## Worth stealing for a headless React library's Storybook docs

- **Promote writing/microcopy guidance to a co-equal top-level docs section** (the priority). Polaris treats the words inside components as part of the component API: a small hub (fundamentals + mechanics + error messages + naming + alt text + inclusive language) that every component page deep-links into. For Base UI: a "Content" section in Storybook (top-level docs pages) that Field/Form/Dialog/Tooltip stories link to — component pages then only carry component-specific text rules. Their consolidation history (9 pages → 6, with permanent redirects) says: start small, keep it a hub.
- **Category-grouped component IA, mirrored in URLs.** 12 semantic categories ("Selection and input", "Overlays", "Feedback indicators"…) beat a flat alphabetical list for discovery and give Related-components sections a vocabulary. Maps 1:1 onto Storybook title paths (`Selection and input/Select`) — adopt category names suited to Base UI's inventory.
- **A fixed, ordered per-component skeleton with a small conditional vocabulary.** Examples → API → Best practices → Content guidelines → Related components → Accessibility. Predictability is the feature: authors know what to write, readers know where to look, and conditionality is legible (no text slots → no Content guidelines). Enforce order harder than Polaris did.
- **Per-example "Use when…" descriptions.** Every example/story carries one sentence of *when-to-use* guidance in metadata, not a caption of what's shown. Direct fit for story `parameters.docs.description.story`.
- **The DoDont primitive: paired literal strings, one pair per rule.** Concrete candidate microcopy ("Email address" vs "What is your email address?") is checkable in review in a way abstract rules aren't. As an MDX component in Storybook docs it costs little and structures all guidance writing. Also steal the per-slot subsection naming (guidelines named after the prop/slot: label, description, error message, trigger text).
- **Task-framed Related components** ("To let users pick from fewer than N options, use X") — routing at decision time is most of what component docs are for; headless libraries especially need it (Menu vs Select vs Combobox vs Autocomplete).
- **Three-layer deprecation signaling**: `status` metadata → colored banner whose body is a *specific* migration note (successor link, replacement recipe, or rationale) → re-homing into a Deprecated category, backed by a published lifecycle policy page (Alpha/Beta/Stable/Legacy/Deprecated with requirements). Storybook equivalents: tags + a doc-block banner + a "Deprecated" title prefix/section. Keep full docs alive under the banner.
- **Accessibility as a structured, per-component section** (Structure / Labeling / Keyboard support; props-to-ARIA mapping; kbd-notation tables). For a headless library this is the core value proposition — Base UI stories should document the keyboard contract per part.
- **A patterns layer for compositions**, template-driven (annotated screenshot + "Use when users need to:" definition table + one canonical copy-pasteable composition + Useful-to-know tips). Base UI equivalents: "filterable select", "confirm dialog", "date range picking" built from primitives — exactly what users currently reverse-engineer from demos.
- **Keywords/synonyms in page metadata** ("drop-down menu", "combo box", "infotip") to make search forgiving; cheap in story tags or docs frontmatter.
- **The interaction-contract bullet** (Modal's "closes when: X button, Cancel, Esc, outside click") — a compact behavioral spec per component; in Storybook these double as play-test specifications.

## Skip or heavily adapt

- **Merchant-specific outcome framing and product citations.** Polaris writes every rule against one product and one persona ("merchants", "Found in: Product / transfers"). A headless library serves arbitrary products — reframe outcome language around end users and app-domain examples, and drop shipped-in-product citations (nothing equivalent exists).
- **The editorial rules themselves.** Sentence-case mandates, {verb}+{noun} templates, first-person terms checkboxes are Shopify's house style. Steal the *shape* (per-slot rules + paired examples); write Base UI's own rules — and per the assignment, never copy their guidance text.
- **Whole-library succession banners (WebComponentBanner) on every page.** That's an artifact of Polaris sunsetting its React library; adding equivalent noise to healthy components would be pure distraction. Keep the mechanism (typed banner driven by frontmatter) only for real statuses.
- **Delegating a component's content guidelines to a separate page.** Text field's CG section is a single outbound link — and its target has since been demoted to "archived" legacy docs. Delegation created a dead-endable dependency; in Storybook keep at least a summary inline and link for depth.
- **Hand-authored props sections — and conversely their auto-props-only API docs.** Their `<Props>` is generated from TypeScript; replicate via autodocs/argTypes rather than writing tables. But note Polaris has no prose API discussion (controlled vs uncontrolled, composition contracts) — Base UI needs that and shouldn't copy the gap.
- **Screenshot-based Do/Don't evidence.** Polaris can screenshot its one canonical skin; a headless library has none. Replace image DoDonts with live rendered demos or code-pair DoDonts.
- **Playroom/CodeSandbox integration plumbing** (previewContext/sandboxContext triple-code-block encoding). Storybook *is* the live playground; this machinery is redundant.
- **Their inconsistencies:** section order drift (Accessibility placement varies), Related components before Accessibility (burying a11y), duplicated `<Examples />` (Tooltip), copy-pasted boilerplate referencing the wrong component (checkbox text on the text-field page), and one-off H2s outside the template. Adopt the template, add a lint.
- **Deprecated as a nav category may over-promote dead components** in a smaller library — for Base UI a status badge plus a single migration index page likely suffices until the deprecated set is large.

## URLs consulted

Live site (all fetched successfully; `polaris.shopify.com/*` 301s to `polaris-react.shopify.com/*`):

- https://polaris-react.shopify.com/content
- https://polaris-react.shopify.com/components
- https://polaris-react.shopify.com/components/selection-and-input/select

GitHub source (repo `Shopify/polaris`, branch `main`, prefix `polaris.shopify.com/`; read via `gh api` + raw.githubusercontent.com):

- `content/` directory trees: `content/components/**` (all 110 mdx files downloaded and grepped), `content/content/`, `content/foundations/`, `content/design/`, `content/tokens/`, `content/patterns/`, `content/patterns-legacy/`, `content/getting-started/`
- Component pages: `content/components/selection-and-input/select.mdx`, `text-field.mdx`, `checkbox.mdx`, `content/components/overlays/tooltip.mdx`, `content/components/deprecated/modal.mdx`, `toast.mdx`, `frame.mdx`, `legacy-card.mdx`, `sheet.mdx`; category indexes `components/index.mdx`, `selection-and-input/index.mdx`, `deprecated/index.mdx`, `internal-only/index.mdx`
- Content section: `content/content/index.mdx`, `fundamentals.mdx`, `grammar-and-mechanics.mdx`, `naming.mdx`, `error-messages.mdx`
- Patterns: `content/patterns/index.mdx`, `content/patterns/variant.md.template`, `content/patterns/date-picking/index.mdx`, `date-picking/variants/single-date.mdx`, `resource-index-layout/index.mdx`, `resource-index-layout/variants/default.mdx`, `content/patterns-legacy/text-fields.mdx`
- Getting started: `content/getting-started/components-lifecycle.mdx`
- Site machinery: `next.config.js` (legacy Content-page redirects), `src/types.ts` (StatusName union), `src/components/StatusBanner/StatusBanner.tsx`, `src/components/WebComponentBanner/WebComponentBanner.tsx`, `pages/examples/` listing (461 example .tsx files)

No pages were unreachable; the only fetch surprise was the site-wide 301 to the `polaris-react` host, noted above.
