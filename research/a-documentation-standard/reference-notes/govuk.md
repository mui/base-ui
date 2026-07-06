# GOV.UK Design System — documentation anatomy

Research notes on documentation STRUCTURE only (section types, ordering, evidence
mechanics). Guidance text is theirs and is not collected for reuse; quotes below are
minimal and only illustrate structural points.

Sources: live pages at design-system.service.gov.uk plus raw page sources at
github.com/alphagov/govuk-design-system (`src/components/*/index.md`) where the live
fetch truncated. Anything unreachable is recorded in "URLs consulted".

## Site-level information architecture

- **Main nav (6 sections):** Get started · Styles · Components · Patterns · Community ·
  Accessibility. Docs proper are the middle three; Community carries the contribution
  and evidence machinery; Accessibility carries statements/strategy.
- **Components** (~35–40, Accordion → Warning text): a **flat alphabetical list**, no
  categories, duplicated in a sidebar nav and in the main content. Defined as
  "reusable parts of a user interface". **No status tags** (no "New"/"Experimental"/
  "WCAG 2.2" badges) on the index at time of research.
- **Patterns**: grouped into three **task-oriented buckets**, named as verb phrases from
  the user's/team's point of view:
  - "Ask users for…" — data-type patterns (Addresses, Bank details, Dates, Email
    addresses, Equality information, Names, National Insurance numbers, Passwords,
    Payment card details, Phone numbers)
  - "Help users to…" — journey patterns (Check answers, Complete multiple tasks,
    Confirm a phone number/email, Create accounts, Exit a page quickly, Navigate a
    service, Recover from validation errors, Start using a service, …)
  - "Pages" — whole-page templates (Confirmation pages, Cookies page, Page not found,
    Question pages, Service unavailable, Step by step navigation, "There is a problem
    with the service" pages)
- **Component ↔ pattern contract**, stated on the indexes: patterns are "best practice
  design solutions for specific user-focused tasks and page types" that "often use one
  or more components and explain how to adapt them to the context". Components are the
  parts; patterns are the decisions and compositions.
- **Styles** is a separate section (colour, typography, spacing, layout) so component
  pages almost never restate visual-design rules — they link out.
- **Community** section IA: "What we're working on" (Upcoming components and patterns,
  Roadmap, What's new) / "Ways to get involved" (Take part in research, Share findings
  about your users, Propose a component or pattern, Develop a component or pattern,
  Propose content changes using GitHub) / "How we work" (Community principles,
  Contribution criteria) / Resources / Events.

## The invariant component-page skeleton

Observed order on every component page dissected (text input, select, radios,
checkboxes, error message, error summary, accordion, button, date input):

1. **H1 + one-line purpose description** — from frontmatter (`description: Help users
   enter information with the text input component`). Frontmatter also carries
   `aliases` (synonyms for search: "text box, text field, input field") and
   `backlogIssueId` (see §Evidence).
2. **Hero example embed** — rendered iframe + "Open this example in a new tab" link +
   collapsed HTML/Nunjucks code tabs. Authored as a one-line shortcode:
   `{{ example({ group: "components", item: "text-input", example: "default", html: true, nunjucks: true, open: false, size: "s", loading: "eager" }) }}`.
   Examples are data, not prose — every example on the site is this same widget.
3. **"When to use this component"** — 1–3 short paragraphs of positive fit criteria.
4. **"When not to use this component"** — always **names the alternative and links it**
   (text input → Textarea; select → Radios; accordion → Details/Tabs). The redirect is
   the point of the section.
5. **"How it works"** — behavioral contract + **one h3 subsection per variant, each with
   its own live example embed** (radios has 7: one-question page, multi-question page,
   inline, items with hints, text divider, conditional reveal, smaller). Form
   components lead with the "one question per page / more than one question" pair
   (legend-as-page-heading convention). Micro-rules live here as h3s too ("Avoid
   placeholder text", "Do not disable copy and paste", "Use the autocomplete
   attribute"), each rule stated with its user-need rationale.
6. **"Error messages"** (form components only) — enumerated h4 failure states with
   fill-in-the-blank templates (see §Error-message guidance model). Sits inside or
   directly after "How it works".
7. **"Research on this component"** — evidence provenance, specific findings, and a
   **"Known issues and gaps"** h3 that discloses failures honestly, then invites
   contributions to the component's backlog issue (see §Evidence).
8. **"Help improve this component"** — *injected by the layout, not authored*: the raw
   markdown ends at "Research…"; the site template appends this section from the
   `backlogIssueId` frontmatter. Two links: the component's GitHub discussion issue +
   a "propose a change" edit-this-page link to the page's own `index.md`.
9. **"Need help?"** — contact link. Then **"Support links"** (site footer).

Cross-cutting conventions: WCAG criteria cited inline where the rule applies (never in
a separate compliance appendix); component pages cross-link to the patterns that
orchestrate them (error message ↔ error summary ↔ validation pattern form a triangle);
JS-dependent components state the no-JS fallback ("users will see all the content
displayed" — accordion).

## Page dissections

### 1. Text input — https://design-system.service.gov.uk/components/text-input/

Headings in document order (verified against raw source
`src/components/text-input/index.md`; frontmatter: `backlogIssueId: 51`):

- H1 Text input + hero example
- When to use this component
- When not to use this component
- How it works
  - Avoid placeholder text
  - If you're asking one question on the page
  - If you're asking more than one question on the page
  - Use appropriately-sized text inputs → Fixed width inputs / Fluid width inputs
  - Hint text → When not to use hint text / Avoid links
  - Numbers → Asking for whole numbers / Asking for decimal numbers / Avoid using
    inputs with a type of number
  - Codes and sequences
  - Prefixes and suffixes → Text inputs with a prefix / Text inputs with a suffix
  - Use the autocomplete attribute
  - Do not disable copy and paste
  - Avoid restricting the length of a user's input
  - How and when to spellcheck a user's input
  - Error messages → **14 h4s**: one formatting note ("If the input has a prefix or a
    suffix") + **13 enumerated failure states** (empty · too long · too short ·
    min+max · disallowed chars (known) · disallowed chars (unknown) · not a number ·
    not a whole number · too low · too high · between two numbers · money needing
    decimals · money that must not have decimals)
- Research on this component
- (injected) Help improve this component / Need help? / Support links

Notable moves: micro-rules are headed sections, not bullet asides — each is findable
from the ToC. The "Numbers" subsection embeds evidence by linking the team's blog post
on why they abandoned `input type="number"` — a rule with its receipt attached. Each
sized/prefixed/hinted variant has its own example embed and its own macro-options
table.

### 2. Radios — https://design-system.service.gov.uk/components/radios/

Headings in document order (verified against raw source; frontmatter:
`backlogIssueId: 59`, `aliases: radio buttons, option buttons`):

- H1 Radios + hero example
- When to use this component
- When not to use this component
- How it works
  - If you're asking one question on the page
  - If you're asking more than one question on the page
  - Inline radios
  - Radio items with hints
  - Radio items with a text divider
  - Conditionally revealing a related question
  - Smaller radios
  - Error messages → 4 h4s keyed to **question shape**, not component API: "If it's a
    'yes' or 'no' question" / "If there are two options which are not 'yes' and 'no'" /
    "If there are more than two options" / "If it's a conditionally revealed question"
  - Known issues
- Research on this component
- (injected) Help improve this component / Need help? / Support links

Notable moves: every one of the 7 variants has its own live example. The known WCAG
failure is disclosed in plain sight, criterion named: "Users are not always notified
when a conditionally revealed question is shown or hidden. This fails WCAG 2.2 success
criterion 4.1.2 Name, role, value." The research section then scopes the risk from
testing (fine when the revealed question is simple, problematic when multi-part) and
ends with an explicit ask to post findings on backlog issue #59.

### 3. Accordion — https://design-system.service.gov.uk/components/accordion/

Headings in document order (live page):

- H1 Accordion + hero example
- When to use this component
- When not to use this component
- Decide between using accordions, tabs and details
- How it works
- Write clear button text
- Adding a summary line
- Structure section headings with the rest of the page
- Starting with sections open
- Do not disable sections
- Research on this component (findings + "Known issues and gaps")
- (injected) Help improve this component / Need help? / Support links

Notable moves: a dedicated **comparative decision section** ("Decide between using
accordions, tabs and details") sits before "How it works" — the three
show/hide components are documented as one decision space. "How it works" opens with
the no-JS behavior (progressive enhancement contract). Known issues name two specific
AT problems (elements-list navigation in speech-recognition/screen-reader use; summary
lines bloating button text) with deep links to the exact GitHub comment threads
(backlog #1 comment, govuk-frontend #2295 Dragon-testing comment), and explicitly ask
the community for research the team lacks.

Also dissected (not written up in full): **select** (states up front that research
shows it should be a last resort; "when not to use" routes to Radios; has its own
"Research on this component → Known issues and gaps" listing scroll-comprehension
problems, with a video link and backlog issue #60), **checkboxes** (mirror of radios
plus an "Add an option for 'none'" variant and a 3-state error section including the
'none'+other conflict; conditional-reveal WCAG 4.1.2 known issue repeated, discussion
issue #37), **error summary** (behavioral contract page: focus moves to the summary on
load, "Error: " prefixed to `<title>`, per-answer linking rules split by single-field /
multi-field / radio-checkbox targets), **button** (variant ladder with per-variant
examples; disabled buttons actively discouraged unless "research shows" otherwise;
double-submission prevention section), **date input** (12 enumerated error states that
also specify which sub-field to highlight).

## Patterns pages anatomy

Pattern pages share the components' spine — "When to use this pattern" → ("When not to
use this pattern") → "How it works" → "Research on this pattern" → injected "Help
improve this pattern" — but the body is **decision and composition logic across
components** rather than a single element's contract.

### 1. Addresses ("Ask users for… addresses") — /patterns/addresses/

- H2 sections are **three competing solutions**: "Multiple text inputs" / "Address
  lookup" / "Textarea".
- Each solution carries its own mini-skeleton as h3s: "When to use X" / "When not to
  use X" / "How X works" (+ solution-specific extras: "Use the autocomplete attribute
  on multiple address fields", "Allow different postcode formats", per-solution "Error
  messages").
- Each solution has its own example embed; each names the components it composes
  (text input, fieldset, textarea, error message) and links to them.
- Structure = a decision tree flattened into a page: comparative "when to use" logic
  (broad formats → textarea; known countries → multiple inputs) replaces a single
  canonical answer. WCAG 1.3.5 (identify input purpose) cited inline at the
  autocomplete rules.

### 2. Validation ("Help users to recover from validation errors") — /patterns/validation/

- Headings: When to use this pattern / When not to use this pattern / How it works /
  Client side and server side validation / Turn off HTML5 validation / Research on
  this pattern / (injected footer).
- This is the **orchestration layer** for the two error components: show an Error
  summary at the top and move focus to it; show an Error message next to each failing
  field; add "Error: " to the page `<title>`; validate on submit ("Wait until they try
  to move to the next part of the service"), with cautions about inline validation.
- Message-writing guidance is not restated — it links to the error message component
  page. Each layer of the triangle (summary component, message component, validation
  pattern) owns one concern and cross-links the other two.
- Its research section is honest about thin evidence: it cites one historical service
  (passport renewal) and solicits findings on inline validation rather than asserting
  certainty.
- "When not to use" is a scope fence: validation ≠ eligibility-checking, with links to
  the patterns that own those cases.

### 3. Question pages — /patterns/question-pages/ (third dissection, page-template flavor)

- Headings: When to use this pattern / How it works (h3s: Back link · Page headings ·
  Hint text · Asking complex questions without using hint text · Asking multiple
  questions on a page · Continue button · Using progress indicators · Using range
  sliders; h4: "Start by asking one question per page") / Help improve this pattern.
- Prescribes a **page-level composition**: back link + question-as-page-heading +
  continue button, with ~5 example embeds showing complete assembled pages, each
  cross-linking the components used.
- Includes "don't" subsections for whole widget classes (progress indicators, range
  sliders) — the pattern page is where anti-recommendations about composition live,
  keeping component pages free of journey-level caveats.

## Evidence & process culture

- **"Research on this component" anatomy** (recurring shape):
  1. *Provenance* — where the design has been validated ("tested with all types of
     users in live services, including tax credits" — error message page).
  2. *Specific findings* — concrete, often quantified anecdotes tied to a named
     service (date input: a teacher-training service saw hundreds of users typing
     month names; accepting them cut errors — with a deep link to the exact backlog
     comment; button: green start buttons improved click-through).
  3. *"Known issues and gaps"* (h3) — honest failure disclosure, including admitted
     WCAG non-conformance: radios and checkboxes both state the conditional-reveal
     pattern "fails WCAG 2.2 success criterion 4.1.2 Name, role, value". Select admits
     users don't realize lists scroll. Accordion names two AT problems and says the
     team lacks research on one of them.
  4. *Call to contribute* — "tell us what you've learned by adding a comment to the
     discussion about this component", linking the backlog issue.
- **The research backlog**: one **long-lived GitHub issue per component/pattern** in
  `alphagov/govuk-design-system-backlog` (accordion #1, date input #42, error summary
  #46, error message #47, text input #51, radios #59, select #60…). Radios' issue was
  opened January 2018; body is one line ("Use this issue to discuss this component…")
  plus labels (`component`, `published`) and a project-board status — **the comment
  thread is the archive**. Docs pages deep-link to individual comments as citations.
- **Wiring**: the per-page `backlogIssueId` frontmatter key drives the injected "Help
  improve this component" footer (discussion link + edit-this-page PR link). The
  feedback loop costs authors one integer per page.
- **Research submission template** (community/share-research-findings/): teams paste a
  three-part template into the backlog issue — **Insights** (what helped/hindered,
  metrics, screenshots of their implementation) / **Methods** (which service, when,
  qual vs quant, whether users with access needs and which assistive technologies) /
  **More information** (prototypes, documents) — plus consent/no-PII rules.
- **WCAG citation style**: inline, at the exact rule they justify, always number +
  name (+ level) hyperlinked to the W3C Understanding doc — e.g. "[WCAG 2.2 success
  criterion 1.4.3 Contrast (minimum), level AA]". Never a compliance appendix.
- **Status/maturity signaling**: no per-component badges on the index today. Lifecycle
  lives in the Community section (Upcoming components and patterns / Roadmap / What's
  new) and in the backlog project board ("Published"). During the WCAG 2.2 transition
  the site ran labelled **WCAG 2.2 callout boxes** on affected pages, then **retired
  them** after the October 2024 public-sector compliance deadline — /accessibility/
  wcag-2.2/ is now an archived notice ("We have retired WCAG 2.2 callouts and guidance
  across the Design System website"). Pattern: time-boxed migration signaling with an
  explicit retirement, folded back into normal guidance.
- **Contribution criteria as quality gates**: proposals must be **Useful** (evidence
  many teams need it) and **Unique**; publication additionally requires **Usable**
  (tested with representative users including disabled users), **Consistent**, and
  **Versatile** (works across services, browsers, assistive tech, devices). Two-stage
  review (proposal, then pre-publication).
- **Evidence-first rhetoric inside guidance**: prohibitions default-on with a research
  escape hatch — disabled buttons: "Only use disabled buttons if research shows it
  makes the user interface easier to understand."

## Error-message guidance model

A three-layer system, each layer owning one concern:

1. **Error message component page** — the writing rulebook. Rule sections (topics):
   match messages to the label/legend; be clear and concise; be consistent; be
   specific; use instructions vs descriptions; reuse templates; plus a **"Track
   errors"** section telling teams to measure how often each message is seen so they
   can improve content, A/B test, or redesign the journey. Also documents the hidden
   "Error:" prefix for screen readers and per-input placement (label vs legend).
2. **Validation pattern page** — the page-level choreography: summary at top + focus
   moved to it, message at each field, "Error: " in `<title>`, validate on submit.
3. **Per-component "Error messages" sections** — exhaustive failure-state enumeration.

The per-component structural template:

- One **h4 per failure state**, phrased as a condition: "If the input is empty", "If
  the date is in the future when it needs to be in the past", "If users check both a
  'none' checkbox and another checkbox".
- Under each: an imperative **fill-in-the-blank template with [square-bracket]
  placeholders**, then a concrete example. Shape: "Say 'Enter [whatever it is]'. For
  example, 'Enter your first name'." / "[whatever it is] must be [number] characters
  or less".
- For composite inputs (date input), each state also specifies the **highlight
  target**: "Highlight the day, month or year field where the information is missing"
  — the template is (which part to mark, what to say).
- Enumeration is keyed to **input semantics, not component API**: text input has 13
  states (length, character-set, numeric-range, money variants); date input 12
  (relative-date logic: before/after/between other dates); radios keys on question
  shape (yes/no vs two options vs many vs conditional); checkboxes covers the
  'none'-exclusivity conflict.
- Coverage is meant to be total: a service team should never have to invent an error
  message for a standard component from scratch.

## Worth stealing for a headless React library's Storybook docs

- **An invariant per-component skeleton, enforced.** Readers learn the map once; gaps
  become visible (a missing "known issues" section is a lie of omission). Transfers
  directly to a Storybook docs-page template / autodocs layout.
- **"When not to use" that always names and links the alternative.** Base UI has real
  confusable pairs (Select vs Combobox vs Menu; Dialog vs AlertDialog vs Popover;
  Toggle vs Checkbox vs Switch). Routing users at decision time is the highest-value
  sentence on the page, and it's cheap.
- **One variant/state = one subsection = one live example.** Maps one-to-one onto "one
  story per variant/state". The discipline that *every* documented behavior has a
  rendered, inspectable instance is the core of their example culture — and Storybook
  is literally built for it.
- **Enumerated failure/edge states per component.** Adapted: instead of UK error copy,
  enumerate component *states and wiring* exhaustively — every `data-*` state, every
  validation state of Field/Form, every focus/dismiss edge of overlays — each as an
  "If …" heading with a story. The exhaustive-enumeration shape transfers; the copy
  doesn't.
- **Honest "Known issues and gaps" with the exact criterion/bug named and a tracking
  link.** For a headless lib: name the WAI-ARIA APG deviation, the browser/AT bug, or
  the open GitHub issue inline. Admitting a WCAG failure in the docs builds more trust
  than any conformance badge.
- **Inline WCAG citations (number + name + level + link) at the exact rule they
  justify.** Headless libraries sell accessibility; citing the criterion where the
  behavior is documented (focus trap → 2.1.2 No keyboard trap) is far stronger than a
  generic "accessible" claim.
- **Frontmatter-driven feedback loop** (`backlogIssueId` → injected "help improve"
  footer). Storybook equivalent: a per-component parameter holding the GitHub
  discussion/issue URL, rendered by a shared docs block. One integer per page buys a
  permanent research channel.
- **One long-lived discussion thread per component, deep-linked from docs as
  citations.** Turns issue threads into an evidence archive rather than a support
  queue; docs can cite specific comments the way GOV.UK cites backlog comments.
- **Every rule carries its rationale.** "Don't X because [user need / technical
  consequence]" — for a headless lib the rationale is often an AT behavior, React
  constraint, or browser quirk. Prevents cargo-cult guidance and survives API churn.
- **Patterns/recipes as a separate doc genre** composing components toward a task
  ("Build a multi-step form", "Filterable listbox"), with its own when-to-use logic
  and links back to the components. Keeps composition caveats out of component pages.
- **Comparative decision pages** for confusable component families (their
  accordion/tabs/details section) — a single place that owns the "which one?"
  question.
- **No-JS/degradation contract stated per component** → transfers as SSR/hydration/
  no-CSS behavior notes, the headless equivalent of progressive enhancement.
- **Example embeds as data (shortcode with knobs)** — every example is the same widget
  with `html/nunjucks/open/size` parameters. Storybook stories + a standard preview
  block already are this; the lesson is to allow *zero* bespoke example plumbing.

## Skip or heavily adapt for a headless library

- **Concrete visual style rules** (crown branding, GOV.UK typography/colour classes,
  fixed-width input classes). Base UI is unstyled; there is no house style to
  legislate. The analogous section is "styling hooks" (`data-*` attributes, CSS parts),
  not visual rules.
- **Literal error-message copy templates.** Their fill-in-the-blank strings are a
  content-design language for one government voice. A headless lib documents the
  *mechanism* (Field.Error wiring, `validityData`, when messages render) and leaves
  copy to the product. Steal the enumeration shape, not the sentences.
- **User-research provenance claims** ("tested in live services with tax credits").
  A component library can't honestly claim service-scale research; the transferable
  evidence currency is APG conformance, AT test matrices, browser-bug links, and
  production-usage reports from downstream apps — same honesty, different receipts.
- **HTML/Nunjucks dual code tabs.** Base UI is React-only; the analogous toggle is
  CSS Modules vs Tailwind styling variants (as the docs already do), or JS/TS.
- **Service-journey guidance** (one thing per page, question pages, check-answers
  flows, GDS form design). This is government service IA, upstream of a component
  library's scope; at most it becomes a short "recipes" genre, not a doctrine.
- **The "Ask users for…" taxonomy.** Organizing docs by citizen data types (National
  Insurance numbers, equality information) is domain-bound. The bucket *idea*
  (task-verb grouping) transfers; the buckets themselves don't.
- **Flat alphabetical component nav.** Works at 40 server-rendered pages; Storybook
  already has hierarchical sidebars and Base UI has an established grouping — keep it.
- **Time-boxed compliance callouts** (their retired WCAG 2.2 boxes) — only worth
  copying *with* the retirement plan; otherwise they rot. For a library, version-
  migration callouts with a scheduled removal are the closer analogue.
- **Macro options tables** (their Nunjucks API reference embedded mid-page). For a
  typed React library, generated props tables already exist; interleaving full API
  tables into guidance pages would duplicate the API reference — link instead.

## URLs consulted

Live site (fetched successfully):

- https://design-system.service.gov.uk/components/ (index)
- https://design-system.service.gov.uk/components/text-input/ (fetched twice; page too
  long — later sections truncated in both fetches; completed via raw source below)
- https://design-system.service.gov.uk/components/select/
- https://design-system.service.gov.uk/components/radios/
- https://design-system.service.gov.uk/components/checkboxes/
- https://design-system.service.gov.uk/components/error-message/
- https://design-system.service.gov.uk/components/error-summary/
- https://design-system.service.gov.uk/components/accordion/
- https://design-system.service.gov.uk/components/button/
- https://design-system.service.gov.uk/patterns/ (index)
- https://design-system.service.gov.uk/patterns/addresses/
- https://design-system.service.gov.uk/patterns/validation/
- https://design-system.service.gov.uk/patterns/question-pages/
- https://design-system.service.gov.uk/community/
- https://design-system.service.gov.uk/community/contribution-criteria/
- https://design-system.service.gov.uk/accessibility/wcag-2.2/ (now an archived
  retirement notice for the WCAG 2.2 callout program)

Raw page sources (GitHub, fetched successfully):

- https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/text-input/index.md
- https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/radios/index.md
- https://raw.githubusercontent.com/alphagov/govuk-design-system/main/src/components/date-input/index.md

Research backlog:

- https://github.com/alphagov/govuk-design-system-backlog/issues/59 (Radios
  discussion; issue body + labels visible, comment thread not fully rendered in fetch)
- (Referenced from pages, not fetched: backlog issues #1 accordion, #37 checkboxes
  conditional-reveal, #42 date input, #46 error summary, #47 error message, #51 text
  input, #60 select; alphagov/govuk-frontend#2295)

Unreachable / dead ends (recorded honestly):

- https://design-system.service.gov.uk/accessibility/wcag/ — 404 (correct path is
  /accessibility/wcag-2.2/, which is itself archived).
- https://design-system.service.gov.uk/community/share-findings-about-your-users/ —
  404; correct URL is
  https://design-system.service.gov.uk/community/share-research-findings/ (template
  structure obtained via search-result summary of that page, not a direct fetch).
- Text-input live page: later sections (Error messages, Research) unreachable via
  WebFetch due to page-length truncation; reconstructed from the raw GitHub markdown
  source instead.
