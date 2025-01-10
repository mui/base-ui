# Versions

## v1.0.0-alpha.5

_Jan 10, 2025_

A big thanks to the 11 contributors who made this release possible.

### Breaking changes

- [popups] Require `Portal` part (#1222) @atomiks

  All the popup-based components (Dialog, AlertDialog, Popover, Menu, Select, Preview Card, and Tooltip) must explicitly include the Portal part wrapping the Positioner (or Popup in case of Dialog and AlertDialog).

  The `keepMounted` prop was removed from the Positioner and Popup parts.
  It's only present on Portal parts.

  ```diff
   <Popover.Root>
  +  <Popover.Portal keepMounted>
  -  <Popover.Positioner keepMounted>
  +    <Popover.Positioner>
  ```

  ```diff
   <Dialog.Root>
  +  <Dialog.Portal>
       <Dialog.Popup>
  ```

### Changes

- [Dialog, AlertDialog] Fix the nesting of different dialogs (#1167) @mnajdova
- [Dialog, Menu, Select] Set `pointer-events` on `InternalBackdrop` based on `open` state (#1221) @atomiks
- [Dialog] Don't call `onNestedDialogOpen` when unmounting a closed nested dialog (#1280) @mj12albert
- [Dialog] Remove `useFloating` call from the Popup (#1300) @michaldudak
- [Menu, Select, Dialog] Use internal backdrop for pointer modality (#1161) @atomiks
- [Menu] Fix `openOnHover` issues (#1191) @atomiks
- [Menu] Fix closing the menu when clicking on checkboxitem/radioitem (#1301) @michaldudak
- [NumberField] Correctly handle quick touches (#1294) @atomiks
- [Popover, Tooltip] Fix PopoverTrigger and TooltipTrigger prop types (#1209) @okmr-d
- [popups] Apply `aria-hidden` to `Arrow` parts (#1196) @atomiks
- [Progress] Set zero width when value is zero (#1204) @mj12albert
- [ScrollArea] Differentiate `x`/`y` orientation `data-scrolling` (#1188) @atomiks
- [ScrollArea] Read `DirectionProvider` and use logical positioning CSS props (#1194) @mj12albert
- [Select, Menu] Handle pseudo-element bounds in mouseup detection (#1250) @onehanddev
- [Select] Allow `id` to be passed to trigger (#1174) @atomiks
- [Select] Fallback to standard positioning when pinch-zoomed in Safari (#1139) @atomiks
- [Select] Fix highlight flash on Safari (#1233) @atomiks
- [Separator] Support vertical orientation (#1304) @mj12albert
- [Slider] Ensure `onValueCommitted` is called with the same value as latest `onValueChange` (#1296) @mj12albert
- [Slider] Replace internal map with `Composite` metadata (#1082) @mj12albert
- [Slider] Set `position: relative` on range slider indicator (#1175) @mj12albert
- [Slider] Use un-rounded values to position thumbs (#1219) @mj12albert
- [Tabs] Expose width/height state in tabs indicator (#1288) @aarongarciah
- [Tooltip, PreviewCard] Use `FloatingPortalLite` (#1278) @atomiks
- [useButton] Fix `focusableWhenDisabled` components (#1313) @mj12albert
- [useButton] Fix Enter key preventDefault when rendering links (#1251) @mj12albert
- [useButton] Modernize implementation (#1177) @mj12albert
- [useScrollLock] New implementation (#1159) @atomiks

All contributors of this release in alphabetical order: @aarongarciah, @atomiks, @colmtuite, @ericchernuka, @michaldudak, @mj12albert, @mnajdova, @okmr-d, @oliviertassinari, @onehanddev, @vladmoroz

## v1.0.0-alpha.4

_Dec 17, 2024_

Public alpha launch 🐣 Merry Xmas! 🎁
