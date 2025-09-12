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
  createBaseUIEventDetails,
  type BaseUIEventDetails,
} from '../../utils/createBaseUIEventDetails';
import type { BaseUIChangeEventReason } from '../../utils/types';
import {
  ComboboxFloatingContext,
  ComboboxDerivedItemsContext,
  ComboboxRootContext,
  ComboboxInputValueContext,
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
  stringifyItemValue,
  createCollatorItemFilter,
  createSingleSelectionCollatorFilter,
} from './utils';
import { useCoreFilter } from './utils/useFilter';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { EMPTY_ARRAY } from '../../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { HTMLProps } from '../../utils/types';
import { useValueChanged } from './utils/useValueChanged';
import { NOOP } from '../../utils/noop';

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
    defaultInputValue: defaultInputValueProp,
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
    itemToStringLabel,
    itemToStringValue,
    virtualized = false,
    fillInputOnItemPress = true,
    modal = false,
    limit = -1,
    autoComplete = 'list',
    locale,
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
  const commitValidation = fieldControlValidation.commitValidation;

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
      if (inputValueProp !== undefined || defaultInputValueProp !== undefined) {
        return defaultInputValueProp ?? '';
      }
      if (selectionMode === 'single') {
        return stringifyItem(selectedValue, itemToStringLabel);
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
      return limit > -1 ? flatItems.slice(0, limit) : flatItems;
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
        selectionMode,
        listRef,
        popupRef,
        inputRef,
        keyboardActiveRef,
        chipsContainerRef,
        clearRef,
        valuesRef,
        allValuesRef,
        name,
        disabled,
        readOnly,
        required,
        fieldControlValidation,
        cols,
        isGrouped,
        virtualized,
        openOnInputClick,
        itemToStringLabel,
        modal,
        autoHighlight,
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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const forceMount = useEventCallback(() => {
    if (items) {
      // Ensure typeahead works on a closed list.
      labelsRef.current = flatFilteredItems.map((item) => stringifyItem(item, itemToStringLabel));
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
    if (!store.state.inputInsidePopup) {
      const stringVal = stringifyItem(fallback, itemToStringLabel);
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

  const setInputValue = useEventCallback(
    (next: string, eventDetails: ComboboxRootInternal.ChangeEventDetails) => {
      if (eventDetails.reason === 'input-clear' && open) {
        hadInputClearRef.current = true;
        // Defer clearing until close transition completes to avoid flicker
        return;
      }

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

        // Avoid out-of-range indices when the visible list becomes smaller.
        if (hasQuery) {
          if (autoHighlight) {
            setIndices({ activeIndex: 0, selectedIndex: null });
          } else {
            setIndices({ selectedIndex: null });
          }
        } else if (autoHighlight) {
          setIndices({ activeIndex: null });
        }
      }

      setInputValueUnwrapped(next);
    },
  );

  const setOpen = useEventCallback(
    (nextOpen: boolean, eventDetails: ComboboxRootInternal.ChangeEventDetails) => {
      if (open === nextOpen) {
        return;
      }

      props.onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      if (selectionMode === 'single' && !nextOpen && queryChangedAfterOpen) {
        setCloseQuery(query);
        // Avoid a flicker when closing the popup with an empty query.
        if (query === '') {
          setQueryChangedAfterOpen(false);
        }
      }

      setOpenUnwrapped(nextOpen);
    },
  );

  const setSelectedValue = useEventCallback(
    (nextValue: Value | Value[], eventDetails: ComboboxRootInternal.ChangeEventDetails) => {
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
          stringifyItem(nextValue, itemToStringLabel),
          createBaseUIEventDetails(eventDetails.reason, eventDetails.event),
        );
      }

      const hadInputValue = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (multiple && hadInputValue) {
        setInputValue('', createBaseUIEventDetails(eventDetails.reason, eventDetails.event));
        // Reset active index and clear any highlighted item since the list will re-filter.
        setIndices({ activeIndex: null });
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
      const lastIndex = registry.indexOf(lastValue);
      setIndices({ selectedIndex: lastIndex === -1 ? null : lastIndex });
    } else {
      const index = registry.indexOf(selectedValue);
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
      const eventDetails = createBaseUIEventDetails('item-press', event);

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
        const isCurrentlySelected = currentSelectedValue.includes(value);
        const nextValue = isCurrentlySelected
          ? currentSelectedValue.filter((v) => v !== value)
          : [...currentSelectedValue, value];

        setSelectedValue(nextValue, eventDetails);

        const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
        if (wasFiltering) {
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

    // If an input-clear was requested while open, perform it here after close completes
    // to avoid mid-exit flicker.
    if (hadInputClearRef.current && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', createBaseUIEventDetails('input-clear'));
      hadInputClearRef.current = false;
    }

    // If explicitly requested by a wrapper (e.g., FilterableMenu), clear the input
    // after close completes regardless of selection mode. This ensures the next open
    // starts from a blank query without requiring external state resets.
    if (props.clearInputOnCloseComplete && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', createBaseUIEventDetails('input-clear'));
    }

    // Multiple selection mode:
    // If the user typed a filter and didn't select in multiple mode, clear the input
    // after close completes to avoid mid-exit flicker and start fresh on next open.
    if (selectionMode === 'multiple' && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', createBaseUIEventDetails('input-clear'));
    }

    // Single selection mode:
    // - If input is rendered inside the popup, clear it so the next open is blank
    // - If input is outside the popup, sync it to the selected value
    if (selectionMode === 'single') {
      if (store.state.inputInsidePopup) {
        if (inputRef.current && inputRef.current.value !== '') {
          setInputValue('', createBaseUIEventDetails('input-clear'));
        }
      } else {
        const stringVal = stringifyItem(selectedValue, itemToStringLabel);
        if (inputRef.current && inputRef.current.value !== stringVal) {
          // If no selection was made, treat this as clearing the typed filter.
          const reason = stringVal === '' ? 'input-clear' : 'item-press';
          setInputValue(stringVal, createBaseUIEventDetails(reason));
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
    focusItemOnOpen: queryChangedAfterOpen || selectionMode === 'none' ? false : 'auto',
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
        setSelectedValue(nextSelectedValue, createBaseUIEventDetails('none'));
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
      getItemProps,
      selectionMode,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      cols,
      isGrouped,
      virtualized,
      onOpenChangeComplete,
      openOnInputClick,
      itemToStringLabel,
      modal,
      autoHighlight,
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
    cols,
    isGrouped,
    virtualized,
    onOpenChangeComplete,
    openOnInputClick,
    itemToStringLabel,
    modal,
    autoHighlight,
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
    return stringifyItemValue(formValue, itemToStringValue);
  }, [formValue, itemToStringValue]);

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(selectedValue) || !name) {
      return null;
    }

    return selectedValue.map((value: Value) => {
      const currentSerializedValue = stringifyItemValue(value, itemToStringValue);
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
            const details = createBaseUIEventDetails('input-change', event.nativeEvent);

            function handleChange() {
              if (selectionMode === 'none') {
                setDirty(nextValue !== validityData.initialValue);
                setInputValue(nextValue, details);

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
                setSelectedValue?.(exactValue, details);

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
    <ComboboxRootContext.Provider value={store}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <ComboboxDerivedItemsContext.Provider value={itemsContextValue}>
          <ComboboxInputValueContext.Provider value={inputValue}>
            {virtualized ? (
              children
            ) : (
              <CompositeList elementsRef={listRef} labelsRef={items ? undefined : labelsRef}>
                {children}
              </CompositeList>
            )}
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
   * Whether the popup is currently open.
   */
  open?: boolean;
  /**
   * Event handler called when the popup is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: ComboboxRootInternal.ChangeEventDetails) => void;
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
   * The input value of the combobox.
   */
  inputValue?: React.ComponentProps<'input'>['value'];
  /**
   * Callback fired when the input value of the combobox changes.
   */
  onInputValueChange?: (
    value: string,
    eventDetails: ComboboxRootInternal.ChangeEventDetails,
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
    itemValue: ItemValue | undefined,
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
   * The maximum number of columns present when the items are rendered in grid layout.
   * A value of more than `1` turns the listbox into a grid.
   * @default 1
   */
  cols?: number;
  /**
   * The items to be displayed in the list.
   * Can be either a flat array of items or an array of groups with items.
   */
  items?: ItemValue[] | Group<ItemValue>[];
  /**
   * Filter function used to match items vs input query.
   * The `itemToStringLabel` function is provided to help convert items to strings for comparison.
   */
  filter?:
    | null
    | ((
        itemValue: ItemValue,
        query: string,
        itemToStringLabel?: (itemValue: ItemValue) => string,
      ) => boolean);
  /**
   * When items' values are objects, converts its value to a string label for display.
   */
  itemToStringLabel?: (itemValue: ItemValue) => string;
  /**
   * When items' values are objects, converts its value to a string value for form submission.
   */
  itemToStringValue?: (itemValue: ItemValue) => string;
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
    eventDetails: ComboboxRootInternal.ChangeEventDetails,
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

  export type ChangeEventReason =
    | BaseUIChangeEventReason
    | 'input-change'
    | 'input-clear'
    | 'clear-press'
    | 'chip-remove-press';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
