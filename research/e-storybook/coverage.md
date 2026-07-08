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


## FINAL STATE (2026-07-08 ~02:00, after the owner-directed enhancement waves)

- **471/471 story tests green across 42 files** (up from 337: +recreations for all 11 Tier-1 components, +~120 story-plan completion stories across Tier 2/3, +2 internal infra stories). `pnpm build-storybook` green; app tsc clean; root `pnpm typescript` (tsgo -b) clean.
- Docs surface: 37 component pages + 3 Overview pages + 6 Patterns pages + 71 Research pages (tag-filtered off by default) + 2 internal utility stories.
- Owner-directed enhancements delivered: In-the-wild visual cards (126 entries) with 18 quality-gated live screenshots + fullscreen Base UI-Dialog lightbox/carousel; MiniPlayground (Base UI Tabs: live/JSX/HTML/CSS) wrapping 17 recreations across 7 components; per-part ArgTypes on 31 compound pages (5 non-component parts hand-tabled); production-tone sweep (0 research jargon; 9 leads verified-in, 4 false positives removed); 277/277 internal links resolve; a11y review (31 story-level fixes; 35 library findings in a11y-review.md); visual sweep of all 54 docs pages (residual flags verified false-positive: sweep-induced OG-CDN 429s, intentional broken-image story, JSX comments inside code samples).
