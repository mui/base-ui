'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useModernLayoutEffect } from '@base-ui-components/utils/useModernLayoutEffect';
import { useOnFirstRender } from '@base-ui-components/utils/useOnFirstRender';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useForkRef } from '@base-ui-components/utils/useForkRef';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useLazyRef } from '@base-ui-components/utils/useLazyRef';
import { Store, useSelector } from '@base-ui-components/utils/store';
import {
  ElementProps,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useClick,
} from '../../floating-ui-react';
import { contains, getTarget } from '../../floating-ui-react/utils';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import {
  ComboboxFloatingContext,
  ComboboxDerivedItemsContext,
  ComboboxRootContext,
  ValueChangeReason,
} from './ComboboxRootContext';
import { selectors, type State as StoreState } from '../store';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { CompositeList } from '../../composite/list/CompositeList';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { useBaseUiId } from '../../utils/useBaseUiId';
import {
  type ComboboxGroup,
  defaultItemFilter,
  singleSelectionFilter,
  isGroupedItems,
  defaultGroupFilter,
  stringifyItem,
} from './utils';
import { EMPTY_ARRAY } from '../../utils/constants';
import { serializeValue } from '../../utils/serializeValue';
import { useTransitionStatus } from '../../utils/useTransitionStatus';

type ExtractItemType<T> = T extends ComboboxGroup<infer U>[] ? U : T extends (infer U)[] ? U : T;

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Item = any>(
  props: ComboboxRoot.SingleGroupedProps<Item>,
): React.JSX.Element;
export function ComboboxRoot<Item = any>(
  props: ComboboxRoot.MultipleGroupedProps<Item>,
): React.JSX.Element;
export function ComboboxRoot<Item = any>(props: ComboboxRoot.SingleProps<Item>): React.JSX.Element;
export function ComboboxRoot<Item = any>(
  props: ComboboxRoot.MultipleProps<Item>,
): React.JSX.Element;
export function ComboboxRoot<Item = any>(props: ComboboxRoot.Props<Item>): React.JSX.Element {
  const {
    id: idProp,
    onOpenChangeComplete,
    defaultSelectedValue,
    selectedValue: selectedValueProp,
    onSelectedValueChange,
    defaultInputValue = '',
    inputValue: inputValueProp,
    selectionMode = 'none',
    onItemHighlighted: onItemHighlightedProp,
    name: nameProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    inputRef: inputRefProp,
    cols = 1,
    items,
    filter: filterProp,
    openOnlyWithMatch = false,
    itemToString,
    itemToValue,
    virtualized = false,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    validityData,
    validationMode,
    setControlId,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId(idProp);
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const multiple = selectionMode === 'multiple';

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [selectedValue, setSelectedValueUnwrapped] = useControlled<any>({
    controlled: selectedValueProp,
    default: multiple ? (defaultSelectedValue ?? EMPTY_ARRAY) : defaultSelectedValue,
    name: 'Combobox',
    state: 'selectedValue',
  });

  const [queryChangedAfterOpen, setQueryChangedAfterOpen] = React.useState(false);

  // Use enhanced filter for single selection mode to show all items when query is empty
  // or matches current selection, falling back to user-provided filter or default
  const filter = React.useMemo(() => {
    if (filterProp) {
      return filterProp;
    }
    if (selectionMode === 'single' && !queryChangedAfterOpen) {
      return (item: any, query: string, itemToStringArg?: (item: any) => string) =>
        singleSelectionFilter(item, query, itemToStringArg, selectedValue);
    }
    return defaultItemFilter;
  }, [filterProp, selectionMode, selectedValue, queryChangedAfterOpen]);

  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'Combobox',
    state: 'value',
  });

  const [openRaw, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const query = React.useMemo(() => {
    if (inputValue === '') {
      return '';
    }
    return String(inputValue).trim().toLocaleLowerCase();
  }, [inputValue]);

  const isGrouped = React.useMemo(() => isGroupedItems(items), [items]);

  const flatItems = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      return (items as ComboboxGroup<Item>[]).flatMap((group) => group.items);
    }

    return items as Item[];
  }, [items, isGrouped]);

  const filteredItems = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      const groupedItems = items as ComboboxGroup<Item>[];
      if (query === '') {
        return groupedItems;
      }
      return groupedItems
        .map((group) => defaultGroupFilter(group, query, filter, itemToString))
        .filter((group): group is ComboboxGroup<Item> => group !== null);
    }

    if (query === '') {
      return flatItems;
    }
    return flatItems.filter((item) => filter(item, query, itemToString));
  }, [items, flatItems, query, filter, isGrouped, itemToString]);

  const store = useLazyRef(
    () =>
      new Store<StoreState>({
        id,
        selectedValue,
        inputValue,
        open: openRaw,
        filter,
        query,
        initialList: [],
        mounted: false,
        transitionStatus: 'idle',
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const selectedIndex = useSelector(store, selectors.selectedIndex);
  const triggerElement = useSelector(store, selectors.triggerElement);
  const positionerElement = useSelector(store, selectors.positionerElement);
  const listElement = useSelector(store, selectors.listElement);
  const inline = useSelector(store, selectors.inline);
  const forceClosed = openOnlyWithMatch && filteredItems.length === 0;
  const open = inline || (openRaw && !forceClosed);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const initialList = React.useMemo(() => {
    if (virtualized && items) {
      return Array.from({ length: items.length }, () => null);
    }
    return [];
  }, [virtualized, items]);

  const listRef = React.useRef<Array<HTMLElement | null>>(initialList);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);
  const closingRef = React.useRef(false);
  const prevQueryRef = React.useRef(query);

  const controlRef = useLatestRef(triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: any) => {
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  });

  const formValue = selectionMode === 'none' ? inputValue : selectedValue;

  useField({
    id,
    commitValidation,
    value: formValue,
    controlRef,
    name,
    getValue: () => formValue,
  });

  useModernLayoutEffect(() => {
    listRef.current = initialList;
  }, [initialList]);

  useModernLayoutEffect(() => {
    if (
      prevQueryRef.current === query ||
      !open ||
      query === '' ||
      query === String(defaultInputValue).toLocaleLowerCase()
    ) {
      return;
    }

    setQueryChangedAfterOpen(true);
  }, [open, query, defaultInputValue]);

  useModernLayoutEffect(() => {
    prevQueryRef.current = query;
  }, [query]);

  const prevValueRef = React.useRef(selectedValue);

  useModernLayoutEffect(() => {
    if (prevValueRef.current === selectedValue) {
      return;
    }

    clearErrors(name);
    commitValidation?.(selectedValue, true);

    if (validationMode === 'onChange') {
      commitValidation?.(selectedValue);
    }
  }, [selectedValue, commitValidation, clearErrors, name, validationMode]);

  useModernLayoutEffect(() => {
    const hasValue = multiple
      ? Array.isArray(selectedValue) && selectedValue.length > 0
      : selectedValue !== null && selectedValue !== undefined && selectedValue !== '';
    setFilled(hasValue);
    if (prevValueRef.current !== selectedValue) {
      updateValue(selectedValue);
    }
  }, [setFilled, updateValue, selectedValue, multiple]);

  useModernLayoutEffect(() => {
    prevValueRef.current = selectedValue;
  }, [selectedValue]);

  const setInputValue = useEventCallback(
    (next: string, event: Event | undefined, reason: ValueChangeReason | undefined) => {
      props.onInputValueChange?.(next, event, reason);
      setInputValueUnwrapped(next);
    },
  );

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: BaseOpenChangeReason | undefined) => {
      // Mark that the popup is closing so we can retain the highlight until the
      // exit transition fully completes.
      closingRef.current = !nextOpen;
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const handleUnmount = useEventCallback(() => {
    closingRef.current = false;
    allowActiveIndexSyncRef.current = true;
    listRef.current = initialList;

    setMounted(false);
    onItemHighlighted(undefined, {
      type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
      index: -1,
    });
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);

    store.set('activeIndex', null);

    // Reset input value to selected value when popup closes without selection in single mode
    // This happens after the closing animation completes to avoid flicker
    if (selectionMode === 'single' && props.inputValue === undefined) {
      const stringVal = stringifyItem(selectedValue as Item, itemToString);
      if (inputRef.current && inputRef.current.value !== stringVal) {
        setInputValue(stringVal, undefined, 'item-press');
      }
    }
  });

  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const setSelectedValue = useEventCallback(
    (nextValue: Item | Item[], event: Event | undefined, reason: string | undefined) => {
      onSelectedValueChange?.(nextValue as Item, event, reason);
      setSelectedValueUnwrapped(nextValue);

      if (selectionMode === 'none' && !multiple && popupRef.current) {
        const stringVal = stringifyItem(nextValue as Item, itemToString);
        setInputValue(stringVal, undefined, undefined);
      }

      // If input value is uncontrolled, keep it in sync for single selection mode
      if (selectionMode === 'single' && props.inputValue === undefined) {
        const stringVal = stringifyItem(nextValue as Item, itemToString);
        setInputValue(stringVal, undefined, undefined);
      }

      // Clear the uncontrolled input after a selection in multiple-select mode when filtering was used.
      const hadInputValue = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (multiple && props.inputValue === undefined && hadInputValue) {
        setInputValue('', undefined, undefined);
        // Reset active index and clear any highlighted item since the list will re-filter.
        store.set('activeIndex', null);
        onItemHighlighted(undefined, {
          type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
          index: -1,
        });
      }

      // Auto-close popup after selection in single mode when open state is uncontrolled
      // Don't auto-close during autofill to avoid interfering with browser behavior
      if (
        selectionMode === 'single' &&
        props.open === undefined &&
        nextValue != null &&
        reason !== 'input-change'
      ) {
        setOpen(false, event, 'item-press');
      }
    },
  );

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    if (selectionMode === 'none') {
      return;
    }

    if (multiple) {
      const currentValue = selectedValue as Item[];
      const selectedIndices: number[] = [];

      if (Array.isArray(currentValue)) {
        currentValue.forEach((val) => {
          const index = valuesRef.current.indexOf(val);
          if (index !== -1) {
            selectedIndices.push(index);
          }
        });
      }

      store.set(
        'selectedIndex',
        selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : null,
      );
    } else {
      const index = suppliedIndex ?? valuesRef.current.indexOf(selectedValue as Item);
      const hasIndex = index !== -1;

      // Always clear the selected index when nothing is selected.
      if (selectedValue === null) {
        store.set('selectedIndex', null);
      } else if (allowActiveIndexSyncRef.current && hasIndex) {
        // Otherwise, sync only when synchronization is enabled.
        store.set('selectedIndex', index);
      }
    }
  });

  useModernLayoutEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerSelectedItem(undefined);
  }, [selectedValue, registerSelectedItem]);

  const handleEnterSelection = useEventCallback((event: Event) => {
    if (activeIndex === null) {
      return;
    }

    const highlightedItemElement = listRef.current[activeIndex];

    if (highlightedItemElement) {
      highlightedItemElement.click();
    } else {
      // Fallback for virtualized lists where DOM element might not exist
      const nextSelectedValue = valuesRef.current[activeIndex];

      if (nextSelectedValue === undefined) {
        return;
      }

      if (multiple) {
        const isSelected =
          Array.isArray(selectedValue) && selectedValue.includes(nextSelectedValue);

        let nextValue = [];
        if (isSelected) {
          nextValue = selectedValue.filter((v) => v !== nextSelectedValue);
        } else {
          nextValue = [...selectedValue, nextSelectedValue];
        }

        setSelectedValue(nextValue, event, 'item-press');
      } else {
        setSelectedValue(nextSelectedValue, event, 'item-press');
        setOpen(false, event, 'item-press');
      }
    }
  });

  const floatingRootContext = useFloatingRootContext({
    open: inline ? true : open,
    onOpenChange(nextOpen, event, reason) {
      setOpen(nextOpen, event, translateOpenChangeReason(reason));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  let ariaHasPopup: 'grid' | 'listbox' | undefined;
  let ariaExpanded: 'true' | 'false' | undefined;
  if (!inline) {
    ariaHasPopup = cols > 1 ? 'grid' : 'listbox';
    ariaExpanded = open ? 'true' : 'false';
  }

  const role: ElementProps = React.useMemo(
    () => ({
      reference: {
        role: 'combobox',
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHasPopup,
        'aria-controls': open ? listElement?.id : undefined,
        'aria-autocomplete': 'list',
        autoComplete: 'off',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'off',
      },
      floating: {
        role: 'presentation',
      },
    }),
    [ariaExpanded, ariaHasPopup, listElement?.id, open],
  );

  const click = useClick(floatingRootContext, {
    enabled: !readOnly && !disabled && !openOnlyWithMatch,
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    bubbles: true,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return !contains(triggerRef.current, target);
    },
  });

  const hasActualSelections = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(selectedValue) && selectedValue.length > 0;
    }
    return Boolean(selectedValue);
  }, [multiple, selectedValue]);

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    virtual: true,
    loop: true,
    allowEscape: true,
    focusItemOnOpen: selectionMode !== 'none' && selectedIndex !== null && hasActualSelections,
    cols,
    orientation: cols > 1 ? 'horizontal' : undefined,
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && (closingRef.current || !open)) {
        return;
      }

      const type = keyboardActiveRef.current ? 'keyboard' : 'pointer';
      if (nextActiveIndex !== null) {
        onItemHighlighted(valuesRef.current[nextActiveIndex], { type, index: nextActiveIndex });
      } else {
        onItemHighlighted(undefined, { type, index: -1 });
      }

      store.set('activeIndex', nextActiveIndex);
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    role,
    click,
    dismiss,
    listNavigation,
  ]);

  useOnFirstRender(() => {
    // These should be initialized at store creation, but there is an interdependency
    // between some values used in floating hooks above.
    store.apply({
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  });

  // Store values that depend on other hooks
  React.useEffect(() => {
    store.apply({
      id,
      selectedValue,
      inputValue,
      open,
      mounted,
      transitionStatus,
      initialList,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  }, [
    store,
    id,
    selectedValue,
    inputValue,
    open,
    mounted,
    transitionStatus,
    initialList,
    getFloatingProps,
    getReferenceProps,
  ]);

  const hiddenInputRef = useForkRef(inputRefProp, fieldControlValidation.inputRef);

  const contextValue: ComboboxRootContext = React.useMemo(
    () => ({
      selectionMode,
      listRef,
      popupRef,
      triggerRef,
      valuesRef,
      inputRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      setOpen,
      setInputValue,
      setSelectedValue,
      handleEnterSelection,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      cols,
      isGrouped,
      virtualized,
      openOnlyWithMatch,
      items,
    }),
    [
      selectionMode,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      setOpen,
      setInputValue,
      setSelectedValue,
      handleEnterSelection,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      cols,
      isGrouped,
      virtualized,
      openOnlyWithMatch,
      items,
    ],
  );

  const itemsContextValue: ComboboxDerivedItemsContext = React.useMemo(
    () => ({
      query,
      filteredItems,
    }),
    [query, filteredItems],
  );

  const serializedValue = React.useMemo(() => {
    if (Array.isArray(formValue)) {
      return '';
    }
    if (itemToValue && formValue != null) {
      return itemToValue(formValue);
    }
    return serializeValue(formValue);
  }, [formValue, itemToValue]);

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(selectedValue) || !name) {
      return null;
    }

    return selectedValue.map((value) => {
      const currentSerializedValue = itemToValue ? itemToValue(value) : serializeValue(value);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={name}
          value={currentSerializedValue}
        />
      );
    });
  }, [multiple, selectedValue, name, itemToValue]);

  const children = (
    <React.Fragment>
      {props.children}
      <input
        {...fieldControlValidation.getInputValidationProps({
          onFocus() {
            // Move focus to the trigger element when the hidden input is focused.
            store.state.triggerElement?.focus();
          },
          // Handle browser autofill.
          onChange(event: React.ChangeEvent<HTMLSelectElement>) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            const nextValue = event.target.value;

            const exactValue = valuesRef.current.find(
              (v: any) =>
                v === nextValue ||
                (typeof selectedValue === 'string' && nextValue.toLowerCase() === v.toLowerCase()),
            );

            if (exactValue != null) {
              setDirty(exactValue !== validityData.initialValue);
              setSelectedValue?.(exactValue, event.nativeEvent, 'input-change');

              if (validationMode === 'onChange') {
                fieldControlValidation.commitValidation(exactValue);
              }
            }
          },
          id,
          name: multiple ? undefined : name,
          disabled,
          required,
          readOnly,
          value: serializedValue,
          ref: hiddenInputRef,
          style: visuallyHidden,
          tabIndex: -1,
          'aria-hidden': true,
        })}
      />
      {hiddenInputs}
    </React.Fragment>
  );

  return (
    <ComboboxRootContext.Provider value={contextValue}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <ComboboxDerivedItemsContext.Provider value={itemsContextValue}>
          {virtualized ? children : <CompositeList elementsRef={listRef}>{children}</CompositeList>}
        </ComboboxDerivedItemsContext.Provider>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

export namespace ComboboxRoot {
  export interface State {}

  export interface Props<Item = any> {
    children?: React.ReactNode;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The id of the combobox.
     */
    id?: string;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to choose a different option from the combobox popup.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the combobox popup is initially open.
     *
     * To render a controlled combobox popup, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the combobox popup is opened or closed.
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: BaseOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the combobox popup is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the combobox popup is currently open.
     */
    open?: boolean;
    /**
     * Whether the combobox popup is only open when the input value is not empty and matches at least one item.
     * @default false
     */
    openOnlyWithMatch?: boolean;
    /**
     * The input value of the combobox.
     */
    inputValue?: React.ComponentProps<'input'>['value'];
    /**
     * Callback fired when the input value of the combobox changes.
     */
    onInputValueChange?: (
      value: string,
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled input value when initially rendered.
     */
    defaultInputValue?: React.ComponentProps<'input'>['defaultValue'];
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value.
     * - `multiple`: Remember all selected values.
     * - `none`: Do not remember the selected value.
     * @default 'none'
     */
    selectionMode?: 'single' | 'multiple' | 'none';
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the combobox will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the combobox manually.
     * Useful when the combobox's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Callback fired when the user navigates the list and highlights an item.
     * Passes the item's `value` or `undefined` when no item is highlighted.
     */
    onItemHighlighted?: (
      value: Item | undefined,
      data: {
        type: 'keyboard' | 'pointer';
        index: number;
      },
    ) => void;
    /**
     * A ref to the hidden input element used for form submission.
     */
    inputRef?: React.RefObject<HTMLInputElement>;
    /**
     * The number of columns the items are rendered in grid layout.
     * @default 1
     */
    cols?: number;
    /**
     * The items to be displayed in the combobox.
     * Can be either a flat array of items or an array of groups with items.
     */
    items?: Item[] | ComboboxGroup<Item>[];
    /**
     * Filter function used to match items vs input query.
     * The `itemToString` function is provided to help convert items to strings for comparison.
     */
    filter?: (item: Item, query: string, itemToString?: (item: Item) => string) => boolean;
    /**
     * Function to convert an item to a string for display in the combobox.
     */
    itemToString?: (item: Item) => string;
    /**
     * Function to convert an item to its value for form submission.
     */
    itemToValue?: (item: Item) => string;
    /**
     * The selected value of the combobox.
     */
    selectedValue?: Item | null;
    /**
     * Callback fired when the selected value of the combobox changes.
     */
    onSelectedValueChange?: (
      value: Item,
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled selected value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `selectedValue` prop instead.
     */
    defaultSelectedValue?: Item;
    /**
     * Whether the combobox popup should be virtualized.
     * @default false
     */
    virtualized?: boolean;
  }

  export interface SingleProps<Item = any> extends Omit<Props<Item>, 'selectionMode'> {
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value in state.
     * - `multiple`: Remember all selected values in state.
     * - `none`: Does not remember the selected value in state.
     * @default 'none'
     */
    selectionMode?: 'single';
  }

  export interface MultipleProps<Item = any>
    extends Omit<
      Props<Item>,
      'selectionMode' | 'selectedValue' | 'onSelectedValueChange' | 'defaultSelectedValue'
    > {
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value.
     * - `multiple`: Remember all selected values.
     * - `none`: Do not remember the selected value.
     * @default 'none'
     */
    selectionMode?: 'multiple';
    /**
     * The selected values of the combobox.
     */
    selectedValue?: Item[];
    /**
     * Callback fired when the selected values of the combobox change.
     */
    onSelectedValueChange?: (
      value: Item[],
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled selected values of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `selectedValue` prop instead.
     */
    defaultSelectedValue?: Item[];
  }

  export interface SingleGroupedProps<Item = any>
    extends Omit<SingleProps<ExtractItemType<Item>>, 'items'> {
    /**
     * The items to be displayed in the combobox as groups.
     */
    items: ComboboxGroup<Item>[];
  }

  export interface MultipleGroupedProps<Item = any>
    extends Omit<MultipleProps<ExtractItemType<Item>>, 'items'> {
    /**
     * The items to be displayed in the combobox as groups.
     */
    items: ComboboxGroup<Item>[];
  }

  export interface Actions {
    unmount: () => void;
  }
}
