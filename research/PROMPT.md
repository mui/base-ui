# Research & Build Brief: A Gold-Standard Storybook for Base UI

You are an autonomous research-and-build agent. This document is your complete brief for an hours-long, unattended session. Read it fully before doing anything. Every decision that could be made in advance has been made and is recorded here — do not relitigate them. Where judgment is still required, the rubrics below tell you how to exercise it. Your outputs are research artifacts and a working Storybook, both committed to this repository.

## 1. Mission

Produce the complete research foundation for — and then build — the best-documented, gold-standard Storybook for Base UI, a headless, unstyled React component library.

Concretely, you will produce five deliverables (detailed in §6–§10, file layout in §11):

- **Deliverable A** — A documentation Definition of Done: a template and checklist for what a world-class component documentation page must contain, distilled from the world's best design-system documentation (GOV.UK Design System first among them).
- **Deliverable B** — A library-wide principles document: the underlying philosophy, conventions, and "correct ways to use Base UI," extracted from Base UI's own documentation, issue tracker, PR history, discussions, and git history — with citations.
- **Deliverable C** — A per-component research brief for every documented Base UI component: intention, when to use / when not to use, alternatives, anatomy, behavior, accessibility contract, prop-level guidance, and a cited decision log.
- **Deliverable D** — A real-world usage corpus: for each component, ranked, annotated real-world examples found on GitHub (up to 100 candidates per component, top picks screenshotted where cheaply possible), each with a link to source and an explanation of why it was ranked as it was.
- **Deliverable E** — A working Storybook project in this repository: scaffolded through Storybook's own agent workflow (storybook ai setup), then populated with CSF story files and MDX docs pages for every identified component — one story per use case (from C's story plans), docs pages implementing the Definition of Done (from A), and real-world examples woven in (from D).

The guiding idea (verbatim intent from the project owner):

> "Analyze the whole project and extract guidelines that capture the principles and good ways of interacting with the component library. Then contextualize this general information for every component, based on the documentation, usage patterns seen, the API, and general data. … We want the Storybook MDX documentation to capture the intention for each component."

## 2. Decisions already made — do not reopen these

1. **Scope**: We are building documentation for Base UI as-is — a generic headless component library. We are not building a design system on top of it. The end goal is the gold-standard Storybook for Base UI itself.
2. **This session is research and implementation.** Phases A–D produce the research foundation; Phase E (§10) then scaffolds a Storybook project in this repository and authors CSF story files + MDX docs pages for all identified components. The Storybook and its stories are strictly additive: never edit existing library/docs source files (packages/, docs/src/app/(docs)/) — new files and the minimal config wiring listed in §10.4 only. Research output goes under research/ (see §11).
3. **GOV.UK Design System is the primary quality reference** for documentation anatomy — "basically the gold standard for design-system documentation."
4. **Additional references**: Adobe React Spectrum (+ spectrum.adobe.com), Microsoft Fluent UI / Fluent 2, Shopify Polaris, Google Material, eBay's design system (Evo / Playbook / MIND Patterns / Skin).
5. **The reference systems are mined for documentation anatomy only** — the section types, concerns, and structures a great doc page covers, and the evidence and design process that goes behind creating and explaining a DS component to its audience. Never copy their content or guidance text into Base UI documentation. Their guidance is specific to their design languages; ours must be derived from Base UI evidence.
6. **Over-generate the documentation template**: "better to generate more than less, because then we can remove." When unsure whether a section belongs in the Definition of Done, include it and mark it optional.
7. **Primary evidence for all Base UI guidance is Base UI itself**: its documentation website, issue and PR list (bodies, comments from maintainers, PR review contents), GitHub Discussions (support Q&A reveals documentation gaps), commit messages, and git history (reveal decisions).
8. **Keep what Base UI's docs already do well**: high-level, feature-driven examples (Adobe-style — ideal for a broad audience that doesn't know the product) and rich API reference tables driven by good JSDoc. The Storybook covers the same but adds what's missing; it doesn't discard these strengths. Additionally we want stories for each individual use case so tests can be built on them.
9. **Real-world examples (Deliverable D)** follow the exact workflow in §9 — candidate collection up to 100 per component, ranking for illustrative value and collective diversity, screenshots as a strictly best-effort, max-3-attempts affair, and a written rationale for every ranking.
10. **Prefer examples from live, linkable websites** where possible — credibility bonus.
11. **Decision logs are first-class**: documentation should be able to say why a prop exists and when to use it ("use the X prop when …, because …"), and highlight major revisions of a component. Your per-component research must gather the evidence that makes this possible.
12. **Storybook setup follows Storybook's own agent workflow.** Phase E retrieves the setup prompt via storybook ai setup --output generated fresh in this repository (its content depends on Storybook's runtime analysis of the project — never reuse a copy generated elsewhere) and executes it, with exactly two scope overrides: cover all identified components instead of the ~10 it asks for, and skip or abbreviate its discovery/research step wherever Phases B–C already supply that understanding (dependencies, providers, portals, what to mock). Mechanics (decorators, shared preview, mocking, verification loop): the generated prompt wins. Scope and content: this brief wins.

## 3. Verified context (established 2026-07-06 — trust this, verify only if something fails)

### 3.1 The repository you are in

Working directory: a clone of storybook-tmp/base-ui (fork). Upstream project: mui/base-ui (MUI organization) — https://github.com/mui/base-ui. Issues, PRs, and Discussions live on the upstream repo, not the fork:

- Issues: https://github.com/mui/base-ui/issues
- PRs: https://github.com/mui/base-ui/pulls
- Discussions: https://github.com/mui/base-ui/discussions
- Docs site: https://base-ui.com (source in this repo under docs/).

Work on branch research (to create from master). Default branch: master. Push with git push -u origin research. Never push to any other branch or repository. Never open PRs. Never write to mui/base-ui.

⚠️ The clone is shallow (50 commits, back to 2026-06-19 only). Before any git history mining, unshallow it:

```
git remote add upstream https://github.com/mui/base-ui.git
git fetch --unshallow upstream master   # fall back to: git fetch upstream --depth=100000
```

If unshallowing fails (network policy), do history mining through the GitHub API / web instead, and record the limitation in research/PROGRESS.md.

node_modules is not installed. If you need to run anything: pnpm i first. Toolchain: pnpm 11.5.2 exactly (enforced), node ≥ 22.18.0. Docs dev server: pnpm docs:dev, port 3005. Repo commands you may find useful: pnpm docs:build, pnpm test:jsdom {name} --no-watch, pnpm test:chromium {name} --no-watch.

### 3.2 Base UI's public surface (the definitive component list)

37 documented components (docs nav is one flat alphabetical list — no categories):

accordion, alert-dialog, autocomplete, avatar, button, checkbox, checkbox-group, collapsible, combobox, context-menu, dialog, drawer, field, fieldset, form, input, menu, menubar, meter, navigation-menu, number-field, otp-field, popover, preview-card, progress, radio, radio-group*, scroll-area, select, separator, slider, switch, tabs, toast, toggle, toggle-group, toolbar, tooltip

*radio-group is publicly exported but has no standalone docs page — it is documented inside the Radio page and absent from the nav. Treat radio + radio-group as one research unit; note the packaging asymmetry in the brief.

- otp-field is the only component tagged [New] in the nav.
- drawer is shipped and documented (15 parts).

4 documented utilities (docs "Utils" section): CSP Provider, Direction Provider, mergeProps, useRender. These get lightweight briefs (Tier 3, §12).

unstable-use-media-query exists as a subpath export with no docs page — mention it in Deliverable B (what "unstable" means in this library) but write no brief.

Not components (do not brief): packages/react/src/{utils, internals, floating-ui-react (vendored), types, merge-props, use-render, csp-provider, direction-provider} — the last four are the documented utils above.

Component architecture: most components are multi-part compound components exported as namespaces (e.g. Select.Root, Select.Trigger, … — Select has 19 parts, Combobox ~26, Autocomplete ~20, Menu ~20). Others are single-part (Button, Input, Form, Menubar, Toggle, ToggleGroup, CheckboxGroup, Separator). Some export non-element APIs too: Toast.useToastManager/createToastManager, Dialog.createHandle/Handle, Combobox.useFilter/useFilteredItems.

npm package names: @base-ui/react and @base-ui/utils (current). Earlier pre-1.0 releases were published under a different name (believed to be @base-ui-components/react) — verify the historical names on the npm registry before running usage searches, and search all specifiers that ever existed. The predecessor library @mui/base (MUI Base) has a different API and is out of scope.

### 3.3 What a Base UI docs page contains today (verified against source)

Page: docs/src/app/(docs)/react/components/<slug>/page.mdx. Ordered structure:

1. `# H1` → 2. `<Subtitle>` one-liner → 3. `<Meta>` SEO description → 4. hero demo (interactive, CSS Modules + Tailwind variants) → 5. optional `## Usage guidelines` bullet list (select has one; most don't) → 6. `## Anatomy` (import + full JSX part tree, code only — no visual diagram) → 7. optional concept sections (e.g. select `## Positioning`) → 8. `## Examples` with feature-driven `###` subsections (prose + code live demos) → 9. `## API reference` — one `###` per part, auto-generated tables (Props / Data Attributes / CSS Variables per part) from TypeScript + JSDoc via createMultipleTypes / committed types.md snapshots → 10. SEO keywords export.

JSDoc conventions in source (relevant to Deliverable C): every part has a 1–2 sentence description + "Renders a `<div>` element." line; every prop has a described interface entry with @default tags; data attributes and CSS variables are per-part enums with JSDoc (`<Part>DataAttributes.ts`, `<Part>CssVars.ts`) — these files are dense, authoritative statements of each component's styling/state contract. Tests sit next to source (*.test.tsx, ~286 files); docs/src/app/(private)/experiments/ holds ~60 manual-testing pages that reveal edge cases maintainers cared about.

### 3.4 The verified gap list (current Base UI docs vs GOV.UK standard)

Confirmed absent from Base UI docs today — this is the gap your research must fill the evidence for:

- No "When to use" / "When not to use" sections anywhere.
- No alternatives/decision guidance between overlapping components — e.g. nothing helps a user choose between popover / tooltip / preview-card / dialog (the popover page's hidden SEO keywords even include "Tooltip Alternative", but no prose addresses the choice).
- No functional categorization: the component list is flat A–Z ("a component is a purpose and an information architecture" — categorize by purpose/IA).
- No per-component accessibility section or keyboard-interaction table (accessibility is one global overview page). No links to W3C ARIA APG patterns from component pages.
- No content/microcopy guidance (e.g. no error-message wording guidance for field/form).
- No do/don't guidance or imagery; no research/evidence citations; no per-page feedback loop; no component status/maturity tags; no real-world context examples; no visual anatomy diagram; no decision log / "why does this prop exist" narrative.

### 3.5 Storybook status

There is no Storybook anywhere in this monorepo (verified: no .storybook dirs, no storybook deps or scripts). The closest analogs are playground/vite-app and the docs experiments. Phase E therefore creates the Storybook greenfield — there is nothing to migrate and nothing to conflict with. Two workspace policies matter when installing it (from pnpm-workspace.yaml): minimumReleaseAge (~3 days) can refuse a freshly-published Storybook version — pin the newest release older than the window if install fails on that policy — and new dependencies with postinstall build scripts may need allowBuilds entries.

## 4. Operating rules (apply to the whole session)

1. **Citation discipline.** Every claim about maintainer intention, design decisions, or correct usage must carry a citation: mui/base-ui#1234 (issue/PR/discussion number), a commit SHA, a docs URL, or a file path in this repo. Tag each claim:
   - **[E]** — direct evidence (quote or paraphrase + citation),
   - **[I]** — your inference (state what it's inferred from),
   - **[G]** — acknowledged gap (looked, found nothing; say where you looked). Never present [I] as [E]. Fabricating a citation is the worst possible failure of this session.
2. **Reference systems: anatomy only** (Decision 5). Notes about their structure go in research/a-documentation-standard/reference-notes/; their guidance text never flows into Base UI-facing artifacts.
3. **Read-only outside this repo.** GitHub reads via whatever tools your environment provides (gh, GitHub MCP tools, or the public REST/search APIs). Never comment, react, open issues/PRs, or otherwise write anywhere except commits pushed to the research branch on storybook-tmp/base-ui.
4. **Licensing hygiene (Deliverable D).** Record the license of every repository you cite as an example. Mark non-permissive or unlicensed repos reuse: link-only — they may be linked and described, but their code must not be copied into future stories. Screenshots of publicly accessible pages are acceptable with attribution recorded.
5. **Commit and push relentlessly.** Commit after every completed artifact (at minimum: after Phase A, after Phase B, after each component brief, after each component's usage dataset, after the Storybook scaffold, and after each component's stories/MDX) with [research]-scoped messages ([storybook] scope for Phase E commits). Push at least hourly. The session may be interrupted at any time; pushed work is the only work that exists.
6. **Maintain research/PROGRESS.md as a living ledger**: a table of every component × phase with status (todo / in-progress / done / blocked+reason), plus a log of decisions you made and obstacles hit. Update it before every push. A future session must be able to resume from it with zero conversation context.
7. **Budget your attention.** Tiering in §12 tells you where depth pays. When you notice the session budget running down, close out per §13 rather than leaving work uncommitted or the ledger stale.
8. **Rate limits.** GitHub code search is rate-limited: batch queries, cache results to disk under research/d-real-world-usage/_cache/ (JSON responses), back off on 403s. Fallback search surfaces: grep.app, Sourcegraph public index, npm dependents (npm view, npmjs "dependents" page, libraries.io).
9. **No destructive git operations.** No force-push, no rebase of pushed history, no touching branches other than yours.

## 5. Phase order and how phases feed each other

```
Phase A (reference anatomy)  ──►  Definition of Done + MDX template ─┐
Phase B (library principles) ──►  principles.md ─────────────────────┼─►  Phase C briefs
                                                                     │    + story plans ──┐
Phase D (usage mining) ── can run interleaved with C ────────────────┘                    │
     └─► ranked real-world examples cited in C briefs and recreated as stories ──────────►┤
                                                                                          ▼
                                                       Phase E: Storybook (CSF stories + MDX
                                                       docs pages for ALL components)
```

Do A first (it defines the fields C must fill). Then B (it provides the library-wide context every C brief inherits). Then interleave C and D per component, Tier 1 first (§12): for each component, mine usage (D) either before or alongside the brief (C) so the brief's "real-world patterns observed" section has data.

Phase E is pipelined, not deferred to the end: scaffold the Storybook project early (§10.1 — right after repo setup is viable; infrastructure problems must surface while there is still budget to fix them), then author each component's stories and MDX as soon as that component's C brief + story plan (and D data, where in scope) are done, in tier order. A component flows research → stories while its context is fresh.

## 6. Phase A — Documentation anatomy study → the Definition of Done

Goal: decide, once, what a gold-standard Base UI component doc page must contain.

### 6.1 Sources (all verified reachable/available as of 2026-07-06)

| System | Where | What to extract |
|---|---|---|
| GOV.UK Design System | https://design-system.service.gov.uk — components, patterns, styles; page sources also at github.com/alphagov/govuk-design-system (src/components/*/index.md) if the site is unreachable | The invariant page skeleton; the evidence culture; the per-component content guidance model |
| Adobe React Spectrum + Spectrum | https://react-spectrum.adobe.com, https://spectrum.adobe.com/page/<component>/; source github.com/adobe/react-spectrum | Two-layer design/implementation docs; "Features" bullet section; anatomy diagrams; Options/Behaviors/Usage/Content-standards/Keyboard-interactions section set |
| Microsoft Fluent 2 + Fluent UI React v9 | https://fluent2.microsoft.design (per-component /components/web/react/core/<component>/usage pages), https://storybooks.fluentui.dev/react/ | Design/code split; Do/Don't best-practice lists embedded in Storybook Docs tabs; unusually concrete per-component a11y specifics |
| eBay (Evo) | Playbook: https://playbook.ebay.com/design-system; Skin: https://opensource.ebay.com/evo-web/skin (code github.com/eBay/evo-web); MIND Patterns: https://ebay.gitbook.io/mindpatterns | Design / Development / Accessibility / Content as four co-equal tabs per component; MIND's framework-agnostic a11y contracts (keyboard, ARIA roles/states, screen-reader expectations) |
| Google Material Design 3 | https://m3.material.io — per-component tabs at /components/<component>/{overview,guidelines,specs} (an Accessibility tab appears on many, though not uniformly); top-level Foundations / Styles / Components. No open markdown source for the guidance: the site is a JS-rendered SPA, so there is no index.md to fall back to. GitHub carries implementation only — github.com/material-components/material-web (web, maintenance mode), github.com/flutter/flutter, github.com/material-components/material-components-android. Guidance text is CC BY 4.0 / Apache 2.0 | Overview / Guidelines / Specs tab skeleton per component; token-level Specs tab enumerating every element, attribute, and design-token value; one guidance layer feeding Compose / Flutter / Web implementations; inline interactive component demos; do/don't as annotated image pairs |
| Shopify Polaris | https://polaris.shopify.com — components at /components/<category>/<component>; top-level Foundations / Design / Content / Patterns / Components / Tokens / Icons. Site source lives in the monorepo github.com/Shopify/polaris under polaris.shopify.com/content/**/*.md(x), path-mirrored to the URL (content/design/colors.md → /design/colors) — clean fallback. Note: @shopify/polaris React is being superseded by Polaris web components; Shopify/polaris-react is deprecated | Content promoted to a co-equal top-level section (Voice and tone, Grammar and mechanics, Naming, Product content); per-component Best practices / Content guidelines / Examples / Related components / Accessibility skeleton; do/don't framed as merchant-facing decisions rather than visual rules |

Study at least three, ideally six, component pages per system, favouring components that also exist in Base UI (e.g. text input/field, select/dropdown/menu, dialog/modal, tooltip, checkbox), so the comparison maps 1:1 onto Phase C work.

### 6.2 What is already known about GOV.UK (verified — build on it, re-verify only if pages moved)

The GOV.UK component page skeleton is invariant: hero example embed (rendered iframe + HTML/Nunjucks code tabs) → "When to use this component" → "When not to use this component" (always names and links the alternative) → "How it works" (many variant subsections, each with its own live example) → per-component "Error messages" guidance (with fill-in-the-blank message templates for every failure state — text-input has 13) → "Research on this component" (findings, known issues honestly disclosed — radios openly admits a WCAG 4.1.2 failure — links to a public research-backlog issue per component) → injected "Help improve this page" footer. Site-level: Components (UI elements) vs Patterns (task-level guidance: "Ask users for…", "Help users to…") vs Styles (foundations). WCAG success criteria are cited inline. Every rule is an instruction with its user-need rationale attached.

### 6.3 Deliverable A artifacts (under research/a-documentation-standard/)

1. reference-notes/{govuk,react-spectrum,fluent,ebay,material,polaris}.md — per system: the section taxonomy observed (ordered), 3 concrete page dissections, and "features worth stealing / features to skip for a headless library, and why."
2. documentation-definition-of-done.md — the master artifact. A superset checklist of every section a Base UI component doc page could contain, each entry with: purpose, which reference system(s) demonstrate it, required/recommended/optional status, what evidence Phase C must gather to fill it, and adaptation notes for a headless library (e.g. GOV.UK's visual style guidance doesn't transfer; its linkage-of-label-and-error behavioral guidance does). Per Decision 6: over-generate; mark aggressively optional rather than omitting. It must at minimum cover: hero example; when to use; when not to use + alternatives; anatomy (visual diagram + code); how it works / behaviors; keyboard & screen-reader contract (ARIA APG link); per-prop usage guidance; data-attributes/CSS-variables styling contract; feature examples; real-world examples; content/microcopy guidance where applicable; error/validation guidance for form components; do/don't; decision log; status/maturity; research & known issues; related patterns; feedback loop.
3. component-doc-template.mdx — an annotated skeleton MDX file implementing the Definition of Done as a Storybook-ready docs template (placeholder prose explaining what goes in each slot and which research field feeds it). It should assume argTables from JSDoc (Decision 8) and one story per use case.
4. taxonomy.md — a proposed categorization of the 37 components + 4 utils by purpose and information architecture (replacing the flat A–Z list), e.g. clusters like: overlays/popups (popover, tooltip, preview-card, dialog, alert-dialog, drawer, menu, context-menu, menubar, navigation-menu, toast), selection & input (select, combobox, autocomplete, checkbox(-group), radio(-group), switch, slider, number-field, otp-field, input, field, fieldset, form), disclosure & structure (accordion, collapsible, tabs, separator, toolbar, scroll-area), status & display (progress, meter, avatar, badge-like), actions (button, toggle, toggle-group). Justify each placement; flag genuinely ambiguous ones. Also propose 3–6 cross-component patterns (GOV.UK-style task-level docs) that Base UI evidence supports — e.g. "Forms & validation", "Choosing an overlay", "Listbox-style selection" — with the components each pattern spans.

## 7. Phase B — Library-wide principles extraction

Goal: the general chapter every component brief inherits: what Base UI believes, how it is meant to be used, where users go wrong.

### 7.1 Sources to mine (in priority order)

1. **This repo's own meta-documentation**: README.md, CONTRIBUTING.md, AGENTS.md, docs/src/app/(docs)/react/overview/* (Quick start, Accessibility, About, Community), and the entire Handbook (docs/src/app/(docs)/react/handbook/*: Styling, Animation, Composition, Customization, Forms, TypeScript). The Handbook is the closest existing statement of "how to use Base UI correctly" — extract its principles explicitly (e.g. the render prop composition model, unstyled-by-default philosophy, data-attribute styling contract, animation with data-starting-style, form integration model).
2. **Upstream git history (after unshallowing)**: full-history scans for [all components]-scoped commits (library-wide conventions), commits touching AGENTS.md/CONTRIBUTING.md/handbook pages, and release/breaking-change commits. CHANGELOG.md + CHANGELOG.old.md in this repo for the release narrative, especially the 1.0 rename/stabilization arc.
3. **Upstream GitHub Discussions** (https://github.com/mui/base-ui/discussions): the support Q&A corpus. Catalog recurring "Am I doing this right?" → "No, do this instead" exchanges — each one is a documented gap. Collect at least the 30 most-active discussions overall, plus targeted searches per Tier-1 component in Phase C.
4. **Upstream issues/PRs with project-level significance**: RFCs, API-convention debates, naming decisions, accessibility policy, render-prop design, animation API debates. Search terms: "RFC", "API design", "convention", "breaking", "philosophy", "why", label-based searches (e.g. label:"breaking change" if such labels exist — discover the label set first).
5. **Maintainer commentary**: MUI blog posts about Base UI (search blog.mui.com and the web), release notes, the About page. Only if budget permits.

### 7.2 Deliverable B artifacts (under research/b-library-principles/)

1. principles.md — the principles document, organized roughly as: project goals & positioning (headless, a11y-first, unstyled, framework of composition); the API grammar (Root/part namespaces, render prop, data-attributes, CSS variables, ChangeEventDetails/Reason pattern, createHandle pattern, Portal/Positioner/Popup layering grammar); styling philosophy; animation philosophy; accessibility stance; forms philosophy; SSR/hydration stance; versioning/stability semantics (what [New], "unstable-", 1.0 mean); common misuse patterns observed in Discussions (each [E] cited). Every principle: statement → evidence ([E]/[I] with citations) → implication for documentation ("therefore every overlay component's docs must explain X").
2. sources.md — annotated bibliography: every issue/PR/discussion/commit/URL consulted, one line each on what it contributed. This doubles as the reusable citation pool for Phase C.
3. glossary.md — Base UI's own vocabulary (part, root, positioner, popup, handle, payload, starting-style, etc.) with definitions grounded in source/docs. The later Storybook must use the project's language consistently.

## 8. Phase C — Per-component research briefs

Goal: for every component, the evidence base that lets a writer fill the Definition of Done template without guessing — above all, the component's intention.

### 8.1 Per-component source protocol (run for each component)

1. **Source code** (packages/react/src/<slug>/): enumerate parts; read each part's JSDoc description; read *DataAttributes.ts / *CssVars.ts enums (the styling/state contract); note props with rich JSDoc (bulleted behavior descriptions) — these are prop-guidance seeds; note cross-component reuse (e.g. Select.Separator re-exports Separator; context-menu shares menu part vocabulary; alert-dialog builds on dialog).
2. **Docs page** (docs/src/app/(docs)/react/components/<slug>/page.mdx + types.md + demos/): current sections, existing "Usage guidelines" bullets if any, which feature examples exist (these are the Adobe-style functionality demos to keep, per Decision 8).
3. **Tests** (packages/react/src/<slug>/**/*.test.tsx): what behaviors are pinned down; edge cases with comments; a11y assertions. Tests encode intention that docs omit.
4. **Experiments** (docs/src/app/(private)/experiments/): any experiment touching the component reveals what maintainers needed to verify by hand — list them and what each probes.
5. **Git history (unshallowed)**: git log --oneline --follow -- packages/react/src/<slug> plus subject-line scope search (git log --grep='^\[<scope>\]' — scopes match the commit convention, e.g. [menu], [number field]). Extract: the introducing PR/commit; major rework commits; bugfix clusters (recurring pain = documentation candidate: e.g. menu's Chrome mouseleave submenu fix #5153 is evidence of hover-menu subtleties worth documenting).
6. **Upstream PRs** (via PR numbers harvested from commit subjects — most commits carry (#NNNN)): read the PR body, reviews and comments of the introducing PR and the top 5–15 most significant PRs per component. PR content state intention directly.
7. **Upstream issues + discussions**: search by component name and part names. Collect: feature requests rejected (and why — that's "when not to use" evidence), support questions (misuse patterns), a11y reports, API-change debates.

Depth per tier (§12): Tier 1 = full protocol; Tier 2 = full protocol but cap at the top ~8 PRs/issues; Tier 3 = steps 1–2 + a quick issue search; utils = steps 1–2 only.

### 8.2 Deliverable C artifacts (under research/c-components/<slug>/)

brief.md per component, with exactly these sections (write [G] + where you looked rather than deleting a section you couldn't fill):

1. **Identity** — name, package subpath, part list with one-liners, single/multi-part, status ([New]/stable/quirks like radio-group's missing page), taxonomy category (from A) and the purpose/IA statement: what purpose, what information architecture.
2. **Intention** — why this component exists, in the maintainers' own terms: introducing PR/issues, design goals, explicit non-goals. The heart of the brief. [E]-heavy.
3. **When to use** — evidenced scenarios (from docs, discussions, real-world usage found in Phase D).
4. **When not to use + alternatives** — the decision boundary against overlapping components, with evidence. Mandatory treatment for the known overlap clusters: popover/tooltip/preview-card/dialog/alert-dialog/drawer; select/combobox/autocomplete; menu/context-menu/menubar/navigation-menu; toggle/switch/checkbox; accordion/collapsible/tabs; progress/meter; dialog-vs-drawer; toolbar-vs-menubar. Where maintainers have stated the boundary, cite it; where they haven't, derive it from API affordances and mark [I].
5. **Anatomy & composition** — the part tree, what each part renders, which parts are optional, composition rules (portal/positioner/popup layering, handle pattern), plus a text spec for a future visual anatomy diagram (numbered callouts → parts).
6. **Behavior ("How it works")** — interaction model, controlled/uncontrolled, open/close semantics, focus behavior, outside-press/escape handling, animation hooks (starting-style, transition status), SSR notes.
7. **Accessibility contract** — keyboard interaction table, ARIA roles/states the component manages, screen-reader behavior, the matching W3C ARIA APG pattern link, known issues (GOV.UK-style honesty: if upstream has open a11y bugs, list them with issue numbers).
8. **Prop-level guidance** — for each decision-relevant prop (not every prop): what it does, when to use it and why ("use modal={false} when …, because …"), evidence. Include data-attributes and CSS variables that matter for styling states.
9. **Decision log** — dated, cited list of major decisions & revisions: introduced in #X; API changed in #Y because Z; prop added in #W to solve V. This feeds the inline decision-log style the Storybook wants (Decision 11).
10. **Pitfalls & FAQ** — misuse patterns from Discussions/issues, each as "symptom → correction → citation".
11. **Real-world patterns observed** — cross-reference to this component's Phase D dataset: which usage archetypes exist in the wild, which ranked examples illustrate which section of the future doc page.
12. **Story plan** (story-plan.md may be split out if long) — the concrete list of Storybook stories to author later: the kept functionality demos (from current docs), one story per use case (for tests, Decision 8), the real-world recreation stories (from D — with interactions, e.g. "the flow that opens the alert dialog", most valuable for complex/business-logic-heavy components; skip for trivial ones), and which Definition-of-Done sections each story serves.

### 8.3 Cluster notes

For each overlap cluster listed in 8.2(4), also write a shared research/c-components/_clusters/<cluster>.md capturing the comparative decision guidance once (the per-component briefs link to it instead of repeating it).

## 9. Phase D — Real-world usage mining

Goal: for each component, a ranked, annotated corpus of real usage. The specified workflow (verbatim intent, made precise):

### 9.1 Corpus building (do once, shared across components)

Verify current + historical npm package names (§3.2). For each name, run GitHub code searches for the import specifiers, e.g.:

- "from '@base-ui/react/select'" (per-component subpath — the strongest signal)
- "@base-ui/react" in package.json (repo-level corpus)
- historical: same for the pre-1.0 package name(s) you verified

Build research/d-real-world-usage/_corpus/repos.json: every distinct repo found, with stars, license, last-commit date, fork status, category: production-app | oss-design-system | starter-template | demo-or-sandbox | docs-or-fork. Exclude: forks of mui/base-ui, the docs site itself, and archived/empty mirrors. Do not exclude design systems and UI kits built on Base UI — wrappers like shadcn-style registries built on Base UI are high-value evidence of real composition patterns; categorize them honestly.

Fallback surfaces when GitHub code search thins out: grep.app, Sourcegraph, npm dependents of the package, and the Community page of base-ui.com (which lists ecosystem projects — also a credibility-friendly source of live sites, Decision 10).

### 9.2 Per-component candidate collection and ranking

For each component (Tier caps in §12):

1. From the corpus + targeted per-subpath searches, collect up to 100 candidate usages (a candidate = one repo+file(s) using the component meaningfully; trivial re-exports don't count). Prefer source code over a rendered site alone; record both when available.
2. Write candidates.json (schema in §11.3): repo, commit-pinned permalink to the file(s), live URL if any, category, license, parts used, context summary (1–2 sentences: what the surrounding product feature is).
3. Rank by the dual criterion from the brief:
   - **Illustrative quality**: does this show how to use the component well? (breadth of parts used correctly, idiomatic composition, a11y respected, meaningful real context vs toy)
   - **Collective diversity**: pick the set that spans the most distinct contexts — "if you take just five out of 100, you really give people a lot of ideas." Use greedy diversity-aware selection: score individually, then when selecting the top set, penalize candidates whose context/archetype is already covered. Bonuses: live linkable production site (Decision 10); permissive license; recent activity. Penalties: starter-template sameness; abandoned code; misuse (though one instructive misuse example per component may be kept, clearly labeled).
4. For every ranked example record WHY: rankRationale — what is interesting about it, what future story could be recomposed from it, which doc section it feeds. This field is mandatory; a ranking without a rationale is useless downstream.

### 9.3 Screenshot protocol (strictly best-effort)

For the top ~15 per Tier-1 component (margin over the final ~5 that will be used):

- Priority order: (1) the project's own running Storybook if it has one → screenshot the relevant story; (2) the live website if one exists → screenshot the relevant page/state directly (cheapest — try this early); (3) if it's just a dev project, run it (install + dev server) and screenshot.
- At most 3 attempts total per example (an attempt = one distinct strategy or one meaningful fix of a failed strategy). If it doesn't work, skip the screenshot, keep the entry, record screenshot: {status: "skipped", attempts: [...]}.
- Use Playwright with the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH is set; never run playwright install; if a project pins another Playwright version, launch with executablePath: '/opt/pw-browsers/chromium').
- Interactive states matter: for overlay components, screenshot the open state (drive the interaction with Playwright before capturing).
- Save PNGs under research/d-real-world-usage/<slug>/screenshots/, ≤ 400 KB each (resize/compress if needed), filename <rank>-<repo-owner>-<repo-name>.png.
- Never authenticate anywhere, never bypass paywalls/logins, respect robots noindex on screenshots of private-ish pages (public marketing/app pages are fine).

### 9.4 Deliverable D artifacts (under research/d-real-world-usage/)

- methodology.md — exact queries run, dates, result counts, caps hit, biases (e.g. "GitHub code search only indexes default branches"), so results are reproducible.
- _corpus/repos.json — the shared repo corpus.
- <slug>/candidates.json — all candidates (≤100), schema §11.3.
- <slug>/ranked.json — the ranked list with scores + mandatory rationales.
- <slug>/examples.md — human-readable: the top picks, each with permalink, live URL, screenshot (if captured), the rationale, and "story recomposition notes" (what a recreated story would show, including the interaction).

## 10. Phase E — Storybook implementation

Goal: a working Storybook project in this repository, with CSF story files and MDX docs pages for all identified components, built by following Storybook's own generated agent workflow and fed by the Phase A–D research.

### 10.1 Scaffold the Storybook project

- pnpm i at the repo root first (nothing runs without it; pnpm 11.5.2 is enforced).
- Decide placement before initializing, and record the choice + reasoning in research/e-storybook/decisions.md. Decision criteria, in priority order:
  1. Storybook must consume the local workspace source of @base-ui/react (not the published npm package), so stories exercise the code in this repo.
  2. Run storybook ai setup from the directory whose package.json owns the Storybook config (or pass --config-dir) — its runtime analysis inspects that project, so prefer a placement where the analysis can see the code your stories import.
  3. Existing builds, tests, and the docs site must keep working untouched.
  4. If the generated prompt (§10.2) calls for colocated story files, colocation inside packages/react/src/** is acceptable as new files only — wire the stories globs accordingly. Reasonable candidates: a new workspace app (e.g. apps/storybook/) or the repo root. Choose, justify, move on — do not agonize.
- Initialize Storybook (React + Vite framework fits this repo's toolchain) with the standard installer, e.g. npx storybook@latest init. Workspace policy gotchas are in §3.5: minimumReleaseAge may refuse a release younger than ~3 days (pin the newest version older than the window), and postinstall build scripts may need allowBuilds entries in pnpm-workspace.yaml.
- Sanity-check that storybook dev and storybook build run before writing any stories. Fix infrastructure now, not mid-authoring.

### 10.2 Retrieve the generated agent prompt — then follow it

After init (verified CLI behavior: storybook ai setup errors out if no Storybook config dir exists — "run from your project root, or specify --config-dir"), generate the setup prompt fresh, in this repository:

```
npx storybook ai setup --output research/e-storybook/setup-prompt.md
```

Verified flags: -o/--output <path> (write prompt to file), --config-dir <dir>, --package-manager pnpm.

The prompt's content is derived from Storybook's runtime analysis of this project — that is why it is generated here and now, and why no cached, secondhand, or example copy may be substituted. Treat its contents as unknown until generated.

Commit the generated prompt verbatim (traceability) before acting on it.

Execute the generated prompt as your work order for Storybook mechanics — it is known to do a good job of constructing the shared preview, decorators, mocking, and a verification loop. Apply the overrides in §10.3. Conflict rule (Decision 12): on mechanics, the generated prompt wins; on scope and content, this brief wins.

### 10.3 Overrides to the generated prompt (scope and inputs only)

- **Coverage: ALL identified components** — the 37 components of §3.2 (radio + radio-group as one unit) plus the 4 utils where rendering a story makes sense — instead of the ~10 components the generated prompt asks for. Apply its per-file story-writing guidance per component; its total-count cap does not apply.
- **Discovery: skip or abbreviate.** The generated prompt includes a discovery/research step to learn the codebase. Phases B–C already establish what it seeks — the dependency graph, provider and portal requirements, and what to mock. Verify against your research artifacts instead of rediscovering; only perform discovery steps that genuinely aren't answered there (e.g. confirming CSS entry points for the preview).
- **Story content comes from the research, not improvisation**: each component's story-plan.md (Phase C) defines its story set — kept functionality demos, one story per use case (test-bearing, Decision 8), and real-world recreation stories with interactions where planned (Phase D). Overlay/popup components must include at least one story exercising the full open/close interaction.
- **MDX docs pages for every component**, implementing research/a-documentation-standard/component-doc-template.mdx (Phase A), filled from brief.md: when to use / when not to use + alternatives, anatomy, behavior, a11y contract, prop-level guidance, decision log with citations, and real-world examples (links + screenshots from Phase D). Sections whose research came up empty keep their [G] markers — visible honesty beats silent omission.
- **Styling**: Base UI components are headless — unstyled stories render invisible and prove nothing. Base story styling on the existing docs demos' CSS (CSS Modules with raw oklch() values, hero-demo look, per AGENTS.md) so stories are visually meaningful and consistent with base-ui.com.

### 10.4 Repo hygiene for Phase E

- **Additive only in existing trees.** Permitted edits to existing files, exhaustively: root package.json scripts, pnpm-workspace.yaml (workspace globs, allowBuilds), lockfile, and files inside the new Storybook project itself. Never edit existing component, docs, or test source.
- Commit scope [storybook]; commit after the scaffold, after the generated prompt is captured, and after each component (or small batch) of stories/MDX. Push hourly.

### 10.5 Verification and Deliverable E artifacts

- Follow the generated prompt's own verification loop and done-criteria (batch-first test runs, iterate only on failures, honest failure marking).
- Additionally, independent of what it prescribes: storybook build must complete, the repo's own checks must still pass untouched (pnpm typescript, and the existing test suites must be unaffected), and every component must render at least one story without errors.

Artifacts:

- the Storybook project itself (location per §10.1);
- research/e-storybook/setup-prompt.md — the generated prompt, verbatim;
- research/e-storybook/coverage.md — table: component × (CSF file, story count, MDX page, interaction tests, pass/fail status);
- research/e-storybook/decisions.md — placement choice, versions pinned, every deviation from the generated prompt and why.

## 11. Output layout and schemas

### 11.1 Directory layout (research files under research/; the Storybook project itself lives where §10.1 decided)

```
research/
  PROMPT.md                          ← this brief (already committed)
  PROGRESS.md                        ← living ledger (§4.6)
  SUMMARY.md                         ← final report (§13)
  a-documentation-standard/
    reference-notes/{govuk,react-spectrum,fluent,ebay,material,polaris}.md
    documentation-definition-of-done.md
    component-doc-template.mdx
    taxonomy.md
  b-library-principles/
    principles.md
    sources.md
    glossary.md
  c-components/
    _clusters/<cluster>.md
    <slug>/brief.md
    <slug>/story-plan.md             (optional split)
  d-real-world-usage/
    methodology.md
    _corpus/repos.json
    _cache/                          (raw API responses; committed is fine)
    <slug>/candidates.json
    <slug>/ranked.json
    <slug>/examples.md
    <slug>/screenshots/*.png
  e-storybook/
    setup-prompt.md                  ← verbatim `storybook ai setup --output` result
    coverage.md                      ← component × (stories, MDX, tests, status) table
    decisions.md                     ← placement, pinned versions, prompt deviations
```

<slug> = the docs slug (accordion, alert-dialog, …). radio + radio-group share radio/. Utils use their slugs under c-components/ too (briefs only, no d- data).

### 11.2 Markdown conventions

GitHub-flavored markdown; one # title per file; citations inline as ([mui/base-ui#1234](https://github.com/mui/base-ui/pull/1234)) or (commit abc1234); evidence tags [E]/[I]/[G] at the start of the relevant bullet/claim.

### 11.3 candidates.json / ranked.json entry schema

```json
{
  "id": "select-017",
  "component": "select",
  "repo": "owner/name",
  "repoUrl": "https://github.com/owner/name",
  "stars": 1234,
  "license": "MIT",
  "reuse": "code-ok | link-only",
  "category": "production-app | oss-design-system | starter-template | demo-or-sandbox",
  "lastActivity": "2026-05-01",
  "importSpecifier": "@base-ui/react/select",
  "files": [{ "path": "src/...", "permalink": "https://github.com/owner/name/blob/<sha>/..." }],
  "liveUrl": "https://... or null",
  "partsUsed": ["Root", "Trigger", "Portal", "Positioner", "Popup", "Item"],
  "contextSummary": "1-2 sentences: what product surface this select serves.",
  "diversityTags": ["e-commerce", "form-heavy", "custom-filtering"],
  "rank": 3,
  "scores": { "illustrative": 4, "realWorld": 5, "diversityContribution": 3, "liveSite": 1, "licenseBonus": 1 },
  "rankRationale": "MANDATORY. What is interesting; what a recomposed story would highlight; which doc section it feeds.",
  "instructiveMisuse": false,
  "screenshot": { "status": "captured | skipped | not-attempted", "path": "screenshots/03-owner-name.png", "attempts": ["live-site: ok"] }
}
```

## 12. Prioritization tiers and budget

- **Tier 1 — full depth** (C full protocol; D: ≤100 candidates, rank, top ~15 screenshot pipeline; E: full story-plan implementation including real-world recreation stories with interaction play functions, MDX fully implementing the Definition of Done): select, combobox, autocomplete, menu, dialog, popover, toast, field (with form), navigation-menu, drawer.
- **Tier 2 — full brief, capped mining** (C capped; D: ≤40 candidates, top ~8, screenshots only if a live URL makes it nearly free; E: full story-plan implementation, recreation stories optional, full MDX): alert-dialog, context-menu, menubar, number-field, otp-field, slider, tabs, tooltip, preview-card, scroll-area, accordion, radio(+radio-group), checkbox(+checkbox-group).
- **Tier 3 — lean brief** (C steps 1–2 + quick issue search; D: ≤20 candidates, top ~5, no screenshots; E: hero story + key variant/use-case stories, MDX from the template with [G] slots where research is thin): avatar, button, collapsible, fieldset, input, meter, progress, separator, switch, toggle, toggle-group, toolbar — plus utils briefs (CSP Provider, Direction Provider, mergeProps, useRender; identity/intention/pitfalls only; a story only where rendering one makes sense, otherwise an MDX docs page alone).

Coverage floor: every component must end the session with at least a brief containing Identity, Intention (even if thin), a candidates.json (even if short), one rendering CSF story, and an MDX docs page — a complete-but-shallow lattice beats a perfect Tier 1 and nothing else. Suggested budget split: A ≈ 10%, B ≈ 10%, C ≈ 25%, D ≈ 20%, E ≈ 30%, close-out ≈ 5%. Work Tier 1 → 2 → 3 within C/D/E. If you must cut, cut screenshot attempts first, then Tier 3 D-mining, then real-world recreation stories, then Tier 3 brief depth — never cut citations, rationales, the ledger, or any component's minimum story + MDX page.

## 13. Definition of session done + self-verification

Before your final commit, verify each item and record the checklist results in research/SUMMARY.md:

1. Deliverable A complete: 6 reference notes, Definition of Done, template MDX, taxonomy.
2. Deliverable B complete: principles (every principle cited), sources, glossary.
3. Every one of the 37 components + 4 utils has a brief at or above its tier's floor; PROGRESS.md table shows honest per-cell status.
4. Every Tier-1 component has candidates.json + ranked.json + examples.md; every ranked entry has a non-empty rankRationale; licenses recorded everywhere.
5. Deliverable E complete: setup-prompt.md committed verbatim before it was acted on; storybook build succeeds; every component has at least one rendering CSF story and an MDX docs page; the generated prompt's own done-criteria are met or the shortfall is recorded; coverage.md matches reality, including components whose stories still fail; the repo's own checks (pnpm typescript, existing test suites) still pass.
6. Spot-check 10 random citations you wrote (do the links/numbers really support the claim?). Record the spot-check outcome honestly in SUMMARY.md; fix what fails.
7. Outside research/ and the Storybook project, no existing file was modified beyond the wiring permitted in §10.4; git log shows [research]/[storybook] scoped commits; branch pushed; working tree clean.
8. SUMMARY.md written: what was produced, coverage table, the 10 most interesting findings of the session, known gaps ([G] inventory), and recommended next steps for polishing the Storybook.

Honesty rules for the final report: report coverage as it is, not as intended; a skipped screenshot, an unreachable source, or an unverifiable claim is recorded, never papered over.

## Appendix — quick-reference facts

- Upstream: mui/base-ui; fork/origin: storybook-tmp/base-ui; working branch: research (create from master); default branch: master.
- Clone is shallow → unshallow before history mining (§3.1).
- Packages: @base-ui/react (37 components + utils), @base-ui/utils (38 shared utilities, e.g. useTimeout, useStableCallback, store). Verify historical npm names before D-phase searches.
- Docs source: docs/src/app/(docs)/react/; experiments: docs/src/app/(private)/experiments/; handbook: docs/src/app/(docs)/react/handbook/.
- Commit format: [research] Imperative summary ([storybook] for Phase E work). Push hourly minimum.
- Docs dev server: pnpm docs:dev → port 3005 (needs pnpm i first; pnpm 11.5.2).
- No Storybook exists yet — Phase E creates it: storybook init first, then npx storybook ai setup --output research/e-storybook/setup-prompt.md, generated fresh in this repo (never a cached copy), then follow it for ALL components with its discovery step skipped where Phases B–C already answer it. Never edit existing library/docs source files.
- Storybook install vs workspace policy: minimumReleaseAge (~3 days) may refuse a fresh release — pin the newest version older than the window; postinstall scripts may need allowBuilds entries in pnpm-workspace.yaml.
- GOV.UK = primary reference; React Spectrum, Fluent 2, eBay Evo/MIND, Shopify Polaris, Google Material 3 = secondary.
- Reference systems: anatomy only — their content never enters Base UI docs.
- Every intention claim: [E]/[I]/[G] + citation. No exceptions.
