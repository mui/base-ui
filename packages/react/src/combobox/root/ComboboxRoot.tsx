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
  type ComboboxGroup,
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

export function ComboboxRoot<Item = any, Mode extends SelectionMode = 'none'>(
  props: ComboboxRootConditionalProps<Item, Mode>,
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
    itemToString,
    itemToValue,
    virtualized = false,
    fillInputOnItemPress = true,
    modal = false,
    limit = -1,
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

  const collatorFilter = useFilter(DEFAULT_FILTER_OPTIONS);

  const filter = React.useMemo(() => {
    if (filterProp === null) {
      return () => true;
    }
    if (filterProp !== undefined) {
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

  const query = inputValue === '' ? '' : String(inputValue).trim().toLocaleLowerCase();
  const isGrouped = isGroupedItems(items);

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
      const resultingGroups: ComboboxGroup<ExtractItemType<Item>>[] = [];
      let currentCount = 0;

      for (const group of groupedItems) {
        if (limit > -1 && currentCount >= limit) {
          break;
        }

        const candidateItems =
          query === ''
            ? group.items
            : group.items.filter((item) => filter(item, query, itemToString));

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

    const limitedItems: ExtractItemType<Item>[] = [];
    for (const item of flatItems) {
      if (limit > -1 && limitedItems.length >= limit) {
        break;
      }
      if (filter(item, query, itemToString)) {
        limitedItems.push(item);
      }
    }

    return limitedItems;
  }, [items, flatItems, query, filter, isGrouped, itemToString, limit]);

  const flatFilteredItems: ExtractItemType<Item>[] = React.useMemo(() => {
    if (!filteredItems || !virtualized) {
      return [];
    }
    if (isGrouped) {
      const groups = filteredItems as ComboboxGroup<ExtractItemType<Item>>[];
      return groups.flatMap((g) => g.items);
    }
    return filteredItems as ExtractItemType<Item>[];
  }, [filteredItems, isGrouped, virtualized]);

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
  const open = inline || openRaw;

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const initialList = React.useMemo(() => {
    if (virtualized) {
      return Array.from({ length: flatFilteredItems.length }, () => null);
    }
    return [];
  }, [virtualized, flatFilteredItems]);

  const listRef = React.useRef<Array<HTMLElement | null>>(initialList);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);
  const hadInputClearRef = React.useRef(false);
  const chipsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const clearRef = React.useRef<HTMLButtonElement | null>(null);

  const queryRef = React.useRef(query);
  const selectedValueRef = React.useRef(selectedValue);

  const initialSelectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (selectedValue !== initialSelectedValueRef.current) {
      store.set('forceMount', true);
    }
  }, [store, selectedValue]);

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
    listRef.current.length = initialList.length;
    valuesRef.current.length = initialList.length;
  }, [initialList, virtualized]);

  // Maintain a full value map for virtualized lists so offscreen selections and
  // navigation use the correct indices even when DOM nodes aren't rendered.
  useIsoLayoutEffect(() => {
    if (!virtualized) {
      return;
    }
    valuesRef.current = flatFilteredItems.slice();
  }, [virtualized, flatFilteredItems]);

  useValueChanged(queryRef, query, () => {
    if (!open || query === '' || query === String(defaultInputValue).toLocaleLowerCase()) {
      return;
    }
    setQueryChangedAfterOpen(true);
  });

  useValueChanged(selectedValueRef, selectedValue, () => {
    clearErrors(name);
    commitValidation?.(selectedValue, true);
    if (validationMode === 'onChange') {
      commitValidation?.(selectedValue);
    }
    updateValue(selectedValue);
  });

  useIsoLayoutEffect(() => {
    const hasValue = multiple
      ? Array.isArray(selectedValue) && selectedValue.length > 0
      : selectedValue !== null && selectedValue !== undefined && selectedValue !== '';
    setFilled(hasValue);
  }, [setFilled, selectedValue, multiple]);

  const setInputValue = useEventCallback(
    (next: string, event: Event | undefined, reason: ValueChangeReason | undefined) => {
      // If user is typing, ensure we don't auto-highlight on open due to a race
      // with the post-open effect that sets this flag.
      if (reason === 'input-change') {
        const hasQuery = next.trim() !== '';
        if (hasQuery) {
          setQueryChangedAfterOpen(true);
          // Prevent initial selectedIndex -> activeIndex sync on typed opens.
          allowActiveIndexSyncRef.current = false;
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
      reason: ComboboxRoot.OpenChangeReason | undefined,
    ) => {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const hasRegisteredRef = React.useRef(false);

  const syncSelectedState = useEventCallback(() => {
    if (!hasRegisteredRef.current || selectionMode === 'none') {
      return;
    }

    if (multiple) {
      const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = lastValue !== undefined ? valuesRef.current.indexOf(lastValue) : -1;

      let computedSelectedIndex = store.state.selectedIndex;
      if (computedSelectedIndex === null) {
        computedSelectedIndex = lastIndex === -1 ? null : lastIndex;
      }

      store.set('selectedIndex', computedSelectedIndex);
    } else {
      const index = valuesRef.current.indexOf(selectedValue);
      const hasIndex = index !== -1;

      if (selectedValue == null || !hasIndex) {
        store.set('selectedIndex', null);
      } else if (allowActiveIndexSyncRef.current) {
        store.set('selectedIndex', index);
      }
    }
  });

  const registerItemIndex = useEventCallback((index: number) => {
    hasRegisteredRef.current = true;

    if (selectionMode === 'none') {
      return;
    }

    if (multiple) {
      // Keep `selectedIndex` in sync once an item reports its index.
      syncSelectedState();
      return;
    }

    // Single selection: prefer the supplied index to avoid relying on filtered values.
    if (selectedValue == null) {
      store.set('selectedIndex', null);
      return;
    }
    if (allowActiveIndexSyncRef.current) {
      store.set('selectedIndex', index);
    }
  });

  // Keep store in sync whenever `selectedValue` changes after registration.
  useIsoLayoutEffect(syncSelectedState, [selectedValue, syncSelectedState]);

  const handleUnmount = useEventCallback(() => {
    allowActiveIndexSyncRef.current = true;

    setMounted(false);
    onOpenChangeComplete?.(false);
    setQueryChangedAfterOpen(false);
    resetOpenInteractionType();
    onItemHighlighted(undefined, { type: 'none', index: -1 });

    store.set('activeIndex', null);

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
      const idx = flatItems.indexOf(selectedValue);
      if (idx !== -1) {
        registerItemIndex(idx);
      } else {
        store.set('selectedIndex', null);
      }
    }

    // If an input-clear was requested while open, perform it here after close completes
    // to avoid mid-exit flicker.
    if (hadInputClearRef.current && inputRef.current && inputRef.current.value !== '') {
      setInputValue('', undefined, 'input-clear');
      hadInputClearRef.current = false;
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
        const stringVal = stringifyItem(selectedValue, itemToString);
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

  const role: ElementProps = React.useMemo(() => {
    const isTextarea = (inputElement as HTMLElement | null)?.tagName === 'TEXTAREA';
    const shouldApplyAria = !isTextarea || open;

    const reference = isTextarea
      ? {}
      : ({
          autoComplete: 'off',
          spellCheck: 'false',
          autoCorrect: 'off',
          autoCapitalize: 'off',
        } as HTMLProps<HTMLInputElement>);

    if (shouldApplyAria) {
      reference.role = 'combobox';
      reference['aria-expanded'] = ariaExpanded;
      reference['aria-haspopup'] = ariaHasPopup;
      reference['aria-controls'] = open ? listElement?.id : undefined;
      reference['aria-autocomplete'] = 'list';
    }

    return {
      reference,
      floating: { role: 'presentation' },
    };
  }, [inputElement, open, ariaExpanded, ariaHasPopup, listElement?.id]);

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
      return (
        !contains(triggerElement, target) &&
        !contains(clearRef.current, target) &&
        !contains(chipsContainerRef.current, target)
      );
    },
  });

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
    openOnArrowKeyDown:
      anchorElement === inputElement && (inputElement as HTMLElement | null)?.tagName === 'INPUT',
    // Use 'auto' so arrow key openings highlight appropriately without requiring a prior selection,
    // but disable when the user has typed after opening to avoid auto-highlighting on type-open.
    focusItemOnOpen: queryChangedAfterOpen || selectionMode === 'none' ? false : 'auto',
    cols,
    orientation: cols > 1 ? 'horizontal' : undefined,
    disabledIndices: virtualized
      ? (index) => index < 0 || index >= flatFilteredItems.length
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

  const { reference: typeaheadTriggerProps } = useTypeahead(floatingRootContext, {
    enabled: !open && !readOnly && !disabled && selectionMode === 'single',
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        const nextSelectedValue = valuesRef.current[index];
        if (nextSelectedValue !== undefined) {
          setSelectedValue(nextSelectedValue, undefined, undefined);
        }
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
      initialList,
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
    initialList,
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
      inputRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      chipsContainerRef,
      clearRef,
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
          {virtualized ? (
            children
          ) : (
            <CompositeList elementsRef={listRef} labelsRef={labelsRef}>
              {children}
            </CompositeList>
          )}
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
  filter?:
    | null
    | ((
        item: ExtractItemType<Item>,
        query: string,
        itemToString?: (item: ExtractItemType<Item>) => string,
      ) => boolean);
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
  /**
   * INTERNAL: Clears the input value after close animation completes.
   * Useful for wrappers like FilterableMenu so they don't need to reset externally.
   * @default false
   */
  clearInputOnCloseComplete?: boolean;
  /**
   * The maximum number of items to display in the list.
   * @default -1
   */
  limit?: number;
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
