# Legacy versions

## MUI Core v5.15.9

_Feb 8, 2024_

### `@mui/base@5.0.0-beta.36`

- [base-ui] Update props using Array to ReadonlyArray type (#40754) @RaghavenderSingh

## MUI Core v5.15.8

_Feb 6, 2024_

### `@mui/base@5.0.0-beta.34`

- [Button] Add support for `hostElementName` prop to improve SSR (#40507) @mj12albert
- [Menu] Use Popup instead of Popper (#40731) @michaldudak
- [useNumberInput] Integrate useNumberInput with useControllableReducer (#40206) @mj12albert
- [Slider] Add support for Arrow Down/Up + Shift and Page Up/Down keys (#40676) @mnajdova

## MUI Core v5.15.7

_Jan 31, 2024_

### `@mui/base@5.0.0-beta.34`

- [Input] Add OTP input demo (#40539) @sai6855
- [Menu] Focus last item after opening a menu using up arrow (#40764) @Jaswanth-Sriram-Veturi
- [Menu] Focus Menu Items on hover (#40755) @michaldudak

## MUI Core v5.15.6

_Jan 22, 2024_

### `@mui/base@5.0.0-beta.33`

- [Select] Fix display of selected Options with rich content (#40689) @michaldudak
- [Select] Use Popup instead of Popper (#40524) @michaldudak
- [useMenuButton] Fix non native button triggers (#40645) @DiegoAndai

## MUI Core v5.15.5

_Jan 17, 2024_

### `@mui/base@5.0.0-beta.32`

#### Breaking changes

-Change the CSS class prefix to `base-` (#40205) @michaldudak

The class prefix of Base UI components have been changed from `Mui-` to `base-`. This only affects codebases that uses class names verbatim, that is not exposed by JS objects such as `buttonClasses`, but as plain strings or in CSS stylesheets (`.MuiButton.root`)

To adapt your code to the new pattern:

- replace all occurrences of the regex `.Mui([A-Z][A-Za-z]*)-` with `.base-$1-` (so `MuiButton-root` becomes `base-Button-root`, etc.),
- replace all occurrences of the regex `.Mui-([a-z]*)` with `.base--$1` (so `Mui-disabled` becomes `base--disabled`, etc.).

#### Changes

- [Select] Fix screen-reader CSS to avoid body scrollbar (#40599) @brijeshb42
- [Switch] Add border-box to demos (#40638) @zanivan

## MUI Core 5.15.4

_Jan 10, 2024_

### `@mui/base@5.0.0-beta.31`

- [base-ui][NumberInput] Remove inputId and inputRef types from NumberInput component (#40425) @sai6855

## MUI Core 5.15.3

_Jan 3, 2024_

### `@mui/base@5.0.0-beta.30`

- [useSlider] Rearrange passive option in eventlisteners (#40235) @Kamino0

## MUI Core 5.15.2

_Dec 25, 2023_

### `@mui/base@5.0.0-beta.29`

- [Popup] Use context-based transition API (#39326) @michaldudak
- [Popup] Popup no longer opens outside viewport (#39827) @adamhylander
- [useSelect] Refactor to use DOM focus management instead of active descendant (#39675) @DiegoAndai

## MUI Core 5.15.0

_Dec 11, 2023_

### `@mui/base@5.0.0-beta.27`

- [base-ui] useControllableReducer warns when controlled props become uncontrolled (and vice versa) (#39096) @mj12albert

## MUI Core 5.14.19

_Nov 29, 2023_

### `@mui/base@5.0.0-beta.25`

- [Menu] Fix navigation of items when 1st item is disabled (#39828) @sai6855
- [Modal] Refine demos (#39824) @zanivan
- [NumberInput] Implement `numberInputReducer` (#38723) @mj12albert
- [useNumberInput] Fix change handlers passed through slotProps (#39407) @mj12albert

## MUI Core 5.14.18

_Nov 14, 2023_

### `@mui/base@5.0.0-beta.23`

- Make list components more reliable (#39380) @michaldudak

## MUI Core 5.14.16

_Oct 31, 2023_

### `@mui/base@5.0.0-beta.22`

- [Autocomplete] Standardize box shadow on demos (#39519) @zanivan
- [useSelect] Support browser autofill (#39595) @DiegoAndai
- [base-ui] Fix mergeSlotProps className join order (#39616) @mj12albert

## MUI Core 5.14.15

_Oct 24, 2023_

### `@mui/base@5.0.0-beta.21`

- [useAutocomplete] Correct keyboard navigation with multiple disabled options (#38788) @VadimZvf
- [Select] Standardize box shadow on demos (#39509) @zanivan
- [Slider] Refine demos (#39526) @zanivan
- [Input] Update and port additional tests from material-ui (#39584) @mj12albert

## MUI Core 5.14.14

_Oct 17, 2023_

### `@mui/base@5.0.0-beta.20`

- [base-ui][Menu] Do not reopen the menu after clicking on a trigger in Safari (#39393) @michaldudak

## MUI Core 5.14.13

_Oct 10, 2023_

### `@mui/base@5.0.0-beta.19`

- [Menu] Add the anchor prop (#39297) @michaldudak

## MUI Core 5.14.12

_Oct 3, 2023_

### `@mui/base@5.0.0-beta.18`

- [useSlider] Align externalProps handling (#38854) @mj12albert
- [useTabs] Align external props handling for useTab/useTabPanel/useTabsList (#39037) @mj12albert
- [test] Fix import paths in useTab tests (#39291) @mj12albert

## MUI Core 5.14.11

_Sep 26, 2023_

### `@mui/base@5.0.0-beta.17`

- [NumberInput] Support adornments (#38900) @anle9650
- [Menu] Align external props handling for useMenu/MenuButton/MenuItem (#38946) @mj12albert
- [Select] Align external props handling (#39038) @mj12albert
- [TextareaAutosize] Simplify logic and add test (#38728) @oliviertassinari

## MUI Core 5.14.10

_Sep 18, 2023_

### `@mui/base@5.0.0-beta.16`

- [NumberInput][base-ui] Warn when changing control mode with `useControlled` (#38757) @sai6855
- [Select][base-ui] Fix Select button layout shift, add placeholder prop (#38796) @mj12albert
- [useList][base-ui] Accept arbitrary external props and forward to root (#38848) @mj12albert
- [Autocomplete][base-ui] Added ref to getInputProps return value (#38919) @DarhkVoyd

## MUI Core 5.14.9

_Sep 13, 2023_

### `@mui/base@5.0.0-beta.15`

- [useSnackbar] Align externalProps handling (#38935) @mj12albert
- [useInput] Align ExternalProps naming (#38849) @mj12albert
- [FocusTrap] Refactor & cleanup (#38878) @mnajdova
- [FocusTrap] Fix `disableEnforceFocus` behavior (#38816) @mnajdova
- [Switch] Simplify source (#38910) @oliviertassinari

## MUI Core 5.14.8

_Sep 5, 2023_

### `@mui/base@5.0.0-beta.14`

- [Autocomplete] Type multiple values with readonly arrays. (#38253) @pcorpet
- [TextField] Fix unstable height of memoized multiline TextField component (#37135) @amal-qb

## MUI Core 5.14.7

_Aug 29, 2023_

### `@mui/base@5.0.0-beta.13`

- [useButton][base-ui] Accept arbitrary props in getRootProps and forward them (#38475) @DiegoAndai

## MUI Core 5.14.6

_Aug 23, 2023_

### `@mui/base@5.0.0-beta.12`

- [Popup] New component (#37960) @michaldudak

## MUI Core 5.14.5

_Aug 14, 2023_

### `@mui/base@5.0.0-beta.11`

- [base-ui] Remove the legacy Extend\* types (#38184) @michaldudak
- [base-ui] Add `useModal` hook (#38187) @mnajdova
- [base-ui] Add `prepareForSlot` util (#38138) @mnajdova
- [useButton][base-ui] Fix tabIndex not being forwarded (#38417) @DiegoAndai
- [useButton][base-ui] Fix onFocusVisible not being handled (#38399) @DiegoAndai

## MUI Core 5.14.4

_Aug 8, 2023_

### `@mui/base@5.0.0-beta.10`

#### Breaking changes

- [base] Ban default exports (#38200) @michaldudak

  Base UI default exports were changed to named ones. Previously we had a mix of default and named ones.
  This was changed to improve consistency and avoid problems some bundlers have with default exports.
  See https://github.com/mui/material-ui/issues/21862 for more context.

  ```diff
  - import Button, { buttonClasses } from '@mui/base/Button';
  + import { Button, buttonClasses } from '@mui/base/Button';
  - import BaseMenu from '@mui/base/Menu';
  + import { Menu as BaseMenu } from '@mui/base/Menu';
  ```

  Additionally, the `ClassNameGenerator` has been moved to the directory matching its name:

  ```diff
  - import ClassNameGenerator from '@mui/base/className';
  + import { ClassNameGenerator } from '@mui/base/ClassNameGenerator';
  ```

  A codemod is provided to help with the migration:

  ```bash
  npx @mui/codemod@latest v5.0.0/base-use-named-exports <path>
  ```

#### Changes

- [base] Create useNumberInput and NumberInput (#36119) @mj12albert
- [Select][base] Fix flicker on click of controlled Select button (#37855) @VishruthR
- [Dropdown] Fix imports of types (#38296) @yash-thakur

## MUI Core 5.14.3

_Jul 31, 2023_

### `@mui/base@5.0.0-beta.9`

#### Breaking changes

- [Dropdown][base][joy] Introduce higher-level menu component (#37667) @michaldudak

#### Other changes

- [typescript][base] Rename one letter type parameters (#38171) @michaldudak

## MUI Core 5.14.2

_Jul 25, 2023_

### @mui/material@5.14.2

- Revert "[core] Adds `component` prop to `OverrideProps` type (#35924)" (#38150) @michaldudak
- [Chip][material] Fix base cursor style to be "auto" not "default" (#38076) @DiegoAndai
- [Tabs] Refactor IntersectionObserver logic (#38133) @ZeeshanTamboli
- [Tabs] Fix and improve visibility of tab scroll buttons using the IntersectionObserver API (#36071) @SaidMarar

### @mui/joy@5.0.0-alpha.89

- [Joy] Replace leftover `Joy-` prefix with `Mui-` (#38086) @siriwatknp
- [Skeleton][joy] Fix WebkitMaskImage CSS property (#38077) @Bestwebdesign
- [Link][Joy UI] Fix font inherit (#38124) @oliviertassinari

## 5.14.1

_Jul 19, 2023_

### `@mui/base@5.0.0-beta.8`

- [Autocomplete] Make touch and click behavior on an option consistent (#37972) @divyammadhok

## MUI Core 5.13.7

_Jul 4, 2023_

### `@mui/base@5.0.0-beta.6`

- [Slider][base][material][joy] Fix not draggable on the edge when `disableSwap={true}` (#35998) @sai6855
- [Slider][base] Provide slot state to Slider's thumb slot props callback (#37749) @mnajdova
- [Tabs] Wrap TabsList context creation in useMemo (#37370) @michaldudak
- [TextareaAutosize] Fix wrong height measurement (#37185) @bigteech

## MUI Core 5.13.6

_Jun 21, 2023_

### `@mui/base@5.0.0-beta.5`

- [Menu][base] Add the resetHighlight action (#37392) @michaldudak
- [Select][base] Expose the `areOptionsEqual` prop (#37615) @michaldudak

## MUI Core 5.13.4

_Jun 5, 2023_

### `@mui/base@5.0.0-beta.4`

- [Input][base] Fix calling slotProps event handlers (#37463) @sai6855

## MUI Core 5.13.3

_May 29, 2023_

### `@mui/base@5.0.0-beta.3`

- [base] Maintain nodes document order in compound components (#36857) @michaldudak
- [base][joy] Prevent persisting hover state styles onclick on mobile (#36704) @gitstart
- [Menu][base] MenuItem as a link does not work (#37242) @nicolas-ot
- [MenuItem][Base] Pass idGenerator function (#37364) @sai6855
- [Slider][Base] Add Vertical slider demo (#37357) @sai6855

## MUI Core 5.13.1

_May 16, 2023_

### `@mui/base@5.0.0-beta.1`

- [Select][base] Keep focus on the trigger element when listbox is open (#37244) @michaldudak

## MUI Core 5.13.0

_May 10, 2023_

### `@mui/base@5.0.0-beta.0`

- [Select][base] Do not call onChange after initial render (#37141) @michaldudak
- [Select][base] Rename the `optionStringifier` prop (#37118) @michaldudak
- [typescript][base] Fix types of components callbacks parameters (#37169) @michaldudak
- [Select], [TablePagination] Use more descriptive parameter names (#37064) @michaldudak

## MUI Core 5.12.3

_May 2, 2023_

### `@mui/base@5.0.0-alpha.128`

#### Breaking changes

- The `component` prop is no longer supported because it can be replaced with the slots API. This is how the transformation will look like:

  ```diff
   <Button
  -  component="span"
  +  slots={{ root: "span" }}
   />
  ```

  If using TypeScript, the custom component type should be added as a generic on the `Button` component.

  ```diff
  -<Button
  +<Button<typeof CustomComponent>
     slots={{ root: CustomComponent }}
     customProp="foo"
   />
  ```

  There is codemod that you can run in your project to do the transformation:

  ```bash
  npx @mui/codemod@latest v5.0.0/base-remove-component-prop <path>
  ```

  The full documentation about the codemod can be found [here](https://github.com/mui/material-ui/blob/master/packages/mui-codemod/README.md#base-remove-component-prop).

  This is the list of PR related to this change:

  - [Button][base] Drop `component` prop (#36677) @mnajdova
  - [Badge][base] Drop `component` prop (#37028) @hbjORbj
  - [FormControl][base] Drop component prop (#37031) @hbjORbj
  - [Input][base] Drop component prop (#37057) @hbjORbj
  - [Menu][base] Drop component prop (#37033) @hbjORbj
  - [MenuItem][base] Drop component prop (#37032) @hbjORbj
  - [Modal][base] Drop component prop (#37058) @hbjORbj
  - [Option][base] Drop component prop (#37052) @hbjORbj
  - [OptionGroup][base] Drop component prop (#37055) @hbjORbj
  - [Popper][base] Drop component prop (#37084) @hbjORbj
  - [Select][base] Drop component prop (#37035) @hbjORbj
  - [Slider][base] Drop component prop (#37056) @hbjORbj
  - [Snackbar][base] Drop component prop (#37041) @nicolas-ot
  - [Switch][base] Drop component prop (#37053) @hbjORbj
  - [Tab][base] Drop component prop (#36768) @sai6855
  - [Tabs][base] Drop component prop (#36770) @sai6855
  - [TablePagination][base] Drop component prop (#37059) @sai6855
  - [TabPanel][base] Drop component prop (#37054) @sai6855
  - [TabsList][base] Drop component prop (#37042) @sai6855

- [base] Improve API consistency (#36970) @michaldudak

  Brought consistency to Base UI components and hooks' parameters and return values:

  1. Whenever a hook needs a ref, it's now called `<slot_name>Ref`, which matches the `get<slot_name>Props` in the return value.
  2. All hooks that accept external refs now return merged refs, making combining multiple hooks on one element easier. This was proven necessary in several compound components (like menuItem being both a button and a list item). The type of this value is `React.RefCallback` as using the more general `React.Ref` caused variance issues.
  3. Type of accepted refs is standardized to `React.Ref<Element>`
  4. Naming and typing of the forwarded ref in unstyled components were standardized - it's forwardedRef: React.ForwardedRef<Element> (unless a more specific type is needed).
  5. The shape of the definition of unstyled components was standardized - it's React.forwardRef(function Component(props: Props, forwardedRef: React.Ref<Element>) { ... });. Specifically, the generic parameters of forwardRef were removed as they are specified in function arguments.

#### Changes

- [FormControl][base] Do not use optional fields in useFormControlContext's return value (#37037) @michaldudak

## MUI Core 5.12.2

_Apr 25, 2023_

### `@mui/base@5.0.0-alpha.127`

#### Breaking changes

- [base] Remove unstyled suffix from Base components + Codemod script (#36873) @hbjORbj

  The `Unstyled` suffix has been removed from all Base UI component names, including names of types and other related identifiers.

  You can use this [codemod](https://github.com/mui/material-ui/blob/master/packages/mui-codemod/src/v5.0.0/base-remove-unstyled-suffix.js) to help with the migration:

  ```bash
  npx @mui/codemod@latest v5.0.0/base-remove-unstyled-suffix <path>
  ```

#### Changes

- [codemod][base] Improve the removal of `component` prop codemod script (#36952) @hbjORbj
- [codemod][base] Write a migration script for removal of `component` prop from components (#36831) @hbjORbj
- [Base][useButton] Allow useButton params to be completely optional (#36922) @mj12albert

## MUI Core 5.12.1

_Apr 17, 2023_

### `@mui/base@5.0.0-alpha.126`

#### Breaking changes

- [base] Refactor the compound components building blocks (#36400) @michaldudak
  Components affected by the changes are:
  - Menu
    - `MenuUnstyledContext` is replaced by `MenuProvider`. The value to pass to the provider is returned by the `useMenu` hook.
    - MenuUnstyled's `onClose` prop is replaced by `onOpenChange`. It has the `open` parameter and is called when a menu is opened or closed
  - Select
    - `SelectUnstyledContext` is replaced by `SelectProvider`. The value to pass to the provider is returned by the `useSelect` hook.
    - `SelectUnstyled`'s popup is permanently mounted.
    - The `defaultOpen` prop was added to the SelectUnstyled. The open/close state can now be controlled or uncontrolled, as a `value`.
  - Tabs
    - `TabsContext` is replaced by `TabsProvider`. The value to pass to the provider is returned by the `useTabs` hook.
    - To deselect all tabs, pass in `null` to Tabs' `value` prop, instead of `false`. This is consistent with how Select works.
    - The `value` prop is still technically not mandatory on TabUnstyled and TabPanel, but when omitted, the contents of the selected tab panel will not be rendered during SSR.

## MUI Core 5.12.0

_Apr 11, 2023_

### `@mui/base@5.0.0-alpha.125`

- [PopperUnstyled] Do not merge internal `ownerState` with `ownerState` from props (#36599) @hbjORbj

## MUI Core 5.11.15

_Mar 28, 2023_

### `@mui/base@5.0.0-alpha.122`

- [Autocomplete] Update `autoSelect` prop description (#36280) @sai6855
- [TablePagination][base] Improve `actions` type in `slotProps` (#36458) @sai6855
- [Base] Add JSDoc comments for classes of Base components (#36586) @hbjORbj
- [useSlider][base] Add API docs for the hook parameters and return type (#36576) @varunmulay22

## MUI Core 5.11.14

_Mar 21, 2023_

### `@mui/base@5.0.0-alpha.121`

- [docs][base] Improve the Slots Table in API docs (#36330) @hbjORbj

## MUI Core 5.11.13

_Mar 14, 2023_

### `@mui/base@5.0.0-alpha.121`

- [base] Disable classes generation via a context (#35963) @michaldudak
- [useMenu][base] Add return interface for useMenu hook (#36376) @HeVictor
- [useBadge] Add interface for the return value (#36042) @skevprog
- [useMenuItem] Add explicit return type (#36359) @rayrw
- [useTabs] Add explicit return type (#36047) @sai6855

## MUI Core 5.11.12

_Mar 6, 2023_

### `@mui/base@5.0.0-alpha.120`

#### Breaking changes

- [Select][base] Add the multiselect functionality to SelectUnstyled (#36274) @michaldudak

  The MultiSelectUnstyled was removed. The `SelectUnstyled` component with the `multiple` prop should be used instead. Additionally, the SelectUnstyledProps received a second generic parameter: `Multiple extends boolean`. If you deal with strictly single- or multi-select components, you can hard-code this parameter to `false` or `true`, respectively. Below is an example of how the migration should look like:

  ```diff
  -import MultiSelectUnstyled from '@mui/base/MultiSelectUnstyled';
  +import SelectUnstyled from '@mui/base/SelectUnstyled';

   export default App() {
  -return <MultiSelectUnstyled />
  +return <SelectUnstyled multiple />
   }
  ```

#### Changes

- [useSnackBar] Add explicit return type (#36052) @sai6855
- [useMenu] Fix `import type` syntax (#36411) @ZeeshanTamboli
- [useSwitch] Add explicit return type (#36050) @sai6855

## MUI Core 5.11.11

_Feb 27, 2023_

### `@mui/base@5.0.0-alpha.119`

#### Breaking changes

- [base] Remove `classes` prop from the Base components that have it (#36157) @hbjORbj
  These are the components affected by this change: ModalUnstyled, SliderUnstyled, TablePaginationUnstyled and TablePaginationActionsUnstyled.
  You can replace the `classes` prop by providing the class name prop directly to the prop via `slotProps`. Below is an example of how the migration should look like:

  ```diff
   <TablePaginationUnstyled
  -   classes={{ toolbar: 'toolbar-classname', menuItem: 'menuItem-classname' }}
  +   slotProps={{ toolbar: { className: 'toolbar-classname' }, menuItem: { className: 'menuItem-classname'}}}
   />
  ```

- [base] Move hooks to their own directories (#36235) @hbjORbj
  Base hooks (e.g., `useSelect`) are no longer exported from `{Component}Unstyled` directories and instead they have their own directories.
  Below is an example of how the migration should look like:

  ```diff
  -import { useBadge } from '@mui/base/BadgeUnstyled';
  +import useBadge from '@mui/base/useBadge';
  ```

  You can use this [codemod](https://github.com/mui/material-ui/blob/master/packages/mui-codemod/README.md#base-hook-imports) to help with the migration.

#### Changes

- [Autocomplete] Add docs interface for the hook (#36242) @HeVictor
- [MenuUnstyled] Remove extra useMemo (#36265) @ivp-dev
- [base] Export all slot prop overrides interfaces (#36323) @michaldudak

## MUI Core 5.11.9

_Feb 14, 2023_

### `@mui/base@5.0.0-alpha.118`

- [base] Override the types of `slotProps` per slot (#35964) @hbjORbj
- [Select][base] Prevent unnecessary rerendering of select items (#35946) @michaldudak
- [Select][base] Update the generated docs (#36183) @michaldudak
- [useAutocomplete] Pass only valid values for the getOptionLabel prop (#36088) @rangoo94
- [useAutocomplete] Fix `useAutocomplete` disabled prop not disabling the input (#36076) @sai6855
- [useInput] Add return value interface (#36036) @Shorifpatwary
- [UseTabPanel] Add explicit return type (#36053) @Shorifpatwary
- [useTabsList] Add explicit return type (#36048) @sai6855
- [Tab] Add explicit return type to useTab (#36046) @sai6855

## MUI Core 5.11.7

_Jan 31, 2023_

### `@mui/base@5.0.0-alpha.116`

- [ListboxUnstyled] Fix option state highlighted to prevent unnecessary focus (#35838) @SaidMarar

## MUI Core 5.11.6

_Jan 23, 2023_

### `@mui/base@5.0.0-alpha.115`

#### Breaking changes

- [SliderUnstyled] Improved logic for displaying the value label (#35805) @ZeeshanTamboli

  - The `valueLabelDisplay` prop is removed from `SliderUnstyled`. The prop was not working as intended in `SliderUnstyled` (See #35398). You can instead provide a `valueLabel` slot with the `slots` prop API to show the value label:

  ```diff
  - <SliderUnstyled valueLabelDisplay="on" />
  + <SliderUnstyled slots={{ valueLabel: SliderValueLabel }} />
  ```

  The following demo shows how to show a value label when it is hovered over with the thumb: https://mui.com/base-ui/react-slider/#value-label

  - The following classes are removed from `sliderUnstyledClasses` since they are not needed for the value label:

  ```diff
  - valueLabel
  - valueLabelOpen
  - valueLabelCircle
  - valueLabelLabel
  ```

  In the custom value label component, you can define your own classNames and target them with CSS.

  - The `SliderValueLabelUnstyled` component is removed from SliderUnstyled. You should provide your own custom component for the value label.

  - To avoid using `React.cloneElement` API in value label, the component hierarchy structure of the value label is changed. The value label is now inside the Thumb slot - `Thumb` -> `Input`, `ValueLabel`.

#### Changes

- [InputUnstyled] Fix externally provided `inputRef` is ignored (#35807) @sai6855

## MUI Core 5.11.5

_Jan 17, 2023_

### `@mui/base@5.0.0-alpha.114`

- [base] Fix typos (#35802) @nnmax
- [Slider] Convert code to TypeScript (#35445) @sai6855

## MUI Core 5.11.4

_Jan 9, 2023_

### `@mui/base@5.0.0-alpha.113`

- [Portal][base] Convert code to TypeScript (#35657) @sai6855

## MUI Core 5.11.2

_Dec 26, 2022_

### `@mui/base@5.0.0-alpha.112`

- [FocusTrap][base] Convert code to TypeScript (#35005) @trizotti
- [Modal][base] Convert code to TypeScript (#34793) @leventdeniz
- [Popper][base] Convert code to TypeScript (#34771) @danhuynhdev
- [Slider] Exclude `isRtl` from Material UI's Slider props (#35564) @michaldudak

## MUI Core 5.11.1

_Dec 20, 2022_

### `@mui/base@5.0.0-alpha.111`

- [Button][base] Set active class when a subcomponent is clicked (#35410) @michaldudak
- [Popper][base] Fix Tooltip Anchor Element Setter (#35469) @sydneyjodon-wk

## MUI Core 5.11.0

_Dec 13, 2022_

### `@mui/base@5.0.0-alpha.110`

- [PopperUnstyled] Update PopperTooltip to have correct width when closing with transition (#34714) @EduardoSCosta

## MUI Core 5.10.16

_Nov 28, 2022_

### `@mui/base@5.0.0-alpha.108`

- [Base] Allow useSlotProps to receive undefined elementType (#35192) @leventdeniz

## MUI Core 5.10.15

_Nov 21, 2022_

### `@mui/base@5.0.0-alpha.107`

- [Select] Add attributes to conform with ARIA 1.2 (#35182) @michaldudak

## MUI Core v5.10.13

_Nov 7, 2022_

### `@mui/base@5.0.0-alpha.105`

- [base] Avoid calling setState during renders (#34916) @Janpot

## MUI Core v5.10.12

_Oct 31, 2022_

### `@mui/base@5.0.0-alpha.104`

- [ButtonUnstyled] Update to render as link when href or to is provided (#34337) @EduardoSCosta

## MUI Core v5.10.11

_Oct 25, 2022_

### `@mui/base@5.0.0-alpha.103`

#### BREAKING CHANGE

- [base] `components` -> `slots` API rename (#34693) @michaldudak

  - Change all occurrences of components and componentsProps props in Base components to slots and slotProps, respectively.
  - Change casing of slots' fields to camelCase

  ```diff
  -<SwitchUnstyled components={{Root: CustomRoot}} componentsProps={{rail: { className: 'custom-rail' }}} />
  +<SwitchUnstyled slots={{root: CustomRoot}} slotProps={{rail: { className: 'custom-rail' }}} />
  ```

- [base] Make CSS class prefixes consistent (#33411) @michaldudak

  **This is a breaking change for anyone who depends on the class names applied to Base components.**
  If you use the `<component>UnstyledClasses` objects, you won't notice a difference. Only if you depend on the resulting class names (for example in CSS stylesheets), you'll have to adjust your code.

  ```diff
  -.ButtonUnstyled-root { ... };
  +.MuiButton-root { ... };
  ```

#### Changes

- [test] Test all Base components with describeConformanceUnstyled (#34825) @michaldudak

## MUI Core 5.10.10

_Oct 18, 2022_

### `@mui/base@5.0.0-alpha.102`

- [MultiSelect][base] Prevent the renderValue prop from being propagated to the DOM (#34698) @michaldudak
- [NoSsr] Convert code to TypeScript (#34735) @mbayucot

## MUI Core 5.10.9

_Oct 10, 2022_

### `@mui/base@5.0.0-alpha.101`

- [FocusTrap] Restore the previously exported type from @mui/material (#34601) @michaldudak

## MUI Core 5.10.8

_Oct 3, 2022_

### `@mui/base@5.0.0-alpha.100`

- [SnackbarUnstyled] Create component and `useSnackbar` hook (#33227) @ZeeshanTamboli

## MUI Core 5.10.7

_Sep 26, 2022_

### `@mui/base@5.0.0-alpha.99`

#### Breaking changes

- [FocusTrap] Rename TrapFocus to FocusTrap (#34216) @kabernardes

  ```diff
  -import TrapFocus from '@mui/base/TrapFocus';
  +import FocusTrap from '@mui/base/FocusTrap';
  ```

#### Changes

- [MultiSelect] Require a single tap to select an item on mobile Chrome (#33932) @michaldudak

## MUI Core 5.10.6

_Sep 19, 2022_

### `@mui/base@5.0.0-alpha.98`

#### Breaking changes

- [Select][base] Add event parameter to the onChange callback (#34158) @michaldudak

  The SelectUnstyled and MultiSelectUnstyled `onChange` callbacks did not have event as the first parameter, leading to inconsistency with other components and native HTML elements.
  This PR adds the event parameter as the first one and moves the newly selected value to the second position. Because of this, it's a breaking change.
  This also affects Select from Joy UI.

  ```jsx
  // before
  <SelectUnstyled onChange={(newValue) => { /* ... */ }} />

  // after
  <SelectUnstyled onChange={(event, newValue) => { /* ... */ }} />
  ```

## MUI Core 5.10.4

_Sep 5, 2022_

### `@mui/base@5.0.0-alpha.96`

- [Select][base] Fix type issues that appeared with TS 4.8 (#34132) @michaldudak

## MUI Core 5.10.3

_Aug 29, 2022_

### `@mui/base@5.0.0-alpha.95`

- [Button][base] Prevent too many ref updates (#33882) @michaldudak
- [Select][base] Fix typo in listbox blur event handler (#34120) @ZeeshanTamboli
- [FocusTrap] Improve tab test and simplify demo (#34008) @EthanStandel

## MUI Core 5.10.1

_Aug 15, 2022_

### `@mui/base@5.0.0-alpha.93`

- [FocusTrap] Removes invisible tabbable elements from (#33543) @EthanStandel
- [Input][base] Pass the rows prop to the underlying textarea (#33873) @michaldudak
- [SelectUnstyled] Add ability to post the select's value when submitting a form (#33697) @michaldudak

## MUI Core 5.9.2

_Jul 25, 2022_

### `@mui/base@5.0.0-alpha.91`

- [Base] Make PopperUnstyled `component` overridable (#33573) @siriwatknp
- [Base] Ensure all components are OverridableComponent (#33506) @michaldudak

## MUI Core 5.9.1

_Jul 18, 2022_

### `@mui/base@5.0.0-alpha.90`

- [base] Export types used by components' props (#33522) @michaldudak
- [base] Add missing type definitions in useControllableReducer (#33496) @michaldudak
- [SelectUnstyled] Do not call onChange unnecessarily (#33408) @michaldudak

## MUI Core 5.9.0

_Jul 12, 2022_

### `@mui/base@5.0.0-alpha.89`

- [Base] Change the order of class names merged in useSlotProps (#33383) @michaldudak
- [ModalUnstyled] Accept callbacks in componentsProps (#33181) @michaldudak
- [SelectUnstyled] Accept callbacks in componentsProps (#33197) @michaldudak
- [TabsUnstyled] Accept callbacks in componentsProps (#33284) @michaldudak

## MUI Core 5.8.7

_Jul 4, 2022_

### `@mui/base@5.0.0-alpha.88`

- [base] Remove a type incompatible with TypeScript 3.5 (#33361) @michaldudak
- [BadgeUnstyled] Export BadgeUnstyledOwnProps interface to fix TypeScript compiler error (#33314) @aaronlademann-wf
- [TablePaginationUnstyled] Accept callbacks in componentsProps (#33309) @michaldudak

## MUI Core 5.8.6

_Jun 27, 2022_

### `@mui/base@5.0.0-alpha.87`

- [base] Improve the return type of useSlotProps (#33279) @michaldudak
- [base] Improve some types (#33270) @mnajdova
- [MenuUnstyled] Fix keyboard accessibility of menu items (#33145) @michaldudak
- [ModalManager] Lock body scroll when container is inside shadow DOM (#33168) @jacobweberbowery
- [SliderUnstyled] Use useSlotProps (#33132) @michaldudak
- [TextareaAutosize] Fix crash when used with React 18 & Suspense (#33238) @howlettt
- [TextareaAutosize] Fix warnings for too many renders in React 18 (#33253) @mnajdova

## MUI Core 5.8.5

_Jun 20, 2022_

### `@mui/base@5.0.0-alpha.86`

- [BadgeUnstyled] Accept callbacks in componentsProps (#33176) @michaldudak
- [ButtonUnstyled] Use useSlotProps (#33096) @michaldudak
- [FormControlUnstyled] Accept callbacks in componentsProps (#33180) @michaldudak
- [InputUnstyled] Use useSlotProps (#33094) @michaldudak
- [ModalUnstyled] Define ownerState and slot props' types (#32901) @michaldudak
- [SwitchUnstyled] Use useSlotProps (#33174) @michaldudak

## MUI Core 5.8.4

_Jun 14, 2022_

### `@mui/base@5.0.0-alpha.85`

- [MenuUnstyled] Accept callbacks in componentsProps (#32997) @michaldudak
- [ModalUnstyled] Fix errors from the W3C validator about incorrect aria-hidden attribute on some elements (#30920) @mkrtchian
- [ModalUnstyled] Fix behavior of not respecting props ariaHidden value (#32055) @tech-meppem

## MUI Core 5.8.3

_Jun 7, 2022_

### `@mui/base@5.0.0-alpha.84`

- [base] Remove @mui/system in tests (#32945) @kevinji
- [ButtonUnstyled] Accept callbacks in componentsProps (#32991) @michaldudak
- [SwitchUnstyled] Accept callbacks in componentsProps (#32993) @michaldudak
- [TablePaginationUnstyled] Define ownerState and slot props' types (#32905) @michaldudak
- [TabPanelUnstyled] Define ownerState and slot props' types (#32928) @michaldudak
- [TabsListUnstyled] Define ownerState and slot props' types (#32925) @michaldudak

## MUI Core 5.8.2

_May 30, 2022_

### `@mui/base@5.0.0-alpha.83`

- [BadgeUnstyled] Define ownerState and slot props' types (#32750) @michaldudak
- [SliderUnstyled] Define ownerState and slot props' types (#32739) @michaldudak
- [SwitchUnstyled] Define ownerState and slot props' types (#32573) @michaldudak
- [TabsUnstyled] Define ownerState and slot props' types (#32918) @michaldudak
- [TabUnstyled] Define ownerState and slot props' types (#32915) @michaldudak

## MUI Core 5.8.1

_May 23, 2022_

### `@mui/base@5.0.0-alpha.82`

- [SliderUnstyled] Fix `disabledSwap` not being respected in `onChangeCommitted` (#32647) @JeanPetrov

## MUI Core 5.8.0

_May 17, 2022_

### `@mui/base@5.0.0-alpha.81`

- [InputUnstyled] Support callbacks in componentsProps (#32271) @michaldudak
- [InputUnstyled] Define ownerState and slot props' types (#32491) @michaldudak
- [MenuUnstyled] Demos improvements (#32714) @michaldudak
- [OptionUnstyled] Define ownerState and slot props' types (#32717) @michaldudak

## MUI Core 5.7.0

_May 10, 2022_

### `@mui/base@5.0.0-alpha.80`

- [ButtonUnstyled] Fix keyboard navigation on customized elements (#32204) @michaldudak

## MUI Core 5.6.3

_Apr 25, 2022_

### `@mui/base@5.0.0-alpha.78`

- [InputUnstyled] `multiline` property should not log DOM warnings for `maxRows` and `minRows` props (#32401) @ZeeshanTamboli

## MUI Core 5.6.2

_Apr 18, 2022_

### `@mui/base@5.0.0-alpha.77`

- [FormControlUnstyled] Revise API (#32134) @michaldudak

## MUI Core 5.6.1

_Apr 11, 2022_

### `@mui/base@5.0.0-alpha.76`

- [ButtonUnstyled] Allow receiving focus when disabled (#32090) @michaldudak

## MUI Core 5.6.0

_Apr 5, 2022_

### `@mui/base@5.0.0-alpha.75`

- [Badge] Simplify unstyled API (#31974) @michaldudak

## MUI Core 5.5.3

_Mar 28, 2022_

### `@mui/base@5.0.0-alpha.74`

#### Breaking changes

- [base] Remove `BackdropUnstyled` component (#31923) @mnajdova

  The `BackdropUnstyled` component was removed from the `@mui/base` package, as it did not have any specific logic, except adding an `aria-hidden` attribute on the div it rendered. This is not enough to justify it's existence in the base package. Here is an example alternative component you can use:

  ```tsx
  const BackdropUnstyled = React.forwardRef<HTMLDivElement, { open?: boolean; className: string }>(
    (props, ref) => {
      const { open, className, ...other } = props;
      return <div className={clsx({ 'MuiBackdrop-open': open }, className)} ref={ref} {...other} />;
    },
  );
  ```

- [FocusTrap] Move docs to Base and drop the Unstyled prefix (#31954) @michaldudak

  Removed the `Unstyled_` prefix from the Base export (it remains in the Material UI export, though).

  ```diff
  -import { Unstyled_TrapFocus } from '@mui/base';
  +import { TrapFocus } from '@mui/base';

   // or

  -import TrapFocus from '@mui/base/Unstyled_TrapFocus';
  +import TrapFocus from '@mui/base/TrapFocus';
  ```

#### Changes

- [base] Add @mui/types to dependencies (#31951) @bicstone

## MUI Core 5.5.2

_Mar 21, 2022_

### `@mui/base@5.0.0-alpha.73`

- [SliderUnstyled] Fix dragging on disabled sliders (#31882) @mnajdova

## MUI Core 5.5.1

_Mar 14, 2022_

### @mui/material@5.5.1

- [Fab] Add z-index (#30842) @issamElmohadeb098
- [Grid] Fix columns of nested container (#31340) @boutahlilsoufiane
- [i10n] Update italian locale (#30974) @SalvatoreMazzullo
- [Pagination] Fix type of UsePaginationItem["page"] (#31295) @aaronadamsCA
- [Popper] Allow setting default props in a theme (#30118) @hafley66
- [TextField] fix disappearing border in Safari (#31406) @krysia1

### @mui/joy@5.0.0-alpha.19

- [Joy] Support horizontal List (#31620) @siriwatknp
- [Joy] Add icon & label `Switch` examples (#31359) @siriwatknp
- [Joy] Add `TextField` component (#31299) @siriwatknp
- [Joy] Add `--Icon-fontSize` to components (#31360) @siriwatknp
- [Joy] Add `Checkbox` component (#31273) @siriwatknp

## 5.5.0

_Mar 7, 2022_

### `@mui/base@5.0.0-alpha.71`

- [MenuUnstyled] Create MenuUnstyled and useMenu (#30961) @michaldudak
- [SelectUnstyled] Prevent window scrolling after opening (#31237) @michaldudak

## MUI Core 5.4.4

_Feb 28, 2022_

### `@mui/base@5.0.0-alpha.70`

- [SelectUnstyled, MultiSelectUnstyled, ButtonUnstyled] Export additional types to make customization easier (#31172) @michaldudak

## MUI Core 5.4.2

_Feb 15, 2022_

### Framer

- [design] Remove framer components (#30983) @mbrookes
- [design] Remove framer leftovers (#31070) @michaldudak

## 5.4.1

_Feb 8, 2022_

### `@mui/base@5.0.0-alpha.68`

- [SelectUnstyled] Improve exported types (#30895) @michaldudak

## MUI Core 5.4.0

_Feb 1, 2022_

### `@mui/base@5.0.0-alpha.67`

- [SelectUnstyled] Create unstyled select (+ hook) (#30113) @michaldudak

## MUI Core 5.3.1

_Jan 24, 2022_

### `@mui/base@5.0.0-alpha.66`

- [SliderUnstyled] Improve typings on some internal utils (#30614) @mnajdova

## MUI Core 5.3.0

_Jan 17, 2022_

### `@mui/base@5.0.0-alpha.65`

- [SliderUnstyled] Add useSlider hook and polish (#30094) @mnajdova

## MUI Core 5.2.6

_Dec 27, 2021_

### `@mui/base@5.0.0-alpha.62`

- [BadgeUnstyled] Add useBadge hook (#30246) @mnajdova

## MUI Core 5.2.4

_Dec 14, 2021_

### `@mui/base@5.0.0-alpha.60`

- [BadgeUnstyled] Make it conformant with other base components (#30141) @mnajdova

## MUI Core 5.2.3

_Dec 6, 2021_

### `@mui/base@5.0.0-alpha.59`

- [base] Fix missing ClickAwayListener barrel index export (#30000) @oliviertassinari
- [TablePaginationUnstyled] Introduce new component (#29759) @mnajdova

## MUI Core 5.2.0

_Nov 23, 2021_

### `@mui/base@5.0.0-alpha.56`

- [FormControlUnstyled] `focused` is always false unless explicitly set to `true` @mwilkins91
- [TabsUnstyled] Introduce new component (#29597) @mnajdova

## MUI Core 5.1.1

_Nov 16, 2021_

### `@mui/base@5.0.0-alpha.55`

#### Breaking changes

- [core] Rename mui/core to mui/base (#29585) @michaldudak

  Based on the results of the [poll](https://x.com/michaldudak/status/1452630484706635779) and our internal discussions, we decided to rename the `@mui/core` package to `@mui/base`. The main rationale for this is the fact that we use the term "Core" to refer to the core components product family, the one that includes Material Design components, unstyled components, System utilities, etc. Therefore, @mui/core was effectively a subset of MUI Core. This was confusing.

  The new name better reflects the purpose of the package: it contains unstyled components, hooks, and utilities that serve as a **base** to build on.

  ```diff
  -import { useSwitch } from '@mui/core/SwitchUnstyled';
  +import { useSwitch } from '@mui/base/SwitchUnstyled';
  ```

## MUI Core 5.0.5

_Oct 26, 2021_

### `@mui/base@5.0.0-alpha.52`

- [ClickAwayListener] Move to the core package (#29186) @hbjORbj
- [Popper] Move from mui-material to mui-base (#28923) @rebeccahongsf
- [TextareaAutosize] Move to the core package (#29148) @hbjORbj

## MUI Core 5.0.4

_Oct 14, 2021_

### `@mui/base@5.0.0-alpha.51`

- [InputUnstyled] Create unstyled input and useInput hook (#28053) @michaldudak

## MUI Core 5.0.3

_Oct 7, 2021_

### `@mui/base@5.0.0-alpha.50`

- [ButtonUnstyled] Don't set redundant role=button (#28488) @michaldudak
- [SliderUnstyled] Prevent unknown-prop error when using marks prop (#28868) @hbjORbj

## MUI Core 5.0.0-rc.0

_Sep 1, 2021_

### `@mui/base@5.0.0-alpha.45`

- [Button] Create ButtonUnstyled and useButton (#27600) @michaldudak

## MUI Core 5.0.0-beta.5

_Aug 24, 2021_

### `@material-ui/unstyled@5.0.0-alpha.44`

- [core] Utilize `CSS.supports` in `SliderUnstyled` component (#27724) @DanailH

## MUI Core 5.0.0-beta.3

_Aug 6, 2021_

### `@material-ui/unstyled@5.0.0-alpha.42`

- [FormControl] Create FormControlUnstyled (#27240) @michaldudak
- [Autocomplete] Move useAutocomplete to the Unstyled package (#27485) @michaldudak

## MUI Core 5.0.0-beta.2

_Jul 26, 2021_

### `@material-ui/unstyled@5.0.0-alpha.41`

- [NoSsr] Move NoSsr to the Unstyled package (#27356) @michaldudak

## MUI Core 5.0.0-beta.1

_Jul 14, 2021_

### `@material-ui/unstyled@5.0.0-alpha.40`

- [Switch] Create SwitchUnstyled and useSwitch (#26688) @michaldudak

## MUI Core 5.0.0-alpha.37

_Jun 15, 2021_

### `@material-ui/unstyled@5.0.0-alpha.37`

- [Slider] Improve TS definition (#26642) @mnajdova
- [FocusTrap] Capture nodeToRestore via relatedTarget (#26696) @eps1lon

## MUI Core 5.0.0-alpha.31

_Apr 20, 2021_

### `@material-ui/unstyled@5.0.0-alpha.31`

- [unstyled] Convert generateUtilityClass(es) to TypeScript (#25753) @eps1lon

### `@material-ui/unstyled@5.0.0-alpha.29`

- [Slider] Allow disabling the left and right thumbs swap (#25547) @michal-perlakowski

## MUI Core 5.0.0-alpha.26

_Feb 27, 2021_

### `@material-ui/unstyled@5.0.0-alpha.26`

- [Portal] Migrate to unstyled (#24890) @povilass
- [FocusTrap] Migrate to unstyled (#24957) @povilass
- [Backdrop] Migrate to unstyled (#24985) @povilass
- [Modal] Migrate to emotion + unstyled (#24857) @povilass

## MUI Core 5.0.0-alpha.24

_Jan 26, 2021_

### `@material-ui/unstyled@5.0.0-alpha.24`

- [unstyled] Convert composeClasses to TypeScript (#24396) @eps1lon

## MUI Core 5.0.0-alpha.19

_Dec 13, 2020_

### `@material-ui/unstyled@v5.0.0-alpha.19`

- [core] Use Lerna to publish (#23793) @oliviertassinari

## MUI Core 5.0.0-alpha.17

_Nov 23, 2020_

### `@material-ui/unstyled@v5.0.0-alpha.17`

- [Slider] Replace core Slider with SliderStyled (#23308) @mnajdova

## MUI Core 5.0.0-alpha.16

_Nov 14, 2020_

### `@material-ui/unstyled@v5.0.0-alpha.16`

- [Slider] Extract slots as standalone components (#22893) @mnajdova

## MUI Core 5.0.0-alpha.15

_Nov 4, 2020_

### `@material-ui/unstyled@v5.0.0-alpha.15`

- [unstyled] Create package and move SliderUnstyled there (#23270) @mnajdova
- [core] Allow React 17 (#23311) @eps1lon
