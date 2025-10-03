# Versions

## v1.0.0-beta.4

_Oct 1, 2025_

### General changes

- **Breaking change:** Generic event details.
  The main exported type is now `BaseUIChangeEventDetails` (with a paired `BaseUIGenericEventDetails`), not `BaseUIEventDetails`.
  (#2796) by @atomiks
- Update `disabled` prop of buttons when ref changes (#2756) by @chuganzy
- Refine event details (#2698) by @atomiks

### Accordion

- **Breaking change:** Use `useId` instead of composite index as fallback value.
  Accordion items must have an explicit `value` set in order to be initially open. Inferring the value by their DOM index is no longer supported.
  (#2664) by @mj12albert
- **Breaking change:** Rename `openMultiple` prop to `multiple`
  (#2764) by @LukasTy

### Autocomplete

- **Breaking change:** Rename `cols` to `grid` prop.
  Specify `grid={true}` instead of `cols={number}` - the columns are automatically inferred from `Autocomplete.Row`
  (#2683) by @atomiks
- Fix duplicate `onOpenChange` calls and pass correct DOM `event`.
  (#2682) by @atomiks
- Fix controlled input value updates (#2707) by @atomiks
- Fix input focus on close when clicking trigger (#2723) by @atomiks
- Add `alwaysSubmitOnEnter` prop and allow form submission on <kbd>Enter</kbd> if no item is highlighted by default (#2700) by @atomiks
- Use `ReadonlyArray` type for `items` (#2819) by @atomiks

### Collapsible

- Fix CollapsiblePanel type to use its own state (#2697) by @chuganzy
- Respect user's CSS `display` property on panel (#2772) by @mj12albert

### Combobox

- **Breaking change**: `onItemHighlighted` now has a `reason` property instead of `type` to be consistent with the `eventDetails` API. (#2796) by @atomiks
- **Breaking change:** Rename `cols` to `grid` prop.
  Specify `grid={true}` instead of `cols={number}` - the columns are automatically inferred from `Combobox.Row`
  (#2683) by @atomiks
- Fix duplicate `onOpenChange` calls and pass correct DOM `event`.
  (#2682) by @atomiks
- Fix initial closed typeahead (#2665) by @atomiks
- Support `autoHighlight` prop (#2668) by @atomiks
- Set default input value based on `value` prop (#2680) by @atomiks
- Fix controlled input value updates (#2707) by @atomiks
- Fix input focus on close when clicking trigger. Fixes a jump to the bottom of the page in Safari (#2723) by @atomiks
- Fix unexpected close with multiple selection and input inside popup (#2771) by @atomiks
- Allow form submission on <kbd>Enter</kbd> if no item is highlighted by default (#2700) by @atomiks
- Avoid refiltering with ending transition in multiple selection mode (#2681) by @atomiks
- Support object values with `isItemEqualToValue` prop (#2704) by @atomiks
- Use `ReadonlyArray` type for `items` (#2819) by @atomiks
- Fix misleading `item-press` reason in `onInputValueChange` (#2830) by @atomiks
- Clear single-select value on input clear (#2860) by @atomiks
- Fix `focusout` of input not closing popup under certain conditions (#2864)

### Context Menu

- Ensure submenus close when parents close (#2768) by @atomiks
- Fix `onClick` firing twice on first click of item (#2849) by @atomiks

### Menu

- Ensure submenus close when parents close (#2768) by @atomiks
- Allow non-nested portals across differing popup trees (#2818) by @atomiks

### Menubar

- Fix Menubar not disabling child Menus (#2736) by @aarongarciah
- Ensure submenus close when parents close (#2768) by @atomiks
- Fix `CompositeList` not updating item order on reordering (#2675) by @chuganzy

### Navigation Menu

- Make link close on click configurable (#2740) by @atomiks
- Fix focus returning to trigger without animations (#2779) by @atomiks
- Fix `CompositeList` not updating item order on reordering (#2675) by @chuganzy

### Number Field

- Fix stuck virtual cursor after mouse tap (#2720) by @atomiks
- Improve parsing logic (#2725) by @atomiks
- Align value changes with `Slider`. An `onValueCommitted` callback has been added. (#2726) by @atomiks

### Popover

- Allow non-nested portals across differing popup trees (#2818) by @atomiks

### Scroll Area

- Add overflow presence state attributes and CSS variables (#2478) by @atomiks
- Fix RTL horizontal scrollbar on Safari (#2776) by @atomiks
- Fix thumb size flicker (#2778) by @atomiks

### Select

- **Breaking change:** Add `Select.List` component. It is now possible for `Select.ScrollArrow` to show when in fallback (`alignItemWithTrigger` deactivated). As a result, if you want the scroll arrows to be hidden in this mode like before, change the styles to default to `display: none` on `.ScrollArrow`, and `display: block` when `[data-side="none"]`. (#2596) by @atomiks
- Block opening the popup when provided `readOnly` (#2717) by @seongminn
- Add `open` state for `Select.Icon` and fix `ref` type (#2714) by @seongminn
- Support object values with `isItemEqualToValue` prop (#2704) by @atomiks
- Use `ReadonlyArray` type for `items` (#2819) by @atomiks

### Slider

- **Breaking change:** `onValueChange` has `activeThumbIndex` as part of the `eventDetails` object as a second parameter, not third. (#2796) by @atomiks
- **Breaking change:** Remove redundant hidden inputs.
  The `inputRef` prop is moved from `Root` to `Thumb`.
  (#2631) by @mj12albert
- Fix pointer tracking bugs (#2688) by @mj12albert
- Fix input attributes (#2728) by @mj12albert
- Add `thumbAlignment` prop (#2540) by @mj12albert

### Switch

- Fix duplicate `name` attribute (#2763) by @mj12albert

### Toast

- **Breaking change:** Support variable height stacking.
  Toasts that have varying heights no longer force a `data-expanded` expanded state on the viewport. CSS should be amended to ensure larger toasts don't overflow a small toast stacked at the front. See this [diff](https://github.com/mui/base-ui/pull/2742/files#diff-e378460dafb74fe0c90ef960ad0ef1c38d68d74b63815520bb437f9041361917) for new styles, along with general improvements to stacking styles.
  (#2742) by @atomiks
- Reduce stickiness of expanded state (#2770) by @atomiks
- Ensure toast is frozen at its current visual transform while swiping (#2769) by @atomiks

### Toggle Group

- **Breaking change:** Rename `toggleMultiple` prop to `multiple`.
  (#2764) by @LukasTy

### Toolbar

- Fix `CompositeList` not updating item order on reordering (#2675) by @chuganzy

### useRender

- Add div as a `defaultTagName` (#2692) by @mnajdova

All contributors of this release in alphabetical order: @aarongarciah, @atomiks, @brijeshb42, @chuganzy, @Copilot, @Janpot, @LukasTy, @martenbjork, @michaldudak, @mj12albert, @mnajdova, @oliviertassinari, @seongminn, @sukvvon, @vladmoroz

## v1.0.0-beta.3

_Sep 3, 2025_

### General changes

- **Breaking change:** Base UI event details.
  Custom event callbacks provide BaseUIEventDetails object as their second parameter.
  This object contains the source event, reason and methods to customize the behavior (where applicable).
  For example, `onOpenChange(open, event, reason)` becomes `onOpenChange(open, eventDetails)`, where `eventDetails` contains `event` and `reason` properties.
  ```diff
  -onOpenChange: (open, event, reason) => {
  +onOpenChange: (open, eventDetails) => {
  -  if (reason === 'escape-key') {
  +  if (eventDetails.reason === 'escape-key') {
       // ...
     }
   }
  ```
  (#2382) by @atomiks

### Alert Dialog

- **Breaking change:** Support `initialFocus` and `finalFocus` functions.
  The `initialFocus` and `finalFocus` props can be functions that return DOM elements to focus.
  This is a new feature for `finalFocus` and a breaking change for `initialFocus` as the element must be returned directly (not as a ref).
  (#2536) by @atomiks

### Autocomplete

- New Autocomplete component (#2105) by @atomiks

### Checkbox

- Fix missing validity attributes when wrapped in `Field` (#2572) by @Copilot

### Combobox

- New Combobox component (#2105) by @atomiks

### Context Menu

- Fix default offsets when `align="center"` or `side` differs (#2601) by @atomiks

### Dialog

- **Breaking change:** Support `initialFocus` and `finalFocus` functions.
  The `initialFocus` and `finalFocus` props can be functions that return DOM elements to focus.
  This is a new feature for `finalFocus` and a breaking change for `initialFocus` as the element must be returned directly (not as a ref).
  (#2536) by @atomiks
- Restore focus to popup when focused element is removed (#2479) by @atomiks

### Field

- Prevent defaultValue reset on focus for uncontrolled inputs (#2543) by @ingokpp
- Allow `onValueChange` to fire when `defaultValue`/`value` are not set (#2600) by @atomiks

### Input

- Allow `onValueChange` to fire when `defaultValue`/`value` are not set (#2600) by @atomiks

### Menu

- **Breaking change:** Fix `closeParentOnEsc` default value.
  The default value of `closeParentOnEsc` in Menu.SubmenuRoot is now false.
  When the <kbd>Esc</kbd> key is pressed in a Submenu, the Submenu closes, and the focus correctly moves to the SubmenuTrigger.
  (#2493) by @seongminn
- **Breaking change:** Support `initialFocus` and `finalFocus` functions.
  The `initialFocus` and `finalFocus` props can be functions that return DOM elements to focus.
  This is a new feature for `finalFocus` and a breaking change for `initialFocus` as the element must be returned directly (not as a ref).
  (#2536) by @atomiks
- Fix menu not opening when inside context menu trigger (#2506) by @baptisteArno
- Fix `transform-origin` variable calculation when Positioner `sideOffset` is a function (#2511) by @atomiks
- Fix submenu events (#2483) by @atomiks
- Fix `limitShift` offset based on arrow size (#2571) by @atomiks

### Navigation Menu

- **Breaking change:** Semantic element structure and `active` page prop.
  `NavigationMenu.List` renders `<ul>` and `NavigationMenu.Item` renders `<li>` by default.
  (#2526) by @atomiks
- Unshare `AbortController` instance (#2441) by @tomokinat
- Close on link click by default (#2535) by @atomiks

### Number Field

- Fix duplicate `onValueChange` calls (#2591) by @atomiks

### Popover

- **Breaking change:** Support `initialFocus` and `finalFocus` functions.
  The `initialFocus` and `finalFocus` props can be functions that return DOM elements to focus.
  This is a new feature for `finalFocus` and a breaking change for `initialFocus` as the element must be returned directly (not as a ref).
  (#2536) by @atomiks
- Fix outside click after right clicking in popup (#2508) by @baptisteArno
- Fix unexpected close when nested inside two popovers (#2481) by @atomiks
- Fix `transform-origin` variable calculation when Positioner `sideOffset` is a function (#2511) by @atomiks
- Restore focus to popup when focused element is removed (#2479) by @atomiks
- Fix `limitShift` offset based on arrow size (#2571) by @atomiks

### Preview Card

- Fix `transform-origin` variable calculation when Positioner `sideOffset` is a function (#2511) by @atomiks
- Fix `limitShift` offset based on arrow size (#2571) by @atomiks

### Radio Group

- Return null in form data when no option selected (#2473) by @ingokpp

### Scroll Area

- Prevent pointer events from sibling portals triggering hover (#2542) by @KenanYusuf

### Select

- Fix stale `items` prop (#2397) by @atomiks
- Fix unexpected close when nested inside two popovers (#2481) by @atomiks
- Fix `onValueChange` type inference (#2372) by @atomiks
- Fix `transform-origin` variable calculation when Positioner `sideOffset` is a function (#2511) by @atomiks
- Reset state when selected item is removed (#2577) by @atomiks
- Fix `data-highlighted` and DOM focus item desync (#2569) by @atomiks
- Fix item click with `defaultOpen` prop (#2570) by @atomiks
- Fix scroll arrows not propagating scroll fully to start/end of list (#2523) by @atomiks
- Fix `limitShift` offset based on arrow size (#2571) by @atomiks

### Slider

- **Breaking change:** Instead of the thumb div, the `input type="range"` element receives focus. Focus styles that were targeting the thumb, should be updated.
  For example `.Thumb:focus-visible` should be replaced with `.Thumb:has(:focus-visible)`.
  The `tabIndex` prop is moved from Root to Thumb where it gets forwarded to the input.
  The thumb's `render` prop no longer contains the third `inputProps` argument; the input element is instead merged with children.
  (#2578) by @mj12albert
- Reduce bundle size (#2551) by @oliviertassinari
- Fix thumb `:focus-visible` with mixed keyboard and pointer modality (#2584) by @mj12albert
- Add `index` prop to `Slider.Thumb` (#2593) by @mj12albert

### Tabs

- Fix tab size rounding (#2488) by @atomiks
- Fix highlight sync when focus is inside list (#2487) by @atomiks

### Tooltip

- Fix `transform-origin` variable calculation when Positioner `sideOffset` is a function (#2511) by @atomiks
- Fix `limitShift` offset based on arrow size (#2571) by @atomiks

### useRender

- Add support for data-\* attributes (#2524) by @Raghuboi
- Add `defaultTagName` parameter (#2527) by @atomiks

All contributors of this release in alphabetical order: @atomiks, @baptisteArno, @brijeshb42, @Copilot, @ingokpp, @Janpot, @KenanYusuf, @LukasTy, @michaldudak, @mirka, @mj12albert, @mnajdova, @oliviertassinari, @Powerplex, @Raghuboi, @seongminn, @tomokinat

## v1.0.0-beta.2

_Jul 30, 2025_

### General changes

- Fix navigator checks and ensure safe platform retrieval (#2273) by @mo36924
- Prevent `Space` key default on keydown (#2295) by @atomiks
- Check for `performance` existence on server (#2316) by @atomiks

### Accordion

- Destructure `render` prop (#2280) by @atomiks
- Fix keyboard interactions with elements in the panel (#2321) by @mj12albert
- Fix open transitions in Safari/Firefox (#2327) by @atomiks

### Alert Dialog

- Support `ShadowRoot` containers (#2236) by @atomiks
- Add `forceRender` prop to `Backdrop` part (#2037) by @atomiks
- Improve outside press behavior with touch input (#2334) by @atomiks

### Checkbox

- Fix focusing form controls with `inputRef` (#2252) by @mj12albert

### Collapsible

- Destructure render prop (#2323) by @atomiks
- Fix open transitions in Safari/Firefox (#2327) by @atomiks

### Dialog

- Support `ShadowRoot` containers (#2236) by @atomiks
- Add `forceRender` prop to `Backdrop` part (#2037) by @atomiks
- Improve outside press behavior with touch input (#2334) by @atomiks
- Use `click` event for outside press dismissal (#2275) by @atomiks

### Field

- Deregister fields from `Form` when unmounting (#2231) by @mj12albert

### Form

- Deregister fields from `Form` when unmounting (#2231) by @mj12albert

### Menu

- Support `ShadowRoot` containers (#2236) by @atomiks
- Avoid double `useRenderElement` passes (#2256) by @atomiks
- Improve outside press behavior with touch input (#2334) by @atomiks
- Close submenus when focus is lost by shift-tabbing (#2290) by @michaldudak

### Menubar

- Fix triggers role (#2317) by @atomiks

### Meter

- Fix ARIA attributes and update docs (#2267) by @mj12albert

### Navigation Menu

- **Breaking change:** Support inlined nesting.
  Ensure the popup's `width` is set to `var(--popup-width)` unconditionally (without the media query) on the `.Popup` class.
  (#2269) by @atomiks
- Avoid double `useRenderElement` passes (#2256) by @atomiks
- Add `useButton` integration to `Trigger` (#2296) by @atomiks
- Fix popup size transitions on iOS (#2387) by @atomiks

### Number Field

- Remove `invalid` prop (#2315) by @atomiks
- Fix button disabled state only including root disabled state (#2268) by @mj12albert

### Popover

- Support `ShadowRoot` containers (#2236) by @atomiks
- Remove ancestor nodes from inside elements for outside press detection (#2339) by @atomiks
- Improve outside press behavior with touch input (#2334) by @atomiks
- Use `click` event for outside press dismissal (#2275) by @atomiks

### Preview Card

- Support `ShadowRoot` containers (#2236) by @atomiks

### Progress

- Fix ARIA attributes and update docs (#2267) by @mj12albert

### Radio Group

- Add aria-required attribute (#2227) by @cgatian
- Extend state with `FieldRoot.State` (#2251) by @mj12albert
- Fix focusing form controls with `inputRef` (#2252) by @mj12albert
- Avoid double `useRenderElement` passes (#2256) by @atomiks

### Scroll Area

- Disable `user-select` on scrollbar and non-main button interactions (#2338) by @atomiks

### Select

- Support `ShadowRoot` containers (#2236) by @atomiks
- Add `value` and `readOnly` to `Select.Trigger` state (#2237) by @atomiks
- Add `multiple` prop (#2173) by @atomiks
- Allow typeahead while open for `multiple` mode (#2274) by @atomiks
- Ensure positionerElement is available in document mouseup (#2276) by @atomiks
- Fix `alignItemWithTrigger` fallback scroll jump (#2241) by @atomiks
- Support conditional `multiple` prop in types (#2369) by @atomiks
- Fix multiple ARIA behavior on touch (#2333) by @atomiks
- Improve outside press behavior with touch input (#2334) by @atomiks

### Slider

- Fix focusing form controls with `inputRef` (#2252) by @mj12albert

### Toast

- Fix `promise` method timeout option handling (#2294) by @atomiks
- Make `Toast.Viewport` an announce container (#2246) by @atomiks

### Toggle

- Avoid double `useRenderElement` passes (#2256) by @atomiks

### Toggle Group

- Avoid double `useRenderElement` passes (#2256) by @atomiks

### Toolbar

- Avoid double `useRenderElement` passes (#2256) by @atomiks

### Tooltip

- Support `ShadowRoot` containers (#2236) by @atomiks
- Memoize leftover object in tooltip (#2250) by @sai6855
- Fix error when combining `defaultOpen` and `disabled` (#2374) by @atomiks

All contributors of this release in alphabetical order: @aelfannir, @atomiks, @brijeshb42, @cgatian, @Janpot, @michaldudak, @mj12albert, @mo36924, @romgrk, @sai6855

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
- Always set `id` on the `<input>` element (#2115) by @mj12albert

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
- [useMergedRefs] Support ref cleanup functions (#1553) @atomiks
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
