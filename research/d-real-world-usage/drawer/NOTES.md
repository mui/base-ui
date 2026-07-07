# drawer — verification notes

- **2026-07-08 spot-check** (prompted by a Storybook copy-editing pass that needed to confirm the
  "In the wild" leads named in `apps/storybook/src/stories/drawer/drawer.mdx`): re-verified the
  three candidates the MDX page listed as "lean, unverified" against the live repos.
  - **`australia/mobtranslate.com`** (`packages/ui/src/components/drawer/drawer.tsx`) — confirmed
    **false positive**: the file imports `Dialog as BaseDialog` from
    `@base-ui-components/react/dialog`, not Drawer. A hand-rolled drawer-like sheet built on the
    generic Dialog primitive (old pre-1.0 package name). Matches the existing `candidates.json`
    `drawer-002` entry, which already flagged this as `false-positive-verified`. Removed the
    WildCard from the MDX page.
  - **`xuerzong/redis-dash`** (`app/src/client/components/ui/Drawer/index.tsx`) — same pattern:
    imports `Dialog` from `@base-ui-components/react/dialog`, not Drawer. Matches `drawer-003`,
    already flagged `false-positive-verified`. Removed the WildCard from the MDX page.
  - **`baseui-cn/baseui-cn`** — previously only a description-based signal
    (`drawer-001`, "no cached subpath search or file inspection has verified an actual Drawer
    file"). A targeted code search (`drawer repo:baseui-cn/baseui-cn`) found
    `apps/www/components/ui/drawer.tsx`, which does import
    `Drawer as DrawerPrimitive from '@base-ui/react/drawer'` — genuinely verified. Updated
    `candidates.json`/`ranked.json` (`drawer-001`) with the real file, a pinned commit SHA
    (`e596e7cad66f1d090be265682d09e465035f74ec`), and an updated `contextSummary`/`rankRationale`.
    Updated the MDX WildCard's `href` to the pinned permalink accordingly.
