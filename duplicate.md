# Duplicated Code in `packages/react/src/`

Audit of 975 `.ts`/`.tsx` files across 48 component and hook directories.
No code changes were made — this is a documentation-only report.

---

## Table of Contents

1. [Identical Backdrop DataAttributes Enums](#1-identical-backdrop-dataattributes-enums)
2. [Identical Positioner DataAttributes Enums](#2-identical-positioner-dataattributes-enums)
3. [Identical Arrow DataAttributes Enums](#3-identical-arrow-dataattributes-enums)
4. [Identical Viewport CSS Variables Enums](#4-identical-viewport-css-variables-enums)
5. [Positioner CSS Variables (Partial Duplication)](#5-positioner-css-variables-partial-duplication)
6. [Identical Viewport `stateAttributesMapping` for `activationDirection`](#6-identical-viewport-stateattributesmapping-for-activationdirection)
7. [Identical Popup/Backdrop `stateAttributesMapping` Composition](#7-identical-popupbackdrop-stateattributesmapping-composition)
8. [Boolean-to-Empty-String State Attribute Mapper Pattern](#8-boolean-to-empty-string-state-attribute-mapper-pattern)
9. [`defaultInitialFocus` Function Duplicated in Dialog and Popover](#9-defaultinitialfocus-function-duplicated-in-dialog-and-popover)
10. [Identical `useOpenChangeComplete` Invocations in Popup Components](#10-identical-useopenchangecomplete-invocations-in-popup-components)
11. [Identical Arrow Component Structure (Popover / Tooltip / PreviewCard)](#11-identical-arrow-component-structure-popover--tooltip--previewcard)
12. [Identical Viewport Component Structure (Popover / Tooltip / PreviewCard)](#12-identical-viewport-component-structure-popover--tooltip--previewcard)
13. [Identical Backdrop Component Structure (Select / Combobox)](#13-identical-backdrop-component-structure-select--combobox)
14. [Near-Identical Positioner `defaultProps` Style Construction](#14-near-identical-positioner-defaultprops-style-construction)
15. [Title/Description ID Management Inconsistency (Dialog vs Popover)](#15-titledescription-id-management-inconsistency-dialog-vs-popover)
16. [Identical `aria-labelledby` + `aria-describedby` Pattern](#16-identical-aria-labelledby--aria-describedby-pattern)
17. [Identical `MenuCheckboxItemIndicator` and `MenuRadioItemIndicator`](#17-identical-menucheckboxitemindicator-and-menuradioitemindicator)
18. [Near-Identical `MenuCheckboxItem` and `MenuRadioItem` DataAttributes](#18-near-identical-menucheckboxitem-and-menuradioitem-dataattributes)
19. [Identical Toast `Title` and `Description` Component Logic](#19-identical-toast-title-and-description-component-logic)
20. [Identical Toast Component `State` Interface (4 files)](#20-identical-toast-component-state-interface-4-files)
21. [`AccordionPanel` and `CollapsiblePanel` Near-Identical Logic](#21-accordionpanel-and-collapsiblepanel-near-identical-logic)
22. [Identical CSS Variable Height/Width Construction in Panels](#22-identical-css-variable-heightwidth-construction-in-panels)
23. [ScrollArea Boolean State Attribute Mapper (6× same pattern)](#23-scrollarea-boolean-state-attribute-mapper-6-same-pattern)
24. [Identical `AccordionHeader` and `AccordionItem` DataAttributes Enums](#24-identical-accordionheader-and-accordionitem-dataattributes-enums)
25. [Identical Checked/Unchecked State Attribute Mapper (Checkbox / Radio / Switch)](#25-identical-checkedunchecked-state-attribute-mapper-checkbox--radio--switch)
26. [Duplicated Hidden Input Setup (Checkbox / Radio / Switch)](#26-duplicated-hidden-input-setup-checkbox--radio--switch)
27. [Identical Click-to-Hidden-Input Dispatch (Checkbox / Radio / Switch)](#27-identical-click-to-hidden-input-dispatch-checkbox--radio--switch)
28. [Identical `onChange` Workaround Pattern (React #9023)](#28-identical-onchange-workaround-pattern-react-9023)
29. [Identical `onBlur` Validation Handler (Checkbox / Switch)](#29-identical-onblur-validation-handler-checkbox--switch)
30. [Duplicated Indicator Component Structure (Checkbox / Radio)](#30-duplicated-indicator-component-structure-checkbox--radio)
31. [Duplicated `useTransitionStatus` + `useOpenChangeComplete` in Indicators](#31-duplicated-usetransitionstatus--useopenchangecomplete-in-indicators)
32. [Duplicated `useControlled` Pattern in Group Components](#32-duplicated-usecontrolled-pattern-in-group-components)
33. [Duplicated `useField` Hook Usage Pattern](#33-duplicated-usefield-hook-usage-pattern)
34. [Duplicated `useValueChanged` Validation Flow in Groups](#34-duplicated-usevaluechanged-validation-flow-in-groups)
35. [Duplicated Identical Data Attribute Enums (Checkbox / Radio / Switch)](#35-duplicated-identical-data-attribute-enums-checkbox--radio--switch)
36. [`SelectValue` and `ComboboxValue` Near-Identical Label Resolution Logic](#36-selectvalue-and-comboboxvalue-near-identical-label-resolution-logic)
37. [`BOUNDARY_OFFSET` Constant Duplicated in Select and Combobox](#37-boundary_offset-constant-duplicated-in-select-and-combobox)
38. [Meter and Progress Near-Identical Context Value Setup](#38-meter-and-progress-near-identical-context-value-setup)
39. [Meter and Progress Near-Identical Indicator Style Logic](#39-meter-and-progress-near-identical-indicator-style-logic)
40. [Context Hook + Provider Boilerplate Pattern](#40-context-hook--provider-boilerplate-pattern)

---

## 1. Identical Backdrop DataAttributes Enums

**Files**:
- `packages/react/src/dialog/backdrop/DialogBackdropDataAttributes.ts`
- `packages/react/src/popover/backdrop/ .ts`
- `packages/react/src/preview-card/backdrop/PreviewCardBackdropDataAttributes.ts`
- `packages/react/src/drawer/backdrop/DrawerBackdropDataAttributes.ts`
- `packages/react/src/menu/backdrop/MenuBackdropDataAttributes.ts`
- `packages/react/src/navigation-menu/backdrop/NavigationMenuBackdropDataAttributes.ts`

**Type**: Identical enum definitions

```typescript
// All six files define (only the enum name differs):
export enum XBackdropDataAttributes {
  open = CommonPopupDataAttributes.open,
  closed = CommonPopupDataAttributes.closed,
  startingStyle = CommonPopupDataAttributes.startingStyle,
  endingStyle = CommonPopupDataAttributes.endingStyle,
}
```

**Note**: Six separate files with character-for-character identical content. A single shared `CommonBackdropDataAttributes` enum would eliminate all six.

---

## 2. Identical Positioner DataAttributes Enums

**Files**:
- `packages/react/src/popover/positioner/PopoverPositionerDataAttributes.ts`
- `packages/react/src/tooltip/positioner/TooltipPositionerDataAttributes.ts`
- `packages/react/src/preview-card/positioner/PreviewCardPositionerDataAttributes.ts`
- `packages/react/src/menu/positioner/MenuPositionerDataAttributes.ts`

**Type**: Identical enum definitions (menu/navigation-menu add one extra attribute)

```typescript
// popover, tooltip, preview-card — all identical:
export enum XPositionerDataAttributes {
  open = CommonPopupDataAttributes.open,
  closed = CommonPopupDataAttributes.closed,
  anchorHidden = CommonPopupDataAttributes.anchorHidden,
  side = CommonPopupDataAttributes.side,
  align = CommonPopupDataAttributes.align,
}

// MenuPositionerDataAttributes is identical to the above;
// NavigationMenuPositionerDataAttributes adds: instant = 'data-instant'
// ToastPositionerDataAttributes omits open/closed but otherwise matches
```

**Note**: The core five attributes are duplicated verbatim across four files. A shared `CommonPositionerDataAttributes` base would reduce this.

---

## 3. Identical Arrow DataAttributes Enums

**Files**:
- `packages/react/src/menu/arrow/MenuArrowDataAttributes.ts`
- `packages/react/src/navigation-menu/arrow/NavigationMenuArrowDataAttributes.ts`
- `packages/react/src/toast/arrow/ToastArrowDataAttributes.ts`

**Type**: Identical or near-identical enum definitions

```typescript
// MenuArrowDataAttributes and NavigationMenuArrowDataAttributes are character-identical:
export enum MenuArrowDataAttributes {
  open = CommonPopupDataAttributes.open,
  closed = CommonPopupDataAttributes.closed,
  side = CommonPopupDataAttributes.side,
  align = CommonPopupDataAttributes.align,
  uncentered = 'data-uncentered',
}

// ToastArrowDataAttributes omits open/closed but shares the rest:
export enum ToastArrowDataAttributes {
  side = CommonPopupDataAttributes.side,
  align = CommonPopupDataAttributes.align,
  uncentered = 'data-uncentered',
}
```

**Note**: The `side`, `align`, `uncentered` triple is repeated in all three files. A shared base would serve all arrow components.

---

## 4. Identical Viewport CSS Variables Enums

**Files**:
- `packages/react/src/popover/viewport/PopoverViewportCssVars.ts`
- `packages/react/src/tooltip/viewport/TooltipViewportCssVars.ts`
- `packages/react/src/preview-card/viewport/PreviewCardViewportCssVars.ts`

**Type**: Identical enum definitions

```typescript
// All three files (only enum name differs):
export enum XViewportCssVars {
  popupWidth = '--popup-width',
  popupHeight = '--popup-height',
}
```

**Note**: Three separate files with identical string values. Could be a single shared `CommonViewportCssVars` enum.

---

## 5. Positioner CSS Variables (Partial Duplication)

**Files**:
- `packages/react/src/popover/positioner/PopoverPositionerCssVars.ts`
- `packages/react/src/tooltip/positioner/TooltipPositionerCssVars.ts`
- `packages/react/src/preview-card/positioner/PreviewCardPositionerCssVars.ts`

**Type**: Mostly identical enum definitions

```typescript
// tooltip and preview-card positioner CSS vars are identical (5 vars each):
availableWidth, availableHeight, anchorWidth, anchorHeight, transformOrigin

// Popover adds two more: positionerWidth, positionerHeight
```

**Note**: Five variables are duplicated verbatim across three files. A shared base enum with an extended Popover-specific enum would eliminate the duplication.

---

## 6. Identical Viewport `stateAttributesMapping` for `activationDirection`

**Files**:
- `packages/react/src/popover/viewport/PopoverViewport.tsx` (lines 11–18)
- `packages/react/src/tooltip/viewport/TooltipViewport.tsx` (lines 11–18)
- `packages/react/src/preview-card/viewport/PreviewCardViewport.tsx` (lines 11–18)

**Type**: Copy-pasted state attributes mapping

```typescript
// All three files define this identically:
const stateAttributesMapping: StateAttributesMapping<X.State> = {
  activationDirection: (value) =>
    value
      ? {
          'data-activation-direction': value,
        }
      : null,
};
```

**Note**: Eight identical lines in three files. Should be a single exported constant in a shared utils file.

---

## 7. Identical Popup/Backdrop `stateAttributesMapping` Composition

**Files**:
- `packages/react/src/dialog/backdrop/DialogBackdrop.tsx` (lines 11–14)
- `packages/react/src/popover/backdrop/PopoverBackdrop.tsx` (lines 12–15)
- `packages/react/src/preview-card/backdrop/PreviewCardBackdrop.tsx` (lines 11–14)
- `packages/react/src/select/popup/SelectPopup.tsx` (lines 37–40)
- `packages/react/src/select/backdrop/SelectBackdrop.tsx` (lines 13–16)
- `packages/react/src/combobox/popup/ComboboxPopup.tsx` (lines 24–27)
- `packages/react/src/combobox/backdrop/ComboboxBackdrop.tsx` (lines 13–16)

**Type**: Copy-pasted state attributes mapping pattern

```typescript
// All seven files define this identically (only the type parameter differs):
const stateAttributesMapping: StateAttributesMapping<X.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};
```

**Note**: This 4-line block is copied verbatim across 7+ files (likely more across the full codebase). It should be a single exported constant.

---

## 8. Boolean-to-Empty-String State Attribute Mapper Pattern

**Files**:
- `packages/react/src/scroll-area/root/stateAttributes.ts` (lines 6–11)
- `packages/react/src/drawer/popup/DrawerPopup.tsx` (lines 92–107)
- Throughout many `stateAttributesMapping` files

**Type**: Copy-pasted mapper pattern

```typescript
// scroll-area/root/stateAttributes.ts — six consecutive copies of same pattern:
hasOverflowX: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowX]: '' } : null),
hasOverflowY: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowY]: '' } : null),
overflowXStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXStart]: '' } : null),
overflowXEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXEnd]: '' } : null),
overflowYStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYStart]: '' } : null),
overflowYEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYEnd]: '' } : null),

// DrawerPopup.tsx — same pattern repeated four times:
expanded(value) {
  return value ? { [DrawerPopupDataAttributes.expanded]: '' } : null;
},
nestedDrawerOpen(value) {
  return value ? { [DrawerPopupDataAttributes.nestedDrawerOpen]: '' } : null;
},
```

**Note**: A factory helper `boolAttr(key: string)` returning `(value) => value ? { [key]: '' } : null` would eliminate all repetitions.

---

## 9. `defaultInitialFocus` Function Duplicated in Dialog and Popover

**Files**:
- `packages/react/src/dialog/popup/DialogPopup.tsx` (lines 69–74)
- `packages/react/src/popover/popup/PopoverPopup.tsx` (lines 75–80)

**Type**: Identical function logic

```typescript
// Both files define this function identically:
function defaultInitialFocus(interactionType: InteractionType) {
  if (interactionType === 'touch') {
    return store.context.popupRef.current;
  }
  return true;
}
```

**Note**: This function prevents virtual keyboard opening on touch on Android. It is defined identically in both files. Should be extracted to a shared utility.

---

## 10. Identical `useOpenChangeComplete` Invocations in Popup Components

**Files**:
- `packages/react/src/dialog/popup/DialogPopup.tsx` (lines 56–64)
- `packages/react/src/popover/popup/PopoverPopup.tsx` (lines 56–64)
- `packages/react/src/preview-card/popup/PreviewCardPopup.tsx` (lines 43–51)
- `packages/react/src/tooltip/popup/TooltipPopup.tsx` (lines 42–50)

**Type**: Identical hook invocation pattern

```typescript
// All four files use this identically:
useOpenChangeComplete({
  open,
  ref: store.context.popupRef,
  onComplete() {
    if (open) {
      store.context.onOpenChangeComplete?.(true);
    }
  },
});
```

**Note**: The hook itself is shared; the call-site boilerplate is repeated verbatim across 4 files.

---

## 11. Identical Arrow Component Structure (Popover / Tooltip / PreviewCard)

**Files**:
- `packages/react/src/popover/arrow/PopoverArrow.tsx` (lines 24–40)
- `packages/react/src/tooltip/arrow/TooltipArrow.tsx` (lines 25–43)
- `packages/react/src/preview-card/arrow/PreviewCardArrow.tsx` (lines 23–40)

**Type**: Near-identical component structure

All three components:
- Get store and positioner context from component-specific hooks
- Build state with `{ open, side, align, uncentered }` (tooltip adds `instant`)
- Use `popupStateMapping` for state attributes
- Render with `arrowStyles` and `aria-hidden: true`

**Note**: Only the context hook names differ. Could be refactored into a shared Arrow factory or a generic implementation with context injection.

---

## 12. Identical Viewport Component Structure (Popover / Tooltip / PreviewCard)

**Files**:
- `packages/react/src/popover/viewport/PopoverViewport.tsx` (lines 28–57)
- `packages/react/src/tooltip/viewport/TooltipViewport.tsx` (lines 28–57)
- `packages/react/src/preview-card/viewport/PreviewCardViewport.tsx` (lines 28–57)

**Type**: Near-identical component structure

All three components follow the exact same pattern:
- Get store and positioner context
- Get `instantType` from store
- Call `usePopupViewport` with `{ store, side, cssVars, children }`
- Build state with `{ activationDirection, transitioning, instant }`
- Apply the same `stateAttributesMapping`

**Note**: Only the context hook names and CSS variable sources differ. A shared Viewport factory would reduce this to one implementation.

---

## 13. Identical Backdrop Component Structure (Select / Combobox)

**Files**:
- `packages/react/src/select/backdrop/SelectBackdrop.tsx` (lines 24–59)
- `packages/react/src/combobox/backdrop/ComboboxBackdrop.tsx` (lines 22–55)

**Type**: Near-identical component logic

```typescript
// SelectBackdrop.tsx — ComboboxBackdrop.tsx is structurally identical:
export const SelectBackdrop = React.forwardRef(function SelectBackdrop(...) {
  const { className, render, ...elementProps } = componentProps;
  const { store } = useSelectRootContext(); // useComboboxRootContext in Combobox
  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const state: SelectBackdrop.State = { open, transitionStatus };
  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ role: 'presentation', hidden: !mounted, style: { userSelect: 'none', ... } }, elementProps],
    stateAttributesMapping,
  });
});
```

**Note**: Identical except for the context hook name. Could share an implementation with the context injected.

---

## 14. Near-Identical Positioner `defaultProps` Style Construction

**Files**:
- `packages/react/src/popover/positioner/PopoverPositioner.tsx` (lines 87–102)
- `packages/react/src/tooltip/positioner/TooltipPositioner.tsx` (lines 73–88)
- `packages/react/src/preview-card/positioner/PreviewCardPositioner.tsx` (lines 74–89)

**Type**: Near-identical hook logic

```typescript
// All three follow this pattern (Tooltip has extra conditions in the `if`):
const defaultProps: HTMLProps = React.useMemo(() => {
  const hiddenStyles: React.CSSProperties = {};
  if (!open) {
    hiddenStyles.pointerEvents = 'none';
  }
  return {
    role: 'presentation',
    hidden: !mounted,
    style: { ...positioning.positionerStyles, ...hiddenStyles },
  };
}, [open, mounted, positioning.positionerStyles]);
```

**Note**: Could be extracted into a shared `usePositionerDefaultProps` hook.

---

## 15. Title/Description ID Management Inconsistency (Dialog vs Popover)

**Files**:
- `packages/react/src/dialog/description/DialogDescription.tsx` (line 23)
- `packages/react/src/dialog/title/DialogTitle.tsx` (line 23)
- `packages/react/src/popover/description/PopoverDescription.tsx` (lines 25–30)
- `packages/react/src/popover/title/PopoverTitle.tsx` (lines 25–30)

**Type**: Same logic, different API

```typescript
// Dialog uses the store convenience method:
store.useSyncedValueWithCleanup('descriptionElementId', id);

// Popover manually reimplements the same logic:
useIsoLayoutEffect(() => {
  store.set('descriptionElementId', id);
  return () => { store.set('descriptionElementId', undefined); };
}, [store, id]);
```

**Note**: Functionally identical. Popover should use `useSyncedValueWithCleanup` for consistency.

---

## 16. Identical `aria-labelledby` + `aria-describedby` Pattern

**Files**:
- `packages/react/src/dialog/popup/DialogPopup.tsx` (lines 92–93)
- `packages/react/src/popover/popup/PopoverPopup.tsx` (lines 105–106)

**Type**: Identical ARIA attribute pattern

```typescript
// Both files:
'aria-labelledby': titleElementId ?? undefined,
'aria-describedby': descriptionElementId ?? undefined,
```

**Note**: Identical in both files. Not harmful but illustrates the shared pattern between dialog and popover popups.

---

## 17. Identical `MenuCheckboxItemIndicator` and `MenuRadioItemIndicator`

**Files**:
- `packages/react/src/menu/checkbox-item-indicator/MenuCheckboxItemIndicator.tsx`
- `packages/react/src/menu/radio-item-indicator/MenuRadioItemIndicator.tsx`

**Type**: Near-identical component logic (~90%+ identical)

```typescript
// Both components follow identical structure (context hook name is the only difference):
const { render, className, keepMounted = false, ...elementProps } = componentProps;
const item = useMenuCheckboxItemContext(); // useMenuRadioItemContext in Radio
const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
const { transitionStatus, setMounted } = useTransitionStatus(item.checked);

useOpenChangeComplete({
  open: item.checked,
  ref: indicatorRef,
  onComplete() { if (!item.checked) { setMounted(false); } },
});

const state: MenuCheckboxItemIndicator.State = {
  checked: item.checked,
  disabled: item.disabled,
  highlighted: item.highlighted,
  transitionStatus,
};
```

**Note**: Could be a single shared `MenuItemIndicator` component parameterized by context, or a shared hook.

---

## 18. Near-Identical `MenuCheckboxItem` and `MenuRadioItem` DataAttributes

**Files**:
- `packages/react/src/menu/checkbox-item/MenuCheckboxItemDataAttributes.ts`
- `packages/react/src/menu/radio-item/MenuRadioItemDataAttributes.ts`

**Type**: Identical enum definitions

```typescript
// Both files are character-for-character identical:
export enum MenuCheckboxItemDataAttributes { // MenuRadioItemDataAttributes
  checked = 'data-checked',
  unchecked = 'data-unchecked',
  disabled = 'data-disabled',
  highlighted = 'data-highlighted',
}
```

**Note**: These two enums are character-for-character identical. Could be a single `MenuSelectableItemDataAttributes`.

---

## 19. Identical Toast `Title` and `Description` Component Logic

**Files**:
- `packages/react/src/toast/title/ToastTitle.tsx` (lines 15–60)
- `packages/react/src/toast/description/ToastDescription.tsx` (lines 16–61)

**Type**: Near-identical component logic (~95% identical)

```typescript
// ToastTitle.tsx:
const { toast, setTitleId } = useToastRootContext();
const children = childrenProp ?? toast.title;
const id = useId(idProp);
useIsoLayoutEffect(() => {
  if (!shouldRender) return undefined;
  setTitleId(id);
  return () => { setTitleId(undefined); };
}, [shouldRender, id, setTitleId]);

// ToastDescription.tsx — identical except:
const { toast, setDescriptionId } = useToastRootContext();
const children = childrenProp ?? toast.description;
// setDescriptionId(id) / setDescriptionId(undefined)
// renders <p> instead of <h2>
```

**Note**: A factory function or shared hook parameterized by `{ setter, getter, tag }` would eliminate the duplication.

---

## 20. Identical Toast Component `State` Interface (4 files)

**Files**:
- `packages/react/src/toast/action/ToastAction.tsx` (lines 60–66)
- `packages/react/src/toast/close/ToastClose.tsx` (lines 60–65)
- `packages/react/src/toast/title/ToastTitle.tsx` (lines 62–67)
- `packages/react/src/toast/description/ToastDescription.tsx` (lines 63–68)

**Type**: Identical type definition

```typescript
// All four files declare independently:
export interface ToastXState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}
```

**Note**: A single shared `ToastComponentState` interface would serve all four.

---

## 21. `AccordionPanel` and `CollapsiblePanel` Near-Identical Logic

**Files**:
- `packages/react/src/accordion/panel/AccordionPanel.tsx`
- `packages/react/src/collapsible/panel/CollapsiblePanel.tsx`

**Type**: Multiple identical logic blocks in the same pair of files

The following code blocks are duplicated between these two files:

**a) Panel ID effect** (AccordionPanel lines 77–85, CollapsiblePanel lines 72–80):
```typescript
useIsoLayoutEffect(() => {
  if (idProp) {
    setPanelIdState(idProp);
    return () => { setPanelIdState(undefined); };
  }
  return undefined;
}, [idProp, setPanelIdState]);
```

**b) keepMounted/hiddenUntilFound sync effects** (both files, back-to-back):
```typescript
useIsoLayoutEffect(() => {
  setHiddenUntilFound(hiddenUntilFound);
}, [setHiddenUntilFound, hiddenUntilFound]);

useIsoLayoutEffect(() => {
  setKeepMounted(keepMounted);
}, [setKeepMounted, keepMounted]);
```

**c) `useOpenChangeComplete` for resetting dimensions** (AccordionPanel lines 95–105, CollapsiblePanel lines 112–122):
```typescript
useOpenChangeComplete({
  open: open && transitionStatus === 'idle',
  ref: panelRef,
  onComplete() {
    if (!open) return;
    setDimensions({ width: undefined, height: undefined });
  },
});
```

**d) Dev-mode warning for `keepMounted={false}` + `hiddenUntilFound`** (both files):
```typescript
if (process.env.NODE_ENV !== 'production') {
  useIsoLayoutEffect(() => {
    if (keepMountedProp === false && hiddenUntilFound) {
      warn('The `keepMounted={false}` prop on a [Component].Panel will be ignored ...');
    }
  }, [hiddenUntilFound, keepMountedProp]);
}
```

**Note**: Accordion's panel is essentially a thin extension of CollapsiblePanel. Many of these blocks could live in a shared `usePanelBehavior` hook.

---

## 22. Identical CSS Variable Height/Width Construction in Panels

**Files**:
- `packages/react/src/accordion/panel/AccordionPanel.tsx` (lines 148–151)
- `packages/react/src/collapsible/panel/CollapsiblePanel.tsx` (lines 139–142)

**Type**: Duplicated CSS variable style construction

```typescript
// Both files (only the CSS var enum source differs):
[AccordionPanelCssVars.accordionPanelHeight as string]:
  height === undefined ? 'auto' : `${height}px`,
[AccordionPanelCssVars.accordionPanelWidth as string]:
  width === undefined ? 'auto' : `${width}px`,
```

**Note**: The `dim === undefined ? 'auto' : '${dim}px'` pattern is also found in `DrawerPopup.tsx` for panel dimensions. A shared helper `dimensionStyle(dim)` would unify all instances.

---

## 23. ScrollArea Boolean State Attribute Mapper (6× same pattern)

**Files**:
- `packages/react/src/scroll-area/root/stateAttributes.ts` (lines 6–11)

**Type**: Six consecutive lines with identical structure

```typescript
hasOverflowX: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowX]: '' } : null),
hasOverflowY: (value) => (value ? { [ScrollAreaRootDataAttributes.hasOverflowY]: '' } : null),
overflowXStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXStart]: '' } : null),
overflowXEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowXEnd]: '' } : null),
overflowYStart: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYStart]: '' } : null),
overflowYEnd: (value) => (value ? { [ScrollAreaRootDataAttributes.overflowYEnd]: '' } : null),
```

**Note**: A factory `boolAttr(key)` would reduce all six to a single reusable expression. See also Finding 8 for the same pattern in DrawerPopup.

---

## 24. Identical `AccordionHeader` and `AccordionItem` DataAttributes Enums

**Files**:
- `packages/react/src/accordion/header/AccordionHeaderDataAttributes.ts`
- `packages/react/src/accordion/item/AccordionItemDataAttributes.ts`

**Type**: Identical enum definitions

```typescript
// Both files are identical (only enum name differs):
export enum AccordionHeaderDataAttributes { // AccordionItemDataAttributes
  index = 'data-index',
  disabled = 'data-disabled',
  open = 'data-open',
}
```

**Note**: These two enums could be consolidated into a single `AccordionItemDataAttributes` and re-exported (or the header can simply re-export the item enum).

---

## 25. Identical Checked/Unchecked State Attribute Mapper (Checkbox / Radio / Switch)

**Files**:
- `packages/react/src/checkbox/utils/useStateAttributesMapping.ts` (lines 11–26)
- `packages/react/src/radio/utils/stateAttributesMapping.ts` (lines 8–12)
- `packages/react/src/switch/stateAttributesMapping.ts` (lines 8–18)

**Type**: Copy-pasted mapper logic

```typescript
// radio and switch — identical:
checked(value): Record<string, string> {
  if (value) { return { [XRootDataAttributes.checked]: '' }; }
  return { [XRootDataAttributes.unchecked]: '' };
}

// checkbox — same but with indeterminate guard:
checked(value): Record<string, string> {
  if (state.indeterminate) { return {}; }
  if (value) { return { [CheckboxRootDataAttributes.checked]: '' }; }
  return { [CheckboxRootDataAttributes.unchecked]: '' };
}
```

**Note**: A shared `checkedUncheckedMapper(checkedAttr, uncheckedAttr)` factory would cover radio and switch; checkbox just adds an indeterminate guard on top.

---

## 26. Duplicated Hidden Input Setup (Checkbox / Radio / Switch)

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 204–256)
- `packages/react/src/radio/root/RadioRoot.tsx` (lines 174–211)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 173–225)

**Type**: Near-identical `mergeProps<'input'>` block

All three components build a hidden `<input>` with:
- `tabIndex: -1`
- `aria-hidden: true`
- `style: visuallyHiddenInput` / `visuallyHidden`
- Same `onFocus` forwarding to `controlRef.current?.focus()`
- Same React #9023 workaround in `onChange` (see Finding 28)

**Note**: Could be extracted into a `useHiddenInputProps` hook shared by all three.

---

## 27. Identical Click-to-Hidden-Input Dispatch (Checkbox / Radio / Switch)

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 318–334)
- `packages/react/src/radio/root/RadioRoot.tsx` (lines 141–157)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 154–170)

**Type**: Identical `onClick` handler

```typescript
// All three files are identical:
onClick(event: React.MouseEvent) {
  if (readOnly || disabled) return;
  event.preventDefault();
  inputRef.current?.dispatchEvent(
    new PointerEvent('click', {
      bubbles: true,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    }),
  );
}
```

**Note**: This click-forwarding pattern could be a shared utility function.

---

## 28. Identical `onChange` Workaround Pattern (React #9023)

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 219–244)
- `packages/react/src/radio/root/RadioRoot.tsx` (lines 187–207)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 187–202)

**Type**: Copy-pasted workaround

```typescript
// All three open with the same guard:
onChange(event) {
  // Workaround for https://github.com/facebook/react/issues/9023
  if (event.nativeEvent.defaultPrevented) return;

  const nextChecked = event.target.checked;
  const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
  // ... component-specific logic ...
  if (details.isCanceled) return;
  setCheckedState(nextChecked);
}
```

**Note**: The preamble and isCanceled check are identical. Could be extracted into a shared handler factory.

---

## 29. Identical `onBlur` Validation Handler (Checkbox / Switch)

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 305–317)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 141–153)

**Type**: Near-identical event handler

```typescript
// Both files:
onBlur() {
  const inputEl = inputRef.current;
  if (!inputEl) return;
  setTouched(true);
  setFocused(false);
  if (validationMode === 'onBlur') {
    validation.commit(inputEl.checked);
  }
}
```

**Note**: Identical. Could be a shared hook.

---

## 30. Duplicated Indicator Component Structure (Checkbox / Radio)

**Files**:
- `packages/react/src/checkbox/indicator/CheckboxIndicator.tsx` (lines 20–74)
- `packages/react/src/radio/indicator/RadioIndicator.tsx` (lines 16–59)

**Type**: Near-identical component structure (~90% identical)

```typescript
// Both follow identical structure:
const { render, className, keepMounted = false, ...elementProps } = componentProps;
const rootState = useXRootContext();
const rendered = rootState.checked; // Checkbox also ORs with indeterminate
const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);
// useOpenChangeComplete block (see Finding 31)
const state: XIndicator.State = { ...rootState, transitionStatus };
// conditionally return null based on mounted/keepMounted
```

**Note**: Also applies to `MenuCheckboxItemIndicator` and `MenuRadioItemIndicator` (Finding 17). All four indicator components follow the same structure.

---

## 31. Duplicated `useTransitionStatus` + `useOpenChangeComplete` in Indicators

**Files**:
- `packages/react/src/checkbox/indicator/CheckboxIndicator.tsx` (lines 26–47)
- `packages/react/src/radio/indicator/RadioIndicator.tsx` (lines 22–52)
- `packages/react/src/field/error/FieldError.tsx` (lines 52, 94–102)
- `packages/react/src/menu/checkbox-item-indicator/MenuCheckboxItemIndicator.tsx`
- `packages/react/src/menu/radio-item-indicator/MenuRadioItemIndicator.tsx`

**Type**: Identical hook usage pattern

```typescript
// All five files use the same block:
const { transitionStatus, setMounted } = useTransitionStatus(rendered);
useOpenChangeComplete({
  open: rendered,
  ref: indicatorRef,
  onComplete() {
    if (!rendered) { setMounted(false); }
  },
});
```

**Note**: A shared `useIndicatorTransition(rendered, ref)` hook would consolidate all five.

---

## 32. Duplicated `useControlled` Pattern in Group Components

**Files**:
- `packages/react/src/checkbox-group/CheckboxGroup.tsx` (lines 59–64)
- `packages/react/src/radio-group/RadioGroup.tsx` (lines 70–75)
- `packages/react/src/toggle-group/ToggleGroup.tsx` (lines 62–67)

**Type**: Identical hook invocation pattern

```typescript
// All three:
const [value, setValueUnwrapped] = useControlled({
  controlled: externalValue,
  default: defaultValue,
  name: 'XGroup',
  state: 'value',
});
```

**Note**: Structural duplication inherent to the group component pattern.

---

## 33. Duplicated `useField` Hook Usage Pattern

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 166–174)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 97–104)
- `packages/react/src/checkbox-group/CheckboxGroup.tsx` (lines 94–102)
- `packages/react/src/radio-group/RadioGroup.tsx` (lines 148–155)

**Type**: Identical hook configuration pattern

```typescript
// All four:
useField({
  id,
  commit: validation.commit,
  value: checked, // or group value
  controlRef,
  name,
  getValue: () => checked,
});
```

**Note**: Structural duplication inherent to form controls; the shape is consistent which is good.

---

## 34. Duplicated `useValueChanged` Validation Flow in Groups

**Files**:
- `packages/react/src/checkbox/root/CheckboxRoot.tsx` (lines 188–202)
- `packages/react/src/switch/root/SwitchRoot.tsx` (lines 112–122)
- `packages/react/src/checkbox-group/CheckboxGroup.tsx` (lines 106–123)
- `packages/react/src/radio-group/RadioGroup.tsx` (lines 157–173)

**Type**: Identical validation flow pattern

```typescript
// All four files:
useValueChanged(value, () => {
  clearErrors(name);
  setDirty(value !== validityData.initialValue);
  setFilled(/* boolean */);
  if (shouldValidateOnChange()) {
    validation.commit(value);
  } else {
    validation.commit(value, true);
  }
});
```

**Note**: This exact validation flow pattern appears four times. A shared hook would consolidate it.

---

## 35. Duplicated Identical Data Attribute Enums (Checkbox / Radio / Switch)

**Files**:
- `packages/react/src/checkbox/root/CheckboxRootDataAttributes.ts`
- `packages/react/src/radio/root/RadioRootDataAttributes.ts`
- `packages/react/src/switch/root/SwitchRootDataAttributes.ts`

**Type**: Near-identical enum definitions

All three declare the same field validity attributes:
```typescript
valid = 'data-valid',
invalid = 'data-invalid',
touched = 'data-touched',
dirty = 'data-dirty',
filled = 'data-filled',
focused = 'data-focused',
```

The only difference: `CheckboxRootDataAttributes` adds `indeterminate`. These six validity attributes are already shared via `fieldValidityMapping` at runtime but the enum strings are still defined in triplicate.

---

## 36. `SelectValue` and `ComboboxValue` Near-Identical Label Resolution Logic

**Files**:
- `packages/react/src/select/value/SelectValue.tsx` (lines 49–59)
- `packages/react/src/combobox/value/ComboboxValue.tsx` (lines 28–39)

**Type**: Near-identical logic

```typescript
// SelectValue.tsx:
if (typeof childrenProp === 'function') { children = childrenProp(value); }
else if (childrenProp != null) { children = childrenProp; }
else if (!hasSelectedValue && placeholder != null && !hasNullLabel) { children = placeholder; }
else if (Array.isArray(value)) { children = resolveMultipleLabels(value, items, itemToStringLabel); }
else { children = resolveSelectedLabel(value, items, itemToStringLabel); }

// ComboboxValue.tsx — identical except `value` → `selectedValue` and `multiple &&` guard:
```

**Note**: Could be extracted into a shared `resolveValueChildren` utility.

---

## 37. `BOUNDARY_OFFSET` Constant Duplicated in Select and Combobox

**Files**:
- `packages/react/src/select/trigger/SelectTrigger.tsx` (line 27)
- `packages/react/src/combobox/trigger/ComboboxTrigger.tsx` (line 29)

**Type**: Identical constant

```typescript
// Both files:
const BOUNDARY_OFFSET = 2;
```

**Note**: Used in identical mouseup boundary-checking logic. Should be a shared constant.

---

## 38. Meter and Progress Near-Identical Context Value Setup

**Files**:
- `packages/react/src/meter/root/MeterRoot.tsx` (lines 49–58)
- `packages/react/src/progress/root/ProgressRoot.tsx` (lines 61–72)

**Type**: Near-identical `useMemo` context pattern

```typescript
// MeterRoot.tsx:
const contextValue: MeterRootContext = React.useMemo(
  () => ({ formattedValue, max, min, setLabelId, value: valueProp }),
  [formattedValue, max, min, setLabelId, valueProp],
);

// ProgressRoot.tsx — same plus state, status:
const contextValue: ProgressRootContext = React.useMemo(
  () => ({ formattedValue, max, min, setLabelId, state, status, value }),
  [formattedValue, max, min, setLabelId, state, status, value],
);
```

**Note**: Progress is a superset of Meter's context shape. Suggests a shared base context type.

---

## 39. Meter and Progress Near-Identical Indicator Style Logic

**Files**:
- `packages/react/src/meter/indicator/MeterIndicator.tsx` (lines 23–37)
- `packages/react/src/progress/indicator/ProgressIndicator.tsx` (lines 24–44)

**Type**: Near-identical style construction

```typescript
// MeterIndicator.tsx:
const percentageWidth = valueToPercent(context.value, context.min, context.max);
// style: { insetInlineStart: 0, height: 'inherit', width: `${percentageWidth}%` }

// ProgressIndicator.tsx — same but wraps in useCallback and handles null:
const percentageValue = /* calculation */;
const getStyles = React.useCallback(() => {
  if (percentageValue == null) return {};
  return { insetInlineStart: 0, height: 'inherit', width: `${percentageValue}%` };
}, [percentageValue]);
```

**Note**: The style object shape is identical. Could share a `useIndicatorStyles(value, min, max)` hook.

---

## 40. Context Hook + Provider Boilerplate Pattern

**Files**:
- `packages/react/src/csp-provider/CSPContext.tsx`
- `packages/react/src/direction-provider/DirectionContext.tsx`
- `packages/react/src/labelable-provider/LabelableContext.ts`
- `packages/react/src/avatar/root/AvatarRootContext.ts`
- (and virtually every component context file)

**Type**: Repeated boilerplate pattern

```typescript
// Pattern repeated in every context file:
export const XContext = React.createContext<XContext | undefined>(undefined);

export function useXContext() {
  const context = React.useContext(XContext);
  if (context === undefined) {
    throw new Error('Base UI: ...');
  }
  return context;
}
```

**Note**: This is a canonical React pattern and not harmful per se — it is deliberately repeated so each component can have its own error message. A `createBaseUIContext<T>(errorMessage)` factory helper (similar to what Radix UI provides) would eliminate the structural repetition while preserving component-specific error messages.

---

## Summary

| # | Pattern | Files Affected |
|---|---------|---------------|
| 1 | Identical backdrop DataAttributes enums | 6 |
| 2 | Identical positioner DataAttributes enums | 4 |
| 3 | Identical arrow DataAttributes enums | 3 |
| 4 | Identical viewport CSS variable enums | 3 |
| 5 | Positioner CSS variables (partial) | 3 |
| 6 | Viewport `activationDirection` mapping | 3 |
| 7 | `popupStateMapping + transitionStatusMapping` spread | 7+ |
| 8 | Boolean-to-empty-string mapper pattern | 7+ |
| 9 | `defaultInitialFocus` function | 2 |
| 10 | `useOpenChangeComplete` popup invocation | 4 |
| 11 | Arrow component structure | 3 |
| 12 | Viewport component structure | 3 |
| 13 | Backdrop component structure (Select/Combobox) | 2 |
| 14 | Positioner `defaultProps` style construction | 3 |
| 15 | Title/description ID management inconsistency | 4 |
| 16 | `aria-labelledby` + `aria-describedby` | 2 |
| 17 | Identical MenuIndicator components | 2 |
| 18 | Identical MenuItem DataAttributes enums | 2 |
| 19 | Toast Title/Description component logic | 2 |
| 20 | Toast component State interface | 4 |
| 21 | AccordionPanel/CollapsiblePanel logic blocks | 2 |
| 22 | CSS variable height/width construction | 2+ |
| 23 | ScrollArea boolean mappers | 1 (×6 in file) |
| 24 | AccordionHeader/Item DataAttributes | 2 |
| 25 | Checked/unchecked mapper (Checkbox/Radio/Switch) | 3 |
| 26 | Hidden input setup | 3 |
| 27 | Click-to-hidden-input dispatch | 3 |
| 28 | `onChange` React #9023 workaround | 3 |
| 29 | `onBlur` validation handler | 2 |
| 30 | Indicator component structure | 2 |
| 31 | `useTransitionStatus + useOpenChangeComplete` | 5 |
| 32 | `useControlled` in group components | 3 |
| 33 | `useField` hook usage | 4 |
| 34 | `useValueChanged` validation flow | 4 |
| 35 | Field validity attribute enums | 3 |
| 36 | Value label resolution logic | 2 |
| 37 | `BOUNDARY_OFFSET` constant | 2 |
| 38 | Meter/Progress context value setup | 2 |
| 39 | Meter/Progress indicator style logic | 2 |
| 40 | Context hook + provider boilerplate | many |

**Highest-impact consolidation opportunities** (most files affected, most code eliminated):

1. **Finding 1** — Shared `CommonBackdropDataAttributes` enum (eliminates 6 identical files)
2. **Finding 7** — Shared `popupBackdropStateMapping` constant (eliminates 7+ identical 4-line blocks)
3. **Finding 8** — `boolAttr(key)` factory helper (eliminates ~20+ repeated mappers)
4. **Finding 31** — `useIndicatorTransition(rendered, ref)` hook (consolidates 5 components)
5. **Finding 40** — `createBaseUIContext<T>()` factory (reduces boilerplate across all components)
6. **Findings 25–29** — Shared hidden-input behavior for Checkbox/Radio/Switch (`useHiddenInputProps` hook)
