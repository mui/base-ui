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
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
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
  createChangeEventDetails,
  createGenericEventDetails,
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
import {
  ComboboxFloatingContext,
  ComboboxDerivedItemsContext,
  ComboboxRootContext,
  ComboboxInputValueContext,
} from './ComboboxRootContext';
import { selectors, type State as StoreState } from '../store';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { createCollatorItemFilter, createSingleSelectionCollatorFilter } from './utils';
import { useCoreFilter } from './utils/useFilter';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { EMPTY_ARRAY } from '../../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { HTMLProps } from '../../utils/types';
import { useValueChanged } from './utils/useValueChanged';
import { NOOP } from '../../utils/noop';
import {
  stringifyAsLabel,
  stringifyAsValue,
  Group,
  isGroupedItems,
} from '../../utils/resolveValueLabel';
import {
  defaultItemEquality,
  findItemIndex,
  itemIncludes,
  removeItem,
} from '../../utils/itemEquality';
import { INITIAL_LAST_HIGHLIGHT, NO_ACTIVE_VALUE } from './utils/constants';

/**
 * @internal
 */
export function AriaCombobox<Value, Mode extends SelectionMode = 'none'>(
  props: Omit<ComboboxRootConditionalProps<Value, Mode>, 'items'> & {
    items: readonly Group<any>[];
  },
): React.JSX.Element;
export function AriaCombobox<Value, Mode extends SelectionMode = 'none'>(
  props: Omit<ComboboxRootConditionalProps<Value, Mode>, 'items'> & {
    items?: readonly any[];
  },
): React.JSX.Element;
export function AriaCombobox<Value = any, Mode extends SelectionMode = 'none'>(
  props: ComboboxRootConditionalProps<Value, Mode>,
): React.JSX.Element {
  const {
    id: idProp,
    onOpenChangeComplete: onOpenChangeCompleteProp,
    defaultSelectedValue = null,
    selectedValue: selectedValueProp,
    onSelectedValueChange,
    defaultInputValue: defaultInputValueProp,
    inputValue: inputValueProp,
    selectionMode = 'none',
    onItemHighlighted: onItemHighlightedProp,
    name: nameProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    inputRef: inputRefProp,
    grid = false,
    items,
    filter: filterProp,
    openOnInputClick = true,
    autoHighlight = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
    virtualized = false,
    fillInputOnItemPress = true,
    modal = false,
    limit = -1,
    autoComplete = 'list',
    locale,
    alwaysSubmitOnEnter = false,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    validityData,
    validationMode,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();
  const id = useLabelableId({ id: idProp });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const multiple = selectionMode === 'multiple';
  const hasInputValue = inputValueProp !== undefined || defaultInputValueProp !== undefined;
  const commitValidation = fieldControlValidation.commitValidation;

  const [selectedValue, setSelectedValueUnwrapped] = useControlled<any>({
    controlled: selectedValueProp,
    default: multiple ? (defaultSelectedValue ?? EMPTY_ARRAY) : defaultSelectedValue,
    name: 'Combobox',
    state: 'selectedValue',
  });

  const [queryChangedAfterOpen, setQueryChangedAfterOpen] = React.useState(false);

  const collatorFilter = useCoreFilter({ locale });

  const filter = React.useMemo(() => {
    if (filterProp === null) {
      return () => true;
    }
    if (filterProp !== undefined) {
      return filterProp;
    }
    if (selectionMode === 'single' && !queryChangedAfterOpen) {
      return createSingleSelectionCollatorFilter(collatorFilter, itemToStringLabel, selectedValue);
    }
    return createCollatorItemFilter(collatorFilter, itemToStringLabel);
  }, [
    filterProp,
    selectionMode,
    selectedValue,
    queryChangedAfterOpen,
    collatorFilter,
    itemToStringLabel,
  ]);

  // If neither inputValue nor defaultInputValue are provided, derive it from the
  // selected value for single mode so the input reflects the selection on mount.
  const initialDefaultInputValue = useRefWithInit<React.ComponentProps<'input'>['defaultValue']>(
    () => {
      if (hasInputValue) {
        return defaultInputValueProp ?? '';
      }
      if (selectionMode === 'single') {
        return stringifyAsLabel(selectedValue, itemToStringLabel);
      }
      return '';
    },
  ).current;

  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: inputValueProp,
    default: initialDefaultInputValue,
    name: 'Combobox',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const [closeQuery, setCloseQuery] = React.useState<string | null>(null);

  const query = closeQuery ?? (inputValue === '' ? '' : String(inputValue).trim());
  const isGrouped = isGroupedItems(items);

  const flatItems: readonly any[] = React.useMemo(() => {
    if (!items) {
      return EMPTY_ARRAY;
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
      const groupedItems = items;
      const resultingGroups: Group<Value>[] = [];
      let currentCount = 0;

      for (const group of groupedItems) {
        if (limit > -1 && currentCount >= limit) {
          break;
        }

        const candidateItems =
          query === ''
            ? group.items
            : group.items.filter((item) => filter(item, query, itemToStringLabel));

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
      return limit > -1
        ? flatItems.slice(0, limit)
        : // The cast here is done as `flatItems` is readonly.
          // valuesRef.current, a mutable ref, can be set to `flatFilteredItems`, which may
          // reference this exact readonly value, creating a mutation risk.
          // However, <Combobox.Item> can never mutate this value as the mutating effect
          // bails early when `items` is provided, and this is only ever returned
          // when `items` is provided due to the early return at the top of this hook.
          (flatItems as Value[]);
    }

    const limitedItems: Value[] = [];
    for (const item of flatItems) {
      if (limit > -1 && limitedItems.length >= limit) {
        break;
      }
      if (filter(item, query, itemToStringLabel)) {
        limitedItems.push(item);
      }
    }

    return limitedItems;
  }, [items, flatItems, query, filter, isGrouped, itemToStringLabel, limit]);

  const flatFilteredItems: Value[] = React.useMemo(() => {
    if (isGrouped) {
      const groups = filteredItems as Group<Value>[];
      return groups.flatMap((g) => g.items);
    }
    return filteredItems as Value[];
  }, [filteredItems, isGrouped]);

  const hasItems = items !== undefined;

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const hadInputClearRef = React.useRef(false);
  const chipsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const clearRef = React.useRef<HTMLButtonElement | null>(null);
  const selectionEventRef = React.useRef<MouseEvent | PointerEvent | KeyboardEvent | null>(null);
  const lastHighlightRef = React.useRef(INITIAL_LAST_HIGHLIGHT);
  const pendingQueryHighlightRef = React.useRef<null | { hasQuery: boolean }>(null);

  /**
   * Contains the currently visible list of item values post-filtering.
   */
  const valuesRef = React.useRef<any[]>([]);
  /**
   * Contains all item values in a stable, unfiltered order.
   * This is only used when `items` prop is not provided.
   * It accumulates values on first mount and does not remove them on unmount due to
   * filtering, providing a stable index for selected value tracking.
   */
  const allValuesRef = React.useRef<any[]>([]);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id,
        selectedValue,
        open,
        filter,
        query,
        items,
        selectionMode,
        listRef,
        labelsRef,
        popupRef,
        inputRef,
        keyboardActiveRef,
        chipsContainerRef,
        clearRef,
        valuesRef,
        allValuesRef,
        selectionEventRef,
        name,
        disabled,
        readOnly,
        required,
        fieldControlValidation,
        grid,
        isGrouped,
        virtualized,
        openOnInputClick,
        itemToStringLabel,
        isItemEqualToValue,
        modal,
        autoHighlight,
        alwaysSubmitOnEnter,
        hasInputValue,
        mounted: false,
        forceMounted: false,
        transitionStatus: 'idle',
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        inputProps: {},
        triggerProps: {},
        typeaheadTriggerProps: {},
        positionerElement: null,
        listElement: null,
        triggerElement: null,
        inputElement: null,
        openMethod: null,
        inputInsidePopup: true,
        onOpenChangeComplete: onOpenChangeCompleteProp || NOOP,
        // Placeholder callbacks replaced on first render
        setOpen: NOOP,
        setInputValue: NOOP,
        setSelectedValue: NOOP,
        setIndices: NOOP,
        onItemHighlighted: NOOP,
        handleSelection: NOOP,
        getItemProps() {
          return {};
        },
        forceMount: NOOP,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);
  const onOpenChangeComplete = useEventCallback(onOpenChangeCompleteProp);

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);
  const positionerElement = useStore(store, selectors.positionerElement);
  const listElement = useStore(store, selectors.listElement);
  const triggerElement = useStore(store, selectors.triggerElement);
  const inputElement = useStore(store, selectors.inputElement);
  const inline = useStore(store, selectors.inline);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);

  const queryRef = React.useRef(query);
  const selectedValueRef = React.useRef(selectedValue);
  const inputValueRef = React.useRef(inputValue);
  const triggerRef = useLatestRef(triggerElement);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const forceMount = useEventCallback(() => {
    if (items) {
      // Ensure typeahead works on a closed list.
      labelsRef.current = flatFilteredItems.map((item) =>
        stringifyAsLabel(item, itemToStringLabel),
      );
    } else {
      store.set('forceMounted', true);
    }
  });

  const initialSelectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (selectedValue !== initialSelectedValueRef.current) {
      forceMount();
    }
  }, [forceMount, selectedValue, initialSelectedValueRef]);

  function updateValue(nextValue: any) {
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  }

  const formValue = selectionMode === 'none' ? inputValue : selectedValue;

  useField({
    id,
    commitValidation,
    value: formValue,
    controlRef: inputInsidePopup ? triggerRef : inputRef,
    name,
    getValue: () => formValue,
  });

  useIsoLayoutEffect(() => {
    if (items) {
      valuesRef.current = flatFilteredItems;
      listRef.current.length = flatFilteredItems.length;
    }
  }, [items, flatFilteredItems]);

  useIsoLayoutEffect(() => {
    const pendingHighlight = pendingQueryHighlightRef.current;
    if (pendingHighlight) {
      if (pendingHighlight.hasQuery) {
        if (autoHighlight) {
          store.set('activeIndex', 0);
        }
      } else if (autoHighlight) {
        store.set('activeIndex', null);
      }
      pendingQueryHighlightRef.current = null;
    }

    if (!open && !inline) {
      return;
    }

    const candidateItems = items ? flatFilteredItems : valuesRef.current;
    const storeActiveIndex = store.state.activeIndex;

    if (storeActiveIndex == null) {
      if (lastHighlightRef.current !== INITIAL_LAST_HIGHLIGHT) {
        lastHighlightRef.current = INITIAL_LAST_HIGHLIGHT;
        store.state.onItemHighlighted(
          undefined,
          createGenericEventDetails('none', undefined, { index: -1 }),
        );
      }
      return;
    }

    if (storeActiveIndex >= candidateItems.length) {
      if (lastHighlightRef.current !== INITIAL_LAST_HIGHLIGHT) {
        lastHighlightRef.current = INITIAL_LAST_HIGHLIGHT;
        store.state.onItemHighlighted(
          undefined,
          createGenericEventDetails('none', undefined, { index: -1 }),
        );
      }
      store.set('activeIndex', null);
      return;
    }

    const nextActiveValue = candidateItems[storeActiveIndex];
    const lastHighlightedValue = lastHighlightRef.current.value;
    const isSameItem =
      lastHighlightedValue !== NO_ACTIVE_VALUE &&
      store.state.isItemEqualToValue(nextActiveValue, lastHighlightedValue);

    if (lastHighlightRef.current.index !== storeActiveIndex || !isSameItem) {
      lastHighlightRef.current = { value: nextActiveValue, index: storeActiveIndex };
      store.state.onItemHighlighted(
        nextActiveValue,
        createGenericEventDetails('none', undefined, { index: storeActiveIndex }),
      );
    }
  }, [activeIndex, autoHighlight, flatFilteredItems, inline, items, open, store, valuesRef]);

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
      const next = current.filter((v) => itemIncludes(registry, v, store.state.isItemEqualToValue));
      if (next.length !== current.length) {
        setSelectedValueUnwrapped(next);
      }
      return;
    }

    const isStillPresent =
      selectedValue == null
        ? true
        : itemIncludes(registry, selectedValue, store.state.isItemEqualToValue);
    if (isStillPresent) {
      return;
    }

    let fallback = null;
    if (
      defaultSelectedValue != null &&
      itemIncludes(registry, defaultSelectedValue, store.state.isItemEqualToValue)
    ) {
      fallback = defaultSelectedValue;
    }
    setSelectedValueUnwrapped(fallback);

    // Keep the input text in sync when the input is rendered outside the popup.
    if (!store.state.inputInsidePopup) {
      const stringVal = stringifyAsLabel(fallback, itemToStringLabel);
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
    itemToStringLabel,
    store,
  ]);

  useValueChanged(queryRef, query, () => {
    if (!open || query === '' || query === String(initialDefaultInputValue)) {
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

  const setIndices = useEventCallback(
    (options: {
      activeIndex?: number | null;
      selectedIndex?: number | null;
      type?: 'none' | 'keyboard' | 'pointer';
    }) => {
      store.apply(options);
      const type: AriaCombobox.HighlightEventReason = options.type || 'none';

      if (options.activeIndex === undefined) {
        return;
      }

      if (options.activeIndex === null) {
        if (lastHighlightRef.current !== INITIAL_LAST_HIGHLIGHT) {
          lastHighlightRef.current = INITIAL_LAST_HIGHLIGHT;
          onItemHighlighted(undefined, createGenericEventDetails(type, undefined, { index: -1 }));
        }
      } else {
        const activeValue = valuesRef.current[options.activeIndex];
        lastHighlightRef.current = { value: activeValue, index: options.activeIndex };
        onItemHighlighted(
          activeValue,
          createGenericEventDetails(type, undefined, {
            index: options.activeIndex,
          }),
        );
      }
    },
  );

  const setInputValue = useEventCallback(
    (next: string, eventDetails: AriaCombobox.ChangeEventDetails) => {
      hadInputClearRef.current = eventDetails.reason === 'input-clear';

      props.onInputValueChange?.(next, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      // If user is typing, ensure we don't auto-highlight on open due to a race
      // with the post-open effect that sets this flag.
      if (eventDetails.reason === 'input-change') {
        const hasQuery = next.trim() !== '';
        if (hasQuery) {
          setQueryChangedAfterOpen(true);
        }
        // Defer index updates until after the filtered items have been derived to ensure
        // `onItemHighlighted` receives the latest item.
        pendingQueryHighlightRef.current = { hasQuery };
        if (hasQuery && autoHighlight && store.state.activeIndex == null) {
          store.set('activeIndex', 0);
        }
      }

      setInputValueUnwrapped(next);
    },
  );

  const setOpen = useEventCallback(
    (nextOpen: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => {
      if (open === nextOpen) {
        return;
      }

      props.onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      if (!nextOpen && queryChangedAfterOpen) {
        if (selectionMode === 'single') {
          setCloseQuery(query);
          // Avoid a flicker when closing the popup with an empty query.
          if (query === '') {
            setQueryChangedAfterOpen(false);
          }
        } else if (selectionMode === 'multiple') {
          if (inline || inputInsidePopup) {
            setIndices({ activeIndex: null });
          } else {
            // Freeze the current query so filtering remains stable while exiting.
            setCloseQuery(query);
          }
          // Clear the input immediately on close while retaining filtering via closeQuery for exit animations
          // if the input is outside the popup.
          setInputValue('', createChangeEventDetails('input-clear', eventDetails.event));
        }
      }

      setOpenUnwrapped(nextOpen);
    },
  );

  const setSelectedValue = useEventCallback(
    (nextValue: Value | Value[], eventDetails: AriaCombobox.ChangeEventDetails) => {
      // Cast to `any` due to conditional value type (single vs. multiple).
      // The runtime implementation already ensures the correct value shape.
      onSelectedValueChange?.(nextValue as any, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setSelectedValueUnwrapped(nextValue);

      const shouldFillInput =
        (selectionMode === 'none' && popupRef.current && fillInputOnItemPress) ||
        (selectionMode === 'single' && !store.state.inputInsidePopup);

      if (shouldFillInput) {
        setInputValue(
          stringifyAsLabel(nextValue, itemToStringLabel),
          createChangeEventDetails(eventDetails.reason, eventDetails.event),
        );
      }

      if (
        selectionMode === 'single' &&
        nextValue != null &&
        eventDetails.reason !== 'input-change' &&
        queryChangedAfterOpen
      ) {
        setCloseQuery(query);
      }
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
      const lastIndex = findItemIndex(registry, lastValue, isItemEqualToValue);
      setIndices({ selectedIndex: lastIndex === -1 ? null : lastIndex });
    } else {
      const index = findItemIndex(registry, selectedValue, isItemEqualToValue);
      setIndices({ selectedIndex: index === -1 ? null : index });
    }
  });

  useIsoLayoutEffect(() => {
    if (!open) {
      syncSelectedIndex();
    }
  }, [open, selectedValue, syncSelectedIndex]);

  const handleSelection = useEventCallback(
    (event: MouseEvent | PointerEvent | KeyboardEvent, passedValue?: any) => {
      let value = passedValue;
      if (value === undefined) {
        if (activeIndex === null) {
          return;
        }
        value = valuesRef.current[activeIndex];
      }

      const targetEl = getTarget(event) as HTMLElement | null;
      const overrideEvent = selectionEventRef.current ?? event;
      selectionEventRef.current = null;
      const eventDetails = createChangeEventDetails('item-press', overrideEvent);

      // Let the link handle the click.
      const href = targetEl?.closest('a')?.getAttribute('href');
      if (href) {
        if (href.startsWith('#')) {
          setOpen(false, eventDetails);
        }
        return;
      }

      if (multiple) {
        const currentSelectedValue = Array.isArray(selectedValue) ? selectedValue : [];
        const isCurrentlySelected = itemIncludes(
          currentSelectedValue,
          value,
          store.state.isItemEqualToValue,
        );
        const nextValue = isCurrentlySelected
          ? removeItem(currentSelectedValue, value, store.state.isItemEqualToValue)
          : [...currentSelectedValue, value];

        setSelectedValue(nextValue, eventDetails);

        const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
        if (!wasFiltering) {
          return;
        }

        if (store.state.inputInsidePopup) {
          setInputValue('', createChangeEventDetails('input-clear', eventDetails.event));
        } else {
          setOpen(false, eventDetails);
        }
      } else {
        setSelectedValue(value, eventDetails);
        setOpen(false, eventDetails);
      }
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);
    resetOpenInteractionType();
    setCloseQuery(null);

    if (selectionMode === 'none') {
      setIndices({ activeIndex: null, selectedIndex: null });
    } else {
      setIndices({ activeIndex: null });
    }

    // Multiple selection mode:
    // If the user typed a filter and didn't select in multiple mode, clear the input
    // after close completes to avoid mid-exit flicker and start fresh on next open.
    if (
      selectionMode === 'multiple' &&
      inputRef.current &&
      inputRef.current.value !== '' &&
      !hadInputClearRef.current
    ) {
      setInputValue('', createChangeEventDetails('input-clear'));
    }

    // Single selection mode:
    // - If input is rendered inside the popup, clear it so the next open is blank
    // - If input is outside the popup, sync it to the selected value
    if (selectionMode === 'single') {
      if (store.state.inputInsidePopup) {
        if (inputRef.current && inputRef.current.value !== '') {
          setInputValue('', createChangeEventDetails('input-clear'));
        }
      } else {
        const stringVal = stringifyAsLabel(selectedValue, itemToStringLabel);
        if (inputRef.current && inputRef.current.value !== stringVal) {
          // If no selection was made, treat this as clearing the typed filter.
          const reason = stringVal === '' ? 'input-clear' : 'none';
          setInputValue(stringVal, createChangeEventDetails(reason));
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

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  // Ensures that the active index is not set to 0 when the list is empty.
  // This avoids needing to press ArrowDown twice under certain conditions.
  React.useEffect(() => {
    if (hasItems && autoHighlight && flatFilteredItems.length === 0) {
      setIndices({ activeIndex: null });
    }
  }, [hasItems, autoHighlight, flatFilteredItems.length, setIndices]);

  const floatingRootContext = useFloatingRootContext({
    open: inline ? true : open,
    onOpenChange: setOpen,
    elements: {
      reference: inputInsidePopup ? triggerElement : inputElement,
      floating: positionerElement,
    },
  });

  let ariaHasPopup: 'grid' | 'listbox' | undefined;
  let ariaExpanded: 'true' | 'false' | undefined;
  if (!inline) {
    ariaHasPopup = grid ? 'grid' : 'listbox';
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
          autoCapitalize: 'none',
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
    // Apply a small delay for touch to let iOS viewport centering settle.
    // This avoids top-bottom flip flickers if the preferred position is "top" when first tapping.
    touchOpenDelay: inputInsidePopup ? 0 : 50,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    outsidePressEvent: {
      mouse: 'sloppy',
      // The visual viewport (affected by the mobile software keyboard) can be
      // somewhat small. The user may want to scroll the screen to see more of
      // the popup.
      touch: 'intentional',
    },
    // Without a popup, let the Escape key bubble the event up to other popups' handlers.
    bubbles: inline ? true : undefined,
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
    id,
    listRef,
    activeIndex,
    selectedIndex,
    virtual: true,
    loop: true,
    allowEscape: !autoHighlight,
    focusItemOnOpen:
      queryChangedAfterOpen || (selectionMode === 'none' && !autoHighlight) ? false : 'auto',
    // `cols` > 1 enables grid navigation.
    // Since <Combobox.Row> infers column sizes (and is required when building a grid),
    // it works correctly even with a value of `2`.
    // Floating UI tests don't require `role="row"` wrappers, so retains the number API.
    cols: grid ? 2 : 1,
    orientation: grid ? 'horizontal' : undefined,
    disabledIndices: virtualized
      ? (index) => index < 0 || index >= flatFilteredItems.length
      : (EMPTY_ARRAY as number[]),
    onNavigate(nextActiveIndex, event) {
      const isClosing = !open || transitionStatus === 'ending';

      // Retain the highlight only while actually transitioning out or closed.
      if (nextActiveIndex === null && !inline && isClosing) {
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
        setSelectedValue(nextSelectedValue, createChangeEventDetails('none'));
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
    store.apply({
      popupProps: getFloatingProps(),
      inputProps: getReferenceProps(),
      triggerProps,
      typeaheadTriggerProps,
      getItemProps,
      setOpen,
      setInputValue,
      setSelectedValue,
      setIndices,
      onItemHighlighted,
      handleSelection,
      forceMount,
    });
  });

  useIsoLayoutEffect(() => {
    store.apply({
      id,
      selectedValue,
      open,
      mounted,
      transitionStatus,
      items,
      popupProps: getFloatingProps(),
      inputProps: getReferenceProps(),
      triggerProps,
      typeaheadTriggerProps,
      openMethod,
      getItemProps,
      selectionMode,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      grid,
      isGrouped,
      virtualized,
      onOpenChangeComplete,
      openOnInputClick,
      itemToStringLabel,
      modal,
      autoHighlight,
      isItemEqualToValue,
      alwaysSubmitOnEnter,
      hasInputValue,
    });
  }, [
    store,
    id,
    selectedValue,
    open,
    mounted,
    transitionStatus,
    items,
    getFloatingProps,
    getReferenceProps,
    getItemProps,
    openMethod,
    triggerProps,
    typeaheadTriggerProps,
    selectionMode,
    name,
    disabled,
    readOnly,
    required,
    fieldControlValidation,
    grid,
    isGrouped,
    virtualized,
    onOpenChangeComplete,
    openOnInputClick,
    itemToStringLabel,
    modal,
    autoHighlight,
    isItemEqualToValue,
    alwaysSubmitOnEnter,
    hasInputValue,
  ]);

  const hiddenInputRef = useMergedRefs(inputRefProp, fieldControlValidation.inputRef);

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
    return stringifyAsValue(formValue, itemToStringValue);
  }, [formValue, itemToStringValue]);

  const hasMultipleSelection = multiple && Array.isArray(selectedValue) && selectedValue.length > 0;

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(selectedValue) || !name) {
      return null;
    }

    return selectedValue.map((value: Value) => {
      const currentSerializedValue = stringifyAsValue(value, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={name}
          value={currentSerializedValue}
        />
      );
    });
  }, [multiple, selectedValue, name, itemToStringValue]);

  const children = (
    <React.Fragment>
      {props.children}
      <input
        {...fieldControlValidation.getInputValidationProps({
          // Move focus when the hidden input is focused.
          onFocus() {
            if (inputInsidePopup) {
              triggerElement?.focus();
            }

            (inputRef.current || triggerElement)?.focus();
          },
          // Handle browser autofill.
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented) {
              return;
            }

            const nextValue = event.target.value;
            const details = createChangeEventDetails('input-change', event.nativeEvent);

            function handleChange() {
              // Browser autofill only writes a single scalar value.
              if (multiple) {
                return;
              }

              if (selectionMode === 'none') {
                setDirty(nextValue !== validityData.initialValue);
                setInputValue(nextValue, details);

                if (validationMode === 'onChange') {
                  fieldControlValidation.commitValidation(nextValue);
                }
                return;
              }

              const matchingValue = valuesRef.current.find((v) => {
                const candidate = stringifyAsValue(v, itemToStringValue);
                if (candidate.toLowerCase() === nextValue.toLowerCase()) {
                  return true;
                }
                return false;
              });

              if (matchingValue != null) {
                setDirty(matchingValue !== validityData.initialValue);
                setSelectedValue?.(matchingValue, details);

                if (validationMode === 'onChange') {
                  fieldControlValidation.commitValidation(matchingValue);
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
          required: required && !hasMultipleSelection,
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
    <ComboboxRootContext.Provider value={store}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <ComboboxDerivedItemsContext.Provider value={itemsContextValue}>
          <ComboboxInputValueContext.Provider value={inputValue}>
            {children}
          </ComboboxInputValueContext.Provider>
        </ComboboxDerivedItemsContext.Provider>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

type SelectionMode = 'single' | 'multiple' | 'none';

type ComboboxItemValueType<ItemValue, Mode extends SelectionMode> = Mode extends 'multiple'
  ? ItemValue[]
  : ItemValue;

interface ComboboxRootProps<ItemValue> {
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
   * Whether the popup is currently open. Use when controlled.
   */
  open?: boolean;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: AriaCombobox.ChangeEventDetails) => void;
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
   * Whether to automatically highlight the first item while filtering.
   * @default false
   */
  autoHighlight?: boolean;
  /**
   * The input value of the combobox. Use when controlled.
   */
  inputValue?: React.ComponentProps<'input'>['value'];
  /**
   * Callback fired when the input value of the combobox changes.
   */
  onInputValueChange?: (value: string, eventDetails: AriaCombobox.ChangeEventDetails) => void;
  /**
   * The uncontrolled input value when initially rendered.
   *
   * To render a controlled input, use the `inputValue` prop instead.
   */
  defaultInputValue?: React.ComponentProps<'input'>['defaultValue'];
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the combobox will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the combobox manually.
   * Useful when the combobox's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<AriaCombobox.Actions>;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation.
   * - `'pointer'`: the highlight changed due to pointer hovering.
   * - `'none'`: the highlight changed programmatically.
   */
  onItemHighlighted?: (
    itemValue: ItemValue | undefined,
    eventDetails: AriaCombobox.HighlightEventDetails,
  ) => void;
  /**
   * A ref to the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Whether list items are presented in a grid layout.
   * When enabled, arrow keys navigate across rows and columns inferred from DOM rows.
   * @default false
   */
  grid?: boolean;
  /**
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   */
  items?: readonly any[] | readonly Group<any>[];
  /**
   * Filter function used to match items vs input query.
   */
  filter?:
    | null
    | ((
        itemValue: ItemValue,
        query: string,
        itemToString?: (itemValue: ItemValue) => string,
      ) => boolean);
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for display in the input.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: ItemValue) => string;
  /**
   * When the item values are objects (`<Combobox.Item value={object}>`), this function converts the object value to a string representation for form submission.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: ItemValue) => string;
  /**
   * Custom comparison logic used to determine if a combobox item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: (itemValue: ItemValue, selectedValue: ItemValue) => boolean;
  /**
   * Whether the items are being externally virtualized.
   * @default false
   */
  virtualized?: boolean;
  /**
   * Determines if the popup enters a modal state when open.
   * - `true`: user interaction is limited to the popup: document page scroll is locked and pointer interactions on outside elements are disabled.
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
   * The locale to use for string comparison.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument;
  /**
   * Whether pressing Enter in the input should always allow forms to submit.
   * By default, pressing Enter in the input will stop form submission if an item is highlighted.
   * @default false
   */
  alwaysSubmitOnEnter?: boolean;
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
  selectedValue?: ComboboxItemValueType<Value, Mode>;
  /**
   * The uncontrolled selected value of the combobox when it's initially rendered.
   *
   * To render a controlled combobox, use the `selectedValue` prop instead.
   */
  defaultSelectedValue?: ComboboxItemValueType<Value, Mode> | null;
  /**
   * Callback fired when the selected value of the combobox changes.
   */
  onSelectedValueChange?: (
    value: ComboboxItemValueType<Value, Mode>,
    eventDetails: AriaCombobox.ChangeEventDetails,
  ) => void;
};

export namespace AriaCombobox {
  export type Props<Value, Mode extends SelectionMode = 'none'> = ComboboxRootConditionalProps<
    Value,
    Mode
  >;

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type HighlightEventReason = 'keyboard' | 'pointer' | 'none';
  export type HighlightEventDetails = BaseUIGenericEventDetails<
    HighlightEventReason,
    Event,
    { index: number }
  >;

  export type ChangeEventReason =
    | 'trigger-press'
    | 'outside-press'
    | 'item-press'
    | 'escape-key'
    | 'list-navigation'
    | 'focus-out'
    | 'input-change'
    | 'input-clear'
    | 'clear-press'
    | 'chip-remove-press'
    | 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason>;
}
