# Phase E coverage — FINAL (2026-07-07 late evening)

**Definitive verification** (run at close-out, after the last fix):
- `npx vitest --project storybook run` → **40 files passed, 337/337 tests passed**
- `pnpm build-storybook` → completed successfully
- `npx tsc -p tsconfig.json --noEmit` → clean, exit 0 (library source graph included)
- Repo gates (verified at the earlier close-out; no library/docs source touched since): `pnpm typescript` (tsgo -b) clean; `pnpm test:jsdom Switch --no-watch` green.

**Coverage floor: MET library-wide** — every one of the 37 components has ≥1 vitest-verified story + a DoD-shaped MDX docs page; all 4 documented utils covered (csp-provider is MDX-only by design — it renders nothing).

## Per-component story counts

Tier-1 deep sets (per-component agents): switch 7 (pilot, incl. the single project-wide CssCheck) · select 29 (3 recreations) · menu 28 (3 recreations) · popover 30 (3 recreations) · dialog 24 (2 recreations) · autocomplete 22 · combobox 26 · toast 21 · field 18 · form 10 · navigation-menu 17 · drawer 17.

Floor batches (counts per batch report, sums verified against the 337 total):
- status four (progress/meter/avatar/separator): 14
- disclosure trio (accordion/collapsible/tabs): 10
- binary family (radio/checkbox/checkbox-group): 11
- actions four (button/toggle/toggle-group/toolbar): 10
- hover-cards + scroll (tooltip/preview-card/scroll-area): 11
- overlay variants (alert-dialog/context-menu/menubar): 8
- numeric trio (number-field/slider/otp-field): 14
- input + fieldset + utils (input/fieldset/direction-provider/merge-props/use-render): 10; csp-provider: MDX only

All story files carry `tags: ['ai-generated']` — every `needs-work` tag was stripped only after its file's vitest run went green. Every overlay component has at least one full open/close interaction play; portal content is asserted via `within(canvasElement.ownerDocument.body)` throughout.

## Final fixes at close-out

- toast.stories.tsx: `StoryObj<typeof meta>` demanded the required `toast` prop, which is only ever supplied by the Provider scaffold — Story type untyped on args (all stories render-based).
- navigation-menu.stories.tsx: `LinkCards` prop widened from one `as const` array's literal type to the structural link shape.

## Known caveats (honest)

- MDX pages are compile+build-verified; only switch's page was visually spot-checked in the browser. A visual pass over the other 40 pages is a follow-up.
- Full ranked/annotated real-world datasets exist for select/dialog/menu/popover only (compression decision); other components have candidates-only or honest-empty datasets.
- One reproducible upstream-or-tooling finding filed during authoring: NavigationMenu.Link with a render-composed child hangs the vitest browser (worked around; follow-up chip filed).
- Gesture interactions (drawer swipe, number-field scrub, toast swipe) are rendered and documented but not play-driven — pointer-capture gestures aren't reliably testable in this harness.


## POLISH STATE (2026-07-08, rev. 8 — correct-component highlights + viewer polish)

Owner feedback: some highlights showed the **wrong component** (Cloudflare Kumo's Radio card spotlighted a Select/combobox; PostHog's Combobox card spotlighted a Menubar), the blue outline + `×N` label were noise, and the viewer/carousel chrome needed tidying. Fixes:

- **No card ever shows the wrong component.** Root cause: the site-level `*::domain` fallback is one landing-page capture of an *arbitrary* component, served to any card on that domain. `lookupHighlight` now **gates the fallback by the capture's `matchedRole`** (recorded per entry): a `combobox`-role landing capture backs a Select card but never a Radio card, etc. Mismatched cards fall back to the GitHub OG card. Fixed kumo/radio, posthog/combobox, mastra·wordpress·shadcn·nextjs/select-menu; kept the genuinely-correct graphql/kumo Select landings. (`gen-wild-highlights.mjs` + `wildHighlights.ts`.)
- **Borderless spotlight, name-only label.** The capture overlay dropped the blue outline (component reads via brightness contrast against a slightly stronger dim) and the `×N` suffix (just the component name). Re-captured all targets: **57 per-component highlights + 2 gated site-level (graphql, kumo Select)**; 67 highlight PNGs regenerated. (`capture-highlight.mjs`.)
- **Viewer/carousel polish** (`InTheWild.tsx` + CSS): the **Full page / Component** toggle moved out of the image stage into the footer beside the "N of M" counter (no longer overlays the screenshot); the fullscreen **carousel now contains only capture-backed cards** (OG-fallback cards stay static grid thumbnails, no "View full size" button); and a card whose secondary link is a **GitHub URL now reads "link to code"** instead of "live site".
- Verified: **474/474 storybook tests green** (updated the `in-the-wild` story that asserted the old carousel behavior → `OnlyCapturesInCarousel`), `pnpm build-storybook` green, tsc/eslint/stylelint/prettier clean on touched files, and browser-confirmed against a fresh static build — kumo/radio now OG-fallback (no combobox highlight), 9ui Tabs spotlight borderless, toggle in footer below the image, WordPress card "link to code".

## POLISH STATE (2026-07-08, rev. 7 — multi-instance highlights + live-slug links)

Owner feedback on the highlights (reui checkbox): the box was a huge off-screen wrapper, the label was hidden, base ≠ highlight, and "live site" went to the site root. Fixes in `capture-highlight.mjs` + `InTheWild.tsx`:

- **Highlight the component instances, not the wrapper.** Selectors now target the component itself (ARIA role, e.g. `[role="checkbox"]`, or `data-slot`), and the driver spotlights **every** visible instance (SVG-mask multi-spotlight, up to 24) — so a card shows all occurrences at once (e.g. **Checkbox ×12**). Re-captured all 4 showcase sites: **57 per-component highlights, 47 of them multi-instance.**
- **Label always visible** — anchored to the topmost in-viewport instance and clamped on-screen; shows the instance count.
- **Base = highlight frame** — both shot after scrolling the first instance into view (fixed the "looks like an interaction" wrapper artifact).
- **"Live site" → exact component slug** — `WildCard` links to the registry `pageUrl` (e.g. `reui.io/components/checkbox`) in both the card and the viewer.
- Separators (a 1px line) stay page-only and fall back to the site-level highlight / OG card.

## POLISH STATE (2026-07-08, rev. 6 — per-component docs highlights + TOC fix)

- **Docs TOC now shows section headings.** `docs.toc.headingSelector` set to `h2` in `.storybook/preview.tsx` — components list up to 19 API-part h3s under "API reference" plus many behavior/recreation h3s, which overflowed the sticky TOC and pushed sections like **In the wild** below the fold. The TOC now lists the ~14 top-level sections.
- **Every in-the-wild capture has a highlight.** Per-component pass across the four showcase sites (9ui, reui, coss, lumiui), targeting each component's OWN page + its live demo (`[data-slot=…]` / `[data-slot="preview"]` / `[data-slot="components-preview"]`, discovered per site): **57 per-component highlights**, plus **10 site-level (`*::domain`) landing fallbacks** (kumo covers its 13 cards, + graphql/mastra/nextjs/posthog/wordpress/docx/shadcn/9ui/reui). Total **67 highlights**. Wiring: a generated `shared/wildHighlights.ts` registry keyed by `component::domain` (+ `*::domain` fallback) and a `component` prop on `<WildCards>`; `WildCard` auto-attaches the highlight. **Enforcement:** a card with a screenshot but no highlight now falls back to the GitHub OG card — no bare captures remain. Pipeline: `_captures/gen-component-targets.mjs` → `capture-highlight.mjs` → `gen-wild-highlights.mjs`.
- Verified: 474/474 storybook tests green, `pnpm build-storybook` green, browser-confirmed per-component (9ui accordion) + site-level (kumo on meter) highlights and the TOC.

## POLISH STATE (2026-07-08, rev. 5 — full component-highlight pass)

- **Component highlights captured across the docs sites**: a 26-site batch pass (role-union selector, `capture-highlight.mjs`) produced **9 solid highlights** — Tabs/Combobox/Menubar/Radio-Group on 9ui, graphql.org, Cloudflare Kumo, Mastra, Next.js, PostHog, ReUI, WordPress Gutenberg, docx-template-system. 14 sites were `page-only` (component behind an interaction or on a subpage the landing URL doesn't show); 3 degenerate matches (<18px) culled by hand. Each highlight carries a concrete `[role="…"]` selector + `matchedRole` + `box` + `route` in `in-the-wild.json`.
- **All highlights are visible** in a new `Utilities/InTheWild highlights (internal)` story (rendered via the shared viewer). `WildCard`'s `license`/`reuse` are now optional, so the gallery shows real provenance-free captures without fabricating badges.
- The capture README documents the batch/union approach; process is fully reproducible from `highlight-targets.json`.

## POLISH STATE (2026-07-08, rev. 4 — component-first in-the-wild + capture doc)

- **In-the-wild component view is now the default** (`shared/InTheWild.tsx`): the fullscreen viewer opens on the **Component** (highlighted) frame when one exists, and card thumbnails lead with the highlighted frame too (falling back to the plain page / OG card otherwise).
- **Base + highlight frames are aligned** (`_captures/capture-highlight.mjs`): the component is scrolled into view *before* both screenshots are taken, so the plain and highlighted frames are identical apart from the overlay (previously the plain frame could omit the component entirely). Re-shot 9ui-dev + reui-io.
- **Capture process is documented + reproducible**: `_captures/README.md` is now a full "how to repeat" guide (the `highlight-targets.json` input schema, the run/rebuild commands, the `in-the-wild.json` output index), surfaced in Storybook as `Research/D — Real-world usage/Screenshot capture`. `pnpm build-storybook` green; in-the-wild suite green.

## POLISH STATE (2026-07-08, rev. 3 — StackBlitz export fix + capture-first sort)

- **473/473 story tests green across 42 files** (re-verified on rerun; +1 from the new `in-the-wild.stories` `SortsCapturesFirst` story). App tsc clean; eslint + stylelint clean; `pnpm build-storybook` green (MDX compile gate for the 6 rewired docs pages). Same pre-existing `ResizeObserver loop` first-run flake as rev. 2, green on re-run.
- **StackBlitz export fixed** (`shared/MiniPlayground.tsx`): the old exporter rewrote only the *first* `.module.css` import (single-match regex) and dropped shared modules, so every recreation importing two stylesheets or `../icons`/`../DemoSelect` failed to build in StackBlitz (`Failed to resolve import`). Replaced with a flatten-and-bundle builder + a `dependencies` prop; all 7 MDX files now pass their extra files. Verified E2E with a real `vite build` on the exported project for the reported MultiSkin case (226 modules) and the hardest Select+DemoSelect case (219 modules, transitive CSS) — both build clean against `@base-ui/react@latest`.
- **In-the-wild cards sort captures first** (`shared/InTheWild.tsx`): cards backed by a real screenshot sort ahead of GitHub OG-card fallbacks, in both the grid (CSS `order`) and the fullscreen carousel (stable sort of the registration order).

## POLISH STATE (2026-07-08, rev. 2 — in-the-wild + playground polish)

- **472/472 story tests green across 42 files** (re-verified; +1 from the new `in-the-wild.stories` `WithComponentHighlight` story). App tsc clean; eslint + stylelint clean on the touched shared files. One first-run flake observed (`ResizeObserver loop` async race on a field/otp input assertion) that passed green on re-run — pre-existing harness flakiness, not from these changes.
- **MiniPlayground** (`shared/MiniPlayground.tsx`): all three code tabs (JSX/HTML/CSS) now render through `SyntaxHighlighter` with `showLineNumbers` — the HTML tab was previously plain `<pre>`. Added filename labels, a right-aligned per-tab Copy button, `cursor: pointer`, and a labelled `role="region"` + `tabIndex` scroll region (a11y). Reads like Storybook's "Show code".
- **In-the-wild** (`shared/InTheWild.tsx`): `WildCard` gained `highlightImage` + `pageUrl`/`route`/`selector`; the fullscreen viewer gained a "Full page / Component" toggle and a copyable locator bar; cards flag a "◎ located" badge. Backed by `_captures/capture-highlight.mjs` output and the `_captures/in-the-wild.json` locator index (see `_captures/README.md`).

## FINAL STATE (2026-07-08 ~02:00, after the owner-directed enhancement waves)

- **471/471 story tests green across 42 files** (up from 337: +recreations for all 11 Tier-1 components, +~120 story-plan completion stories across Tier 2/3, +2 internal infra stories). `pnpm build-storybook` green; app tsc clean; root `pnpm typescript` (tsgo -b) clean.
- Docs surface: 37 component pages + 3 Overview pages + 6 Patterns pages + 71 Research pages (tag-filtered off by default) + 2 internal utility stories.
- Owner-directed enhancements delivered: In-the-wild visual cards (126 entries) with 18 quality-gated live screenshots + fullscreen Base UI-Dialog lightbox/carousel; MiniPlayground (Base UI Tabs: live/JSX/HTML/CSS) wrapping 17 recreations across 7 components; per-part ArgTypes on 31 compound pages (5 non-component parts hand-tabled); production-tone sweep (0 research jargon; 9 leads verified-in, 4 false positives removed); 277/277 internal links resolve; a11y review (31 story-level fixes; 35 library findings in a11y-review.md); visual sweep of all 54 docs pages (residual flags verified false-positive: sweep-induced OG-CDN 429s, intentional broken-image story, JSX comments inside code samples).
