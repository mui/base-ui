# Documentation Definition of Done — Base UI component pages

The master checklist for what a gold-standard Base UI component documentation page (Storybook MDX) may contain. Distilled from GOV.UK (primary), Adobe Spectrum/React Spectrum/React Aria, Microsoft Fluent 2 + Fluent UI Storybook, eBay Playbook/MIND/Skin, Google Material 3, and Shopify Polaris — see [reference-notes/](./reference-notes/). Per Decision 6 of the brief this is **over-generated**: prefer marking a section `optional` over omitting it. Sections marked `required` form the floor for every component page; `recommended` applies where the component kind matches; `optional` is aspirational or situational.

Statuses: **R** = required · **REC** = recommended (where applicable) · **O** = optional.

Conventions that apply to every section below:

- Never copy reference-system guidance text — their content is design-language-specific. Structure only. All Base UI guidance derives from Base UI evidence ([E]/[I]/[G] tags per brief §4.1).
- Every normative rule states its user-need rationale inline (GOV.UK's signature move: instruction + why).
- Sections that research could not fill keep a visible `[G]` marker with where we looked (GOV.UK-style honesty beats silent omission).

## The checklist

### 1. Identity strip — **R**

- **Purpose**: orient in 5 seconds: component name, one-sentence purpose, import specifier, part count, status tag, ARIA-pattern link.
- **Demonstrated by**: GOV.UK (H1 + description frontmatter), Polaris (lede + status banner), Fluent (Resources block with Storybook/APG links), Material (Overview hero + availability table).
- **Phase C evidence**: brief §1 Identity (name, subpath, parts, status incl. `Preview`-suffix semantics, taxonomy category).
- **Headless adaptation**: replace "availability in Figma/platforms" with import specifier + part inventory + `@base-ui/react` version the docs were verified against.

### 2. Hero example — **R**

- **Purpose**: a live, *styled*, interactive instance above the fold, with copyable code. Unstyled headless components render invisible — a styled hero is the proof of life.
- **Demonstrated by**: every reference system; GOV.UK adds "open in new tab" + dual code tabs; Fluent Storybook lands directly in Docs view.
- **Phase C evidence**: current docs hero demo (keep per Decision 8); story-plan hero story.
- **Headless adaptation**: hero styling mirrors base-ui.com demo CSS (CSS Modules, oklch values) so the Storybook stays visually consistent with the official site; code shown must be the real story source.

### 3. Features / "what you get" bullets — **REC**

- **Purpose**: 4–8 bullets answering "why not build this myself?" — the behaviors the component implements for free (keyboard nav, typeahead, focus management, form integration…). One capability per bullet.
- **Demonstrated by**: React Aria "Features" (the strongest model), Material Overview takeaway bullets.
- **Phase C evidence**: brief §2 Intention + §6 Behavior; part JSDoc.
- **Headless adaptation**: emphasize invisible machinery (focus guards, scroll lock, anchoring) — precisely the things users can't see and later trip over.

### 4. When to use — **R**

- **Purpose**: evidenced scenarios where this component is the right choice.
- **Demonstrated by**: GOV.UK (invariant section #2), Polaris best-practices framing ("should be used when…").
- **Phase C evidence**: brief §3 (docs statements, issue/support evidence, Phase D real-world archetypes).
- **Headless adaptation**: scenarios are interaction/IA-level (not visual-style-level): "a mutually exclusive choice among 5+ options", "content that must interrupt".

### 5. When not to use + alternatives — **R**

- **Purpose**: the decision boundary; always **names and links** the alternative (GOV.UK's rule). This is the single biggest gap in current Base UI docs (brief §3.4).
- **Demonstrated by**: GOV.UK (select→radios is the canonical example), Polaris Related components.
- **Phase C evidence**: brief §4 + the shared cluster notes (research/c-components/_clusters/*).
- **Headless adaptation**: boundaries argued from interaction semantics and ARIA patterns (menu ≠ select ≠ combobox), citing maintainer statements ([E]) or API affordances ([I]).

### 6. Anatomy — **R** (code) / **REC** (visual diagram)

- **Purpose**: the part tree: what each part renders, which parts are optional, how they nest. For compound components this *is* the API map.
- **Demonstrated by**: React Aria (labeled wireframe + props-free JSX skeleton — the diagram labels exported API parts, not visual pieces), Spectrum (numbered callouts), Playbook (numbered parts list), Material (anatomy legends).
- **Phase C evidence**: brief §5 (part tree, optional parts, composition rules, text spec for a future diagram with numbered callouts).
- **Headless adaptation**: annotate the Portal/Positioner/Popup layering grammar and which parts are mandatory (Portal throws if missing — mui/base-ui#1222); include the "renders a `<div>`" line per part from JSDoc.

### 7. How it works / behaviors — **R**

- **Purpose**: the interaction model in prose+examples: one subsection per behavior/variant, each with its own live example (GOV.UK's "How it works" shape). Covers: controlled/uncontrolled, open/close semantics, dismissal (outside press, Escape), focus behavior, pointer vs keyboard differences.
- **Demonstrated by**: GOV.UK (variant subsections w/ examples), Spectrum (Value/Selection controlled+uncontrolled pair), Fluent (story-per-feature as the docs spine).
- **Phase C evidence**: brief §6; tests (behaviors pinned down); story plan (one story per use case = one subsection per behavior).
- **Headless adaptation**: include the eventDetails contract (`reason`, `event`, `.cancel()`) — Base UI's own grammar (mui/base-ui#2382) that no reference system has an analog for.

### 8. Feature examples (one per use case) — **R**

- **Purpose**: the Adobe-style feature-driven examples Base UI docs already do well (Decision 8: keep) — now each backed by a named story so tests can attach (the Fluent move: the story list IS the feature index).
- **Demonstrated by**: Base UI current docs, React Spectrum example escalation (minimal → controlled → async → complex), Fluent story-per-feature files, Polaris per-example "use when" frontmatter.
- **Phase C evidence**: story-plan.md (kept demos + one story per use case, each mapped to a DoD section).
- **Headless adaptation**: attach a one-line "Use when…" description to every story (Polaris move) via story `parameters.docs.description.story`.

### 9. Keyboard & screen-reader contract — **R**

- **Purpose**: the framework-agnostic accessibility contract: (a) keyboard table (Key → Action, per part/phase where needed); (b) ARIA roles/states/properties the component manages; (c) screen-reader expectations phrased as announcement outcomes; (d) link to the matching W3C ARIA APG pattern; (e) which side of the contract the CONSUMER owns (focus-visible styles, contrast, accessible names).
- **Demonstrated by**: MIND Patterns (the strongest model: terminology-first, RFC-2119 musts, `UPPER-CASE` keys), Fluent AccessibilitySpec (per-phase keyboard tables, named AT edge cases), Material a11y tab ("Keys | Actions"), GOV.UK inline WCAG citations.
- **Phase C evidence**: brief §7 (keyboard table from source/tests/docs, ARIA management, APG link, open a11y issues).
- **Headless adaptation**: split "library guarantees" vs "you must provide" (Base UI's own accessibility page draws this line — docs/…/overview/accessibility); cite WCAG criteria inline as number+name+link where a rule exists because of one.

### 10. Styling contract (data-attributes + CSS variables) — **R**

- **Purpose**: per part: the state table (state → `[data-*]` selector) and CSS variables with meaning. For an unstyled library this **is** the styling API.
- **Demonstrated by**: React Aria per-part styling-states tables; Material's state × element × attribute matrix (translated: part × data-attribute × CSS variable).
- **Phase C evidence**: brief §8 (the *DataAttributes.ts / *CssVars.ts enums — authoritative, JSDoc'd).
- **Headless adaptation**: this replaces every reference system's visual-spec section; note attributes are duplicated on every part ("never rely on DOM structure" — mui/base-ui#717/#3036 arc).

### 11. Animation guidance — **REC** (popups/collapsibles) / **O** (static components)

- **Purpose**: how to animate open/close: `data-starting-style`/`data-ending-style` for CSS transitions, `data-open`/`data-closed` for keyframes, JS-library integration (`keepMounted` + `actionsRef.unmount`), and the "transitions are cancellable, prefer them" stance.
- **Demonstrated by**: no reference system has an analog (their components ship styled) — this is Base UI-specific, sourced from the handbook Animation page.
- **Phase C evidence**: brief §6 animation hooks; handbook extracts; support-issue evidence (exit animations are a top confusion theme).
- **Headless adaptation**: pure Base UI content; include one working transition example per popup component.

### 12. Per-prop usage guidance — **R** (decision-relevant props only)

- **Purpose**: for each prop that embodies a *decision*: what it does, when to use it, and **why** ("use `modal={false}` when …, because …"). Not a repeat of the API table — the judgment layer above it.
- **Demonstrated by**: no reference system does this systematically (Polaris per-example "use when" is closest); it is this project's signature addition, powered by decision-log evidence.
- **Phase C evidence**: brief §8 (prop-guidance seeds from rich JSDoc) + §9 decision log (the PR that introduced the prop states the why).
- **Headless adaptation**: n/a — born headless.

### 13. Forms & validation integration — **R** for form controls / **O** otherwise

- **Purpose**: how the component participates in `<form>`: name/value serialization (hidden input mechanics), Field/Fieldset/Form wrapping, validation modes, server errors, focus-on-error.
- **Demonstrated by**: GOV.UK (validation pattern + error-message sections), Spectrum Validation sections, Polaris content guidelines on form components.
- **Phase C evidence**: brief §6/§8 (form-related props; handbook Forms page; native-form alignment arc rc.0 mui/base-ui#3406).
- **Headless adaptation**: document the hidden-input mechanism explicitly (support issues show it surprises users: positioning wrapper requirement, `uncheckedValue`).

### 14. Error/failure-state enumeration — **REC** (form controls)

- **Purpose**: enumerate the component's failure/edge states exhaustively, one heading per state ("If the value is empty", "If the value is out of range…"), each with behavior + a story. GOV.UK's fill-in-the-blank message *templates* don't transfer (we own no product copy), but the exhaustive state enumeration does — and maps 1:1 to "one story per state".
- **Demonstrated by**: GOV.UK error messages (text-input: 13 states); Material state matrices.
- **Phase C evidence**: brief §6 (validity states from Field), tests (invalid/valid transitions), *DataAttributes (`data-invalid`, `data-touched`, `data-dirty`, `data-filled`…).
- **Headless adaptation**: states are data-attribute-driven; the enumeration doubles as the styling-states test plan.

### 15. Content/microcopy guidance — **O**

- **Purpose**: guidance for the component's text slots (label, description, error, empty state), one subsection per slot.
- **Demonstrated by**: Polaris content guidelines (one `###` per text slot + do/don't text pairs), GOV.UK per-component content rules.
- **Phase C evidence**: mostly [G] — Base UI ships no copy and maintainers publish no content rules; fill only where evidence exists (e.g. accessible-name requirements are content guidance with a11y teeth).
- **Headless adaptation**: keep the *slot enumeration* (which parts accept text and what ARIA wiring they get: Title→aria-labelledby, Description→aria-describedby); leave voice/tone to consumers. Mark [G] otherwise.

### 16. Do / Don't — **REC**

- **Purpose**: short normative best-practice pairs, code-actionable, each with a why.
- **Demonstrated by**: Fluent (`## Best practices → ### Do / ### Don't` bullet micro-schema — the transferable one), Material (captioned image pairs — needs a canonical skin we don't have), Polaris DoDont blocks.
- **Phase C evidence**: brief §10 Pitfalls (each support-issue misuse pattern becomes a Don't with citation).
- **Headless adaptation**: text/code bullets, not screenshots; every Don't cites the issue where a real user hit it.

### 17. Real-world examples — **REC** (Tier 1–2) / **O** (Tier 3)

- **Purpose**: 3–5 ranked, linked, attributed real usages (live site + source permalink + what to learn from it), optionally screenshotted; each with why-it's-here rationale.
- **Demonstrated by**: no reference system does this (our addition; GOV.UK's "research on this component" is the spiritual ancestor — evidence from the field).
- **Phase C/D evidence**: Phase D ranked.json + examples.md (mandatory rankRationale; licenses recorded; reuse flags respected — link-only repos are linked, never copied).
- **Headless adaptation**: real usage shows real styling+composition — the strongest possible answer to "what can I build with this".

### 18. Decision log — **REC**

- **Purpose**: dated, cited list of major decisions & revisions: introduced in #X; API changed in #Y because Z; prop added in #W to solve V. Answers "why is this API shaped this way" and pre-empts "why not do it like Radix".
- **Demonstrated by**: Spectrum design-page Changelog (shallow); ours is deeper — powered by PR/issue archaeology (Decision 11 of the brief: first-class).
- **Phase C evidence**: brief §9 (introducing PR, rework PRs, rejected alternatives with reasons).
- **Headless adaptation**: include library-wide arcs where they shaped the component (eventDetails #2382, Portal #1222, boolean data-attrs #717).

### 19. Research & known issues — **REC**

- **Purpose**: honest disclosure: open a11y bugs (with numbers), browser/AT quirks, unresolved design debates, what feedback is wanted. GOV.UK's most trust-building move (radios openly admits a WCAG 4.1.2 failure).
- **Demonstrated by**: GOV.UK "Research on this component" + known issues; MIND "Known Issues".
- **Phase C evidence**: brief §7 known issues + §10; open upstream issues.
- **Headless adaptation**: link the upstream issue instead of a research backlog we don't own.

### 20. Status & maturity — **R** (one line) 

- **Purpose**: stable vs preview signaling + since-version. Base UI's own semantics: `Preview`-suffixed exports (DrawerPreview→Drawer, OTPFieldPreview), `unstable-` subpaths, post-1.0 additive policy.
- **Demonstrated by**: Polaris three-layer status (frontmatter → banner → re-homing + lifecycle page), Fluent Preview/Compat taxonomy, Material availability chips.
- **Phase C evidence**: brief §1 (status), history mining (birth version).
- **Headless adaptation**: also state the docs-verified library version on the page.

### 21. Related components & patterns — **REC**

- **Purpose**: task-framed links ("To ask for a single choice from few options, use Radio") + links to cross-component pattern docs.
- **Demonstrated by**: Polaris Related components (task-framed), GOV.UK pattern links.
- **Phase C evidence**: brief §4 + taxonomy.md clusters.

### 22. API reference (per-part tables) — **R**

- **Purpose**: exhaustive per-part props/data-attributes/CSS-variables tables. Base UI already does this well from JSDoc (Decision 8: keep) — in Storybook, argTables + `meta.subcomponents` (Fluent's move for compound components) or per-part `ArgTypes` blocks.
- **Demonstrated by**: Base UI docs, React Aria per-part props tables, Fluent subcomponents.
- **Phase C evidence**: source JSDoc (already excellent).
- **Headless adaptation**: keep tables auto-generated; the judgment layer lives in §12 per-prop guidance instead.

### 23. Testing guidance — **O**

- **Purpose**: how consumers test compositions of this component (interaction snippets, roles to query, animation pitfalls in jsdom).
- **Demonstrated by**: React Spectrum "Testing" sections (page-object test utils).
- **Phase C evidence**: the component's own test files (patterns to imitate); play functions in stories double as living examples.

### 24. Feedback loop — **REC**

- **Purpose**: per-page "found a problem?" affordance wired to a stable destination.
- **Demonstrated by**: GOV.UK injected footer driven by one frontmatter integer per page (backlogIssueId) — the cheapest high-trust move in the whole study.
- **Headless adaptation**: link to upstream issue search pre-filtered to the component (no backlog issues exist per component; do not fabricate them) + edit-this-page link into this repo.

### 25. SSR / hydration notes — **O**

- **Purpose**: what to know when server-rendering (id generation, pre-hydration behavior scripts, hidden-input `suppressHydrationWarning`).
- **Demonstrated by**: Fluent SSR md-fragments.
- **Phase C evidence**: mostly [G] — B-mining found no consolidated SSR doc; fill from scattered evidence where it exists, else mark the gap.

### 26. Internationalization / RTL — **O**

- **Purpose**: direction-sensitive behavior (arrow keys in RTL, DirectionProvider interplay — it changes behavior only, not `dir`).
- **Demonstrated by**: Spectrum Internationalization sections.
- **Phase C evidence**: DirectionProvider docs + composite keyboard code; per-component only where behavior differs.

### 27. Performance notes — **O**

- **Purpose**: virtualization guidance, re-render characteristics, large-collection advice — only where upstream evidence exists (e.g. combobox/select `items` handling).
- **Demonstrated by**: none of the references (occasionally Spectrum async sections).
- **Phase C evidence**: perf-labeled issues/PRs per component; else omit (don't speculate).

### 28. Migration & interop notes — **O**

- **Purpose**: mapping from Radix/@mui/base equivalents where confusion is documented (LLMs hallucinate Radix APIs on Base UI — mui/base-ui#2262; Radix-compat props rejected #601), plus third-party interop pitfalls (body scroll-lock conflicts etc.).
- **Demonstrated by**: Fluent v8→v9 migration pages, Polaris web-components succession banners.
- **Phase C evidence**: brief §10 interop pitfalls with issue citations.

## Page-level ordering (the template's spine)

Identity strip → Hero → Features → When to use / When not to use → Anatomy → How it works (behaviors, forms, animation) → Feature examples (stories) → Keyboard & SR contract → Styling contract → Per-prop guidance → Do/Don't → Real-world examples → Decision log → Research & known issues → Related → API reference → Testing → Feedback. (Rationale: decision sections before mechanics — GOV.UK; contract sections adjacent to examples that prove them — Fluent; API reference last — every system.)

## Site-level requirements (beyond single pages)

- **R** Purpose-based categorization of the sidebar (taxonomy.md) — every reference system groups by function; Base UI's A–Z flat list is the outlier.
- **REC** 3–6 cross-component pattern docs (taxonomy.md proposals) — GOV.UK Patterns / Polaris Patterns model.
- **REC** A library-principles page (Phase B principles.md distilled) — the "how Base UI thinks" chapter every component page inherits, so component pages don't re-explain render props/portals each time.
- **O** llms.txt-style export of docs pages (Fluent publishes every Docs page as markdown; upstream already ships docs `.md` twins — mui/base-ui#1738).
