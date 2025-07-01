# Versions

## v1.0.0-beta.1

_Jul 1, 2025_

### General changes

- Make error messages consistent (#2049) by @michaldudak
- Do not overwrite event handler when `undefined` is passed explicitly (#2151) by @michaldudak

### Accordion

- Allow content to resize naturally (#2043) by @atomiks
- Fix transition status mapping (#2169) by @atomiks
- Fix `aria-controls` reference (#2170) by @atomiks
- Fix test warning about mixed animation types (#2180) by @atomiks

### Checkbox

- **Breaking change:** Support implicit `Field.Label`.
  If `Field.Label` encloses Switch/Checkbox/Radio, the `htmlFor`/`id` attributes are no longer explicitly set to associate them.
  (#2036) by @mj12albert
- Refactor to `useRenderElement` (#2053) by @mj12albert
- Always set `id` on the `&lt;input&gt;` element (#2115) by @mj12albert

### Checkbox Group

- Fix `onCheckedChange` not running when parent checkbox is present (#2155) by @mj12albert

### Collapsible

- Allow content to resize naturally (#2043) by @atomiks
- Fix `aria-controls` reference (#2170) by @atomiks
- Fix test warning about mixed animation types (#2180) by @atomiks

### Context Menu

- **Breaking change:** Add `SubmenuRoot` part.
  Nested menus should be defined with `Menu.SubmenuRoot` instead of `Menu.Root` to to avoid ambiguity.
  (#2042) by @atomiks
- Fix CheckboxItemIndicator export (#2009) by @aarongarciah

### Dialog

- Fix popup prop merging (#2119) by @atomiks

### Field

- **Breaking change:** Support implicit `Field.Label`.
  If `Field.Label` encloses Switch/Checkbox/Radio, the `htmlFor`/`id` attributes are no longer explicitly set to associate them.
  (#2036) by @mj12albert
- Enable custom validation based on other form values (#1941) by @mj12albert
- Fix `onValueChange` `value` type (#2112) by @atomiks
- Fix `Field.Label` focusing trigger (#2118) by @atomiks
- Fix slider field label (#2154) by @mj12albert

### Fieldset

- Refactor to `useRenderElement` (#2053) by @mj12albert

### Form

- Enable custom validation based on other form values (#1941) by @mj12albert

### Input

- Fix `onValueChange` `value` type (#2112) by @atomiks

### Menu

- **Breaking change:** Add `SubmenuRoot` part.
  Nested menus should be defined with `Menu.SubmenuRoot` instead of `Menu.Root` to to avoid ambiguity.
  (#2042) by @atomiks
- Unset `role` from Trigger (#2047) by @atomiks
- Emit `close` event on `cancel-open` (#2067) by @atomiks
- Fix close toggle when rendering non-native button (#2071) by @atomiks
- Add `highlighted` to item `State` (#2079) by @atomiks
- Remove highlighted effect (#2162) by @atomiks
- Cut out internal backdrop to allow interacting with triggers (#2141) by @michaldudak
- Fix active index sync on hover (#2163) by @atomiks
- Fix focus returning to root when submenus have exit transitions (#2163) by @atomiks

### Menubar

- Fix `closeOnClick: false` not working in nested menus (#2094) by @michaldudak

### Navigation Menu

- Handle layout resize while open (#2070) by @atomiks
- Fix positioner height when opening menu using the keyboard arrows (#2060) by @juliomerisio

### Number Field

- Ensure `onValueChange` is called with already-formatted parsed value (#1905) by @atomiks
- Fix revalidation on change (#2174) by @atomiks

### Popover

- Fix close toggle when rendering non-native button (#2071) by @atomiks
- Cut out internal backdrop to allow interacting with triggers (#2141) by @michaldudak

### Radio Group

- **Breaking change:** Support implicit `Field.Label`.
  If `Field.Label` encloses Radio, the `htmlFor`/`id` attributes are no longer explicitly set to associate them.
  (#2036) by @mj12albert
- Refactor to `useRenderElement` (#2053) by @mj12albert

### Scroll Area

- Ignore `data-scrolling` during programmatic scroll (#1908) by @atomiks

### Select

- **Breaking change:** Print raw value in `Select.Value`.
  `<Select.Value>` now prints the raw value by default unless an `items` prop is specified on `Select.Root`.
  See https://base-ui.com/react/components/select#formatting-the-value for more information.
  (#2087) by @atomiks
- Performance: avoid re-renders (#1961) by @romgrk
- Fix close toggle when rendering non-native button (#2071) by @atomiks
- Fix `Field.Label` focusing trigger (#2118) by @atomiks
- Fix programmatic value changes and autofill handling (#2084) by @atomiks
- Add `highlighted` to item `State` (#2079) by @atomiks
- Cut out internal backdrop to allow interacting with triggers (#2141) by @michaldudak
- Pass `value` as state (#2153) by @atomiks
- Extend `FieldRoot.State` type (#2192) by @atomiks

### Slider

- Use pointer capture when dragging (#2059) by @mj12albert
- Fix slider field label (#2154) by @mj12albert

### Switch

- **Breaking change:** Support implicit `Field.Label`.
  If `Field.Label` encloses Switch, the `htmlFor`/`id` attributes are no longer explicitly set to associate them.
  (#2036) by @mj12albert

### Tabs

- Fix indicator positioning when TabsList overflows (#2093) by @mj12albert
- Fix focus going out of sync when selected value is changed externally (#2107) by @atomiks
- Remove highlighted state (#2164) by @atomiks

### Toolbar

- Set `disabled` attr on toolbar button when `focusableWhenDisabled={false}` (#2176) by @mj12albert

### useRender

- Make useRender RSC-friendly (#2134) by @michaldudak

All contributors of this release in alphabetical order: @aarongarciah, @atomiks, @bernardobelchior, @brijeshb42, @Janpot, @juliomerisio, @lesha1201, @michaldudak, @mj12albert, @oliviertassinari, @romgrk

## v1.0.0-beta.0

_May 29, 2025_

### General changes

- Remove proptypes (#1760) by @michaldudak
- Unify component export patterns (#1478) by @michaldudak
- Default `tabIndex` to `0` on `<button>` parts (#1939) by @atomiks

### Accordion

- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks

### Alert Dialog

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Use basic scroll lock on iOS
  (#1890) by @atomiks

### Checkbox

- Set `aria-required`, use `useButton` (#1777) by @mj12albert

### Checkbox Group

- **Breaking change:** Enable submitting checkbox group value as one field.
  For parent checkboxes, use `value` instead of `name` on each `Checkbox.Root` part to link as the values.
  (#1948) by @mj12albert
- Fix `validate` fn incorrectly running twice (#1959) by @mj12albert

### Context Menu

- New `ContextMenu` component (#1665) by @atomiks

### Dialog

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Use basic scroll lock on iOS
  (#1890) by @atomiks

### Field

- **Breaking change:** Consolidate `Field.Error` `forceShow` into `match` prop.
  Use `match={true}` (or implicit boolean) instead of `forceShow`.
  (#1919) by @atomiks
- Improve `Label` logic that prevents text selection on double click (#1784) by @atomiks
- Fix validation inconsistency (#1779) by @atomiks
- Fix integration of Base UI components (#1755) by @atomiks
- Set `valueMissing` to false if only error and not dirtied (#1810) by @atomiks
- `validate` with latest value on blur (#1850) by @atomiks
- Revalidate only `required` on change (#1840) by @atomiks
- Run validate function after native validations (#1926) by @mj12albert
- Fix `validate` fn incorrectly running twice (#1959) by @mj12albert
- Integrate range sliders with Form and Field (#1929) by @mj12albert

### Form

- Fix integration of Base UI components (#1755) by @atomiks
- Select inputs on focus (#1858) by @atomiks
- Exclude number formatting from form value (#1957) by @mj12albert
- Integrate range sliders with Form and Field (#1929) by @mj12albert

### Input

- Fix `Input.Props` type (#1915) by @mj12albert
- Extend `Field.Control.State` (#1954) by @atomiks

### Menu

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Fix function dependency handling (#1787) by @atomiks
- Add missing `'use client'` to `RadioGroup` part (#1851) by @atomiks
- Ensure `null` items are removed from composite lists (#1847) by @atomiks
- Avoid `:focus-visible` style appearing (#1846) by @atomiks
- Better handle dynamic and non-string items (#1861) by @atomiks
- Add `collisionAvoidance` prop (#1849) by @atomiks
- Add `finalFocus` and `closeDelay` props (#1918) by @atomiks
- Use basic scroll lock on iOS
  (#1890) by @atomiks

### Menubar

- New `Menubar` component (#1684) by @michaldudak

### Navigation Menu

- New `NavigationMenu` component (#1741) by @atomiks

### Number Field

- `validate` with latest value on blur (#1850) by @atomiks
- Move scrubbing logic to `ScrubArea` component (#1859) by @atomiks
- Remove floating point errors when `snapOnStep` is disabled (#1857) by @atomiks
- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks
- Exclude number formatting from form value (#1957) by @mj12albert

### Popover

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Fix function dependency handling (#1787) by @atomiks
- Avoid prop getters when merging props (#1852) by @atomiks
- Add `collisionAvoidance` prop (#1849) by @atomiks
- Fix nested `openOnHover` (#1938) by @atomiks
- Use basic scroll lock on iOS
  (#1890) by @atomiks

### Preview Card

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Fix function dependency handling (#1787) by @atomiks
- Add `collisionAvoidance` prop (#1849) by @atomiks

### Radio Group

- Fix composite focus of initially selected radio item (#1753) by @atomiks
- Add `inputRef` props (#1683) by @atomiks
- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks

### Select

- **Breaking change:** Move item anchoring prop to `Positioner`.
  Use `<Select.Positioner alignItemWithTrigger={false}>` instead of `<Select.Root alignItemToTrigger={false}>` (note the `With` instead of `To`).
  (#1713) by @atomiks
- **Breaking change:** Defer mounting until typeahead is needed.
  The `placeholder` prop is now required. Previously, only SSR needed it to prevent a hydration flash, but client-side rendering now also requires it.
  (#1906) by @atomiks
- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Fix function dependency handling (#1787) by @atomiks
- Add `inputRef` props (#1683) by @atomiks
- Refactor to `useRenderElement` (#1797) by @atomiks
- Ensure `null` items are removed from composite lists (#1847) by @atomiks
- Fix `id` prop forwarding to hidden input (#1862) by @atomiks
- Avoid `:focus-visible` style appearing (#1846) by @atomiks
- Fix `transitionStatus` mapping on `ItemIndicator` (#1925) by @atomiks
- Better handle dynamic and non-string items (#1861) by @atomiks
- Use `Select.ItemText` ref to grab default text content (#1943) by @atomiks
- Add `collisionAvoidance` prop (#1849) by @atomiks
- Use basic scroll lock on iOS
  (#1890) by @atomiks

### Slider

- **Breaking change:** Drop `inputId` prop from Thumb.
  (#1914) by @mj12albert
- Position thumb based on value instead of pointer location when dragging (#1750) by @DarthSim
- Use `useRenderElement` (#1772) by @mj12albert
- Add `inputRef` props (#1683) by @atomiks
- Add `locale` prop (#1796) by @mj12albert
- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks
- set `data-dragging` on touchstart and pointerdown (#1874) by @mj12albert
- Integrate range sliders with Form and Field (#1929) by @mj12albert

### Toast

- **Breaking change:** Add `Portal` part.
  Place `<Toast.Viewport>` inside of `<Toast.Portal>`.
  (#1962) by @atomiks
- **Breaking change:** Avoid removing limited toasts from the DOM.
  The `[data-limited]` styles in the demos were updated to handle limited toasts remaining in the DOM. They should now be a standalone style as `&[data-limited] { opacity: 0 }`.
  (#1953) by @atomiks
- Fix swipe jump on iOS (#1785) by @atomiks

### Toggle

- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks

### Toolbar

- Stop event propagation to allow composite components to be used within popups (#1871) by @atomiks

### Tooltip

- **Breaking change:** Refine `OpenChangeReason`. `hover` is now `trigger-hover`; `click` is now `trigger-press`; `focus` is now `trigger-focus`.
  (#1782) by @atomiks
- Fix function dependency handling (#1787) by @atomiks
- Avoid prop getters when merging props (#1852) by @atomiks
- Remove `trackCursorAxis` type from `Positioner` (#1895) by @atomiks
- Apply `pointer-events: none` to `Positioner` when not hoverable (#1917) by @atomiks
- Add `collisionAvoidance` prop (#1849) by @atomiks

### useRender

- **Breaking change:** Performance/refactor: `useRender`. An object with a `renderElement` property is no longer returned; instead, the hook returns the element directly (`const element = useRender(...)`). The `refs` option was also renamed to `ref`.
  (#1934) by @romgrk
- Skip most of useRenderElement logic when unnecessary (#1967) by @michaldudak

All contributors of this release in alphabetical order: @aarongarciah, @atomiks, @brijeshb42, @DarthSim, @flaviendelangle, @Janpot, @JCQuintas, @michaldudak, @mj12albert, @oliviertassinari, @romgrk, @Yonava, @ZeeshanTamboli

## v1.0.0-alpha.8

_Apr 17, 2025_

### Accordion

- Recalculate panel dimensions on layout resize (#1704) @atomiks
- Rework animations and transitions (#1601) @mj12albert

### AlertDialog

- **Breaking change:** Rename `data-has-nested-dialogs` to `data-nested-dialog-open` (#1686) @mj12albert
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert

### CheckboxGroup

- Parent checkbox/nested demos (#1610) @atomiks

### Collapsible

- Fix ForwardedRef type of CollapsiblePanel (#1595) @megos
- Recalculate panel dimensions on layout resize (#1704) @atomiks
- Rework animations and transitions (#1601) @mj12albert

### Dialog

- **Breaking change:** Rename `data-has-nested-dialogs` to `data-nested-dialog-open` (#1686) @mj12albert
- **Breaking change:** Add new `trap-focus` value to `modal` prop.
  Dialogs with `modal=false` no longer trap focus.
  (#1571) @atomiks
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert
- Allow document to slide input into view on iOS when keyboard opens (#1735) @atomiks

### Field

- Fix forwarding of `name` and `disabled` props (#1616) @atomiks

### Menu

- Add missing item data attributes docs (#1691) @atomiks
- Fix `inert` prop compatibility in React <19 (#1618) @sebinsua
- Fix stuck highlight on submenu trigger when submenu opens with keyboard (#1698) @atomiks
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert

### Meter

- New Meter component (#1435) @mj12albert

### NumberField

- Correct percentage parse handling (#1676) @atomiks
- New `snapOnStep` prop (#1560) @atomiks

### Popover

- **Breaking change:** Add new `trap-focus` value to `modal` prop (#1571) @atomiks
- Fix `inert` prop compatibility in React <19 (#1618) @sebinsua
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert

### Progress

- **Breaking change:** Add `Progress.Label` and `locale` prop.
  The `getAriaLabel` prop was removed as `Progress.Label` should be used to provide an accessible name.
  (#1666) @mj12albert

### Radio

- Fix value forwarding and null handling (#1697) @atomiks

### ScrollArea

- **Breaking change:** Add `Content` part.
  It is now required to include the `ScrollArea.Content` within `ScrollArea.Viewport` part when the content is horizontally scrollable.
  (#1607) @atomiks
- Handle visibility change and nesting (#1598) @atomiks
- Correct thumb sizing with scrollbar margins (#1606) @atomiks

### Select

- **Breaking change:** Improve item highlight performance.
  The highlighted state is now removed. It's not possible to customize the `data-highlighted` attribute anymore.
  (#1570) @atomiks
- Avoid double commit on value change (#1597) @atomiks
- Reset `selectedIndex` when set to `null` (#1596) @atomiks
- Add missing item data attributes docs (#1691) @atomiks
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert

### Slider

- Correct thumb positioning when control has padding (#1661) @mj12albert
- Prevent range slider thumbs from being dragged past each other (#1612) @mj12albert
- Fix incorrect CSS position on vertical slider indicator (#1599) @ZeeshanTamboli
- Fix overlapping slider thumbs stuck at min or max (#1732) @mj12albert

### Toast

- New Toast component (#1467) @atomiks

### Tooltip

- Avoid re-rendering unrelated consumers (#1677) @atomiks
- Add `disabled` prop (#1682) @atomiks
- Fix `onOpenChange` types for `event`/`reason` passing (#1721) @atomiks
- Use consistent `inert` attr and map `[data-popup-open]` back to `open` (#1650) @atomiks
- Fix text selection & right-clicks (#1702) @mj12albert

All contributors of this release in alphabetical order: @atomiks, @megos, @michaldudak, @mj12albert, @oliviertassinari, @sebinsua, @ZeeshanTamboli

## v1.0.0-alpha.7

_Mar 20, 2025_

### Accordion

- Fix `aria-labelledby` on accordion panel (#1544) @mj12albert

### AlertDialog

- Fix selection on outside press on Firefox with modal prop (#1573) @atomiks
- Fix non-interactive button disabled state (#1473) @mj12albert
- `actionsRef` prop (#1236) @atomiks

### Avatar

- Support cross origin in useImageLoadingStatus (#1433) @ISnackable
- Add missing Avatar export (#1428) @Gomah

### Collapsible

- Update props destructuring to fix Trigger disabled state (#1469) @huijiewei

### Dialog

- Fix selection on outside press on Firefox with modal prop (#1573) @atomiks
- Fix non-interactive button disabled state (#1473) @mj12albert
- `actionsRef` prop (#1236) @atomiks

### Field

- Fix `FieldControl` [data-filled] not reacting to external value changes (#1565) @atomiks

### Menu

- Ensure submenu triggers respond to clicks when `openOnHover=false` (#1583) @atomiks
- Ensure `stickIfOpen` is reset to `true` correctly (#1548) @atomiks
- Fix selection on outside press on Firefox with modal prop (#1573) @atomiks
- Reset `hoverEnabled` state on close (#1461) @atomiks
- Fix prop merging issues (#1445) @michaldudak
- Set `pointer-events: none` style on backdrops when hoverable (#1351) @atomiks
- `actionsRef` prop (#1236) @atomiks

### NumberField

- Fix ScrubArea on Safari (#1584) @atomiks
- Fix `large/smallStep` getting stuck (#1578) @atomiks
- Fix parse of numbers with spaces as thousands separators (#1577) @michaldudak
- Prevent virtual cursor overlapping native one (#1491) @atomiks
- Fix disabled state on increment/decrement buttons (#1462) @mj12albert
- Correct virtual cursor rendering (#1484) @atomiks
- Add `locale` prop (#1488) @atomiks
- Improve virtual cursor perf (#1485) @atomiks

### Popover

- Ensure `stickIfOpen` is reset to `true` correctly (#1548) @atomiks
- Fix selection on outside press on Firefox with modal prop (#1573) @atomiks
- Set `pointer-events: none` style on backdrops when hoverable (#1351) @atomiks
- Fix non-interactive button disabled state (#1473) @mj12albert
- `modal` prop (#1459) @atomiks
- `actionsRef` prop (#1236) @atomiks

### PreviewCard

- Set `pointer-events: none` style on backdrops when hoverable (#1351) @atomiks
- `actionsRef` prop (#1236) @atomiks

### RadioGroup

- Fix `Form`/`Field` validation integration (#1448) @atomiks
- Handle modifier keys (#1529) @mj12albert

### Select

- Fix selection on outside press on Firefox with modal prop (#1573) @atomiks
- Improve `ScrollArrow` behavior (#1564) @atomiks
- Ensure switching controlled value to `null` updates `Select.Value` label (#1561) @atomiks
- Pass `value` as second argument to function children `Select.Value` (#1562) @atomiks
- Fix focus jump while hovering while navigating with keyboard (#1563) @atomiks
- Fix disabled state changing (#1526) @mj12albert
- `actionsRef` prop (#1236) @atomiks

### Slider

- Fix thumb positioning when controlled value violates min/max/step (#1541) @mj12albert
- Warn when `min` is not less than `max` (#1475) @mj12albert
- Narrow the type of `value` in callbacks (#1241) @seloner

### Tabs

- Fix keyboard navigation involving disabled Tabs (#1449) @mj12albert
- Handle modifier keys (#1529) @mj12albert

### Toolbar

- Add Toolbar components (#1349) @mj12albert

### Tooltip

- `actionsRef` prop (#1236) @atomiks
- Fix `Provider` `delay=0` not being respected (#1416) @atomiks

### useRender

- Add public hook (#1418) @mnajdova
- Refine docs and APIs (#1551) @atomiks

### Docs

- Fix CSS issues (#1585) @atomiks
- Clean up old experiments (#1572) @mj12albert
- Fix SEO site name description (#1520) @oliviertassinari
- Fix `actionsRef` propTypes (#1460) @atomiks
- Tooltip guidelines (#1356) @atomiks
- Update the release instructions (#1444) @michaldudak
- Mention Progress.Value in API reference (#1429) @aarongarciah
- Update release instructions (#1417) @michaldudak

### Core

- [code-infra] Polish VS Code DX (#1238) @oliviertassinari
- [code-infra] Fix build:types not copying on some setups (#1482) @Janpot
- [Composite] Derive sorted map state (#1489) @atomiks
- Update release docs and scripts (#1245) @oliviertassinari
- Export namespaces consistently (#1472) @michaldudak
- Make `mergeReactProps` work with non-native event handlers (#1440) @michaldudak
- Remove babel-plugin-istanbul (#1409) @michaldudak
- Fix stylelint violations (#1422) @michaldudak
- Misc cleaning (#1579) @atomiks
- [mergeProps] Convert as a top level import and export publicly (#1535) @mnajdova
- [test] Fix wrong env skip (#1490) @atomiks
- [test] Fix PreviewCard test flake (#1487) @atomiks
- [test] Extract common popup tests (#1358) @michaldudak
- [test] Verify root exports (#1431) @michaldudak
- [test] Fix flaky browser tests (#1371) @atomiks
- [test] Update vitest to ^3 (#1453) @michaldudak
- [test] Skip flaky FieldRoot tests in real browsers (#1446) @michaldudak
- [useForkRef] Support ref cleanup functions (#1553) @atomiks
- [utils] Change order of args in `mergeReactProps` (#1533) @mnajdova

## v1.0.0-alpha.6

_Feb 6, 2025_

### AlertDialog

- `onOpenChangeComplete` prop (#1305) @atomiks
- Fix jump with `scroll-behavior` style (#1343) @atomiks

### Avatar

- Add Avatar component (#1210) @acomanescu

### Checkbox

- Avoid applying `hidden` attr when `keepMounted=true` for indicators (#1329) @onehanddev

### Dialog

- Remove `modal={open}` state (#1352) @atomiks
- Support multiple non-nested modal backdrops (#1327) @atomiks
- Fix missing `id`s on Title and Description (#1326) @mj12albert
- `onOpenChangeComplete` prop (#1305) @atomiks
- Fix jump with `scroll-behavior` style (#1343) @atomiks

### Field

- Respect `validationMode` (#1053) @atomiks
- Add `filled` and `focused` style hooks (#1341) @atomiks

### Form

- Fix focusing of invalid field controls on errors prop change (#1364) @atomiks

### Menu

- Avoid applying `hidden` attr when `keepMounted=true` for indicators (#1329) @onehanddev
- Support submenus with `openOnHover` prop (#1338) @atomiks
- Fix iPad detection when applying scroll lock (#1342) @mj12albert
- `onOpenChangeComplete` prop (#1305) @atomiks
- Fix jump with `scroll-behavior` style (#1343) @atomiks
- Add `OffsetFunction` for `sideOffset` and `alignOffset` (#1223) @atomiks
- Ensure `keepMounted` is a private param on `Positioner` (#1410) @atomiks

### Popover

- `onOpenChangeComplete` prop (#1305) @atomiks
- Add `OffsetFunction` for `sideOffset` and `alignOffset` (#1223) @atomiks
- Ensure `keepMounted` is a private param on `Positioner` (#1410) @atomiks

### PreviewCard

- `onOpenChangeComplete` prop (#1305) @atomiks
- Add `OffsetFunction` for `sideOffset` and `alignOffset` (#1223) @atomiks
- Ensure `keepMounted` is a private param on `Positioner` (#1410) @atomiks

### Progress

- Add `format` prop and `Value` component (#1355) @mj12albert

### Radio

- Avoid applying `hidden` attr when `keepMounted=true` for indicators (#1329) @onehanddev

### Select

- `onOpenChangeComplete` prop (#1305) @atomiks
- Fix jump with `scroll-behavior` style (#1343) @atomiks
- Add `OffsetFunction` for `sideOffset` and `alignOffset` (#1223) @atomiks
- Ensure `keepMounted` is a private param on `Positioner` (#1410) @atomiks

### Slider

- Fix thumb positioning (#1411) @mj12albert

### Tabs

- Fix being able to activate a disabled tab (#1359) @michaldudak
- Fix tabs activating incorrectly on non-primary button clicks (#1318) @mj12albert

### Tooltip

- `onOpenChangeComplete` prop (#1305) @atomiks
- Add `OffsetFunction` for `sideOffset` and `alignOffset` (#1223) @atomiks
- Ensure `keepMounted` is a private param on `Positioner` (#1410) @atomiks

## v1.0.0-alpha.5

_Jan 10, 2025_

### AlertDialog

- **Breaking change:** Require `Portal` part.
  The AlertDialog must explicitly include the Portal part wrapping the Popup.
  The `keepMounted` prop was removed from the Popup.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Don't call `onNestedDialogOpen` when unmounting a closed nested dialog [#1280](https://github.com/mui/base-ui/pull/1280) @mj12albert
- Fix the nesting of different dialogs [#1167](https://github.com/mui/base-ui/pull/1167) @mnajdova
- Remove `useFloating` call from the Popup [#1300](https://github.com/mui/base-ui/pull/1300) @michaldudak
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221) @atomiks
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161) @atomiks

### Dialog

- **Breaking change:** Require `Portal` part.
  The Dialog must explicitly include the Portal part wrapping the Popup.
  The `keepMounted` prop was removed from the Popup.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Don't call `onNestedDialogOpen` when unmounting a closed nested dialog [#1280](https://github.com/mui/base-ui/pull/1280) @mj12albert
- Fix the nesting of different dialogs [#1167](https://github.com/mui/base-ui/pull/1167) @mnajdova
- Remove `useFloating` call from the Popup [#1300](https://github.com/mui/base-ui/pull/1300) @michaldudak
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221) @atomiks
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161) @atomiks

### Menu

- **Breaking change:** Require `Portal` part.
  The Menu must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196) @atomiks
- Fix `focusableWhenDisabled` components [#1313](https://github.com/mui/base-ui/pull/1313) @mj12albert
- Fix `openOnHover` issues [#1191](https://github.com/mui/base-ui/pull/1191) @atomiks
- Fix closing the menu when clicking on checkboxitem/radioitem [#1301](https://github.com/mui/base-ui/pull/1301) @michaldudak
- Fix Enter key preventDefault when rendering links [#1251](https://github.com/mui/base-ui/pull/1251) @mj12albert
- Handle pseudo-element bounds in mouseup detection [#1250](https://github.com/mui/base-ui/pull/1250) @atomiks
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221) @atomiks
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161) @atomiks

### NumberField

- Correctly handle quick touches [#1294](https://github.com/mui/base-ui/pull/1294) @atomiks

### Popover

- **Breaking change:** Require `Portal` part.
  The Popover must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196) @atomiks
- Fix PopoverTrigger and TooltipTrigger prop types [#1209](https://github.com/mui/base-ui/pull/1209) @mnajdova

### PreviewCard

- **Breaking change:** Require `Portal` part.
  The PreviewCard must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196) @atomiks
- Use `FloatingPortalLite` [#1278](https://github.com/mui/base-ui/pull/1278) @atomiks

### Progress

- Set zero width when value is zero [#1204](https://github.com/mui/base-ui/pull/1204) @mj12albert

### ScrollArea

- Differentiate `x`/`y` orientation `data-scrolling` [#1188](https://github.com/mui/base-ui/pull/1188) @atomiks
- Read `DirectionProvider` and use logical positioning CSS props [#1194](https://github.com/mui/base-ui/pull/1194) @mj12albert

### Select

- **Breaking change:** Require `Portal` part.
  The Select must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Allow `id` to be passed to trigger [#1174](https://github.com/mui/base-ui/pull/1174) @atomiks
- Fallback to standard positioning when pinch-zoomed in Safari [#1139](https://github.com/mui/base-ui/pull/1139) @atomiks
- Fix `focusableWhenDisabled` components [#1313](https://github.com/mui/base-ui/pull/1313) @mj12albert
- Fix highlight flash on Safari [#1233](https://github.com/mui/base-ui/pull/1233) @atomiks
- Handle pseudo-element bounds in mouseup detection [#1250](https://github.com/mui/base-ui/pull/1250) @atomiks
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161) @atomiks

### Separator

- Support vertical orientation [#1304](https://github.com/mui/base-ui/pull/1304) @mj12albert

### Slider

- Ensure `onValueCommitted` is called with the same value as latest `onValueChange` [#1296](https://github.com/mui/base-ui/pull/1296) @mj12albert
- Replace internal map with `Composite` metadata [#1082](https://github.com/mui/base-ui/pull/1082) @mj12albert
- Set `position: relative` on range slider indicator [#1175](https://github.com/mui/base-ui/pull/1175) @mj12albert
- Use un-rounded values to position thumbs [#1219](https://github.com/mui/base-ui/pull/1219) @mj12albert

### Tabs

- Expose width/height state in tabs indicator [#1288](https://github.com/mui/base-ui/pull/1288) @aarongarciah

### Tooltip

- **Breaking change:** Require `Portal` part.
  The Tooltip must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222) @atomiks
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196) @atomiks
- Fix PopoverTrigger and TooltipTrigger prop types [#1209](https://github.com/mui/base-ui/pull/1209) @mnajdova
- Use `FloatingPortalLite` [#1278](https://github.com/mui/base-ui/pull/1278) @atomiks

## v1.0.0-alpha.4

_Dec 17, 2024_

Public alpha launch 🐣 Merry Xmas! 🎁
