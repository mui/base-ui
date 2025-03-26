# Versions

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
