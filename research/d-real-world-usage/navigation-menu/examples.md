# Navigation Menu — top real-world examples

Mined 2026-07-07/08. This component started **empty** in the corpus (see `NOTES.md` for the prior compressed pass's honest zero-signal writeup and its "future full pass" recommendation). This pass executed exactly that recommendation: a fresh GitHub code search for `"@base-ui/react/navigation-menu"` (`_cache/code-import-base-ui-navigation-menu-p1.json` — this cache already existed from a prior parallel effort; `total_count` 1,280, 30 items on the cached first page, reused rather than re-queried) plus a direct grep of the registry-tree caches already fetched for other components (`_cache/registry-trees/*.txt`) for navigation-menu-shaped paths. 11 candidates recorded in `candidates.json`, all verified by fetching and reading the actual source (not just path/description matching), and all 11 ranked in `ranked.json`.

Selection follows §9.2's dual criterion: individual illustrative quality first, then greedy diversity-aware picking so the top set spans a docs-site framework's own top nav, a peer project's Storybook stories, a 52k-star CRM's marketing site, the fullest registry anatomy, a dev-tooling company's navbar, a minimal no-dropdown settings sidebar, a large AI-gateway admin console, a standard registry wrapper, a CMS-driven starter template, a creative personal site, and an honest unskinned-primitive signal.

---

## 1. Vocs (wevm) — a docs-site framework's own top nav, built on NavigationMenu

- **Permalink:** https://github.com/wevm/vocs/blob/861a096100f07cd04ada43797048c1e28ff44e69/src/react/internal/TopNav.tsx
- **Live:** https://vocs.dev (and every site built with Vocs)
- **License / reuse:** MIT / code-ok. 1.5k stars, active daily.
- **Parts:** Root, List, Item, Trigger, Content, Link, Icon, Portal, Positioner, Popup, Viewport, Arrow.
- **Why ranked #1:** Vocs is a well-known static docs-site generator by wevm (the team behind viem/wagmi); its `TopNav` — which renders the header for every Vocs-powered documentation site, including its own — is built on Base UI's NavigationMenu, including the pointed-panel `Arrow` part. This is directly meta-relevant: this project is itself assembling MDX documentation pages, and Vocs's own doc-site chrome is a close real-world parallel.
- **Story recomposition notes:** *Docs-site top nav*: a horizontal nav with a "Guides" dropdown (Trigger → Content with a link list) and plain links (Docs, GitHub icon-link); interaction = hover/click to open the dropdown, arrow-key through links, Escape to close. Feeds both the real-world-usage section and, indirectly, this project's own navigation chrome decisions.

## 2. strait-dev/ui — a peer project's own Storybook stories for NavigationMenu

- **Permalink:** https://github.com/strait-dev/ui/blob/6a06489172d84167f12c341a201ef280df89617d/packages/ui/src/components/navigation-menu.stories.tsx
- **Live:** none found (component library, no deployed docs site)
- **License / reuse:** MIT / code-ok. New/unstarred repo, active.
- **Parts:** Root, List, Item, Trigger, Content, Link.
- **Why ranked #2:** This file *is* a Storybook CSF story set for a NavigationMenu built on Base UI — `Playground`, `PlainLinks`, `WithActiveLink`, and `RichPanel` (mega-menu) stories, with `autodocs` and an `align` argType control, plus a docs description that already explains the anatomy in prose: "NavigationMenu wrapper already includes NavigationMenuPositioner (portal + positioner + viewport) — do not add it manually." This is the single most directly reusable piece of prior art found in this entire Tier-1 pass for shaping this project's own NavigationMenu story-plan and MDX docs page.
- **Story recomposition notes:** Use its four story shapes (playground, plain links, active-link state, rich mega-menu panel) as a structural checklist when writing this project's own NavigationMenu stories — a good sanity check for "did we cover the same use-case matrix a comparable project already validated is useful."

## 3. Twenty (twentyhq) — a 52k-star CRM's own marketing site nav

- **Permalink:** https://github.com/twentyhq/twenty/blob/8a4bcd14453eaf2ca25329ea3d9abb11b02aa06b/packages/twenty-website/src/sections/menu/components/MenuNav.tsx
- **Live:** https://twenty.com
- **License / reuse:** no SPDX license detected (GitHub `NOASSERTION`) / link-only. 52.4k stars — the single largest repo found across all four components mined in this pass.
- **Parts:** Root, List, Item, Trigger, Content, Link, Icon, Portal, Positioner, Popup, Viewport.
- **Why ranked #3:** Twenty (the open-source Salesforce/CRM alternative) uses NavigationMenu for its own marketing website header, with full i18n via `@lingui`. A top-tier credibility anchor: one of the largest, most recognizable open-source products in the entire corpus is a genuine, verified NavigationMenu consumer.
- **Story recomposition notes:** *Marketing mega-menu with i18n*: a "Product" dropdown revealing a grid of feature links with icons; interaction = open, tab through links, close on outside click. A caption noting the i18n wrapping is a good citation for internationalization considerations in the a11y/i18n section.

## 4. Lumi UI (patrick-xin) — the fullest anatomy in any registry

- **Permalink:** https://github.com/patrick-xin/lumi-ui/blob/HEAD/packages/ui/src/components/ui/navigation-menu.tsx
- **Live:** https://www.lumiui.dev
- **License / reuse:** MIT / code-ok. 25 stars, active daily.
- **Parts:** all — Root, List, Item, Trigger, Content, Link, Icon, Portal, **Backdrop**, Positioner, Popup, Viewport, **Arrow**.
- **Why ranked #4:** The only wrapper found combining `Backdrop` and `Arrow` together with the complete Portal → Positioner → Popup → Viewport layering — the fullest part coverage of any registry inspected for this component. A live map of the full anatomical grammar, directly useful for the Anatomy section's visual diagram.
- **Story recomposition notes:** *Anatomy tour*: render every optional part visible (including the dimming Backdrop) with callouts numbered to the part tree; interaction = open near a viewport edge to show collision handling.

## 5. Argos (argos-ci.com) — a dev-tooling company's own live navbar

- **Permalink:** https://github.com/argos-ci/argos-ci.com/blob/ad2df3a46bf872ec6c9dd9c15bf20a060dd86707/app/navbar.tsx
- **Live:** https://argos-ci.com
- **License / reuse:** MIT / code-ok. 25 stars, active.
- **Parts:** Root, List, Item, Trigger, Content, Link, Icon, Portal, Positioner, Popup, Viewport.
- **Why ranked #5:** Argos (a visual-regression-testing tool many frontend engineers already know) uses NavigationMenu for its own live marketing navbar — thematically adjacent to this project's own Storybook/visual-testing focus, and a recognizable, verifiable production site.
- **Story recomposition notes:** *Product navbar*: a horizontal nav with a features dropdown and a CTA link; screenshot-friendly since it's a small, live, stable marketing page.

---

### Also ranked (6–11, see `ranked.json` for full rationales)

| # | Repo | Archetype | Reuse |
|---|------|-----------|-------|
| 6 | martpie/museeks | Minimal no-dropdown usage: only Root/List/Item/Link for a desktop app's vertical settings sidebar | MIT / code-ok |
| 7 | QuantumNous/new-api | 41k-star AI-gateway admin console nav | AGPL-3.0 / link-only |
| 8 | borabaloglu/9ui | Standard Tailwind registry wrapper with its own demo page | MIT / code-ok |
| 9 | robotostudio/turbo-start-sanity | Only starter-template representative — CMS-driven nav structure (Sanity + Next.js) | MIT / code-ok |
| 10 | raphaelsalaja/userinterface-wiki | Personal "living manual for interfaces" site; minimal nav + custom sound-feedback library | MIT / code-ok |
| 11 | cloudflare/kumo | Honest "not skinned yet" signal — bare `export * from "@base-ui/react/navigation-menu"` | MIT / code-ok |

### Diversity coverage of the top set

docs-site-framework chrome, a peer project's own Storybook stories, a 52k-star CRM's marketing site, fullest-anatomy registry, dev-tooling company navbar, minimal no-dropdown settings sidebar, large AI-gateway admin console, standard registry wrapper, CMS-driven starter template, creative personal site with sound feedback, and an honest unskinned-primitive signal.

### Notable non-candidates / false positives (verified and excluded)

- `cosscom/coss` (`apps/origin/registry/default/ui/navigation-menu.tsx`) and `keenthemes/reui` (`components/ui/navigation-menu.tsx`) — both files are named `navigation-menu.tsx` (surfaced via registry-tree path grep) but on inspection import from **`radix-ui`** / **`@radix-ui/react-navigation-menu`**, not Base UI at all. Both repos are genuine Base UI adopters for *other* components (see their Drawer/Combobox candidates), but their NavigationMenu specifically is still Radix-backed — the same "registry ships one component on Radix, another on Base UI" pattern already documented for Select's non-candidates. Not added to `candidates.json`; excluded here for transparency.
- `mui/base-ui` itself, and several skill/reference/mirror repos (`pproenca/dot-skills`, `xvenv/base-ui-skill`, docs-mirrors) surfaced by the code search — excluded as the upstream project or as documentation-about-Base-UI rather than usage.
