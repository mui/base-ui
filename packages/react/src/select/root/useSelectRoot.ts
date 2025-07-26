import * as React from 'react';
import { useLazyRef } from '@base-ui-components/utils/useLazyRef';
import { useOnFirstRender } from '@base-ui-components/utils/useOnFirstRender';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { warn } from '@base-ui-components/utils/warn';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useSelector, Store } from '@base-ui-components/utils/store';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
  FloatingRootContext,
} from '../../floating-ui-react';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { selectors, State } from '../store';
import type { SelectRootContext } from './SelectRootContext';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import type { SelectRootConditionalProps, SelectRoot } from './SelectRoot';
import { EMPTY_ARRAY } from '../../utils/constants';

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
  } = params;

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

  useIsoLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

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
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const keyboardActiveRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    allowSelect: false,
  });
  const hasRegisteredRef = React.useRef(false);
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const highlightTimeout = useTimeout();

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const store = useLazyRef(
    () =>
      new Store<State>({
        id,
        modal,
        multiple,
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
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
      }),
  ).current;

  const initialValueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (value !== initialValueRef.current) {
      store.set('forceMount', true);
    }
  }, [store, value]);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const selectedIndex = useSelector(store, selectors.selectedIndex);

  const triggerElement = useSelector(store, selectors.triggerElement);
  const positionerElement = useSelector(store, selectors.positionerElement);

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
          const index = valuesRef.current.indexOf(v);
          return index !== -1 ? (labelsRef.current[index] ?? '') : '';
        })
        .filter(Boolean);

      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = lastValue != null ? valuesRef.current.indexOf(lastValue) : -1;

      // Store the last selected index for later use when closing the popup.
      lastSelectedIndexRef.current = lastIndex === -1 ? null : lastIndex;

      store.apply({
        label: labels.join(', '),
      });
    } else {
      const index = valuesRef.current.indexOf(value);

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
  ]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const setOpen = useEventCallback(
    (
      nextOpen: boolean,
      event: Event | undefined,
      reason: SelectRoot.OpenChangeReason | undefined,
    ) => {
      params.onOpenChange?.(nextOpen, event, reason);
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

  const setValue = useEventCallback((nextValue: any, event?: Event) => {
    params.onValueChange?.(nextValue, event);
    setValueUnwrapped(nextValue);
  });

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
          const index = valuesRef.current.indexOf(v);
          return index !== -1 ? (labelsRef.current[index] ?? '') : '';
        })
        .filter(Boolean);

      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = lastValue !== undefined ? valuesRef.current.indexOf(lastValue) : -1;

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
      const index = valuesRef.current.indexOf(value);
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

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange(nextOpen, event, reason) {
      setOpen(nextOpen, event, translateOpenChangeReason(reason));
    },
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
    outsidePressEvent: 'mousedown',
  });

  const role = useRole(floatingContext, {
    role: 'select',
  });

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY,
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
        setValue(valuesRef.current[index]);
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
    role,
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

  // Store values that depend on other hooks
  React.useEffect(() => {
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
  ]);

  const rootContext: SelectRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      setValue,
      setOpen,
      listRef,
      popupRef,
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
      highlightTimeout,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      setValue,
      setOpen,
      listRef,
      popupRef,
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
      highlightTimeout,
    ],
  );

  return {
    rootContext,
    floatingContext,
    value,
  };
}

export namespace useSelectRoot {
  export interface Parameters<Value, Multiple extends boolean | undefined = false>
    extends Omit<SelectRootConditionalProps<Value, Multiple>, 'children' | 'inputRef'> {}

  export type ReturnValue = {
    rootContext: SelectRootContext;
    floatingContext: FloatingRootContext;
    value: any;
  };
}
