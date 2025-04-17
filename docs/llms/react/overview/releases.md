---
title: Releases
subtitle: Changelogs for each Base UI release.
description: Changelogs for each Base UI release.
---
# Releases

Changelogs for each Base UI release.

## v1.0.0-alpha.6

**Feb 6, 2025**

### AlertDialog

- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Fix jump with `scroll-behavior` style ([#1343](https://github.com/mui/base-ui/pull/1343/))

### Avatar

- Add Avatar component ([#1210](https://github.com/mui/base-ui/pull/1210/))

### Checkbox

- Avoid applying `hidden` attr when `keepMounted=true` for indicators ([#1329](https://github.com/mui/base-ui/pull/1329/))

### Dialog

- Remove `modal={open}` state ([#1352](https://github.com/mui/base-ui/pull/1352/))
- Support multiple non-nested modal backdrops ([#1327](https://github.com/mui/base-ui/pull/1327/))
- Fix missing `id`s on Title and Description ([#1326](https://github.com/mui/base-ui/pull/1326/))
- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Fix jump with `scroll-behavior` style ([#1343](https://github.com/mui/base-ui/pull/1343/))

### Field

- Respect `validationMode` ([#1053](https://github.com/mui/base-ui/pull/1053/))
- Add `filled` and `focused` style hooks ([#1341](https://github.com/mui/base-ui/pull/1341/))

### Form

- Fix focusing of invalid field controls on errors prop change ([#1364](https://github.com/mui/base-ui/pull/1364/))

### Menu

- Avoid applying `hidden` attr when `keepMounted=true` for indicators ([#1329](https://github.com/mui/base-ui/pull/1329/))
- Support submenus with `openOnHover` prop ([#1338](https://github.com/mui/base-ui/pull/1338/))
- Fix iPad detection when applying scroll lock ([#1342](https://github.com/mui/base-ui/pull/1342/))
- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Fix jump with `scroll-behavior` style ([#1343](https://github.com/mui/base-ui/pull/1343/))
- Add `OffsetFunction` for `sideOffset` and `alignOffset` ([#1223](https://github.com/mui/base-ui/pull/1223/))
- Ensure `keepMounted` is a private param on `Positioner` ([#1410](https://github.com/mui/base-ui/pull/1410/))

### Popover

- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Add `OffsetFunction` for `sideOffset` and `alignOffset` ([#1223](https://github.com/mui/base-ui/pull/1223/))
- Ensure `keepMounted` is a private param on `Positioner` ([#1410](https://github.com/mui/base-ui/pull/1410/))

### PreviewCard

- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Add `OffsetFunction` for `sideOffset` and `alignOffset` ([#1223](https://github.com/mui/base-ui/pull/1223/))
- Ensure `keepMounted` is a private param on `Positioner` ([#1410](https://github.com/mui/base-ui/pull/1410/))

### Progress

- Add `format` prop and `Value` component ([#1355](https://github.com/mui/base-ui/pull/1355/))

### Radio

- Avoid applying `hidden` attr when `keepMounted=true` for indicators ([#1329](https://github.com/mui/base-ui/pull/1329/))

### Select

- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Fix jump with `scroll-behavior` style ([#1343](https://github.com/mui/base-ui/pull/1343/))
- Add `OffsetFunction` for `sideOffset` and `alignOffset` ([#1223](https://github.com/mui/base-ui/pull/1223/))
- Ensure `keepMounted` is a private param on `Positioner` ([#1410](https://github.com/mui/base-ui/pull/1410/))

### Slider

- Fix thumb positioning ([#1411](https://github.com/mui/base-ui/pull/1411/))

### Tabs

- Fix being able to activate a disabled tab ([#1359](https://github.com/mui/base-ui/pull/1359/))
- Fix tabs activating incorrectly on non-primary button clicks ([#1318](https://github.com/mui/base-ui/pull/1318/))

### Tooltip

- `onOpenChangeComplete` prop ([#1305](https://github.com/mui/base-ui/pull/1305/))
- Add `OffsetFunction` for `sideOffset` and `alignOffset` ([#1223](https://github.com/mui/base-ui/pull/1223/))
- Ensure `keepMounted` is a private param on `Positioner` ([#1410](https://github.com/mui/base-ui/pull/1410/))

## v1.0.0-alpha.5

**Jan 10, 2025**

### AlertDialog

- **Breaking change:** Require `Portal` part.
  The AlertDialog must explicitly include the Portal part wrapping the Popup.
  The `keepMounted` prop was removed from the Popup.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Don't call `onNestedDialogOpen` when unmounting a closed nested dialog [#1280](https://github.com/mui/base-ui/pull/1280)
- Fix the nesting of different dialogs [#1167](https://github.com/mui/base-ui/pull/1167)
- Remove `useFloating` call from the Popup [#1300](https://github.com/mui/base-ui/pull/1300)
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221)
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161)

### Dialog

- **Breaking change:** Require `Portal` part.
  The Dialog must explicitly include the Portal part wrapping the Popup.
  The `keepMounted` prop was removed from the Popup.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Don't call `onNestedDialogOpen` when unmounting a closed nested dialog [#1280](https://github.com/mui/base-ui/pull/1280)
- Fix the nesting of different dialogs [#1167](https://github.com/mui/base-ui/pull/1167)
- Remove `useFloating` call from the Popup [#1300](https://github.com/mui/base-ui/pull/1300)
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221)
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161)

### Menu

- **Breaking change:** Require `Portal` part.
  The Menu must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196)
- Fix `focusableWhenDisabled` components [#1313](https://github.com/mui/base-ui/pull/1313)
- Fix `openOnHover` issues [#1191](https://github.com/mui/base-ui/pull/1191)
- Fix closing the menu when clicking on checkboxitem/radioitem [#1301](https://github.com/mui/base-ui/pull/1301)
- Fix Enter key preventDefault when rendering links [#1251](https://github.com/mui/base-ui/pull/1251)
- Handle pseudo-element bounds in mouseup detection [#1250](https://github.com/mui/base-ui/pull/1250)
- Set `pointer-events` on `InternalBackdrop` based on `open` state [#1221](https://github.com/mui/base-ui/pull/1221)
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161)

### NumberField

- Correctly handle quick touches [#1294](https://github.com/mui/base-ui/pull/1294)

### Popover

- **Breaking change:** Require `Portal` part.
  The Popover must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196)
- Fix PopoverTrigger and TooltipTrigger prop types [#1209](https://github.com/mui/base-ui/pull/1209)

### PreviewCard

- **Breaking change:** Require `Portal` part.
  The PreviewCard must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196)
- Use `FloatingPortalLite` [#1278](https://github.com/mui/base-ui/pull/1278)

### Progress

- Set zero width when value is zero [#1204](https://github.com/mui/base-ui/pull/1204)

### ScrollArea

- Differentiate `x`/`y` orientation `data-scrolling` [#1188](https://github.com/mui/base-ui/pull/1188)
- Read `DirectionProvider` and use logical positioning CSS props [#1194](https://github.com/mui/base-ui/pull/1194)

### Select

- **Breaking change:** Require `Portal` part.
  The Select must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Allow `id` to be passed to trigger [#1174](https://github.com/mui/base-ui/pull/1174)
- Fallback to standard positioning when pinch-zoomed in Safari [#1139](https://github.com/mui/base-ui/pull/1139)
- Fix `focusableWhenDisabled` components [#1313](https://github.com/mui/base-ui/pull/1313)
- Fix highlight flash on Safari [#1233](https://github.com/mui/base-ui/pull/1233)
- Handle pseudo-element bounds in mouseup detection [#1250](https://github.com/mui/base-ui/pull/1250)
- Use internal backdrop for pointer modality [#1161](https://github.com/mui/base-ui/pull/1161)

### Separator

- Support vertical orientation [#1304](https://github.com/mui/base-ui/pull/1304)

### Slider

- Ensure `onValueCommitted` is called with the same value as latest `onValueChange` [#1296](https://github.com/mui/base-ui/pull/1296)
- Replace internal map with `Composite` metadata [#1082](https://github.com/mui/base-ui/pull/1082)
- Set `position: relative` on range slider indicator [#1175](https://github.com/mui/base-ui/pull/1175)
- Use un-rounded values to position thumbs [#1219](https://github.com/mui/base-ui/pull/1219)

### Tabs

- Expose width/height state in tabs indicator [#1288](https://github.com/mui/base-ui/pull/1288)

### Tooltip

- **Breaking change:** Require `Portal` part.
  The Tooltip must explicitly include the Portal part wrapping the Positioner.
  The `keepMounted` prop was removed from the Positioner.
  It's only present on the Portal part.
  [#1222](https://github.com/mui/base-ui/pull/1222)
- Apply `aria-hidden` to `Arrow` parts [#1196](https://github.com/mui/base-ui/pull/1196)
- Fix PopoverTrigger and TooltipTrigger prop types [#1209](https://github.com/mui/base-ui/pull/1209)
- Use `FloatingPortalLite` [#1278](https://github.com/mui/base-ui/pull/1278)

## 1.0.0-alpha.4

**December 17, 2024**

Public alpha launch 🐣 Merry Xmas! 🎁
