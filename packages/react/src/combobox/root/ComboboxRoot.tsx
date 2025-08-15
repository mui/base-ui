'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useOnFirstRender } from '@base-ui-components/utils/useOnFirstRender';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { Store, useStore } from '@base-ui-components/utils/store';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
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
  isGroupedItems,
  defaultGroupFilter,
  stringifyItem,
  createCollatorItemFilter,
  createSingleSelectionCollatorFilter,
} from './utils';
import { useFilter } from './utils/useFilter';
import { serializeValue } from '../../utils/serializeValue';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { EMPTY_ARRAY } from '../../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';

export function ComboboxRoot<Item = any, Mode extends SelectionMode = 'none'>(
  props: ComboboxRootConditionalProps<Item, Mode>,
): React.JSX.Element {
  const {
    id: idProp,
    onOpenChangeComplete: onOpenChangeCompleteProp,
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
    openOnInputClick = true,
    itemToString,
    itemToValue,
    virtualized = false,
    fillInputOnItemPress = true,
    modal = false,
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

  const frame = useAnimationFrame();

  useIsoLayoutEffect(() => {
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

  const collatorFilter = useFilter({ sensitivity: 'base' });

  const filter = React.useMemo(() => {
    if (filterProp) {
      return filterProp;
    }
    if (selectionMode === 'single' && !queryChangedAfterOpen) {
      return createSingleSelectionCollatorFilter(collatorFilter, itemToString, selectedValue);
    }
    return createCollatorItemFilter(collatorFilter, itemToString);
  }, [
    filterProp,
    selectionMode,
    selectedValue,
    queryChangedAfterOpen,
    collatorFilter,
    itemToString,
  ]);

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
      return [] as ExtractItemType<Item>[];
    }

    if (isGrouped) {
      return (items as ComboboxGroup<ExtractItemType<Item>>[]).flatMap((group) => group.items);
    }

    return items as ExtractItemType<Item>[];
  }, [items, isGrouped]);

  const filteredItems = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      const groupedItems = items as ComboboxGroup<ExtractItemType<Item>>[];
      if (query === '') {
        return groupedItems;
      }
      return groupedItems
        .map((group) => defaultGroupFilter(group, query, filter, itemToString))
        .filter((group): group is ComboboxGroup<ExtractItemType<Item>> => group !== null);
    }

    if (query === '') {
      return flatItems;
    }
    return flatItems.filter((item) => filter(item, query, itemToString));
  }, [items, flatItems, query, filter, isGrouped, itemToString]);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id,
        selectedValue,
        inputValue,
        open: openRaw,
        filter,
        query,
        items,
        initialList: [],
        mounted: false,
        transitionStatus: 'idle',
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        inputProps: {},
        triggerProps: {},
        anchorElement: null,
        positionerElement: null,
        listElement: null,
        triggerElement: null,
        inputElement: null,
        openMethod: null,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);
  const onOpenChangeComplete = useEventCallback(onOpenChangeCompleteProp);

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);
  const anchorElement = useStore(store, selectors.anchorElement);
  const positionerElement = useStore(store, selectors.positionerElement);
  const listElement = useStore(store, selectors.listElement);
  const triggerElement = useStore(store, selectors.triggerElement);
  const inputElement = useStore(store, selectors.inputElement);
  const inline = useStore(store, selectors.inline);
  const open = inline || openRaw;

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const initialList = React.useMemo(() => {
    if (virtualized) {
      const count = Array.isArray(filteredItems) ? filteredItems.length : 0;
      return Array.from({ length: count }, () => null);
    }
    return [];
  }, [virtualized, filteredItems]);

  const listRef = React.useRef<Array<HTMLElement | null>>(initialList);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);
  const hadInputClearRef = React.useRef(false);
  const prevQueryRef = React.useRef(query);

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
    controlRef: inputRef,
    name,
    getValue: () => formValue,
  });

  useIsoLayoutEffect(() => {
    if (!virtualized) {
      return;
    }
    // Drop stray nulls
    listRef.current = initialList.slice();
    valuesRef.current.length = initialList.length;
  }, [initialList, virtualized]);

  // Maintain a full value map for virtualized lists so offscreen selections and
  // navigation use the correct indices even when DOM nodes aren't rendered.
  useIsoLayoutEffect(() => {
    if (!virtualized || isGrouped) {
      return;
    }
    valuesRef.current = filteredItems.slice();
  }, [virtualized, filteredItems, isGrouped]);

  useIsoLayoutEffect(() => {
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

  useIsoLayoutEffect(() => {
    prevQueryRef.current = query;
  }, [query]);

  const prevValueRef = React.useRef(selectedValue);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === selectedValue) {
      return;
    }

    clearErrors(name);
    commitValidation?.(selectedValue, true);

    if (validationMode === 'onChange') {
      commitValidation?.(selectedValue);
    }
  }, [selectedValue, commitValidation, clearErrors, name, validationMode]);

  useIsoLayoutEffect(() => {
    const hasValue = multiple
      ? Array.isArray(selectedValue) && selectedValue.length > 0
      : selectedValue !== null && selectedValue !== undefined && selectedValue !== '';
    setFilled(hasValue);
    if (prevValueRef.current !== selectedValue) {
      updateValue(selectedValue);
    }
  }, [setFilled, updateValue, selectedValue, multiple]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = selectedValue;
  }, [selectedValue]);

  const setInputValue = useEventCallback(
    (next: string, event: Event | undefined, reason: ValueChangeReason | undefined) => {
      if (reason === 'input-clear' && selectionMode === 'none' && open) {
        hadInputClearRef.current = true;
        // Defer clearing until close transition completes to avoid flicker
        return;
      }
      props.onInputValueChange?.(next, event, reason);
      setInputValueUnwrapped(next);
    },
  );

  const setOpen = useEventCallback(
    (
      nextOpen: boolean,
      event: Event | undefined,
      reason: ComboboxRoot.OpenChangeReason | undefined,
    ) => {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const hasRegisteredRef = React.useRef(false);

  const registerItemIndex = useEventCallback((suppliedIndex: number | undefined) => {
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
      if (selectedValue == null) {
        store.set('selectedIndex', null);
      } else if (allowActiveIndexSyncRef.current && hasIndex) {
        // Otherwise, sync only when synchronization is enabled.
        store.set('selectedIndex', index);
      }
    }
  });

  const handleUnmount = useEventCallback(() => {
    allowActiveIndexSyncRef.current = true;
    listRef.current = initialList;

    setMounted(false);
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);
    resetOpenInteractionType();
    onItemHighlighted(undefined, { type: 'none', index: -1 });

    store.apply({
      activeIndex: null,
    });

    // Restore selectedIndex back to its real value after the popup closes.
    // It may have been set to null while filtering or typing to avoid
    // interfering with navigation. On close, ensure it reflects the
    // current selection so initial highlight on next open is correct.
    if (selectionMode === 'none') {
      store.set('selectedIndex', null);
    } else if (multiple) {
      const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
      const selectedIndices: number[] = [];
      currentValue.forEach((val) => {
        const idx = flatItems.indexOf(val);
        if (idx !== -1) {
          selectedIndices.push(idx);
        }
      });
      store.set(
        'selectedIndex',
        selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : null,
      );
    } else {
      const idx = flatItems.indexOf(selectedValue as any);
      if (idx !== -1) {
        registerItemIndex(idx);
      } else {
        store.set('selectedIndex', null);
      }
    }

    // If an input-clear was requested while open, perform it here after close completes
    // to avoid mid-exit flicker.
    if (selectionMode === 'none' && props.inputValue === undefined && hadInputClearRef.current) {
      if (inputRef.current && inputRef.current.value !== '') {
        setInputValue('', undefined, 'input-clear');
      }
      hadInputClearRef.current = false;
    }

    // Single selection mode:
    // - If input is rendered inside the popup, clear it so the next open is blank
    // - If input is outside the popup, sync it to the selected value
    // Applies to both controlled and uncontrolled input values so that controlled
    // consumers can reset the input on close via onInputValueChange.
    if (selectionMode === 'single') {
      const isInputInsidePopup = contains(popupRef.current, inputRef.current);
      if (isInputInsidePopup) {
        if (inputRef.current && inputRef.current.value !== '') {
          setInputValue('', undefined, 'input-clear');
        }
      } else {
        const stringVal = stringifyItem(selectedValue, itemToString);
        if (inputRef.current && inputRef.current.value !== stringVal) {
          setInputValue(stringVal, undefined, 'item-press');
        }
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
    (nextValue: Item | Item[], event: Event | undefined, reason: ValueChangeReason | undefined) => {
      if (selectionMode === 'none' && !multiple && popupRef.current) {
        if (fillInputOnItemPress) {
          const stringVal = stringifyItem(nextValue as Item, itemToString);
          setInputValue(stringVal, event, reason);
        }
      }

      // If input value is uncontrolled, keep it in sync for single selection mode.
      // When the input is inside the popup, do not fill it with the selected value;
      // it should reopen blank on next open. When the input is outside, sync to selection.
      if (selectionMode === 'single' && props.inputValue === undefined) {
        const isInputInsidePopup = Boolean(
          popupRef.current && inputRef.current && popupRef.current.contains(inputRef.current),
        );
        if (!isInputInsidePopup) {
          const stringVal = stringifyItem(nextValue as Item, itemToString);
          setInputValue(stringVal, event, reason);
        }
      }

      // Clear the uncontrolled input after a selection in multiple-select mode when filtering was used.
      const hadInputValue = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (multiple && props.inputValue === undefined && hadInputValue) {
        setInputValue('', event, reason);
        // Reset active index and clear any highlighted item since the list will re-filter.
        store.set('activeIndex', null);
        onItemHighlighted(undefined, { type: 'none', index: -1 });
      }

      // Cast to `any` due to conditional value type (single vs. multiple).
      // The runtime implementation already ensures the correct value shape.
      onSelectedValueChange?.(nextValue as any, event, reason);
      setSelectedValueUnwrapped(nextValue);

      // For virtualized lists in single-selection mode, ensure `selectedIndex`
      // reflects the newly selected item's index even if its DOM node isn't
      // currently rendered (outside the virtual window).
      if (virtualized && !multiple && selectionMode !== 'none') {
        const index = flatItems.indexOf(nextValue as any);
        if (index !== -1) {
          store.set('selectedIndex', index);
        }
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

  useIsoLayoutEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerItemIndex(undefined);
  }, [selectedValue, registerItemIndex]);

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
      reference: anchorElement,
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
    enabled: !readOnly && !disabled && openOnInputClick,
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    bubbles: true,
    outsidePressEvent:
      anchorElement !== inputElement ? { mouse: 'intentional', touch: 'sloppy' } : undefined,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return !contains(triggerElement, target);
    },
  });

  const hasActualSelections = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(selectedValue) && selectedValue.length > 0;
    }
    return Boolean(selectedValue);
  }, [multiple, selectedValue]);

  useIsoLayoutEffect(() => {
    if (!open || selectedIndex === null) {
      return;
    }

    frame.request(() => {
      onItemHighlighted(valuesRef.current[selectedIndex], {
        type: 'none',
        index: selectedIndex,
      });
    });
  }, [open, selectedIndex, onItemHighlighted, frame]);

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
    disabledIndices:
      virtualized && !isGrouped
        ? (index) => index < 0 || index >= (Array.isArray(filteredItems) ? filteredItems.length : 0)
        : EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight only while actually transitioning out or closed.
      if (nextActiveIndex === null && (!open || transitionStatus === 'ending')) {
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
      inputProps: getReferenceProps(),
      triggerProps,
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
      items,
      initialList,
      popupProps: getFloatingProps(),
      inputProps: getReferenceProps(),
      triggerProps,
      openMethod,
    });
  }, [
    store,
    id,
    selectedValue,
    inputValue,
    open,
    mounted,
    transitionStatus,
    items,
    initialList,
    getFloatingProps,
    getReferenceProps,
    openMethod,
    triggerProps,
  ]);

  const hiddenInputRef = useMergedRefs(inputRefProp, fieldControlValidation.inputRef);

  const contextValue: ComboboxRootContext = React.useMemo(
    () => ({
      selectionMode,
      listRef,
      popupRef,
      valuesRef,
      inputRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      store,
      getItemProps,
      registerItemIndex,
      onItemHighlighted,
      onOpenChangeComplete,
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
      openOnInputClick,
      itemToString,
      modal,
    }),
    [
      selectionMode,
      store,
      getItemProps,
      registerItemIndex,
      onItemHighlighted,
      onOpenChangeComplete,
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
      openOnInputClick,
      itemToString,
      modal,
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
            const referenceElement = inputRef.current || triggerElement;
            referenceElement?.focus();
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

type ExtractItemType<Item> = Item extends ComboboxGroup<infer GroupItem>[]
  ? GroupItem
  : Item extends ComboboxGroup<infer GroupItem>
    ? GroupItem
    : Item extends (infer GroupItem)[]
      ? GroupItem
      : Item;

type SelectionMode = 'single' | 'multiple' | 'none';

type ComboboxValueType<Item, Mode extends SelectionMode> = Mode extends 'multiple'
  ? Item[]
  : Item | null;

interface ComboboxRootProps<Item> {
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
    reason: ComboboxRoot.OpenChangeReason | undefined,
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
   * Whether the combobox popup opens when clicking the input.
   * @default true
   */
  openOnInputClick?: boolean;
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
   * A ref to imperative actions.
   * - `unmount`: When specified, the combobox will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the combobox manually.
   * Useful when the combobox's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<ComboboxRoot.Actions>;
  /**
   * Callback fired when the user navigates the list and highlights an item.
   * Passes the item and the type of navigation or `undefined` when no item is highlighted.
   * - `keyboard`: The item was highlighted via keyboard navigation.
   * - `pointer`: The item was highlighted via pointer navigation.
   * - `none`: The item was highlighted via programmatic navigation.
   */
  onItemHighlighted?: (
    value: ExtractItemType<Item> | undefined,
    data: {
      type: 'keyboard' | 'pointer' | 'none';
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
  items?: ExtractItemType<Item>[] | ComboboxGroup<ExtractItemType<Item>>[];
  /**
   * Filter function used to match items vs input query.
   * The `itemToString` function is provided to help convert items to strings for comparison.
   */
  filter?: (
    item: ExtractItemType<Item>,
    query: string,
    itemToString?: (item: ExtractItemType<Item>) => string,
  ) => boolean;
  /**
   * Function to convert an item to a string for display in the combobox.
   */
  itemToString?: (item: ExtractItemType<Item>) => string;
  /**
   * Function to convert an item to its value for form submission.
   */
  itemToValue?: (item: ExtractItemType<Item>) => string;
  /**
   * Whether the combobox items are virtualized.
   * @default false
   */
  virtualized?: boolean;
  /**
   * INTERNAL: When `selectionMode` is `none`, controls whether selecting an item fills the input.
   * Defaults to `true` to preserve legacy Combobox behavior.
   */
  fillInputOnItemPress?: boolean;
  /**
   * Determines if the combobox enters a modal state when open.
   * - `true`: user interaction is limited to the combobox: document page scroll is locked and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default false
   */
  modal?: boolean;
}

export type ComboboxRootConditionalProps<Item, Mode extends SelectionMode = 'none'> = Omit<
  ComboboxRootProps<Item>,
  'selectionMode' | 'selectedValue' | 'defaultSelectedValue' | 'onSelectedValueChange'
> & {
  /**
   * How the combobox should remember the selected value.
   * - `single`: Remembers the last selected value.
   * - `multiple`: Remember all selected values.
   * - `none`: Do not remember the selected value.
   * @default 'none'
   */
  selectionMode?: Mode;
  /**
   * The selected value of the combobox.
   */
  selectedValue?: ComboboxValueType<ExtractItemType<Item>, Mode>;
  /**
   * The uncontrolled selected value of the combobox when it's initially rendered.
   *
   * To render a controlled combobox, use the `selectedValue` prop instead.
   */
  defaultSelectedValue?: ComboboxValueType<ExtractItemType<Item>, Mode>;
  /**
   * Callback fired when the selected value of the combobox changes.
   */
  onSelectedValueChange?: (
    value: ComboboxValueType<ExtractItemType<Item>, Mode>,
    event: Event | undefined,
    reason: string | undefined,
  ) => void;
};

export namespace ComboboxRoot {
  export type Props<Item, Mode extends SelectionMode = 'none'> = ComboboxRootConditionalProps<
    Item,
    Mode
  >;

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'input-change' | 'input-clear';
}
