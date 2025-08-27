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
import {
  ElementProps,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useClick,
  useTypeahead,
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
  type Group,
  isGroupedItems,
  stringifyItem,
  createCollatorItemFilter,
  createSingleSelectionCollatorFilter,
} from './utils';
import { useFilter } from './utils/useFilter';
import { serializeValue } from '../../utils/serializeValue';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { EMPTY_ARRAY } from '../../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { HTMLProps } from '../../utils/types';
import { useValueChanged } from './utils/useValueChanged';

const DEFAULT_FILTER_OPTIONS = { sensitivity: 'base' } as const;

/**
 * @internal
 */
export function ComboboxRootInternal<Value, Mode extends SelectionMode = 'none'>(
  props: Omit<ComboboxRootConditionalProps<Value, Mode>, 'items'> & {
    items: Group<Value>[];
  },
): React.JSX.Element;
export function ComboboxRootInternal<Value, Mode extends SelectionMode = 'none'>(
  props: Omit<ComboboxRootConditionalProps<Value, Mode>, 'items'> & {
    items?: Value[];
  },
): React.JSX.Element;
export function ComboboxRootInternal<Value = any, Mode extends SelectionMode = 'none'>(
  props: ComboboxRootConditionalProps<Value, Mode>,
): React.JSX.Element {
  const {
    id: idProp,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    defaultSelectedValue = null,
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
    autoHighlight = false,
    itemToLabel,
    itemToValue,
    virtualized = false,
    fillInputOnItemPress = true,
    modal = false,
    limit = -1,
    autoComplete = 'list',
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

  const collatorFilter = useFilter(DEFAULT_FILTER_OPTIONS);

  const filter = React.useMemo(() => {
    if (filterProp === null) {
      return () => true;
    }
    if (filterProp !== undefined) {
      return filterProp;
    }
    if (selectionMode === 'single' && !queryChangedAfterOpen) {
      return createSingleSelectionCollatorFilter(collatorFilter, itemToLabel, selectedValue);
    }
    return createCollatorItemFilter(collatorFilter, itemToLabel);
  }, [
    filterProp,
    selectionMode,
    selectedValue,
    queryChangedAfterOpen,
    collatorFilter,
    itemToLabel,
  ]);

  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'Combobox',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const query = inputValue === '' ? '' : String(inputValue).trim().toLocaleLowerCase();
  const isGrouped = isGroupedItems(items);

  const flatItems: Value[] = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      return items.flatMap((group) => group.items);
    }

    return items;
  }, [items, isGrouped]);

  const filteredItems: Value[] | Group<Value>[] = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      const groupedItems = items as Group<Value>[];
      const resultingGroups: Group<Value>[] = [];
      let currentCount = 0;

      for (const group of groupedItems) {
        if (limit > -1 && currentCount >= limit) {
          break;
        }

        const candidateItems =
          query === ''
            ? group.items
            : group.items.filter((item) => filter(item, query, itemToLabel));

        if (candidateItems.length === 0) {
          continue;
        }

        const remainingLimit = limit > -1 ? limit - currentCount : Infinity;
        const itemsToTake = candidateItems.slice(0, remainingLimit);

        if (itemsToTake.length > 0) {
          const newGroup = { ...group, items: itemsToTake };
          resultingGroups.push(newGroup);
          currentCount += itemsToTake.length;
        }
      }

      return resultingGroups;
    }

    if (query === '') {
      return limit > -1 ? flatItems.slice(0, limit) : flatItems;
    }

    const limitedItems: Value[] = [];
    for (const item of flatItems) {
      if (limit > -1 && limitedItems.length >= limit) {
        break;
      }
      if (filter(item, query, itemToLabel)) {
        limitedItems.push(item);
      }
    }

    return limitedItems;
  }, [items, flatItems, query, filter, isGrouped, itemToLabel, limit]);

  const flatFilteredItems: Value[] = React.useMemo(() => {
    if (isGrouped) {
      const groups = filteredItems as Group<Value>[];
      return groups.flatMap((g) => g.items);
    }
    return filteredItems as Value[];
  }, [filteredItems, isGrouped]);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id,
        selectedValue,
        inputValue,
        open,
        filter,
        query,
        items,
        mounted: false,
        forceMount: false,
        transitionStatus: 'idle',
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        inputProps: {},
        triggerProps: {},
        typeaheadTriggerProps: {},
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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const hadInputClearRef = React.useRef(false);
  const chipsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const clearRef = React.useRef<HTMLButtonElement | null>(null);

  /**
   * Contains the currently visible list of item values post-filtering.
   */
  const valuesRef = React.useRef<Array<any>>([]);
  /**
   * Contains all item values in a stable, unfiltered order.
   * - When `items` prop is provided, this mirrors the flat items.
   * - When `items` is not provided, this accumulates values on first mount and
   *   does not remove them on unmount (due to filtering), providing a stable
   *   index for selected value tracking.
   */
  const allValuesRef = React.useRef<Array<any>>([]);

  const queryRef = React.useRef(query);
  const selectedValueRef = React.useRef(selectedValue);
  const inputValueRef = React.useRef(inputValue);

  const forceMount = useEventCallback(() => {
    if (items) {
      labelsRef.current = flatFilteredItems.map((item) => stringifyItem(item, itemToLabel));
    } else {
      store.set('forceMount', true);
    }
  });

  const initialSelectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (selectedValue !== initialSelectedValueRef.current) {
      forceMount();
    }
  }, [forceMount, selectedValue, initialSelectedValueRef]);

  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: any) => {
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  });

  const setIndices = useEventCallback(
    (options: {
      activeIndex?: number | null;
      selectedIndex?: number | null;
      type?: 'none' | 'keyboard' | 'pointer';
    }) => {
      store.apply(options);
      const type = options.type || 'none';

      if (options.activeIndex === undefined) {
        return;
      }

      if (options.activeIndex === null) {
        onItemHighlighted(undefined, { type, index: -1 });
      } else {
        const activeValue = valuesRef.current[options.activeIndex];
        onItemHighlighted(activeValue, {
          type,
          index: options.activeIndex,
        });
      }
    },
  );

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
    if (items) {
      valuesRef.current = flatFilteredItems;
      allValuesRef.current = flatItems;
      listRef.current.length = flatFilteredItems.length;
    }
  }, [items, flatFilteredItems, flatItems]);

  // When the available items change, ensure the selected value(s) remain valid.
  // - Single: if current selection is removed, fall back to defaultSelectedValue if it exists in the list; else null.
  // - Multiple: drop any removed selections.
  useIsoLayoutEffect(() => {
    if (!items || selectionMode === 'none') {
      return;
    }

    const registry = flatItems;

    if (multiple) {
      const current = Array.isArray(selectedValue) ? selectedValue : EMPTY_ARRAY;
      const next = current.filter((v) => registry.includes(v));
      if (next.length !== current.length) {
        setSelectedValueUnwrapped(next);
      }
      return;
    }

    const isStillPresent = selectedValue == null ? true : registry.includes(selectedValue);
    if (isStillPresent) {
      return;
    }

    let fallback = null;
    if (defaultSelectedValue != null && registry.includes(defaultSelectedValue as Value)) {
      fallback = defaultSelectedValue;
    }
    setSelectedValueUnwrapped(fallback);

    // Keep the input text in sync when the input is rendered outside the popup.
    const isInputInsidePopup = contains(popupRef.current, inputRef.current);
    if (!isInputInsidePopup) {
      const stringVal = stringifyItem(fallback, itemToLabel);
      if (inputRef.current && inputRef.current.value !== stringVal) {
        setInputValueUnwrapped(stringVal);
      }
    }
  }, [
    items,
    flatItems,
    multiple,
    selectionMode,
    selectedValue,
    defaultSelectedValue,
    setSelectedValueUnwrapped,
    setInputValueUnwrapped,
    itemToLabel,
  ]);

  useValueChanged(queryRef, query, () => {
    if (!open || query === '' || query === String(defaultInputValue).toLocaleLowerCase()) {
      return;
    }
    setQueryChangedAfterOpen(true);
  });

  useValueChanged(selectedValueRef, selectedValue, () => {
    if (selectionMode === 'none') {
      return;
    }

    clearErrors(name);
    commitValidation?.(selectedValue, true);

    if (validationMode === 'onChange') {
      commitValidation?.(selectedValue);
    }

    updateValue(selectedValue);
  });

  useValueChanged(inputValueRef, inputValue, () => {
    if (selectionMode !== 'none') {
      return;
    }

    clearErrors(name);
    commitValidation?.(inputValue, true);

    if (validationMode === 'onChange') {
      commitValidation?.(inputValue);
    }

    updateValue(inputValue);
  });

  useIsoLayoutEffect(() => {
    if (selectionMode === 'none') {
      setFilled(String(inputValue) !== '');
    } else {
      setFilled(
        multiple ? Array.isArray(selectedValue) && selectedValue.length > 0 : selectedValue != null,
      );
    }
  }, [setFilled, selectionMode, inputValue, selectedValue, multiple]);

  const setInputValue = useEventCallback(
    (next: string, event: Event | undefined, reason: ValueChangeReason | undefined) => {
      // If user is typing, ensure we don't auto-highlight on open due to a race
      // with the post-open effect that sets this flag.
      if (reason === 'input-change') {
        const hasQuery = next.trim() !== '';
        if (hasQuery) {
          setQueryChangedAfterOpen(true);
        }
        if (selectionMode === 'none' && autoHighlight) {
          setIndices({ activeIndex: hasQuery ? 0 : null });
        }
      }

      if (reason === 'input-clear' && open) {
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
      reason: ComboboxRootInternal.ChangeReason | undefined,
    ) => {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const syncSelectedIndex = useEventCallback(() => {
    if (selectionMode === 'none') {
      return;
    }

    const registry = items ? flatItems : allValuesRef.current;

    if (multiple) {
      const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = registry.indexOf(lastValue);
      setIndices({ selectedIndex: lastIndex === -1 ? null : lastIndex });
    } else {
      const index = registry.indexOf(selectedValue);
      setIndices({ selectedIndex: index === -1 ? null : index });
    }
  });

  useIsoLayoutEffect(() => {
    if (!mounted) {
      syncSelectedIndex();
    }
  }, [mounted, selectedValue, syncSelectedIndex]);

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);
    resetOpenInteractionType();

    if (selectionMode === 'none') {
      setIndices({ activeIndex: null, selectedIndex: null });
    } else {
      setIndices({ activeIndex: null });
    }

    // If an input-clear was requested while open, perform it here after close completes
    // to avoid mid-exit flicker.
    if (hadInputClearRef.current && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', undefined, 'input-clear');
      hadInputClearRef.current = false;
    }

    // If explicitly requested by a wrapper (e.g., FilterableMenu), clear the input
    // after close completes regardless of selection mode. This ensures the next open
    // starts from a blank query without requiring external state resets.
    if (props.clearInputOnCloseComplete && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', undefined, 'input-clear');
    }

    // Multiple selection mode:
    // If the user typed a filter and didn't select in multiple mode, clear the input
    // after close completes to avoid mid-exit flicker and start fresh on next open.
    if (selectionMode === 'multiple' && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', undefined, 'input-clear');
    }

    // Single selection mode:
    // - If input is rendered inside the popup, clear it so the next open is blank
    // - If input is outside the popup, sync it to the selected value
    if (selectionMode === 'single') {
      const isInputInsidePopup = contains(popupRef.current, inputRef.current);
      if (isInputInsidePopup) {
        if (inputRef.current && inputRef.current.value !== '') {
          setInputValue('', undefined, 'input-clear');
        }
      } else {
        const stringVal = stringifyItem(selectedValue, itemToLabel);
        if (inputRef.current && inputRef.current.value !== stringVal) {
          // If no selection was made, treat this as clearing the typed filter.
          const reason = stringVal === '' ? 'input-clear' : 'item-press';
          setInputValue(stringVal, undefined, reason);
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
    (
      nextValue: Value | Value[],
      event: Event | undefined,
      reason: ValueChangeReason | undefined,
    ) => {
      // Cast to `any` due to conditional value type (single vs. multiple).
      // The runtime implementation already ensures the correct value shape.
      onSelectedValueChange?.(nextValue as any, event, reason);
      setSelectedValueUnwrapped(nextValue);

      const shouldFillInput =
        (selectionMode === 'none' && popupRef.current && fillInputOnItemPress) ||
        (selectionMode === 'single' && popupRef.current && anchorElement === inputElement);

      if (shouldFillInput) {
        setInputValue(stringifyItem(nextValue as Value, itemToLabel), event, reason);
      }

      const hadInputValue = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (multiple && hadInputValue) {
        setInputValue('', event, reason);
        // Reset active index and clear any highlighted item since the list will re-filter.
        setIndices({ activeIndex: null });
      }

      if (selectionMode === 'single' && nextValue != null && reason !== 'input-change') {
        setOpen(false, event, 'item-press');
      }
    },
  );

  const handleEnterSelection = useEventCallback(() => {
    if (activeIndex === null) {
      return;
    }

    listRef.current[activeIndex]?.click();
  });

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

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

  const role: ElementProps = React.useMemo(() => {
    const isPlainInput = inputElement?.tagName === 'INPUT';
    const shouldApplyAria = isPlainInput || open;

    const reference = isPlainInput
      ? ({
          autoComplete: 'off',
          spellCheck: 'false',
          autoCorrect: 'off',
          autoCapitalize: 'off',
        } as HTMLProps<HTMLInputElement>)
      : {};

    if (shouldApplyAria) {
      reference.role = 'combobox';
      reference['aria-expanded'] = ariaExpanded;
      reference['aria-haspopup'] = ariaHasPopup;
      reference['aria-controls'] = open ? listElement?.id : undefined;
      reference['aria-autocomplete'] = autoComplete;
    }

    return {
      reference,
      floating: { role: 'presentation' },
    };
  }, [inputElement, open, ariaExpanded, ariaHasPopup, listElement?.id, autoComplete]);

  const click = useClick(floatingRootContext, {
    enabled: !readOnly && !disabled && openOnInputClick,
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    outsidePressEvent:
      anchorElement !== inputElement ? { mouse: 'intentional', touch: 'sloppy' } : undefined,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return (
        !contains(triggerElement, target) &&
        !contains(clearRef.current, target) &&
        !contains(chipsContainerRef.current, target)
      );
    },
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    virtual: true,
    loop: true,
    allowEscape: !autoHighlight,
    openOnArrowKeyDown:
      anchorElement === inputElement && (inputElement as HTMLElement | null)?.tagName === 'INPUT',
    focusItemOnOpen:
      queryChangedAfterOpen || selectionMode === 'none' || selectedIndex === null ? false : 'auto',
    cols,
    orientation: cols > 1 ? 'horizontal' : undefined,
    disabledIndices: virtualized
      ? (index) => index < 0 || index >= flatFilteredItems.length
      : EMPTY_ARRAY,
    onNavigate(nextActiveIndex, event) {
      // Retain the highlight only while actually transitioning out or closed.
      if (nextActiveIndex === null && (!open || transitionStatus === 'ending')) {
        return;
      }

      if (!event) {
        setIndices({
          activeIndex: nextActiveIndex,
        });
      } else {
        setIndices({
          activeIndex: nextActiveIndex,
          type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
        });
      }
    },
  });

  const { reference: typeaheadTriggerProps } = useTypeahead(floatingRootContext, {
    enabled: !open && !readOnly && !disabled && selectionMode === 'single',
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      const nextSelectedValue = valuesRef.current[index];
      if (nextSelectedValue !== undefined) {
        setSelectedValue(nextSelectedValue, undefined, undefined);
      }
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
      typeaheadTriggerProps,
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
      popupProps: getFloatingProps(),
      inputProps: getReferenceProps(),
      triggerProps,
      typeaheadTriggerProps,
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
    getFloatingProps,
    getReferenceProps,
    openMethod,
    triggerProps,
    typeaheadTriggerProps,
  ]);

  const hiddenInputRef = useMergedRefs(inputRefProp, fieldControlValidation.inputRef);

  const contextValue: ComboboxRootContext = React.useMemo(
    () => ({
      selectionMode,
      listRef,
      popupRef,
      valuesRef,
      allValuesRef,
      inputRef,
      keyboardActiveRef,
      chipsContainerRef,
      clearRef,
      store,
      getItemProps,
      onOpenChangeComplete,
      setOpen,
      setInputValue,
      setSelectedValue,
      setIndices,
      onItemHighlighted,
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
      itemToLabel,
      modal,
      autoHighlight,
      forceMount,
    }),
    [
      selectionMode,
      store,
      getItemProps,
      onOpenChangeComplete,
      setOpen,
      setInputValue,
      setSelectedValue,
      setIndices,
      onItemHighlighted,
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
      itemToLabel,
      modal,
      autoHighlight,
      forceMount,
    ],
  );

  const itemsContextValue: ComboboxDerivedItemsContext = React.useMemo(
    () => ({
      query,
      filteredItems,
      flatFilteredItems,
    }),
    [query, filteredItems, flatFilteredItems],
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

    return selectedValue.map((value: Value) => {
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
            if (!open && anchorElement !== inputElement) {
              // inputRef is potentially inside a keepMounted but invisible popup.
              triggerElement?.focus();
            }

            // Move focus when the hidden input is focused.
            (inputRef.current || triggerElement)?.focus();
          },
          // Handle browser autofill.
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            const nextValue = event.target.value;

            function handleChange() {
              if (selectionMode === 'none') {
                setDirty(nextValue !== validityData.initialValue);
                setInputValue(nextValue, event.nativeEvent, 'input-change');

                if (validationMode === 'onChange') {
                  fieldControlValidation.commitValidation(nextValue);
                }
                return;
              }

              const exactValue = valuesRef.current.find(
                (v: any) =>
                  v === nextValue ||
                  (typeof selectedValue === 'string' &&
                    nextValue.toLowerCase() === v.toLowerCase()),
              );

              if (exactValue != null) {
                setDirty(exactValue !== validityData.initialValue);
                setSelectedValue?.(exactValue, event.nativeEvent, 'input-change');

                if (validationMode === 'onChange') {
                  fieldControlValidation.commitValidation(exactValue);
                }
              }
            }

            if (items) {
              handleChange();
            } else {
              forceMount();
              queueMicrotask(handleChange);
            }
          },
          id,
          name: multiple || selectionMode === 'none' ? undefined : name,
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
          {virtualized ? (
            children
          ) : (
            <CompositeList elementsRef={listRef} labelsRef={items ? undefined : labelsRef}>
              {children}
            </CompositeList>
          )}
        </ComboboxDerivedItemsContext.Provider>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

type SelectionMode = 'single' | 'multiple' | 'none';

type ComboboxValueType<Value, Mode extends SelectionMode> = Mode extends 'multiple'
  ? Value[]
  : Value;

interface ComboboxRootProps<Value> {
  children?: React.ReactNode;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string;
  /**
   * The id of the component.
   */
  id?: string;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean;
  /**
   * Whether the user should be unable to choose a different option from the popup.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the popup is initially open.
   *
   * To render a controlled popup, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the popup is currently open.
   */
  open?: boolean;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?: (
    open: boolean,
    event: Event | undefined,
    reason: ComboboxRootInternal.ChangeReason | undefined,
  ) => void;
  /**
   * Event handler called after any animations complete when the popup is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the popup opens when clicking the input.
   * @default true
   */
  openOnInputClick?: boolean;
  /**
   * Whether to automatically highlight the first item when the popup opens.
   * @default false
   */
  autoHighlight?: boolean;
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
    reason: ComboboxRootInternal.ChangeReason | undefined,
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
  actionsRef?: React.RefObject<ComboboxRootInternal.Actions>;
  /**
   * Callback fired when the user navigates the list and highlights an item.
   * Passes the item and the type of navigation or `undefined` when no item is highlighted.
   * - `keyboard`: The item was highlighted via keyboard navigation.
   * - `pointer`: The item was highlighted via pointer navigation.
   * - `none`: The item was highlighted via programmatic navigation.
   */
  onItemHighlighted?: (
    value: Value | undefined,
    data: {
      type: 'keyboard' | 'pointer' | 'none';
      index: number;
    },
  ) => void;
  /**
   * A ref to the hidden input element.
   */
  inputRef?: React.RefObject<HTMLInputElement>;
  /**
   * The number of columns the items are rendered in grid layout.
   * @default 1
   */
  cols?: number;
  /**
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   */
  items?: Value[] | Group<Value>[];
  /**
   * Filter function used to match items vs input query.
   * The `itemToLabel` function is provided to help convert items to strings for comparison.
   */
  filter?:
    | null
    | ((value: Value, query: string, itemToLabel?: (value: Value) => string) => boolean);
  /**
   * Function to convert an item's value to a string label for display.
   */
  itemToLabel?: (item: Value) => string;
  /**
   * Function to convert an item's value to its serialized value for form submission.
   */
  itemToValue?: (item: Value) => string;
  /**
   * Whether the combobox items are virtualized.
   * @default false
   */
  virtualized?: boolean;
  /**
   * Determines if the combobox enters a modal state when open.
   * - `true`: user interaction is limited to the combobox: document page scroll is locked and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default false
   */
  modal?: boolean;
  /**
   * The maximum number of items to display in the list.
   * @default -1
   */
  limit?: number;
  /**
   * Controls how the component behaves with respect to list filtering and inline autocompletion.
   * - `list` (default): items are dynamically filtered based on the input value. The input value does not change based on the active item.
   * - `both`: items are dynamically filtered based on the input value, which will temporarily change based on the active item (inline autocompletion).
   * - `inline`: items are static (not filtered), and the input value will temporarily change based on the active item (inline autocompletion).
   * - `none`: items are static (not filtered), and the input value will not change based on the active item.
   * @default 'list'
   */
  autoComplete?: 'list' | 'both' | 'inline' | 'none';
  /**
   * INTERNAL: Clears the input value after close animation completes.
   * Useful for wrappers like FilterableMenu so they don't need to reset externally.
   * @default false
   */
  clearInputOnCloseComplete?: boolean;
  /**
   * INTERNAL: When `selectionMode` is `none`, controls whether selecting an item fills the input.
   */
  fillInputOnItemPress?: boolean;
}

export type ComboboxRootConditionalProps<Value, Mode extends SelectionMode = 'none'> = Omit<
  ComboboxRootProps<Value>,
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
   * The selected value of the combobox. Use when controlled.
   */
  selectedValue?: ComboboxValueType<Value, Mode>;
  /**
   * The uncontrolled selected value of the combobox when it's initially rendered.
   *
   * To render a controlled combobox, use the `selectedValue` prop instead.
   */
  defaultSelectedValue?: ComboboxValueType<Value, Mode> | null;
  /**
   * Callback fired when the selected value of the combobox changes.
   */
  onSelectedValueChange?: (
    value: ComboboxValueType<Value, Mode>,
    event: Event | undefined,
    reason: ComboboxRootInternal.ChangeReason | undefined,
  ) => void;
};

export namespace ComboboxRootInternal {
  export type Props<Value, Mode extends SelectionMode = 'none'> = ComboboxRootConditionalProps<
    Value,
    Mode
  >;

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type ChangeReason = BaseOpenChangeReason | 'input-change' | 'input-clear' | 'clear-press';
}
