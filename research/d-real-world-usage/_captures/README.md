# In-the-wild screenshots & component locators

This directory holds the screenshots for the "In the wild" sections of the Base UI Storybook
docs **and** the machine-readable metadata that makes the capture process fully repeatable.
If you need to (re)shoot a screenshot, everything you need is here — you should never have to
hand-hunt a component on a live page twice.

Consumed by `apps/storybook/src/stories/shared/InTheWild.tsx` (the `WildCard` / `WildCards`
components) and by any later agent that wants to drive one of these live components.

## The two JSON files that matter

| File | Role | Edit it? |
|---|---|---|
| **`highlight-targets.json`** | **Input.** The list of sites to (re)capture, one object per site. This is the file you edit to repeat or extend the process. | ✅ Yes — this is the knob. |
| **`in-the-wild.json`** | **Output/durable index.** One record per site with the resolved `url` / `route` / CSS `selector` / `box` and the screenshot filenames. A `selector: null` marks a site that still needs a highlight pass. | ❌ Generated — don't hand-edit. |
| `highlight-manifest.json` | Per-run log from the last `capture-highlight.mjs` run (notes, status). Transient. | ❌ Generated. |
| `manifest-a.json` / `manifest-b.json` | Logs from the original plain/open-state page-capture batches. | ❌ Generated. |

## How to repeat / add a capture (the short version)

1. **Add a target** to `highlight-targets.json`:

   ```json
   {
     "slug": "my-site-hl",
     "url": "https://example.com/app",
     "domain": "example.com",
     "components": ["dialog"],
     "selector": "[role=\"dialog\"]"
   }
   ```

2. **Run the capture** (from `apps/storybook`, so the `playwright` dependency resolves):

   ```sh
   cd apps/storybook
   node ../../research/d-real-world-usage/_captures/capture-highlight.mjs
   ```

   This writes, per target, two screenshots at the **same scroll position** (identical apart
   from the overlay): `my-site-hl.png` (plain) and `my-site-hl-highlight.png` (spotlight), and
   records the resolved `selector` / `box` / `route`.

3. **Rebuild the index** (folds the run into the durable index):

   ```sh
   node research/d-real-world-usage/_captures/build-in-the-wild-index.mjs
   ```

4. **Wire it into a docs card** — see "Wiring a highlight into a docs card" below.

To find sites that still need a highlight, grep `in-the-wild.json` for `"selector": null` —
those already have a page screenshot and a component list, they just need a selector added to
`highlight-targets.json` and a re-run.

## Target schema (`highlight-targets.json`)

| Field | Required | Meaning |
|---|---|---|
| `slug` | ✅ | Output filename stem. Use a `-hl` suffix so you don't overwrite the curated batch-A/B page screenshots — the index generator folds `<slug>-hl` back onto the base `<slug>`. |
| `url` | ✅ | The page to load. |
| `domain` | – | Display domain (defaults to the URL host). |
| `components` | – | Base UI component names present; the first labels the highlight box. |
| `selector` | – | CSS selector for the element to spotlight (**preferred**). |
| `interact` | – | `{ "kind": "text" \| "selector", "value": "…" }` — click something first (e.g. open a dialog/menu) before locating. |
| `overlayRole` | – | `"dialog" \| "menu" \| "listbox"` — grab the revealed overlay after `interact`. |

If no explicit `selector` matches, the script falls back to the first visible
`[role="dialog"]` / `[role="menu"]` / `[role="listbox"]` and derives a concrete selector for
it. Targets whose component can't be located are still saved as a plain page screenshot
(`status: "page-only"`).

### Batch pass with a role-union selector

To sweep many sites at once without hand-picking a selector per site, give each target a
**union** of Base UI component roles as its `selector` and let the script highlight (and
label, via the matched element's `role`) whichever appears first:

```
[role="tablist"], [role="menubar"], [role="switch"], [role="slider"],
[role="radiogroup"], [role="checkbox"], [role="combobox"], [role="meter"], [role="progressbar"]
```

This is how the current set was captured: a 26-site pass yielded 9 solid component
highlights (Tabs, Menubar, Combobox, Radio Group across 9ui, graphql, kumo, mastra, nextjs,
posthog, reui, wordpress, docx-template-system). The rest were `page-only` — their component
usually lives behind an interaction or on a subpage the landing URL doesn't show; those need
a per-component `url` + `selector` (or an `interact`) to capture. Degenerate matches (a
component under ~18px) were culled by hand. Every captured highlight is rendered in the
`Utilities/InTheWild highlights (internal)` Storybook story.

## Per-component docs highlights (the exact component per card)

To highlight the *exact* component a given docs card documents (e.g. the accordion on 9ui's
accordion card), target that component's OWN page on the site. The selector points at the
component **instances** (ARIA role — `[role="checkbox"]` etc. — else `data-slot`), not the
demo wrapper, and the driver spotlights **every** visible instance (SVG-mask multi-spotlight,
up to 24) — the component reads at full brightness while the rest of the page is dimmed, with
just the component name as a label (no outline, no count) so one card shows all occurrences at
once. The four showcase sites use a shadcn-style `data-slot` convention; the discovered page
patterns:

| Site | Component page URL | Demo selector |
|---|---|---|
| 9ui.dev | `/docs/components/<slug>` | `[data-slot="<slug>"]` |
| reui.io | `/components/<slug>` | `[data-slot="components-preview"]` |
| coss.com | `/ui/docs/components/<slug>` | `[data-slot="preview"]` |
| lumiui.dev | `/docs/components/<cat>/<slug>` | `[data-slot="<component>"]` |

Pipeline:

1. `gen-component-targets.mjs` — encodes the component→site matrix + per-site URL/slug/selector
   rules and emits `highlight-targets.json` (one target per docs card).
2. `capture-highlight.mjs` — captures them (its manifest **merges**, so broadened-selector
   retries and site-level landing captures accumulate rather than clobber).
3. `build-in-the-wild-index.mjs` — rebuilds `in-the-wild.json`.
4. `gen-wild-highlights.mjs` — generates `apps/storybook/src/stories/shared/wildHighlights.ts`,
   a registry keyed by `component::domain` (per-component) with a `*::domain` site-level
   fallback. Each entry records the `matchedRole` (the spotlighted element's ARIA role).

**Wiring into docs:** each `<WildCards>` section carries a `component` prop; `WildCard` looks
the highlight up by that component + the card's domain. A per-component `component::domain`
hit is served as-is (it's targeted at that component's page). The `*::domain` site-level
fallback — a single landing-page capture that shows one arbitrary component — is **gated by
`matchedRole`**: it's only served to a card whose component the capture genuinely depicts
(e.g. a `combobox`-role landing capture backs a Select card, but never a Radio card), so a
card never shows the wrong component. A card with a screenshot but no eligible highlight
falls back to the GitHub OG card — so no docs card ever shows a highlight-less or
wrong-component capture.

## The scripts

| Script | Produces | Notes |
|---|---|---|
| `capture-highlight.mjs` | `<slug>.png` + `<slug>-highlight.png` | The component-highlight pass. Scrolls the component into view, then shoots the plain and highlighted frames back-to-back so they match. Writes `highlight-manifest.json` and merges into `in-the-wild.json`. |
| `build-in-the-wild-index.mjs` | `in-the-wild.json` | Rebuilds the unified index from every manifest. Run after any capture pass. |
| `capture.mjs` / `capture-b.mjs` | `<slug>.png` (+ `<slug>-open.png`) | The original plain + open-state page-capture batches (driven by `sites.json` / an inline list). |

## `in-the-wild.json` — the durable index

One record per site, keyed by slug. This is the file a later agent should read to act on an
in-the-wild component without re-discovering it:

```jsonc
{
  "9ui-dev": {
    "url": "https://www.9ui.dev",
    "route": "/",                       // URL pathname
    "domain": "9ui.dev",
    "components": ["tabs"],
    "selector": "[role=\"tablist\"]",   // CSS selector to the component (null = highlight pending)
    "box": { "x": 105, "y": 685, "width": 250, "height": 36 }, // viewport rect at capture
    "screenshot": "9ui-dev.png",               // plain page (same frame as the highlight)
    "screenshotOpen": null,                    // open-state (overlay) page, if captured
    "screenshotHighlight": "9ui-dev-hl-highlight.png", // spotlighted component
    "status": "captured"
  }
}
```

## Wiring a highlight into a docs card

`WildCard` accepts the extra props so the fullscreen viewer defaults to the **Component**
view, offers a **Full page / Component** toggle, and shows a copyable locator bar; the card
thumbnail also leads with the highlighted frame:

```tsx
<WildCard
  repo="9ui.dev" title="9ui" href="https://9ui.dev" live="https://9ui.dev"
  license="MIT" reuse="code-ok"
  image={pageShot} highlightImage={highlightShot}
  pageUrl="https://www.9ui.dev" route="/" selector='[role="tablist"]'
>
  …
</WildCard>
```

See `apps/storybook/src/stories/shared/in-the-wild.stories.tsx` (`WithComponentHighlight`)
for a working example backed by the real captures in this directory, and the
`Research/D — Real-world usage/Screenshot capture` page in Storybook for this doc rendered
in-app.
