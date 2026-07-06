# eBay Evo (Playbook / Skin / MIND Patterns) — documentation anatomy

Studied 2026-07-06. Structure-only notes; quotes limited to a sentence or two purely to illustrate format conventions.

Reachability, honestly recorded per surface:

- **Playbook** (playbook.ebay.com): publicly reachable, no login for the Design tab. Component pages are an SPA; the Design tab is server-rendered and fully extractable, the Accessibility tab is partially extractable, the Develop tab renders a resources table but explicitly gates the rest: "More component info is available for signed-in users." Tab-specific URLs (e.g. `/accordion/develop`) 404; tabs are client-side state.
- **MIND Patterns** (ebay.gitbook.io/mindpatterns): fully reachable, every pattern page extractable. Best-documented surface of the three.
- **Skin / evo-web** (opensource.ebay.com/evo-web/skin): the live site is a client-rendered SPA — direct fetches 404 or return only a page shell ("Evo Web" header, content truncated). Structure was recovered from the GitHub source (`eBay/evo-web`), which is public and conclusive: the Skin docs site is literally a Storybook (`packages/skin/.storybook/` + `src/sass/**/stories/*.stories.js`). Legacy skin docs (`ebay.github.io/skin`, `opensource.ebay.com/skin/archive/...`) redirect or 404; web.archive.org was not fetchable from this environment. Legacy structure is therefore described only from search-result evidence, flagged below.

## The three-surface model

Which concerns live where:

| Surface | Audience | Concern | Form |
|---|---|---|---|
| **Playbook** | designers (primarily), PMs, devs entering from design | usage guidance: when/why, anatomy, variants, behavior, responsive rules, do/don't, redline specs | marketing-grade design-system site; per-component pages with co-equal tabs |
| **MIND Patterns** | frontend developers | the framework-agnostic accessibility contract: keyboard, screen reader, pointer, ARIA semantics, part terminology | GitBook; one page per pattern with a fixed section skeleton; normative must/should language |
| **Skin (evo-web)** | frontend developers | the concrete markup contract: exact HTML + BEM classes + ARIA attributes that the CSS binds to; plus Marko/React component wrappers of that markup | today: a Storybook of raw-HTML stories; historically: one long docs page of demo + markup-snippet pairs |

Cross-linking observed (and its limits):

- Playbook **Foundations → Accessibility** page links out to "eBay MIND Patterns" — but at the *old* URL (`opensource.ebay.com/mindpatterns/index.html`), not the current GitBook. It also states the conformance target ("aim to conform to WCAG 2.1 AA").
- Playbook **component Develop tabs** link each implementation row to `opensource.ebay.com/evo-web/components/<name>` — i.e. Playbook treats the code docs as a per-library availability index, not inline API docs.
- Playbook **component pages do not deep-link MIND** — on the component pages checked (Tab, Popover, Dialog, Accordion, Date picker) no ebay.gitbook.io links were found. The a11y tab content is written in-house per component instead of delegating to the matching MIND pattern.
- MIND **Working Examples** sections link outward to the MIND examples site, the "Bones" GitHub project (semantic markup skeletons), and eBay Skin — i.e. MIND points at implementations, never at Playbook.
- Skin/evo-web README points users to its own site only; MIND is referenced from code docs occasionally (MIND's menu page notes Skin as an implementation), but there is no systematic three-way linking.

Net: the three surfaces are separated by *concern* (guidance vs a11y contract vs markup/implementation), with weak, partially stale hyperlinking between them. The separation of concerns is the strength; the link rot is the cautionary tale.

## Playbook component-page skeleton

**Verified tab model:** the co-equal top-level tabs are **Design | Develop | Motion | Accessibility** (Motion present only on some components — seen on Accordion and Date picker; Tab and Dialog showed three: Design | Development | Accessibility). A top-level **"Content" tab was NOT observed** on any of the five component pages checked. Content guidance exists, but as a *section inside the Design tab* (e.g. Tab's Design tab has "Content → Labels"). So the working model is "three-to-four co-equal tabs: Design / Develop / (Motion) / Accessibility", with editorial content folded into Design. Multi-variant components (Button) use a different top layer: sub-pages "Overview | CTA button | Icon button | Link button", each of which then carries the tab model.

Inside the **Develop** tab there is a second-level *framework toggle*: **CSS | Marko | React** — one design page fanning out to three implementations.

**Design tab — fixed heading order** (near-identical across Dialog, Tab, Accordion, Popover, Date picker):

1. **Considerations** — 3 short named principles (e.g. Dialog: "Focused, Responsive, Intentional"), one line each
2. **Anatomy** — numbered-callout diagram naming the parts (Dialog: Scrim, Header, Container, Footer)
3. **Properties** — the visual/structural variants, one subheading per property (Dialog: Container, Header, Width, Type)
4. **Behavior** — interactive rules, one subheading per behavior (Dialog: Height, Scrim, Button overflow; Tab: Scrolling, Number of tabs, Space between tabs, States)
5. *(Platforms)* — only where iOS/Android diverge (Date picker)
6. *(Content)* — editorial rules where relevant (Tab: Labels)
7. **Screen sizes** — Small / Medium / Large responsive behavior, incl. native-vs-web mockups
8. **Best practices** — Do/Don't image pairs, one subheading per rule (Dialog: Alignment, Complexity, Nesting, Size, Overflow)
9. **Specs** — redline measurement diagrams

**Develop tab — contents:** a resources table with columns **Library | Resource | Latest version | Status**, one row per deliverable per framework (e.g. CSS rows: alert-dialog, confirm-dialog, dialog, lightbox-dialog; Marko rows: ebay-alert-dialog, ebay-confirm-dialog; React equivalents). Each row links to `opensource.ebay.com/evo-web/components/<name>`. Status values like "In progress" make it an availability matrix. Anything deeper (code, props) is behind sign-in or on the evo-web site.

**Accessibility tab — contents** (extracted from Dialog): **Keyboard interaction → Tab Sequence → Labeling**. Short, component-specific; does not reproduce or link the MIND pattern.

**Motion tab:** present on animation-bearing components (Accordion, Date picker); content not extractable via fetch (client-rendered), so only its existence and position in the tab strip are recorded here.

## MIND Patterns a11y-contract skeleton

Site frame: four category groups spelling MIND — **Messaging, Input, Navigation, Disclosure** — plus Structure, Anti-Patterns, Techniques, and appendices (ARIA Essentials, References, Utilities, FAQ). The landing page itself declares the per-pattern skeleton: each completed pattern has "introduction, working examples, terminology, best practices, interaction design, developer guide, and ARIA reference."

**The recurring section skeleton**, confirmed across Combobox, Menu, Listbox, Tooltip, Lightbox Dialog (parentheses = optional, seen on some patterns):

1. *(Screenshots)* — an image of the pattern up top (Menu, Listbox)
2. **Introduction** — what the pattern is, and pointedly what it is *not* ("A menu is **not** appropriate for links.")
3. *(Known Issues)* — honest defect/AT-support notes (Listbox)
4. **Working Examples** — links to a live examples site + reference implementations (Bones markup skeletons, eBay Skin)
5. **Terminology** — bulleted glossary naming the pattern's parts before any behavior is specified; italicized term, colon, definition (Combobox: "*combobox*: the pattern as a whole, comprised of the following distinct parts"; Tooltip defines *tooltip / host / overlay / tip*; Menu defines *menu / command list / command*; Listbox defines *widget / listbox / option / checked*)
6. *(Configuration)* — named behavior switches/variants of the pattern (Combobox: `autoSelect`)
7. **Best Practices** — prescriptive usage rules ("Tooltip **must** describe the host element only")
8. **Interaction Design** — the heart of the contract, always subdivided by input modality:
   - **Keyboard** — normative statements, chronological by user action rather than a key/function table; key names in `UPPER-CASE` code format ("Pressing `DOWN-ARROW` and `UP-ARROW` keys **must** navigate through the list"; "When lightbox dialog opens, focus **must** move to the dismiss button"; "**must** confine `TAB` and `SHIFT-TAB` to focusable elements of child window")
   - **Screen Reader** — expected *announcements*, phrased as testable outcomes ("Commands **must** be announced as 'menu item', 'menu item radio' or 'menu item checkbox' role"; "The checked state of an option **must** be announced."); typically three recurring statement types: role announcement, state announcement (checked/expanded), disabled announcement
   - **Pointer** (or "Mouse and Touch") — hover/click/press expectations
9. **Developer Guide** — implementation walk-through; in the fullest pages layered by progressive enhancement: **Content (HTML) → Presentation (CSS) → Behaviour (JS)**, with focused sub-topics (Lightbox HTML: Button, Dialog Role, Hidden State, Child Window, Header and Body, Title, Close Button; Lightbox JS: Hide and Show, Modality for Keyboard, Modality for Screen Reader, Prevent Page Scroll, ESC Key, Returning Focus; Combobox: Textbox, Listbox, Keyboard and Screen Reader Navigation, Active Descendant)
10. *(JavaScript Modules / Utilities)* — links to helper libraries implementing the tricky bits
11. **ARIA Reference** — one subheading **per role/state/property**, each followed by one or two sentences on how the pattern uses it — not a table (Combobox: `role=combobox`, `role=listbox`, `role=option`, `aria-owns`, `aria-expanded`, `aria-label`; Menu: `role=menu`, `role=presentation`, `role=menuitem`, `role=menuitemradio`, `role=menuitemcheckbox`, `aria-checked`; Lightbox: `role=dialog`, `aria-modal=true`, `aria-labelledby`, `aria-label`, plus `aria-hidden` for masking)
12. *(FAQ, Further Reading)* — closing extras (Tooltip has FAQ; Combobox has Further Reading)

**Terminology/writing conventions that make it a contract:**

- RFC-2119-style normative keywords, **bolded**: must / should / must not — every behavioral sentence carries one, so every sentence is individually verifiable.
- Keys always in code-formatted upper case: `DOWN-ARROW`, `SPACEBAR`, `ESC`, `TAB`, `SHIFT-TAB`.
- Behaviors are always attached to the *named part* from Terminology ("Host **must** be keyboard focusable", "Overlay **must** appear after short delay when host receives focus") — parts first, then behavior, so statements are unambiguous.
- Screen-reader expectations written as announcement outcomes ("X must be announced as Y"), not as ARIA attribute lists — the ARIA Reference carries the attributes separately.
- Stated baseline: progressive enhancement strategy, WCAG 2.2 Level AA target, explicitly building on the ARIA Authoring Practices Guide.
- Gaps are marked, not hidden: Listbox shows "Best Practices" and "Developer Guide" as explicitly unavailable, and has a "Known Issues" section.

## Skin markup-contract notes

- **Current form (evo-web): the docs are a Storybook.** `packages/skin/.storybook/` (main.js/preview.js/theme.js; framework `@storybook/web-components-vite`; stories glob `["../src/sass/**/*.stories.js", "../src/sass/**/stories/**/*.stories.js"]`). Each component folder holds `<name>.scss` + `stories/<name>.stories.js`.
- **A story file *is* the markup contract**: default export is just `{ title: "Skin/Lightbox Dialog" }`; each named export (`base`, `expressiveBase`, `scrollingLightbox`, …) returns a raw HTML template string — full BEM markup with the ARIA baked in (`class="lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby=…`, close button with `aria-label`). No args/controls, no docs prose: variants = named exports, contract = the literal DOM.
- Component granularity is fine-grained: nine dialog folders (alert-, confirm-, drawer-, fullscreen-, lightbox-, panel-, snackbar-, toast-dialog, dialog) and four menu folders (menu, menu-button, filter-menu, filter-menu-button) — each variant is its own markup contract rather than a composed option.
- **Legacy form** (from search evidence only; archive unreachable): one long page, one section per component, each section = short description + variant subsections, each variant = live demo + copy-paste HTML snippet with ARIA included, plus stateful class conventions (`dialog--show`/`dialog--hide`, `-init` primer classes).
- Layering: `@ebay/skin` (CSS) is the base; `@ebay/ebayui-core` (Marko) and `@ebay/ebayui-core-react` render that same markup — so the Skin markup snippets double as the cross-framework rendered-DOM spec.

## Page dissections

### 1. Playbook — Dialog (`https://playbook.ebay.com/design-system/components/dialog`)

- Top strip: tabs **Design | Development | Accessibility**; inside Development a **CSS | Marko | React** toggle.
- **Design tab**, headings in order: Considerations (3 one-liner principles: Focused / Responsive / Intentional) → Anatomy (numbered diagram: Scrim, Header, Container, Footer) → Properties (Container, Header, Width, Type — Type fans into Alert/Confirm/Task with images) → Behavior (Height, Scrim, Button overflow; links to sibling components/tokens) → Screen sizes (Small native, Small web, Large; device mockups) → Best practices (Do/Don't pairs: Alignment, Complexity, Nesting, Size, Overflow) → Specs (redline diagrams per variant).
- **Accessibility tab** headings: Keyboard interaction → Tab Sequence → Labeling. No link to the MIND lightbox-dialog pattern.
- **Development tab**: resources table (Library | Resource | Latest version | Status) — CSS rows alert-dialog/confirm-dialog/dialog/lightbox-dialog, Marko rows ebay-alert-dialog/ebay-confirm-dialog, each linking to `opensource.ebay.com/evo-web/components/<name>`; further info gated behind sign-in.
- Notes: guidance and specs are image-heavy; the four dialog *code* variants map to one *design* page — the design page is the aggregation point.

### 2. MIND Patterns — Combobox (`https://ebay.gitbook.io/mindpatterns/input/combobox`)

- Headings in order: **Combobox → Introduction → Terminology → Configuration → Working Example → Best Practices → Interaction Design (Keyboard / Screen Reader / Mouse and Touch) → Developer Guide (Textbox / Listbox / Keyboard and Screen Reader Navigation / Active Descendant) → ARIA Reference (role=combobox / role=listbox / role=option / aria-owns / aria-expanded / aria-label) → Further Reading**.
- Formats: Terminology = bulleted glossary of italicized part names; Configuration = named behavior flag (`autoSelect`); Keyboard = prose ordered by user action with bolded *must* and code-formatted keys; Screen Reader = bulleted announcement expectations; ARIA Reference = one subheading per attribute, a sentence each (no table).
- Notes: the pattern separates *what the user experiences* (Interaction Design) from *how you build it* (Developer Guide) from *which semantics encode it* (ARIA Reference) — three altitudes of the same contract, never mixed.

### 3. Skin/evo-web — Lightbox Dialog stories (`https://github.com/eBay/evo-web/blob/main/packages/skin/src/sass/lightbox-dialog/stories/lightbox-dialog.stories.js`; rendered at the SPA-only `https://opensource.ebay.com/evo-web/skin`)

- Structure: `export default { title: "Skin/Lightbox Dialog" }`; named story exports (`base`, `expressiveBase`, `scrollingLightbox`, …), each returning a raw HTML template string.
- The markup carries the full contract inline: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wired to the `h2` title id, `aria-label` on the icon close button, BEM classes (`lightbox-dialog__window`, `__header`, `__close`).
- No argTypes, no controls, no doc descriptions — variants-as-exports, DOM-as-spec.
- Notes: a CSS-only library's whole documentation obligation reduces to "here is the exact DOM you must produce," and Storybook's story-per-variant model fits that exactly; what's missing (prose, controls, a11y rationale) is exactly what MIND provides on its separate surface.

## Worth stealing for a headless React library's Storybook docs

- **The MIND a11y-contract skeleton as a fixed, named section set** (Terminology → Interaction Design: Keyboard/Screen Reader/Pointer → ARIA Reference) — top priority. It is framework-agnostic, so it survives Base UI's headless model untouched, and its fixed order makes every component page scannable the same way.
- **Terminology-first**: define the part names before specifying behavior. Base UI already ships named parts (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`…) — a Terminology section maps pattern-part names to exported component parts 1:1, and every subsequent normative sentence gets an unambiguous subject.
- **One normative keyword per sentence (bolded must/should/must not)** — turns docs into a checklist: each "must" sentence can become a play-function assertion or interaction test in a story. This is the difference between describing behavior and *contracting* it.
- **Screen-reader expectations as announcement outcomes** ("the checked state of an option must be announced") — almost no library documents this; it's separately testable from ARIA attributes and is exactly what a headless library's consumers need to verify after styling/composing.
- **ARIA Reference enumerating each role/state/property the component emits, one heading each** — for Base UI this is a spec of the rendered DOM attributes, greppable and assertable in stories (adapt to a table, see below).
- **Co-equal concerns, not an a11y footnote**: Playbook's Design | Develop | Accessibility tab strip puts accessibility at the same level as usage and code. In Storybook terms: fixed co-equal doc sections (or tabs) per component page rather than an "Accessibility" paragraph at the bottom.
- **Playbook's fixed Design-tab order** (Considerations → Anatomy → Properties → Behavior → Screen sizes → Best practices → Specs) — the *predictability* is the feature; a Storybook standard should likewise fix section order across all components. "Anatomy with numbered parts" in particular maps perfectly to headless part lists.
- **Keys in code format, upper case, consistently** (`DOWN-ARROW`, `ESC`) — trivially cheap convention that makes keyboard sections skimmable and consistent.
- **Variants as named story exports whose rendered DOM is the spec** (Skin) — for Base UI, stories per state (open, nested, modal/non-modal) double as the rendered-DOM contract; eBay proves a whole library can document itself this way.
- **Configuration and Known Issues as first-class optional sections** — honest AT-support caveats and named behavior switches (cf. Base UI props like `modal`, `openOnHover`) beat burying them in prose.
- **An availability/status matrix** (Playbook Develop's Library | Resource | Version | Status table) — adapted: per-component support/status table (SSR, ARIA pattern followed, since-version).

## Skip or heavily adapt

- **Three separate sites with hand-maintained cross-links** — Playbook links MIND at a dead-ish legacy URL, component pages don't link MIND at all, and the Skin SPA is unfetchable. The separation of *concerns* is right; the separation of *surfaces* rots. In Storybook, keep the concerns as sections of one page instead.
- **Auth-gating parts of the Develop tab** ("More component info is available for signed-in users") — obviously hostile to an open-source library; also broke this very analysis. Everything public.
- **MIND's progressive-enhancement Developer Guide layering (Content/Presentation/Behaviour)** — assumes server HTML enhanced by JS; meaningless for a headless React library. Keep the *contract* sections; replace the Developer Guide layer with Base UI composition examples.
- **ARIA Reference as prose-only, one paragraph per attribute** — adapt into a compact table (attribute | rendered on which part | condition/value) for density and diffability; keep the exhaustive per-attribute enumeration.
- **Keyboard spec as flowing prose ordered by user action** — MIND's normative sentences are excellent, but a key/result table (as APG uses) is easier to scan and to generate tests from; consider hybrid: table for keys, prose for sequences (focus trap, return focus).
- **Nine sibling dialog components, each its own markup contract** — a composition-first library should document one Dialog with composed variants, not fork the docs per variant; Playbook already aggregates them on one design page, proving the fan-out is a CSS-era artifact.
- **A separate Motion tab** — in a headless library, motion is user-land CSS/JS against exposed data-attributes; document transition hooks as a section, not a co-equal tab.
- **Skin stories' total absence of prose, args, and controls** — steal the DOM-as-spec idea, but a gold-standard Storybook page needs narrative, argTypes, and interaction tests around the markup; bare template-string exports are the floor, not the target.
- **Playbook's image-first specs (redlines, do/don't screenshots)** — priceless for a styled design system, mostly inapplicable to an unstyled library; replace redline "Specs" with API/props and rendered-DOM/data-attribute reference.
- **Skeleton drift left visible but unenforced** (Listbox missing Best Practices/Dev Guide, category index with broken/mis-linked entries) — the fix worth copying is a template/lint that *enforces* the fixed section set, so gaps are impossible rather than merely honest.

## URLs consulted

- https://playbook.ebay.com/design-system — reachable; IA: Get started / Foundations / Design system / Expressions / Resources / Articles
- https://playbook.ebay.com/design-system/components — reachable; alphabetical component index (~40 entries)
- https://playbook.ebay.com/design-system/components/dialog — reachable (Design + a11y headings; Develop table; sign-in gate noted)
- https://playbook.ebay.com/design-system/components/tab — reachable (tabs Design/Development/Accessibility; "Content" as Design-tab heading)
- https://playbook.ebay.com/design-system/components/accordion — reachable (tabs Design/Develop/Motion/Accessibility; CSS/Marko/React toggle)
- https://playbook.ebay.com/design-system/components/button — reachable (Overview + per-variant sub-pages model)
- https://playbook.ebay.com/design-system/components/popover — reachable (Design tab skeleton confirmed)
- https://playbook.ebay.com/design-system/components/date-picker — reachable (Design/Develop/Motion/Accessibility; Platforms section)
- https://playbook.ebay.com/design-system/components/accordion/develop — 404 (tabs are client-side, not routed)
- https://playbook.ebay.com/design-system/components/accordion/accessibility — redirects to /foundations/accessibility (which links MIND at legacy URL, states WCAG 2.1 AA)
- https://ebay.gitbook.io/mindpatterns — reachable; landing page declares per-pattern skeleton, WCAG 2.2 AA, APG lineage
- https://ebay.gitbook.io/mindpatterns/input — reachable; Input pattern index
- https://ebay.gitbook.io/mindpatterns/disclosure — reachable; Disclosure pattern index
- https://ebay.gitbook.io/mindpatterns/input/combobox — reachable; dissected
- https://ebay.gitbook.io/mindpatterns/input/menu — reachable; dissected
- https://ebay.gitbook.io/mindpatterns/input/listbox — reachable; dissected (explicit gaps noted)
- https://ebay.gitbook.io/mindpatterns/disclosure/tooltip — reachable; dissected
- https://ebay.gitbook.io/mindpatterns/disclosure/lightbox-dialog — reachable; dissected
- https://opensource.ebay.com/evo-web/skin (± trailing slash) — 404 to fetch (SPA)
- https://opensource.ebay.com/evo-web/ — shell only ("Evo Web" header; content client-rendered)
- https://opensource.ebay.com/evo-web/components/lightbox-dialog — exists ("Lightbox Dialog Component" heading) but SPA content not extractable
- https://opensource.ebay.com/skin/ and https://ebay.github.io/skin/ — 301 → evo-web/skin
- https://opensource.ebay.com/skin/archive/v12.1/index.html — 404
- http://web.archive.org/web/2024/https://ebay.github.io/skin/ — fetch blocked in this environment
- https://github.com/eBay/evo-web — reachable; packages @ebay/skin, @ebay/ebayui-core (Marko), @ebay/ebayui-core-react
- https://github.com/eBay/evo-web/tree/main/packages/skin — reachable; README defers all end-user docs to the Skin website
- https://github.com/eBay/evo-web/tree/main/packages/skin/.storybook — reachable; confirms Storybook-built docs
- https://raw.githubusercontent.com/eBay/evo-web/main/packages/skin/.storybook/main.js — reachable; stories glob quoted above
- https://github.com/eBay/evo-web/tree/main/packages/skin/src/sass — reachable; component folder inventory (9 dialog folders, 4 menu folders)
- https://api.github.com/repos/eBay/evo-web/contents/packages/skin/src/sass/{menu,lightbox-dialog}/stories — reachable; story file names
- https://raw.githubusercontent.com/eBay/evo-web/main/packages/skin/src/sass/lightbox-dialog/stories/lightbox-dialog.stories.js — reachable; dissected
- https://github.com/eBay/skin (archived 2025) — legacy repo; docs listing not fully renderable
- WebSearch: legacy Skin dialog docs structure (markup/variant conventions) — used as flagged secondary evidence
