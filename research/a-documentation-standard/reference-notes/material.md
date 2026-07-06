# Google Material Design 3 — documentation anatomy

Studied 2026-07-06 against the live site (rendered in a real browser — see reachability log). Structure only; no guidance text collected beyond short illustrative quotes (content is CC BY 4.0).

## Site-level information architecture

**Top-level nav** (verbatim, each with a Material Symbols icon): `Home` / `Get started` (apps) / `Develop` (code) / `Foundations` (book) / `Styles` (palette) / `Components` (add_circle) / `Blog` (pages), plus a global `search`. The guidance triad is **Foundations → Styles → Components**:

- **Foundations** — cross-cutting concepts (accessibility, adaptive design, interaction states, glossary).
- **Styles** — the design-language layer (color, typography, shape, motion, elevation, icons).
- **Components** — one section per component, each a 4-tab mini-site (below).
- **Develop** is a parallel section that bridges to per-platform code (Android, Flutter, Web), separate from guidance.

**Component categorization.** The `/components` index opens with (verbatim): "Components are interactive building blocks for creating a user interface. They can be organized into categories based on their purpose: **Action, containment, communication, navigation, selection, and text input**." — so the six functional/purpose categories are confirmed, in singular form, as the official taxonomy sentence.

However, the *current* index page (2026) does **not** use those six as its visible group headings. Its H2 groups are:

1. `Buttons` (Button groups, Buttons, Extended FABs, FAB menu, FABs, Icon buttons, Segmented buttons, Split buttons)
2. `Date & time pickers` (Date pickers, Time pickers)
3. `Loading & progress` (Loading indicator, Progress indicators)
4. `Navigation` (Navigation bar, Navigation drawer, Navigation rail)
5. `Sheets` (Bottom sheets, Side sheets)
6. `All other components` (App bars, Badges, Cards, Carousel, Checkbox, Chips, Dialogs, Divider, Lists, Menus, Radio button, Search, Sliders, Snackbar, Switch, Tabs, Text fields, Toolbars, Tooltips — alphabetical)

So the plural group headings the brief asked about ("Actions", "Communication", "Containment", "Navigation", "Selection", "Text inputs") were the *earlier* index/sidebar grouping; on today's site the purpose taxonomy survives as prose (singular: Action, Containment, Communication, Navigation, Selection, Text input) while the index groups by component *family* + a catch-all. Third-party summaries and search snippets still describe the site by the six purpose groups.

**Other IA traits:**
- Every index entry is `Component name` + one-sentence purpose ("Menus display a list of choices on a temporary surface"). The same sentence is reused as the hero definition on the component's own pages — one canonical one-liner per component.
- The whole Components section is a linear book: footer pagination `Previous ← Checkbox: Guidelines` / `Up next → Chips: Overview` chains tab→tab and component→component.
- Heroes are animated with an explicit play/pause control (motion previews, not interactive sandboxes).

## Per-component tab skeleton

Every component checked (text fields, menus, dialogs, checkbox, sliders, buttons) has the **same four tabs, in this DOM order, each with an icon**:

`Overview` (info) → `Specs` (style) → `Guidelines` (design_services) → `Accessibility` (accessibility_new)

Note two corrections to the brief: (a) on the live site **Specs precedes Guidelines**, and the `Up next` pagination follows that order (Overview's "Up next" is `<Component>: Specs`); (b) the old "Usage" name survives only as the *first H2 inside* the Guidelines tab. The four tabs were present on **all six** components I checked — no partial tab sets encountered in this sample.

Each tab is its own URL: `/components/<slug>/{overview,specs,guidelines,accessibility}`. Every H2/H3 has an anchor + "Copy link" affordance.

**Overview tab** (ordered contents — consistent across all six):
1. Hero: H1 name, one-sentence definition, animated hero image (play/pause).
2. Unlabeled "key takeaways" bullet list — 4–6 scannable rules mixing anatomy facts and usage imperatives (buttons: "Two variants: default and toggle", "Keep labels concise and use sentence case").
3. Variant strip — linked thumbnails per variant (Filled text field / Outlined text field; Elevated/Filled/Filled tonal/Outlined/Text button).
4. H2 `Availability & resources` — the cross-platform table (see one-guidance-many-implementations section).
5. H2 `M3 Expressive update` (only where applicable: buttons, menus, sliders) and sometimes `Previous updates` (sliders).
6. H2 `Differences from M2` — versioned migration deltas ("Color: New color mappings and compatibility with dynamic color").
7. Footer pagination `Up next → <Component>: Specs`.

**Specs tab** (ordered contents — text fields pattern, variant-first): H2 `Tokens & specs` (the interactive token viewer), then one H2 per variant (`Filled text field`, `Outlined text field`), each with the same five H3s: `… color`, `… states`, `… error states`, `… measurements`, `… configurations`. The newer layout (menus) is: H2 `Variants` → H2 `Configurations` → H2 `Tokens & specs` → H2 `Anatomy` → H2 `Color` (Standard colors / Vibrant colors) → H2 `States` → H2 `Measurements`, then a repeated per-variant block (`Menu (baseline)`) with its own Anatomy/Color/States/Measurements/Configurations. Either way the invariant sub-model is: **anatomy, color, states, measurements, configurations — per variant — plus one interactive token viewer**.

**Guidelines tab** (ordered contents):
- Text fields: H2 `Usage` → H2 `Choosing text fields` (decision guidance incl. "Using both text field variants on the same screen") → H2 `Anatomy` with an H3 **per part** (`Containers`, `Label text`, `Adjacent label`, `Required text indicator`, `Input text`, `Prefix text`, `Suffix text`, `Supporting text & character counter`, `Error text`, `Error icon`, `Icons & images`, `Read-only fields`) → H2 `Adaptive design` (`Density`, "Avoid applying density by default").
- Dialogs: H2 `Usage` (H3 `Similar components` — cross-links to snackbar/menus etc.) → H2 `Anatomy` (per-part H3s: `Container and scrim`, `Headline (optional)`, `Buttons`) → per-variant H2s (`Basic dialog`, `Full-screen dialog`) with behavioral H3s (`Saving selections`, `Confirmation`, `Dismissing`, `Error messages`, `Navigation`) → H2 `Adaptive design` (`Medium window size`, `Expanded window size`) → H2 `Behavior` (`Appearing`, `Position`, `Scrolling`).
- Canonical Guidelines skeleton: **Usage → when-to-choose → Anatomy (element-by-element) → variant behavior → Adaptive design → Behavior**, saturated with captioned figures (70 on text fields alone) including the Do/Don't pairs.

**Accessibility tab** (ordered contents — identical skeleton on text fields and checkbox):
1. H2 `Use cases` — a "User should be able to:" capability checklist ("Navigate to and activate a text field with assistive technology", "Receive and understand supporting text and error messages").
2. H2 `Interaction & style` — how visual affordances serve AT/low-vision users.
3. H2 `Keyboard navigation` — a two-column `Keys | Actions` table ("Tab | Focus lands on (non-disabled) text field").
4. H2 `Labeling elements` — naming/ARIA guidance.
(Checkbox inserts an extra density-warning H2 between 2 and 3.)

## Specs-tab token-level model

The `Tokens & specs` section embeds a bespoke interactive widget (Angular custom elements: `token-viewer` > `token-viewer-nav`, `panel-list-search`, `token-viewer-context-selector`, `display-groups`, `display-group-item`). Its structure:

- **Toolbar** (aria-labels verbatim): `Token set selector` — a dropdown per component-variant ("Text field - Filled"); `search` across tokens; `Toggle previews` (visibility icon — show/hide rendered swatches); `Toggle view` (grid vs list); `Toggle expand all`; a column header `Token`; and a **context selector** reading `Default, Light` (switch theme scheme/context and every resolved value updates).
- **Enumeration hierarchy** (three levels, collapsible folders):
  1. **State group**: `Enabled`, `Disabled`, `Hovered`, `Focused`, `Error`.
  2. **Element subgroup** within each state: `Enabled / Container`, `Enabled / Label text`, `Enabled / Leading icon`, `Enabled / Trailing icon`, `Enabled / Active indicator`, `Enabled / Supporting text`, `Enabled / Input text`, `Enabled / Caret`… (35 group nodes for one text-field variant).
  3. **Token rows** within each element: human-readable name + live preview + resolved value — "Filled text field container color → #E6E0E9", "Filled text field container height → 56dp", "Filled text field label text font → Roboto".
- **Every row is backed by a formal design-token id** exposed via tooltip/expansion with a `Copy token name` button: `md.comp.filled-text-field.container.color`, `md.comp.filled-text-field.label-text.populated.size`, `md.comp.filled-text-field.leading-icon.color`. Naming grammar: `md.comp.<component[-variant]>.<element>.<attribute>[.<state-or-modifier>]`. Rows whose value isn't fully token-driven carry a `warning` marker (e.g. the 56dp container height).
- So the coverage matrix is **state × element × attribute**, exhaustive, with copyable machine names — this token-level exhaustiveness is unique among reference doc systems.

Static sections complement the widget:
- **Anatomy**: a diagram with numbered callouts + a numbered legend caption naming every part, with optionality marked: "Container, Leading icon (optional), Label text in empty field, Label text in populated field, Trailing icon (optional), Focused active Indicator, Caret, Input text, Supporting text (optional)".
- **Color**: same numbered-callout convention but mapping parts to color *roles*, not hex: "Filled text field color roles used for light and dark schemes: Surface container highest, On surface variant, … Primary…".
- **States**: a figure matrix crossing state × content: "Enabled (empty), Focused (empty), Hovered (empty), Disabled (empty), Enabled (populated), Focused (populated)…".
- **Measurements**: plain two-column `Attribute | Value` HTML tables ("Default container height | 56dp", "Left/right padding without icons | 16dp", "Icon alignment | Vertically centered") — note attribute rows also capture *alignment rules*, not just dimensions.
- **Configurations**: layout permutations (e.g. with/without icons, text area).

## Do/Don't imagery convention

Markup-verified structure (text fields + dialogs guidelines):

- A figure (`mio-figure`) = example image + caption. Normative captions begin with a `<span class="caption-label do">` or `<span class="caption-label dont">`: a **check icon + "Do"** (green) or **close icon + "Don't"** (red), followed by **one imperative sentence**, occasionally a second rationale sentence ("Don't truncate label text. Keep it short, clear, and fully visible.").
- Deployed two ways: (1) **side-by-side pairs** stating the same rule positively then negatively — "Do — When using both variants of text fields in a UI, separate them by region" / "Don't — …don't use both next to each other or within the same form"; (2) **standalone Don'ts** where only the anti-pattern needs an image ("Label text shouldn't take up multiple lines").
- A **third label tier exists: `Caution`** (exclamation icon) for conditional/edge-case advice rather than hard rules (long error messages wrapping to multiple lines).
- Labeled figures are the minority: text-fields Guidelines has ~70 figures, only 8 carry Do/Don't labels; the rest are neutral illustrations with plain descriptive captions. The label is what makes a figure *normative*.

## Page dissections

Tab presence note: **all four tabs (Overview, Specs, Guidelines, Accessibility) were present on every component checked** — text fields, menus, dialogs, checkbox, sliders, buttons (tab links extracted from the rendered DOM for text fields, menus, checkbox, sliders; standard tab bar observed on dialogs and buttons).

**1. Text fields — https://m3.material.io/components/text-fields/{overview,specs,guidelines,accessibility}** (all four dissected)
- Overview: hero + 5 takeaway bullets ("Two variants: filled and outlined", "The text field's state (blank, with input, error, etc) should be visible at a glance") → variant strip (Filled/Outlined) → `Availability & resources` (5 rows, all "Available") → `Differences from M2` → Up next: Specs.
- Specs: `Tokens & specs` viewer (state → element → token rows; `md.comp.filled-text-field.*`), then per-variant H2s each with color / states / error states / measurements / configurations; 32 figures; 2 measurement tables.
- Guidelines: Usage → Choosing text fields → Anatomy with 12 per-part H3s (down to `Prefix text`, `Error icon`, `Read-only fields`) → Adaptive design/Density; 70 figures, Do/Don't pairs + one Caution.
- Accessibility: Use cases → Interaction & style → Keyboard navigation (`Keys | Actions`) → Labeling elements.

**2. Menus — https://m3.material.io/components/menus/{overview,specs}** (two tabs dissected; all four present)
- Overview: hero → `Availability & resources` (adds an extra row vs text fields: `Jetpack Compose: Expressive`) → `M3 Expressive update` → `Differences from M2`.
- Specs (post-Expressive layout): `Variants` (Vertical menus / Baseline variant) → `Configurations` → `Tokens & specs` → `Anatomy` → `Color` (Standard colors / Vibrant colors) → `States` → `Measurements` → repeated block `Menu (baseline)` with its own anatomy/color/states/measurements/configurations. Shows the pattern of *re-running the full spec model per variant on one page*.

**3. Dialogs — https://m3.material.io/components/dialogs/guidelines** (deep) 
- Guidelines: Usage (+ `Similar components` cross-links) → Anatomy (`Container and scrim`, `Headline (optional)`, `Buttons`) → per-variant sections (Basic dialog; Full-screen dialog: Saving selections / Confirmation / Dismissing / Error messages / Navigation) → Adaptive design (Medium/Expanded window size) → **`Behavior`** (Appearing / Position / Scrolling) — the closest M3 gets to headless-style interaction semantics, and it's prose+figures, not tables.
- Do/Don't verified here too: "Do — Use dialogs for prompts that block an app's normal operation…" / "Don't — Don't use dialogs for low- or medium-priority information…".

Spot-checks: **Checkbox** overview (hero → Availability & resources → Differences from M2) and accessibility (Use cases → Interaction & style → density caution → Keyboard navigation → Labeling elements); **Sliders** overview (adds `M3 Expressive update` + `Previous updates` with dated "Visual refresh…" entry); **Buttons** overview (6 takeaway bullets; 5-variant strip; resource table with Expressive rows and one "Unavailable" status).

## One-guidance-many-implementations model

One guidance layer fans out to N implementations via the `Availability & resources` table on every Overview tab — columns `Type | Resource | Status`:

- Type `Design`: `Design Kit (Figma)` → figma.com/community/file/1035203688168086460 (one shared community file for the whole system).
- Type `Implementation` (buttons, verbatim rows): `Flutter` → api.flutter.dev (useMaterial3); `Jetpack Compose` → developer.android.com/develop/ui/compose/components/button; `Jetpack Compose: Expressive` → androidx.compose.material3 API reference; `Android Views (MDC-Android)` → github.com/material-components/…; `Web` → material-web; `Web: Expressive` → status **Unavailable**.
- Status is a per-platform chip (`Available` / `Unavailable`) — the guidance page honestly tracks implementation lag per platform, including for sub-flavors (Expressive).

Key property: the guidance layer contains **zero per-framework code**; it links out to each platform's own docs/repos, which in turn cite the spec URL back. The Figma design kit is listed as a peer "implementation" of the same spec. The `Develop` top-level section is the reverse bridge (per-platform landing pages).

**Inline interactive demos:** contrary to older iterations of this site, I found **no embedded interactive component demos** on any of the six components' pages (checked DOM for demo/iframe elements). Current interactivity = animated heroes with play/pause, the interactive token viewer, and a `theme-provider` element that themes rendered figures. Worth knowing before citing M3 as the "inline playground" reference — today that's not what it does.

## Worth stealing for a headless React library's Storybook docs

- **The six purpose categories as story hierarchy** — "Action, containment, communication, navigation, selection, and text input" (verbatim from the index). Grouping Base UI stories by *what the component is for* (Menu under actions, Dialog under containment, Checkbox/Radio/Slider under selection, Field/Input under text input) beats a flat alphabetical sidebar for discovery; M3 proves the taxonomy covers a full component set. Keep an "all components" alphabetical view too — M3's current index shows even Google needed a catch-all.
- **Fixed four-part skeleton per component, same order every time** — predictability is the feature; a Storybook autodocs template with fixed section order (Overview → API/parts reference → Usage guidelines → Accessibility) gives the same "you always know where you are" effect, whether as one page with anchors or as tabs.
- **The state × element × attribute matrix with copyable machine names** — the single most transferable idea. Base UI's headless analog is exact: **part (sub-component) × state (`data-*` attribute) × hook (CSS variable / attribute value)**. A generated table per component — every part, its rendered element, every `data-state` it can carry, every CSS variable it exposes, with copy buttons — is the headless equivalent of `md.comp.filled-text-field.container.color`, and it can be generated from source instead of hand-built.
- **Anatomy as numbered enumeration of every part with "(optional)" markers** — maps 1:1 to compound components (`<TextField.Root>`, `.Label`, `.Input`…); an anatomy figure/legend where each callout links to the part's props table would outdo M3 (their callouts don't link).
- **One canonical one-liner per component**, reused verbatim from index to hero — becomes the Storybook `Meta` subtitle and sidebar tooltip; forces clarity.
- **Key-takeaways bullets before any prose** — 4–6 bullets at the top of each docs page; cheap and high-value.
- **Do/Don't as labeled, paired, one-sentence-caption figures + a `Caution` third tier** — in Storybook these can be *live story pairs* instead of images (a "Do" story and a "Don't" story side by side), keeping the caption grammar: icon + label + one imperative sentence.
- **Accessibility tab grammar**: "User should be able to:" capability checklist + `Keys | Actions` keyboard table + "Labeling elements" — directly portable, and Base UI actually implements the keyboard behavior, so the table can be tested against stories.
- **Per-platform/status resource table** — adapt as: framework/router adapters, RSC/SSR support, or per-part "since version" status chips; the honesty of an "Unavailable" chip builds trust.
- **Linear Previous/Up-next pagination** across components and sections — trivial in Storybook, rarely done, makes docs read like a book.
- **"Differences from M2" section** — adapt as "Differences from Radix/@mui/base" or per-release migration deltas on each component page rather than in a global changelog only.

## Skip or heavily adapt

- **dp measurements, color-role mappings, typography values** — the whole *visual* half of the Specs model is meaningless for an unstyled library; keep the enumeration *shape*, swap the payload (data attributes, CSS variables, ARIA output instead of 56dp/#E6E0E9).
- **Visual variant taxonomy** (Filled/Outlined, Standard/Vibrant colors, Expressive) — Base UI has behavioral options, not visual variants; per-variant page repetition would be noise.
- **The bespoke token-viewer widget** — high engineering cost (custom Angular app, search, context switching); a *generated static table* in a Storybook doc block captures 90% of the value. Steal the exhaustiveness, not the widget.
- **Image-first guidance** — most M3 rules live in static annotated images (70 figures/page) with the actual behavior invisible; a component library should demonstrate rules with *live stories* (M3 currently has no inline interactive demos at all — do better, don't copy).
- **Four separate routes per component** — makes sense for m3.material.io's SEO and audience split (designers vs a11y reviewers); in Storybook, four disconnected pages per component fragments search and autodocs — prefer one docs page with a strong TOC, or Storybook tabs, and keep the *order* not the route split.
- **"M3 Expressive update"/versioned-design-system sections** — tied to Google's design-language versioning; only the migration-notes pattern transfers.
- **JS-only SPA delivery** — the raw HTML is literally "This website requires JavaScript."; unscrapable, un-greppable, fragile for tooling (see log). Storybook static builds + published MDX should stay statically readable.
- **Duplicated H1/H2 hero headings and icon-text leakage** (`infoOverview`, `check Do` in extracted text) — cosmetic accessibility/markup wart worth consciously avoiding.

## Reachability log + URLs consulted

The site is an Angular SPA; every route serves the same ~62KB shell. Honest accounting of routes tried:

**Failed / empty:**
- `WebFetch` on `https://m3.material.io/components`, `/components/text-fields/overview`, `/components/text-fields/specs`, `/components/text-fields/guidelines` → title-only ("Text fields – Material Design 3"), zero body content. Confirmed: no SSR content comes through, not even partially.
- `curl -sL https://m3.material.io/components/text-fields/specs` → 61,753-byte shell; only text content: "This website requires JavaScript." Assets: `/static/angular/{runtime,polyfills,vendor,main}.*.js`. Grepped for `__NEXT_DATA__`, `AF_initDataCallback`, inline JSON payloads → none; content is fetched client-side (preconnects to firebasestorage.googleapis.com / lh3.googleusercontent.com). No obvious unauthenticated content API worth chasing.
- Google cache: not attempted — Google retired public cache endpoints (2024); dead route.

**Worked:**
- `WebSearch` with `site:m3.material.io …` → good for route discovery (confirmed `/specs`, `/guidelines`, `/accessibility` URLs exist across components: menus, cards, search, date-pickers) and for corroborating the purpose-category names via snippets/third-party summaries; useless for page anatomy (snippets too thin).
- **`claude-in-chrome` MCP driving a local Chrome tab — the primary successful route.** Rendered-DOM extraction via `get_page_text` + `javascript_tool`. Caveats found: needs ~3–5s wait after each in-app navigation (one extraction on dialogs came back empty at 3.5s, succeeded at +5s); `get_page_text` is unreliable mid-render and strips heading structure, so DOM queries (h1–h4 walk, TreeWalker text search, aria-label/title harvesting) were the reliable method; formal token names (`md.comp.*`) are not in visible text — recovered from `title`/aria attributes ("Copy token name" buttons); the token viewer uses light-DOM Angular custom elements (no shadow roots), expandable via clicking its `expand_all` control.

**URLs consulted (method → outcome):**
- https://m3.material.io/components — WebFetch ✗ / browser ✓ (index groups, purpose sentence, header nav)
- https://m3.material.io/components/text-fields/overview — WebFetch ✗ / browser ✓
- https://m3.material.io/components/text-fields/specs — WebFetch ✗, curl ✗ (shell) / browser ✓ (token viewer expanded and harvested)
- https://m3.material.io/components/text-fields/guidelines — WebFetch ✗ / browser ✓ (do/don't markup verified)
- https://m3.material.io/components/text-fields/accessibility — browser ✓
- https://m3.material.io/components/menus/overview — browser ✓ (resource links harvested)
- https://m3.material.io/components/menus/specs — browser ✓
- https://m3.material.io/components/dialogs/guidelines — browser ✓ (needed longer render wait)
- https://m3.material.io/components/checkbox/overview — browser ✓
- https://m3.material.io/components/checkbox/accessibility — browser ✓ (tab order + pagination verified)
- https://m3.material.io/components/sliders/overview — browser ✓
- https://m3.material.io/components/buttons/overview — browser ✓ (resource table incl. "Unavailable" status)
- WebSearch queries: `site:m3.material.io components text fields specs …`, `site:m3.material.io "interactive demo"`, `m3.material.io components categories "Actions" "Communication" "Containment" "Selection" "Text inputs"` — URL discovery + category corroboration only.
