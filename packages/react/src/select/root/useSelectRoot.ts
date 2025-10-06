import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui-components/utils/useOnFirstRender';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { warn } from '@base-ui-components/utils/warn';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useStore, Store } from '@base-ui-components/utils/store';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useTypeahead,
  FloatingRootContext,
} from '../../floating-ui-react';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useControlId } from '../../labelable-provider/useControlId';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { selectors, State } from '../store';
import type { SelectRootContext } from './SelectRootContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import type { SelectRootConditionalProps, SelectRoot } from './SelectRoot';
import { EMPTY_ARRAY } from '../../utils/constants';
import { defaultItemEquality, findItemIndex } from '../../utils/itemEquality';

export function useSelectRoot<Value, Multiple extends boolean | undefined>(
  params: useSelectRoot.Parameters<Value, Multiple>,
): useSelectRoot.ReturnValue {
  const {
    id: idProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = false,
    name: nameProp,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
  } = params;

  const { controlId } = useLabelableContext();
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

  const defaultId = useBaseUiId(idProp);
  const id = controlId ?? defaultId;

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  useControlId(idProp);

  const [value, setValueUnwrapped] = useControlled({
    controlled: params.value,
    default: multiple ? (params.defaultValue ?? EMPTY_ARRAY) : params.defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: params.open,
    default: params.defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const keyboardActiveRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
  });
  const hasRegisteredRef = React.useRef(false);
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const store = useRefWithInit(
    () =>
      new Store<State>({
        id,
        modal,
        multiple,
        itemToStringLabel,
        itemToStringValue,
        isItemEqualToValue,
        value,
        label: '',
        open,
        mounted,
        forceMount: false,
        transitionStatus,
        items,
        touchModality: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
        hasScrollArrows: false,
      }),
  ).current;

  const initialValueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (value !== initialValueRef.current) {
      store.set('forceMount', true);
    }
  }, [store, value]);

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);

  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);

  const controlRef = useLatestRef(store.state.triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  useField({
    id,
    commitValidation,
    value,
    controlRef,
    name,
    getValue: () => value,
  });

  const prevValueRef = React.useRef(value);

  useIsoLayoutEffect(() => {
    setFilled(value !== null);
  }, [value, setFilled]);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === value) {
      return;
    }

    if (multiple) {
      // For multiple selection, update the label and keep track of the last selected
      // item via `selectedIndex`, which is needed when the popup (re)opens.
      const currentValue = Array.isArray(value) ? value : [];

      const labels = currentValue
        .map((v) => {
          const index = findItemIndex(valuesRef.current, v, isItemEqualToValue);
          return index !== -1 ? (labelsRef.current[index] ?? '') : '';
        })
        .filter(Boolean);

      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = findItemIndex(valuesRef.current, lastValue, isItemEqualToValue);

      // Store the last selected index for later use when closing the popup.
      lastSelectedIndexRef.current = lastIndex === -1 ? null : lastIndex;

      store.apply({
        label: labels.join(', '),
      });
    } else {
      const index = findItemIndex(valuesRef.current, value as Value, isItemEqualToValue);

      store.apply({
        selectedIndex: index === -1 ? null : index,
        label: labelsRef.current[index] ?? '',
      });
    }

    clearErrors(name);
    setDirty(value !== validityData.initialValue);
    commitValidation(value, validationMode !== 'onChange');

    if (validationMode === 'onChange') {
      commitValidation(value);
    }
  }, [
    value,
    commitValidation,
    clearErrors,
    name,
    validationMode,
    store,
    setDirty,
    validityData.initialValue,
    setFilled,
    multiple,
    isItemEqualToValue,
  ]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const setOpen = useEventCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      params.onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      // The active index will sync to the last selected index on the next open.
      if (!nextOpen && multiple) {
        store.set('selectedIndex', lastSelectedIndexRef.current);
      }

      // Workaround `enableFocusInside` in Floating UI setting `tabindex=0` of a non-highlighted
      // option upon close when tabbing out due to `keepMounted=true`:
      // https://github.com/floating-ui/floating-ui/pull/3004/files#diff-962a7439cdeb09ea98d4b622a45d517bce07ad8c3f866e089bda05f4b0bbd875R194-R199
      // This otherwise causes options to retain `tabindex=0` incorrectly when the popup is closed
      // when tabbing outside.
      if (!nextOpen && store.state.activeIndex !== null) {
        const activeOption = listRef.current[store.state.activeIndex];
        // Wait for Floating UI's focus effect to have fired
        queueMicrotask(() => {
          activeOption?.setAttribute('tabindex', '-1');
        });
      }
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.set('activeIndex', null);
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !params.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(params.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useEventCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      params.onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  /**
   * Keeps `store.selectedIndex` and `store.label` in sync with the current `value`.
   * Does nothing until at least one item has reported its index (so that
   * `valuesRef`/`labelsRef` are populated).
   */
  const syncSelectedState = useEventCallback(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];

      const labels = currentValue
        .map((v) => {
          const index = findItemIndex(valuesRef.current, v, isItemEqualToValue);
          return index !== -1 ? (labelsRef.current[index] ?? '') : '';
        })
        .filter(Boolean);

      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex =
        lastValue !== undefined
          ? findItemIndex(valuesRef.current, lastValue, isItemEqualToValue)
          : -1;

      // Store the last selected index for later use when closing the popup.
      lastSelectedIndexRef.current = lastIndex === -1 ? null : lastIndex;

      let computedSelectedIndex = store.state.selectedIndex;
      if (computedSelectedIndex === null) {
        computedSelectedIndex = lastIndex === -1 ? null : lastIndex;
      }

      store.apply({
        selectedIndex: computedSelectedIndex,
        label: labels.join(', '),
      });
    } else {
      const index = findItemIndex(valuesRef.current, value as Value, isItemEqualToValue);
      const hasIndex = index !== -1;

      if (hasIndex || value === null) {
        store.apply({
          selectedIndex: hasIndex ? index : null,
          label: hasIndex ? (labelsRef.current[index] ?? '') : '',
        });
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        if (value) {
          const stringValue =
            typeof value === 'string' || value === null ? value : JSON.stringify(value);
          warn(`The value \`${stringValue}\` is not present in the select items.`);
        }
      }
    }
  });

  /**
   * Called by each <Select.Item> once it knows its stable index. After the first
   * call, the root is able to resolve labels and selected indices.
   */
  const registerItemIndex = useEventCallback((index: number) => {
    hasRegisteredRef.current = true;

    if (multiple) {
      // Store the last selected item index so that the popup can restore focus
      // when it re-opens.
      lastSelectedIndexRef.current = index;
    }

    syncSelectedState();
  });

  // Keep store in sync whenever `value` changes after registration.
  useIsoLayoutEffect(syncSelectedState, [value, syncSelectedState]);

  const handleScrollArrowVisibility = useEventCallback(() => {
    const scroller = store.state.listElement || popupRef.current;
    if (!scroller) {
      return;
    }

    const viewportTop = scroller.scrollTop;
    const viewportBottom = scroller.scrollTop + scroller.clientHeight;
    const shouldShowUp = viewportTop > 1;
    const shouldShowDown = viewportBottom < scroller.scrollHeight - 1;

    if (store.state.scrollUpArrowVisible !== shouldShowUp) {
      store.set('scrollUpArrowVisible', shouldShowUp);
    }
    if (store.state.scrollDownArrowVisible !== shouldShowDown) {
      store.set('scrollDownArrowVisible', shouldShowDown);
    }
  });

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext, {
    bubbles: false,
  });

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY as number[],
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      store.set('activeIndex', nextActiveIndex);
    },
    // Implement our own listeners since `onPointerLeave` on each option fires while scrolling with
    // the `alignItemWithTrigger=true`, causing a performance issue on Chrome.
    focusItemOnHover: false,
  });

  const typeahead = useTypeahead(floatingContext, {
    enabled: !readOnly && !disabled && (open || !multiple),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails('none'));
      }
    },
    onTypingChange(typing) {
      // FIXME: Floating UI doesn't support allowing space to select an item while the popup is
      // closed and the trigger isn't a native <button>.
      typingRef.current = typing;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    listNavigation,
    typeahead,
  ]);

  useOnFirstRender(() => {
    // These should be initialized at store creation, but there is an interdependency
    // between some values used in floating hooks above.
    store.apply({
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  });

  useIsoLayoutEffect(() => {
    store.apply({
      id,
      modal,
      multiple,
      value,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
      items,
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
    });
  }, [
    store,
    id,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    getFloatingProps,
    getReferenceProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
  ]);

  const rootContext: SelectRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      itemToStringLabel,
      itemToStringValue,
      setValue,
      setOpen,
      listRef,
      popupRef,
      scrollHandlerRef,
      handleScrollArrowVisibility,
      scrollArrowsMountedCountRef,
      getItemProps,
      events: floatingContext.events,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      selectedItemTextRef,
      fieldControlValidation,
      registerItemIndex,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
      initialValueRef,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      itemToStringLabel,
      itemToStringValue,
      setValue,
      setOpen,
      listRef,
      popupRef,
      scrollHandlerRef,
      getItemProps,
      floatingContext.events,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      selectedItemTextRef,
      fieldControlValidation,
      registerItemIndex,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
      handleScrollArrowVisibility,
    ],
  );

  return {
    rootContext,
    floatingContext,
    value,
  };
}

export interface UseSelectRootParameters<Value, Multiple extends boolean | undefined = false>
  extends Omit<SelectRootConditionalProps<Value, Multiple>, 'children' | 'inputRef'> {}

export type UseSelectRootReturnValue = {
  rootContext: SelectRootContext;
  floatingContext: FloatingRootContext;
  value: any;
};

export namespace useSelectRoot {
  export type Parameters<
    Value,
    Multiple extends boolean | undefined = false,
  > = UseSelectRootParameters<Value, Multiple>;
  export type ReturnValue = UseSelectRootReturnValue;
}
