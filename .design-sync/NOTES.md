# Base UI design-sync notes

- Repo uses pnpm, pinned node `>=22.23.2` (nvm has it installed as `v22.23.2`). Use
  `export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use v22.23.2` before any
  pnpm/node invocation in this repo.
- `@base-ui/react` has no `main`/`module` fields at the package.json root - the built
  output only exists after `pnpm build`, published via `publishConfig.directory: "build"`.
  Build with workspace deps included: `pnpm -F "@base-ui/react..." build` (the trailing
  `...` is required - it builds `@base-ui/utils` first). Bare `pnpm --filter @base-ui/react
  build` fails with TS6305 errors because `@base-ui/utils/build/*.d.ts` doesn't exist yet.
- Converter `--entry` -> `./packages/react/build/index.mjs`, `--node-modules` ->
  `./packages/react/node_modules` (react/react-dom resolve there).
- Base UI is a **headless/unstyled** library by design (see AGENTS.md) - it ships no CSS.
  `[CSS_RUNTIME]` firing is expected, not a bug to chase. Preview styling is ported from
  each component's own docs "hero" demo (CSS Modules variant, per AGENTS.md's own
  demo-styling convention) into `.design-sync/previews/<Name>.tsx`.
- Docs site layout: `docs/src/app/(docs)/react/components/<slug>/page.mdx` - every
  component's doc file is literally named `page.mdx`, so basename-matching (the stock
  `lib/docs.mjs` heuristic) never fires. Forked `docs.mjs` (see `libOverrides` in
  config.json) to fall back to the enclosing directory name when the doc file's own
  basename is `page`/`index`. `docsDir` in config.json is package-relative to
  `PKG_DIR` (which is `dirname(--entry)` = `packages/react/build` when `--entry` is
  passed) - hence the `../../../` prefix to reach repo-root `docs/`.
- Demo styling source for previews: `docs/src/app/(docs)/react/components/<slug>/demos/hero/css-modules/index.tsx`
  plus its sibling `../../_index.module.css`. Port the classNames + the CSS rules
  (inlined into the preview's own scoped stylesheet, since previews can't import a
  relative `.module.css` the way the docs site's build pipeline does) rather than
  reimplementing from scratch.

## Known render warns

- `[RENDER_THIN] Toggle.html: mounts have no text and paint nothing` - false
  positive. `Toggle` previews are icon-only (a heart SVG, no text label) per
  the docs hero demo convention; the sheet (`_screenshots/general__Toggle.png`)
  confirms Basic/Disabled/Pressed all render the icon correctly with the
  expected checked/disabled visual states. Benign, expected on every re-sync
  unless the preview changes.
- `[RENDER_BLANK] Slider.html: renders but PNG is <5KB` - false positive. The
  `Range` primary story (`cfg.overrides.Slider.primaryStory`) is a real,
  correctly-rendered two-thumb slider (`_screenshots/general__Slider.png`
  confirms it) - it's just visually thin (a single ~28px-tall track+thumbs
  row), which trips the same blank-detection heuristic that flags truly empty
  renders. Benign.

## Known limitation: compound `.d.ts` props are empty stubs

Every grouped compound (`Menu`, `Select`, `Accordion`, ... all 29 of them) gets
`export interface <Name>Props { [key: string]: unknown }` and every member
(`Menu.Root`, `Menu.Trigger`, ...) types as `React.ComponentType<any>` - the
converter's ts-morph extractor can't flatten props here because Base UI's
actual export shape is `export * as Menu from './index.parts'` (a real
namespace of already-typed components), not a single top-level `<Name>`
component - there is no "MenuProps" to synthesize, and the extractor doesn't
walk into the namespace members to pull each one's own Props interface
(e.g. `MenuRoot.Props`, from `export type * from './root/MenuRoot'`). This
is a converter-level limitation (ts-morph type resolution in `lib/dts.mjs`),
not something a `cfg.dtsPropsFor` override can practically fix at scale (29
compounds x several members each). The `.prompt.md` for each component
(synthesized from JSDoc + the authored preview's real JSX) is the design
agent's best source of real prop usage for these compounds until the
extractor is taught to walk namespace-shaped exports.

## Preview-authoring findings (folded from batch learnings)

- **The emitted `.d.ts` stubs are useless for prop discovery** on every
  compound/overlay component (`{[key: string]: unknown}`, see "Known
  limitation" above) - authoring subagents had to read
  `packages/react/src/<slug>/**/*.tsx` source directly for `defaultOpen`,
  `modal`, etc. Any future authoring work on this repo should go straight to
  source, not the bundle's `.d.ts`.
- **Radio / RadioGroup**: `radio-group` has no docs page of its own (only
  `types.md`); its canonical composition lives in `radio`'s hero demo. A
  standalone `Radio.Root` outside `RadioGroup` context isn't meaningfully
  controllable (`checked` derives from `value === ''`) - both previews always
  compose the full `RadioGroup > Radio.Root > Radio.Indicator` tree.
- **Select**: `defaultOpen` + a matching `defaultValue` aligns the selected
  row exactly over the trigger (`data-side="none"`), hiding the trigger under
  the popup - use `defaultOpen` without `defaultValue` for a static shot that
  keeps the trigger visible.
- **NavigationMenu.Item** needs an explicit `value` prop for `Root`'s
  `defaultValue` to target it reliably (fallback is an unpredictable
  auto-generated id).
- **Docs-demo containers that size via sibling count**: trimming a hero
  demo's children (e.g. Tooltip's 3-button toolbar down to 1 trigger) can
  break a plain `flex` container's "shrink to content" sizing - use
  `inline-flex` or `width: fit-content` when trimming children.
- **Slider `[data-disabled]`**: the hero/range-slider demos have no disabled
  styling at all; `disabled` sets `data-disabled` via the generic
  `getStateAttributesProps` boolean-state mapping (confirmed in
  `packages/react/src/internals/getStateAttributesProps.ts`) even though the
  demo CSS never styles it - added a small dimmed-track override.
- **Progress indeterminate**: `Progress.Indicator`'s inline style is `{}`
  (no height) when `value == null`, and the hero CSS never sets an explicit
  height either (relies on the determinate-case inline `height: 'inherit'`) -
  it collapses to zero height and disappears. Fix (correct for the real demo
  too, not preview-only): add `height: 100%` to the base `.Indicator` rule,
  then `width: 40%` on `[data-indeterminate]`.
- **ScrollArea**: the hero demo's `.Scrollbar` is `opacity: 0` by default,
  shown only via `[data-hovering]`/`[data-scrolling]` (runtime pointer
  states that can't be simulated statically) - the preview forces
  `.Scrollbar { opacity: 1 }` unconditionally as a documented, intentional
  deviation so the thumb is always visible.
- **Toast has no static-render prop** - fully imperative API
  (`useToastManager().add(...)`; no `defaultToasts`/`open`-style prop
  anywhere in `packages/react/src/toast/`). The preview seeds a real toast
  via `toastManager.add()` in a mount effect (once, ref-guarded) instead of
  a click handler - goes through the same public API the real demo's button
  uses, so the toast is genuinely store-backed, not faked. Also strips the
  demo's transform/animation CSS (driven by custom properties only set by
  interaction/measurement effects that don't run in a single static mount)
  in favor of a plain statically-positioned card.
- **DirectionProvider** is the one provider with a real visual effect (RTL
  mirroring); `CSPProvider`'s effect (nonce/style-element suppression) is
  non-visual by nature - both got real authored previews (CSPProvider
  demonstrates it doesn't break normal rendering rather than showing a
  visual diff).

## Re-sync risks

- If Base UI restructures its docs site (moves off `page.mdx`, changes the
  `components/<slug>/` layout), the `docs.mjs` fork's directory-name fallback will
  silently stop matching - re-check `docs: N/41 components matched` after any docs
  site refactor.
- Preview styling is manually ported CSS (not `cfg.cssEntry`, since there is no
  single compiled stylesheet to point at) - if a component's hero demo CSS changes
  upstream, the preview won't pick it up automatically; a re-sync only re-verifies
  components whose *source* changed, not demo-only CSS tweaks.
