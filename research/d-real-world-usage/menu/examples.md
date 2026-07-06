# Menu — top real-world examples

Component: `menu` (`@base-ui/react/menu`, historical `@base-ui-components/react/menu`). Mined 2026-07-06 per §9 of the brief. Full pool: `candidates.json` (100 candidates, 32 inspected file-by-file at pinned SHAs under `_cache/inspect-menu/`); ranked set with scores: `ranked.json` (15). Screenshots: not attempted in this pass (`screenshot.status: "not-attempted"` everywhere). Licenses recorded per repo; **link-only** entries must not have code copied into stories.

## 1. PostHog — account switcher with Backdrop + nested submenus (`menu-005`)

- Permalinks (pinned to `c8311b5a95`):
  - [NewAccountMenu.tsx](https://github.com/PostHog/posthog/blob/c8311b5a9520c9bf105ea4e3b8474f63dffa9c9b/frontend/src/lib/components/Account/NewAccountMenu.tsx)
  - [HelpMenu.tsx](https://github.com/PostHog/posthog/blob/c8311b5a9520c9bf105ea4e3b8474f63dffa9c9b/frontend/src/lib/components/HelpMenu/HelpMenu.tsx)
  - [quill dropdown-menu primitives](https://github.com/PostHog/posthog/blob/c8311b5a9520c9bf105ea4e3b8474f63dffa9c9b/packages/quill/packages/primitives/src/dropdown-menu.tsx)
- Live: https://posthog.com (app: app.posthog.com) · License: custom (MIT + enterprise dirs) → **link-only**
- Parts: Root, Trigger, Portal, **Backdrop**, Positioner, Popup, Item, SubmenuRoot, SubmenuTrigger (+ full part set incl. Checkbox/Radio in quill primitives)
- Why ranked #1: the richest *direct* product usage found. Controlled `Menu.Root`, the corpus's only `Menu.Backdrop` sighting, two nested `SubmenuRoot`s ("All projects", "All organizations"), triggers and items rendered into PostHog's `ButtonPrimitive`/`Link` via the `render` prop, and a popup height-capped by `--available-height` behind a scroll-shadow wrapper.
- Story recomposition: an "account menu" story — avatar-ish trigger, org section, project submenu, invite item, sign-out. **Interaction to drive**: click trigger (menu opens over a backdrop) → `ArrowDown` across items → `ArrowRight` on "All projects" to open the submenu → `ArrowDown` → `Enter` to select a project → assert menu closed and selection callback fired. Feeds: Behavior (submenus, backdrop), prop guidance (`render`, controlled `open`), CSS-variables contract (`--available-height`).

## 2. Next.js DevTools — shadow-DOM portal, non-modal (`menu-002`)

- Permalink (pinned to `b1eba13dc0`): [segment-boundary-trigger.tsx](https://github.com/vercel/next.js/blob/b1eba13dc082d89e62d064fd8351d64463994d22/packages/next/src/next-devtools/dev-overlay/components/overview/segment-boundary-trigger.tsx)
- Live: https://nextjs.org (rendered inside every `next dev` overlay) · MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item, Group, GroupLabel
- Why ranked #2: `<Menu.Root delay={0} modal={false}>` with `<Menu.Portal container={shadowRoot}>` — the canonical citation for embedding a menu inside a shadow root (the dev overlay's isolation boundary) and for non-modal menus that keep the host page interactive. Trigger is `disabled` until the hovered route segment actually has a boundary; grouped items under a "Toggle Overrides" GroupLabel.
- Story recomposition: "menu in a constrained embed" story — render the menu into a custom `container`, `modal={false}`, disabled-trigger state variant. **Interaction**: hover/click trigger → arrow-navigate the override group → `Enter` selects an override → assert `onOpenChange` fired and page scroll was never locked. Feeds: `Portal.container` and `modal` prop guidance, disabled-trigger behavior.

## 3. Playroom (SEEK) — settings menu that stays open (`menu-017`)

- Permalink (pinned to `aa778ceb26`): [Menu.tsx](https://github.com/seek-oss/playroom/blob/aa778ceb26c20436eb32878a9beba14535b80993/src/components/Menu/Menu.tsx)
- Live: none (dev tool run locally) · MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item, CheckboxItem(+Indicator), RadioGroup, RadioItem(+Indicator), Group, GroupLabel, SubmenuRoot, SubmenuTrigger, Separator
- Why ranked #3: the best `closeOnClick` teacher in the corpus. One shared `MenuItem` abstraction sets `closeOnClick={false}` for checkbox/radio settings items *and* for submenu triggers; `onOpenChangeComplete` resets submenu state only after the exit animation finishes so the popup doesn't flicker mid-close.
- Story recomposition: "checkbox settings menu" story — frame-visibility checkboxes + theme radio group. **Interaction**: open → `Space` toggles two CheckboxItems (assert the menu did **not** close between toggles) → arrow into a submenu → `Escape` closes all → assert submenu state was reset after `onOpenChangeComplete`. Feeds: `closeOnClick` and `onOpenChangeComplete` prop guidance, checkbox-settings archetype.

## 4. Oxide Console — row actions, `modal={false}` by default (`menu-043`)

- Permalink (pinned to `975bba9f3f`): [DropdownMenu.tsx](https://github.com/oxidecomputer/console/blob/975bba9f3f2ce5fc0fa0d03ea4d71e04d9e4d6c5/app/ui/lib/DropdownMenu.tsx)
- Live: https://console-preview.oxide.computer · MPL-2.0 → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item, RadioGroup, RadioItem, SubmenuRoot, SubmenuTrigger, Separator
- Why ranked #4: a real cloud console wrapping `Menu.Root` with `modal={false}` as the house default and a comment stating the reason — *prevent scroll locking* — plus a semantic `anchor="bottom end"` string prop parsed into `side`/`align`/offsets, and `collisionPadding` passthrough. Backs the row-action menus of the console's data tables.
- Story recomposition: "table row-actions menu" story — kebab trigger per row, non-modal, destructive item variant. **Interaction**: click kebab → arrow-navigate → `Enter` on "Delete" → assert page scroll never locked while open. Feeds: When-to-use (row actions), `modal` decision note, Positioner `side`/`align` guidance.

## 5. cmux — split download button + menu→dialog handoff (`menu-007`)

- Permalink (pinned to `fa3f388c17`): [download-button.tsx](https://github.com/manaflow-ai/cmux/blob/fa3f388c17eb6fa9e7eac3daa761508cc46343dc/web/app/%5Blocale%5D/components/download-button.tsx)
- Live: https://cmux.com · no license file → **link-only**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item, Group, GroupLabel, Separator
- Why ranked #5: a marketing split-CTA where only the caret zone is the `Menu.Trigger`; items render as i18n `<Link>`s via `render`, waitlist platforms grouped under a `GroupLabel`, and — the gem — selecting an item opens a dialog **deferred by `requestAnimationFrame`**, with a comment explaining that opening synchronously lets the same pointer gesture's trailing event count as an outside press and instantly dismiss the dialog.
- Story recomposition: "split-button menu" story with a follow-up dialog. **Interaction**: click caret → `ArrowDown` to a waitlist platform → `Enter` → assert dialog opened *and stayed open*. Feeds: split-button use case, a menu-to-dialog-handoff pitfall entry, `render`-as-link guidance.

## 6. Cloudflare Kumo — LinkItem promotion with deprecation JSDoc (`menu-022`)

- Permalinks (pinned to `8f2c40b3a9`): [dropdown.tsx](https://github.com/cloudflare/kumo/blob/8f2c40b3a9d14dc8e6b3b39ba87e1fa7b03d8f26/packages/kumo/src/components/dropdown/dropdown.tsx) · [primitives/menu.ts](https://github.com/cloudflare/kumo/blob/8f2c40b3a9d14dc8e6b3b39ba87e1fa7b03d8f26/packages/kumo/src/primitives/menu.ts)
- Live: https://kumo-ui.com · MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item, **LinkItem**, CheckboxItem(+Indicator), RadioGroup, RadioItem(+Indicator), Group, GroupLabel, SubmenuRoot, SubmenuTrigger, Separator
- Why ranked #6: Cloudflare's design system documents an API migration inside its own JSDoc — `href` on Item is `@deprecated` in favor of `DropdownMenu.LinkItem` for navigation, with usage examples — plus danger-styled items and container-aware portals. This is the "use LinkItem when …, because …" evidence the prop-guidance section wants, from a household-name org.
- Story recomposition: "actions vs navigation menu" story mixing `Item` (actions) with `LinkItem` (links, external targets) and a danger item. **Interaction**: open → arrow through action items → `Enter` on a LinkItem → assert navigation semantics (anchor role/href). Feeds: LinkItem prop guidance + decision log.

## 7. Vocs — RadioGroup as current-page nav indicator (`menu-028`)

- Permalink (pinned to `861a096100`): [MobileNav.tsx](https://github.com/wevm/vocs/blob/861a096100f07cd04ada43797048c1e28ff44e69/src/react/internal/MobileNav.tsx)
- Live: https://vocs.dev (powers viem/wagmi docs) · MIT → **code-ok**
- Parts: Root, Trigger, Portal, Positioner, Popup, RadioGroup, RadioItem, Group, GroupLabel
- Why ranked #7: a semantically distinct use — `Menu.RadioGroup value={activeLink}` marks the *current page* in a mobile docs top-nav; RadioItems render as links, `data-checked` styles the active route, sections grouped with GroupLabels. Radio state as *selection display* rather than a mutable setting.
- Story recomposition: "nav menu with current-page radio" story. **Interaction**: open trigger showing the active section → arrow-navigate → `Enter` another page → assert `data-checked` moved and navigation fired. Feeds: RadioGroup/RadioItem guidance and the menu-vs-navigation-menu boundary discussion.

## 8. WordPress Gutenberg — menu item opens an AlertDialog (`menu-009`)

- Permalink (pinned to `73d48b46f8`): [alert-dialog stories/index.story.tsx](https://github.com/WordPress/gutenberg/blob/73d48b46f8caa925fbaffb4e97246f02a1b3ce80/packages/ui/src/alert-dialog/stories/index.story.tsx)
- Live: https://wordpress.org/gutenberg/ · GPL-2.0+/MPL dual (NOASSERTION) → **link-only**
- Parts: Root, Trigger, Portal, Positioner, Popup, Item
- Why ranked #8: WordPress's next-generation `packages/ui` builds on Base UI, and this Storybook story wires a controlled Menu ("Actions ▾") whose Delete item opens an AlertDialog; `onConfirm` closes the menu via `setMenuOpen(false)`. A canonical destructive-action composition from one of the largest OSS projects adopting the library — and it's already story-shaped.
- Story recomposition: "menu with confirm dialog" story. **Interaction**: open menu → `ArrowDown` to "Delete" → `Enter` opens the alert dialog → confirm → assert both dialog and menu are closed. Feeds: controlled-`open` guidance and the overlay-composition cluster (menu + alert-dialog).

---

### Also notable (ranked 9–15, see `ranked.json` for scores and full rationales)

| # | Repo | One-line hook | Reuse |
|---|------|----------------|-------|
| 9 | [siriwatknp/mui-treasury](https://github.com/siriwatknp/mui-treasury/blob/8fa129a0519d08764af1a208bafd3e83e19fd9c6/apps/website/registry/components/menubar-01/menubar-01.tsx) | Base UI Menubar + Menu rendering **Material UI `MenuItem`s** via `render` — by a MUI maintainer | link-only |
| 10 | [stagewise-io/stagewise](https://github.com/stagewise-io/stagewise/blob/ef9d249f29f2a98dfeac80b2f1013315333994d6/apps/browser/src/ui/components/file-context-menu.tsx) | `ContextMenu.Root` composed with **`Menu.Portal/Popup/Item` parts** — cross-component part interop | link-only (AGPL) |
| 11 | [makeplane/plane](https://github.com/makeplane/plane/blob/7fbf14a6cb494bbf5866e2b293b28a6d8a7e52c3/packages/propel/src/menu/menu.tsx) | 54k-star PM tool's Propel wrapper exposing `openOnHover`; historical package name | link-only (AGPL) |
| 12 | [langgenius/dify](https://github.com/langgenius/dify/blob/fc01d112a06cc286f5b47d34112387c46503ddb2/packages/dify-ui/src/dropdown-menu/index.tsx) | 148k-star adopter; `LinkItem` wrapper with `closeOnClick` default | link-only |
| 13 | [pingdotgg/t3code](https://github.com/pingdotgg/t3code/blob/32e7844837b35ca0a0ff038997a45ea75cb7103f/apps/web/src/components/ui/menu.tsx) | Shipped MIT wrapper re-exporting **`Menu.createHandle`** (detached menu handles); Coss-registry lineage | code-ok |
| 14 | [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui/blob/efeb96ffd7a3b7a4868667e4ac3c346620fb3044/apps/www/registry/primitives/base/menu/index.tsx) | Every part (incl. **Arrow**) wrapped with motion/react springs — JS-animation integration | link-only |
| 15 | [wevm/curl.md](https://github.com/wevm/curl.md/blob/91469a7fbf2957a2cda20ec25add0807717ba3aa/src/routes/docs/-render.tsx) | `Positioner anchor={ref}` — popup anchored to an **external element**, `modal={false}` mobile outline | code-ok |

### Diversity coverage of the ranked set

account-menu · nested-submenus · backdrop · devtools-overlay/shadow-DOM portal · non-modal menus · checkbox-settings menu · table row-actions · split-button + dialog handoff · LinkItem navigation · radio-as-current-page nav · menu→alert-dialog composition · Material UI interop via render props · context-menu part interop · hover-open wrapper · createHandle detached triggers · motion-library animation · anchor-ref positioning. No misuse candidates were kept (`instructiveMisuse: false` throughout — nothing inspected qualified).
