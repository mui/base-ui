# Adobe Spectrum + React Spectrum/Aria — documentation anatomy

Structural study of how Adobe documents components across layers. Sources: 6 React Spectrum v3 pages (TextField, Picker, ComboBox, Dialog, Tooltip, Menu), 3 React Aria pages (classic Menu via Wayback; current ComboBox + Select on the new site), 3 Spectrum design pages (Text field, Picker, Tooltip). Method notes: spectrum.adobe.com is fully client-rendered (WebFetch returns only the page title), so its section structure was reconstructed from the CMS JSON embedded in the Next.js flight payload of each page — this yields exact section order, sub-item titles, and content-block types. `react-spectrum.adobe.com/react-aria/*` now 301-redirects to `react-aria.adobe.com` with a restructured (leaner) docs site; the classic skeleton was captured from a Wayback snapshot (2025-01-15).

## The two-layer model

Adobe actually runs **three** doc surfaces, cleanly split by concern:

| Layer | Site | Owns |
| --- | --- | --- |
| Design system | spectrum.adobe.com/page/\<component\>/ | What the component is, anatomy, design options, behaviors, do/don't usage rules, i18n (RTL), keyboard interaction spec, theming, changelog |
| Styled implementation | react-spectrum.adobe.com/react-spectrum/\<Component\>.html | Code behavior: controlled/uncontrolled, forms, events, validation, props reference, testing utils; visual options only as prop demos |
| Headless implementation | react-aria.adobe.com (formerly react-spectrum.adobe.com/react-aria/*) | Part anatomy + composition, styling hooks (data-attributes, render props), per-part props, customization/hooks, starter kits |

Cross-linking is systematic, not ad hoc:

- Every React Spectrum page header carries three links: "View guidelines" (→ the spectrum.adobe.com design page), "View repository" (GitHub), "View package" (npm). Inside the "Visual options" section, individual option subsections (Quiet, Help text, Custom width...) each link again to the *specific* design guideline.
- React Aria pages swap the design link for **"View ARIA pattern"** (→ W3C APG pattern) — the headless layer's "spec" is the ARIA pattern, not the design system. This is the right model for a headless library.
- The design layer links back: each Spectrum page's CMS record holds an implementation-resource matrix with public URLs for `spectrum_css`, `react_spectrum_v3` (points exactly at the React Spectrum component page), and `spectrum_web_components` (plus internal corp links for iOS/UWP/etc.). So design → implementation is a per-component, per-platform link table.
- Division of labor is strict: do/don't guidance, content/writing rules, and keyboard *specs* live only in the design layer; the implementation layer never repeats them, it links. Conversely the design layer shows zero code.
- React Spectrum pages link *downward* into React Aria/Stately utilities (`useAsyncList`, `useFilter`) when an example needs data machinery.

## React Spectrum component-page skeleton

Ordered skeleton common to TextField, Picker, ComboBox, Dialog, Tooltip, Menu (v3 docs). Every content section is a live, editable code example with rendered output.

1. **Header block** — H1, one-sentence definition, install/import metadata (package, version, import statement), and the three links (View guidelines / View repository / View package).
2. **Example** — the minimal viable usage, 3–8 lines. No options, no state.
3. **Content** — how children/data are provided. For collection components this explains static vs dynamic collections (`items` prop + render function), with h3s for *Trays* (mobile behavior note) and *Internationalization* (RTL note). For Dialog, "Content" is instead the slot anatomy (labeled diagram + required/optional child components + escalating examples).
4. **Value / Selection** — the controlled/uncontrolled pair (`defaultValue` vs `value`, `defaultSelectedKey` vs `selectedKey`), always shown side-by-side in one example; h3 *HTML forms* (`name`, native form integration).
5. **Labeling** — label/required/necessity-indicator props, with h3s *Accessibility* (aria-label fallbacks) and *Internationalization* (localizing the indicator).
6. **Events** — which callbacks fire and when, demonstrated with state mirrored into the UI.
7. **Capability sections** (collection components only, order varies): Links (+ *Client side routing*), Sections (*Static items* / *Dynamic items*), Complex items (icons/descriptions/avatars via slots), Asynchronous loading, Submenus, Custom filtering, Trigger options.
8. **Validation** — `isRequired`/`validate` with `<Form validationBehavior="native">`.
9. **Props** — exhaustive reference table (columns: Name / Type / Default / Description) partitioned into sub-tables: main props, then **Events**, **Layout**, **Spacing**, **Sizing**, **Positioning**, **Accessibility**, **Advanced** (`UNSAFE_className`/`UNSAFE_style`). Multi-part components get one table per part (Tooltip: TooltipTrigger props + Tooltip props; Menu: Menu + ContextualHelpTrigger + SubmenuTrigger).
10. **Visual options** — one h3 per design option (Quiet, Disabled, Read only, Label alignment and position, Help text, Contextual help, Custom width, Menu state...). This section deliberately mirrors the design page's "Options" list, each linking to its guideline.
11. **Testing** (on some pages: Picker, Tooltip; absent on Menu/TextField at capture time) — pointers to shared testing docs (timers, virtualization, long press) plus **Test utils (beta)**: a page-object-style tester (`SelectTester`) documented with Properties/Methods tables.

Signature ordering idea: *behavior narrative first, API reference late, visual variants last, testing at the very end.* No "Features" bullet section on this layer.

## React Aria component-page skeleton

### Classic skeleton (the one worth studying; captured from the 2025-01-15 Wayback snapshot of Menu.html)

1. **Header** — H1, one-line definition, links: View ARIA pattern (W3C) / View repository / View package.
2. **Example** — minimal composed usage, live and editable.
3. **Features** — 4–8 bullets, each formatted "**Bolded capability** – one sentence of what you get for free." Menu's four: keyboard navigation, item selection, trigger interactions, accessibility ("Follows the ARIA menu pattern..."). Keyboard behavior is *summarized here* rather than in a table (e.g. "arrow keys, along with page up/down, home/end... Typeahead, auto scrolling, and disabled items are supported").
4. **Anatomy** — the headless centerpiece, four artifacts in sequence:
   a. labeled wireframe diagram (SVG) of the composed component;
   b. a prose paragraph naming every part and when parts are optional;
   c. a **composition snippet**: the import line plus a nested JSX skeleton of *all* parts with slots, no props (see Anatomy-diagram conventions below);
   d. h3 **Concepts** — cards linking to architecture guides the component relies on (Menu → Collections, Selection); h3 **Composed components** — cards linking to the standalone docs of parts it reuses (Menu → Button, Popover).
5. **Examples** — gallery of fully styled, realistic examples (distinct from the minimal Example).
6. **Starter kits** — downloadable vanilla-CSS and Tailwind starter projects containing pre-styled copies of every component.
7. **Reusable wrappers** — shows how to wrap the parts into your own single-component API (the "make it look like a monolithic component" recipe).
8. **Usage sections** — same narrative style as React Spectrum: Content → Selection (*Single*/*Multiple*) → Links (*Client side routing*) → Sections (*Static items*/*Dynamic items*/*Separators*/*Section-level selection*/*Accessibility*) → Text slots → Long press → Disabled items → Controlled open state → Submenus (*Static*/*Dynamic*).
9. **Props** — one h3 + table **per part**, in composition order: MenuTrigger, SubmenuTrigger, Button, Popover, Menu, MenuSection, Header, MenuItem, Separator.
10. **Styling** — intro on the styling contract (class names, render props/className functions), then **per part**: a table of UI states with a *CSS selector* column mapping state → data-attribute selector (`[data-hovered]`, `[data-pressed]`, `[data-focus-visible]`, `[data-selected]`, `[data-open]`, `[data-entering]`, `[data-exiting]`, `[data-placement]`, `[data-has-submenu]`, `[data-pending]`...).
11. **Advanced customization** — *Composition*, *Custom children*, *Contexts* (on some pages), *State*, *Hooks* (escape hatch down to `useMenu` et al.).
12. **Testing** — shared testing guidance + **Test utils** (beta badge) with Properties/Methods tables.

### Current react-aria.adobe.com skeleton (post-2025 restructure; ComboBox, Select)

Much leaner: H1 + intro → live example with a **theme/framework switcher** (Vanilla CSS vs Tailwind tabs, exposing full `Component.tsx` + `Component.css` starter source inline) → usage sections (Content [*Autocomplete*, *TagGroup*], Value [*Input value*, *Fully controlled*], Item actions, Forms, Popover) → **API** → **Related pages**. The Features H2 is gone (folded into intro prose); the anatomy diagram + composition snippet survive but now sit at the top of the **API** section rather than under their own H2. Per-part prop tables remain (h3 per part). Keyboard/interaction detail moved almost entirely into linked concept pages — a regression for skimmability, and a reason the classic skeleton is the better reference.

## Spectrum design-page skeleton

Extracted from the CMS payload of text-field, picker, and tooltip — the section set is enforced by the CMS, so it is nearly identical across all components:

0. **Page header** — title, one-line definition, release-status badge (`released`), version number + "view changelog" anchor, hero image, and the implementation-resources link matrix (UI kit downloads, Spectrum CSS, React Spectrum, Spectrum Web Components...). Auto table of contents.
1. **Anatomy** — a single labeled diagram (see conventions below). No prose beyond the image.
2. **Options** — one titled sub-block per design option, each an image + short prose (Text field: Label, Label position, Value, Width, Size, Quiet, Required or optional, Character count, Validation icon, Error, Disabled, Read-only, Help text, Input type). Ends with an auto-generated **Table of options** (columns: Property / Values / Default value) — effectively the designer-facing "props table," with rows like `label`, `is quiet`, `necessity indicator`, `is error` that map 1:1 to React Spectrum props.
3. **Behaviors** — titled sub-blocks for dynamic/layout behavior, image + prose each (Picker: *Minimum width*, *Text overflow*, *Help text overflow*, *Menu height*, *Windows high contrast mode*; Tooltip: *Text overflow*, *Animation*, *Immediate or delayed appearance*, *Warmup and cooldown*).
4. **Usage guidelines** — a list of imperative-titled rules ("Include a label", "Don't place actions inside a tooltip", "Write error text that shows a solution"). Each rule is either prose + illustration or a **do/don't pair**: the CMS stores `image_do`/`image_dont`, `description_do`/`description_dont`, and per-side background colors — rendered as side-by-side cards with green-check "Do" and red-X "Don't" captions. Text-field has 8 such pairs. Content/writing standards live *here* as rules ("Follow capitalization rules") — there is no separate "Content standards" H2 on these pages; deeper writing guidance is a separate site area (the checklist tracks `writing_guidelines`/`content_design` per component).
5. **Internationalization** — usually a single *RTL* sub-block describing mirroring (which decorations flip, which don't).
6. **Keyboard interactions** — a two-column table, **Key / Interaction**, one row per key. Example row shape (Picker): "Space or Down Arrow" → opens the menu and sets focus; rows also encode focus-loop policy ("Does not loop..."). This is the behavioral spec the implementation must satisfy.
7. **Theming** (only where applicable; on text-field and tooltip, not picker) — short intro linking the global Theming page + a "Spectrum for Adobe Express" visual.
8. **Changelog** — table of Date / Version / Notes per page.
9. **Design checklist** — auto-generated completeness matrix from CMS booleans: all interactive states, all color themes, all platform scales, defined behaviors, usage guidelines, i18n guidelines, keyboard interactions, design tokens, generated UI kit, writing guidelines, accessibility-contrast checks...

## Page dissections

### 1. https://react-spectrum.adobe.com/react-spectrum/Picker.html (styled implementation layer)

Headings in order (h2, with h3 nested):

- Example
- Content — *Trays*, *Internationalization*
- Labeling
- Selection — *HTML forms*
- Links — *Client side routing*
- Sections — *Static items*, *Dynamic items*
- Events
- Complex items — *With avatars*
- Asynchronous loading
- Validation
- Props — main table (Name/Type/Default/Description), then Events / Layout / Spacing / Sizing / Positioning / Accessibility / Advanced sub-tables
- Visual options — *Label alignment and position*, *Quiet*, *Disabled*, *Help text*, *Contextual help*, *Custom widths*, *Align and direction*, *Menu state*
- Testing — *Test utils (beta)* with a SelectTester Methods table (open, close, findOption, toggleOptionSelection, getOptions, getTrigger, getListbox...)

Notes: every section is a live editable example; example escalation is static → dynamic → controlled → forms → complex content → async → validation; "Visual options" is a deliberate mirror of the design page's Options list; help-text subsection links straight to the Spectrum guideline.

### 2. https://web.archive.org/web/20250115194304/https://react-spectrum.adobe.com/react-aria/Menu.html (classic headless layer)

Headings in order:

- Example
- Features (4 bullets: keyboard navigation / item selection / trigger interactions / accessible-per-ARIA-pattern)
- Anatomy — labeled SVG diagram → prose → composition snippet → *Concepts* (Collections, Selection) → *Composed components* (Button, Popover)
- Examples
- Starter kits
- Reusable wrappers
- Content
- Selection — *Single*, *Multiple*
- Links — *Client side routing*
- Sections — *Static items*, *Dynamic items*, *Separators*, *Section-level selection*, *Accessibility*
- Text slots
- Long press
- Disabled items
- Controlled open state
- Submenus — *Static*, *Dynamic*
- Props — per part: *MenuTrigger*, *SubmenuTrigger*, *Button*, *Popover*, *Menu*, *MenuSection*, *Header*, *MenuItem*, *Separator*
- Styling — per part with state tables (CSS-selector column; `[data-hovered]`, `[data-selected]`, `[data-open]`, `[data-entering]`/`[data-exiting]`, `[data-placement]`, `[data-has-submenu]`, `[data-pending]`...)
- Advanced customization — *Composition*, *Custom children*, *Hooks*
- Testing — *Test utils* (beta) with Properties/Methods tables

The composition snippet, verbatim shape (this is the single most transferable artifact):

```jsx
import {Button, Header, Keyboard, Menu, MenuItem, MenuSection, MenuTrigger, Popover, Separator, Text} from 'react-aria-components';

<MenuTrigger>
  <Button />
  <Popover>
    <Menu>
      <MenuItem>
        <Text slot="label" />
        <Text slot="description" />
        <Keyboard />
      </MenuItem>
      <Separator />
      <MenuSection>
        <Header />
        <MenuItem />
      </MenuSection>
    </Menu>
  </Popover>
</MenuTrigger>
```

### 3. https://spectrum.adobe.com/page/picker/ (design layer; structure reconstructed from embedded CMS payload)

Sections in CMS sort order, with sub-items:

- Anatomy — one labeled diagram ("Picker anatomy")
- Options — Label, Label position, Placeholder, Value, Width, Size, Quiet, Required or optional, Menu container, Error, Disabled, Read-only, Help text (description and error message); then auto-generated Table of options (Property / Values / Default value)
- Behaviors — Minimum width, Text overflow, Help text overflow, Menu height, Windows high contrast mode
- Usage guidelines — Include a label; Review label-less designs; Keep menu items concise; Choose an appropriate width; Follow capitalization rules; Mark the minority of pickers in a form as required or optional; Use help text to show context; Switch help text with error text; Write error text that shows a solution (each with do/don't imagery where applicable)
- Internationalization — RTL
- Keyboard interactions — Key/Interaction table, 4 rows (open with "Space or Down Arrow", select with Space, move focus with Up/Down Arrow — explicitly "does not loop", close with Esc)
- Changelog — Date/Version/Notes entries
- Design checklist — auto-generated matrix

Notes: no Theming section on this particular component; the same nine-section frame otherwise matches text-field and tooltip exactly, confirming the CMS-enforced template.

## Anatomy-diagram conventions

- **Named labels with leader lines, not numbered callouts.** Both layers label parts by *name* directly on the diagram. Spectrum design diagrams: the text-field anatomy image's own alt text describes it as "illustrating through labels the component parts... field, label, required asterisk, value, character count, validation marker, and help text." React Aria diagrams label *parts you will render*: for Menu — Menu Trigger, Popover, Menu, Section, Section header, Menu item, Menu item label, Menu item description, Menu item keyboard shortcut; for Select — Label, Button, Value, Popover, ListBox, Item (label + description), Section (header), Help text (description or error message).
- **The two layers label different vocabularies.** Design anatomy labels *visual* pieces (required asterisk, validation marker); headless anatomy labels *composable API parts* — every label corresponds to an exported component or slot. That correspondence is the whole point: the diagram doubles as an API map.
- React Aria diagrams are inline SVGs of a grayscale wireframe of the rendered component with muted styling (no brand styling), so the labels are the visual emphasis. Each carries an accessible prose alternative ("Shows a menu component with labels pointing to its parts, including...").
- **Diagram → prose → code triplet.** The React Aria anatomy always chains: labeled diagram, a paragraph stating which parts are optional/required and how labeling works, then the composition JSX snippet listing every part in nesting order with slots. Reader sees the same anatomy three times in three notations.
- Design anatomy sits at position 1 of the page (before Options); classic React Aria anatomy at position 4 (after Example and Features); the new React Aria site moved it to the top of the API reference.

## Worth stealing for a headless React library's Storybook docs

- **The anatomy triplet (diagram → prose → bare composition snippet)** — React Aria's most distinctive move and the most transferable to Base UI, whose components are also part-composed (`Menu.Root`, `Menu.Trigger`, `Menu.Popup`...). A props-free JSX skeleton of all parts is the fastest possible mental model, and in Storybook it can live at the top of an MDX docs page or as a dedicated "Anatomy" story.
- **Features bullets immediately after the first example** ("**Capability** – one sentence"), including one bullet summarizing keyboard support and one naming the ARIA pattern followed. It answers "why not build this myself?" in 20 seconds — exactly the question a headless library's docs must answer.
- **"View ARIA pattern" as a first-class header link.** For a headless library the W3C APG pattern is the spec; linking it up top delegates interaction rationale instead of restating it.
- **Per-part props tables, ordered by composition nesting** — never one merged table. Base UI's parts map 1:1 to this; in Storybook this argues for one ArgTypes/props block per part on the component docs page.
- **Per-part styling-state tables mapping state → data-attribute selector** (`[data-open]`, `[data-pressed]`, `[data-entering]`...). For unstyled components the data-attribute contract *is* the styling API; documenting it as a table per part is far more usable than prose. Base UI already exposes such attributes — tables like this belong next to each part.
- **Controlled/uncontrolled always documented as a pair** (`defaultX` vs `X` in one example section named "Value"/"Selection"/"Open state"). A consistent, predictable slot in every page.
- **The keyboard Key/Interaction table (from the design layer).** Adobe keeps it on the design side; a headless library has no design side, so pull it into the component page — it doubles as the interaction spec and the accessibility statement. Include policy details in the rows (e.g. whether focus loops).
- **"Concepts" / "Composed components" mini-link sections inside Anatomy** — architecture guides (collections, selection, positioning) get linked, not restated, and shared sub-parts link to their own page. Keeps every page short while making the system discoverable.
- **"Reusable wrappers" section** — shows how to collapse the parts into an app-level component. This preempts the biggest headless-library complaint ("so much boilerplate") and is directly writable as a Storybook story.
- **Example escalation ladder** — minimal example → data/content → controlled state → forms/validation → complex content → async — consistently ordered across components, so readers always know where to look. Maps cleanly to an ordered story list in Storybook (each section = one named story).
- **Testing section with page-object test utils tables** — documenting *how to test against the component* (what roles/testids, what timers to advance) next to the component is rare and valuable; Storybook interaction tests could be shown inline as the equivalent.
- **Design checklist / status metadata concept** — a per-component completeness matrix (states documented? keyboard documented? RTL?) is a great internal quality gate for a docs project, even if rendered as a simple badge row.

## Skip or heavily adapt

- **The three-site split itself.** Adobe can afford separate design/styled/headless properties; a Storybook for one headless library should collapse all concerns into one page per component — but *keep the section separation* (usage narrative vs API reference vs styling contract vs keyboard spec) inside that page.
- **Style-prop reference sub-tables (Layout / Spacing / Sizing / Positioning) and `UNSAFE_` escape hatches** — artifacts of React Spectrum's proprietary style-props system. Base UI styles via className/render, so these tables have no equivalent; don't imitate the partitioning, only the main props table.
- **"Visual options" as a section** — it exists to mirror Spectrum's design-option list (Quiet, label position...). A headless library has no visual options; the analogous content is the styling-states/data-attributes documentation instead.
- **Do/don't image pairs and usage guidelines** — the signature design-layer convention (paired do/don't cards with green/red captions) presumes an opinionated visual language. A headless library can't tell users what their select should look like; at most, adapt into sparse "when to use / when not to use" prose (e.g. Picker vs ComboBox) without imagery.
- **Trays/mobile-variant subsections and Adobe Express theming** — Spectrum-product-specific; no equivalent.
- **The CMS-generated boilerplate sections** (Changelog per page, Design checklist, Table of options) — valuable *ideas*, but auto-generated from Adobe's CMS; hand-maintaining them per page would rot. Only adopt if generated from source (e.g. Base UI's API JSON).
- **The new react-aria.adobe.com restructure** (Features gone, anatomy demoted into API, keyboard detail pushed to concept pages) — a warning, not a model: the classic page answered "what do I get / what parts / how do I style each" at a skim; the new layout trades that for starter-kit code volume. Prefer the classic skeleton.
- **Sidebar-heavy monolithic pages** (React Spectrum props tables run to hundreds of rows inherited from HTML/ARIA attributes on the new Aria site — 200+ props for `SelectValue`). Inheriting every DOM prop into the table buries the component's own API; filter generated tables to own-props plus a link for the rest.

## URLs consulted

Fetched and dissected:

- https://react-spectrum.adobe.com/react-spectrum/TextField.html
- https://react-spectrum.adobe.com/react-spectrum/Picker.html
- https://react-spectrum.adobe.com/react-spectrum/ComboBox.html
- https://react-spectrum.adobe.com/react-spectrum/Dialog.html
- https://react-spectrum.adobe.com/react-spectrum/Tooltip.html
- https://react-spectrum.adobe.com/react-spectrum/Menu.html
- https://react-spectrum.adobe.com/react-aria/ComboBox.html → 301 → https://react-aria.adobe.com/ComboBox (current, restructured docs)
- https://react-spectrum.adobe.com/react-aria/Select.html → 301 → https://react-aria.adobe.com/Select (current, restructured docs)
- https://web.archive.org/web/20250115194304/https://react-spectrum.adobe.com/react-aria/Menu.html (classic React Aria Components skeleton)
- https://spectrum.adobe.com/page/text-field/ (client-rendered; structure extracted from embedded CMS payload)
- https://spectrum.adobe.com/page/picker/ (same method)
- https://spectrum.adobe.com/page/tooltip/ (same method)

Reachability caveats recorded honestly:

- spectrum.adobe.com pages return only a title to plain fetchers; all section/sub-item/do-don't/keyboard-table structure above comes from parsing the page's embedded JSON payload, not rendered HTML. Section order is taken from the CMS `sort` fields, so it is exact.
- The classic React Aria component pages are no longer served live (redirected to the restructured react-aria.adobe.com); the classic skeleton is from the January 2025 Wayback snapshot of Menu.html only — other components' classic pages were not re-verified, though the template was uniform across the library.
- Wayback had no snapshot of the classic react-aria ComboBox.html at the timestamps checked; ComboBox observations for the headless layer come from the current site only.
