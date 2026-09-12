'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useListNavigation,
  useTypeahead,
} from '../../floating-ui-react';
import {
  SelectFloatingContext,
  SelectRootContext,
  SelectRootPropsContext,
  type SelectRootPropsContextValue,
} from './SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { selectors, type SelectStoreContext, type State as StoreState } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useFormContext } from '../../internals/form-context/FormContext';
import { type Group, stringifyAsLabel, stringifyAsValue } from '../../internals/resolveValueLabel';
import {
  defaultItemEquality,
  findSelectionIndex,
  isSelectedValueDirty,
} from '../../internals/itemEquality';
import { useValueChanged } from '../../internals/useValueChanged';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { FOCUSABLE_POPUP_PROPS } from '../../utils/popups';
import { mergeProps } from '../../merge-props';
import { NOOP } from '../../internals/noop';

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name: nameProp,
    form,
    autoComplete,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    setTouched,
    setFocused,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
    validationMode,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
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
  const firstItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);
  const initialValueRef = React.useRef(value);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  const store = useRefWithInit(
    () =>
      new ReactStore<StoreState, SelectStoreContext, typeof selectors>(
        {
          id: generatedId,
          labelId: undefined,
          modal,
          multiple,
          itemToStringLabel,
          itemToStringValue,
          isItemEqualToValue,
          value,
          open,
          mounted,
          transitionStatus,
          items,
          forceMount: false,
          openMethod: null,
          activeIndex: null,
          selectedIndex: null,
          popupProps: EMPTY_OBJECT,
          triggerProps: EMPTY_OBJECT,
          triggerElement: null,
          positionerElement: null,
          listElement: null,
          popupSide: null,
          scrollUpArrowVisible: false,
          scrollDownArrowVisible: false,
          hasScrollArrows: false,
        },
        {
          setValue: NOOP,
          setOpen: NOOP,
          handleScrollArrowVisibility: NOOP,
          onOpenChangeComplete: NOOP,
          listRef,
          popupRef,
          scrollHandlerRef,
          scrollArrowsMountedCountRef,
          valueRef,
          valuesRef,
          labelsRef,
          typingRef,
          selectionRef,
          firstItemTextRef,
          selectedItemTextRef,
          alignItemWithTriggerActiveRef,
          initialValueRef,
        },
        selectors,
      ),
  ).current;

  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');

  const previousOpenMethod = usePreviousValue(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod;

  const serializedValue = React.useMemo(() => {
    if (multiple) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const controlRef = useValueAsRef(triggerElement);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);

  useRegisterFieldControl(
    controlRef,
    generatedId,
    value,
    getStringifiedValueForForm,
    !disabled,
    nameProp,
  );

  const hasSelectedValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value != null && serializedValue !== '';

  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);

  useIsoLayoutEffect(
    function syncSelectedIndex() {
      const nextIndex = findSelectionIndex(valuesRef.current, value, isItemEqualToValue, multiple);

      if (nextIndex === null) {
        selectedItemTextRef.current = null;
      }

      if (open) {
        return;
      }

      store.set('selectedIndex', nextIndex);
    },
    [multiple, open, value, isItemEqualToValue, store],
  );

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));

    validation.change(value);
  });

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      if (
        !nextOpen &&
        (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)
      ) {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          validation.commit(value);
        }
      }
    },
  );

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({
      activeIndex: null,
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false,
    });
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const handleScrollArrowVisibility = useStableCallback((scroller: HTMLElement) => {
    const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;

    store.set('scrollUpArrowVisible', shouldShowUp);
    store.set('scrollDownArrowVisible', shouldShowDown);
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
    enabled: !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext);

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      if (nextActiveIndex === null && !open) {
        return;
      }

      store.set('activeIndex', nextActiveIndex);
    },
    focusItemOnHover: highlightItemOnHover,
  });

  const typeahead = useTypeahead(floatingContext, {
    enabled: !disabled && (open || (!readOnly && !multiple)),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    disabledIndices: (index) => isElementDisabled(listRef.current[index]),
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails(REASONS.none));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    },
  });

  const mergedTriggerProps = React.useMemo(
    () =>
      mergeProps(
        typeahead.reference,
        listNavigation.reference,
        dismiss.reference,
        click.reference,
        interactionTypeProps,
      ),
    [
      click.reference,
      typeahead.reference,
      listNavigation.reference,
      dismiss.reference,
      interactionTypeProps,
    ],
  );

  const popupProps = React.useMemo(
    () =>
      mergeProps(
        FOCUSABLE_POPUP_PROPS,
        typeahead.floating,
        listNavigation.floating,
        dismiss.floating,
      ),
    [typeahead.floating, listNavigation.floating, dismiss.floating],
  );

  const itemProps =
    (listNavigation.item as React.HTMLProps<HTMLElement> | undefined) ?? EMPTY_OBJECT;

  store.useContextCallback('setValue', setValue);
  store.useContextCallback('setOpen', setOpen);
  store.useContextCallback('handleScrollArrowVisibility', handleScrollArrowVisibility);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  useOnFirstRender(() => {
    store.update({
      popupProps,
      triggerProps: mergedTriggerProps,
    });
  });

  store.useSyncedValues({
    id: generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    popupProps,
    triggerProps: mergedTriggerProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    openMethod: renderedOpenMethod,
  });

  const rootPropsContextValue: SelectRootPropsContextValue = React.useMemo(
    () => ({
      disabled,
      readOnly,
      required,
      multiple,
      highlightItemOnHover,
      itemProps,
    }),
    [disabled, readOnly, required, multiple, highlightItemOnHover, itemProps],
  );

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hiddenInputName = multiple ? undefined : name;

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          form={form}
          name={name}
          value={currentSerializedValue}
          disabled={disabled}
        />
      );
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);

  return (
    <SelectRootContext.Provider value={store}>
      <SelectRootPropsContext.Provider value={rootPropsContextValue}>
        <SelectFloatingContext.Provider value={floatingContext}>
          {children}
        </SelectFloatingContext.Provider>
      </SelectRootPropsContext.Provider>
      <input
        {...validation.getValidationProps(disabled, {
          onFocus() {
            store.state.triggerElement?.focus({
              focusVisible: true,
            });
          },
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }

            const nextValue = event.currentTarget.value;
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

            function handleChange() {
              if (multiple) {
                return;
              }

              const nextValueLower = nextValue.toLowerCase();
              let matchingIndex = valuesRef.current.findIndex(
                (candidate) =>
                  stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower ||
                  stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower,
              );

              if (matchingIndex === -1) {
                matchingIndex = valuesRef.current.findIndex((_, index) => {
                  const renderedLabel = labelsRef.current[index];
                  return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
                });
              }

              const matchingValue = valuesRef.current[matchingIndex];
              if (matchingValue != null) {
                setValue(matchingValue, details);
              }
            }

            store.set('forceMount', true);
            queueMicrotask(handleChange);
          },
        })}
        id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
        form={form}
        name={hiddenInputName}
        autoComplete={autoComplete}
        value={serializedValue}
        disabled={disabled}
        required={required && !(multiple && hasSelectedValue)}
        readOnly={readOnly}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHidden}
        tabIndex={-1}
        aria-hidden
        suppressHydrationWarning
      />
      {hiddenInputs}
    </SelectRootContext.Provider>
  );
}

type SelectValueInputType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? readonly Value[]
  : Value;

type SelectValueOutputType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export interface SelectRootProps<Value, Multiple extends boolean | undefined = false> {
  children?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  name?: string | undefined;
  form?: string | undefined;
  autoComplete?: string | undefined;
  id?: string | undefined;
  required?: boolean | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  multiple?: Multiple | undefined;
  highlightItemOnHover?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, eventDetails: SelectRootChangeEventDetails) => void) | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  open?: boolean | undefined;
  modal?: boolean | undefined;
  actionsRef?: React.RefObject<SelectRootActions | null> | undefined;
  items?:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | ReadonlyArray<Group<any>>
    | undefined;
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  defaultValue?: SelectValueInputType<Value, Multiple> | null | undefined;
  value?: SelectValueInputType<Value, Multiple> | null | undefined;
  onValueChange?:
    | ((
        value: SelectValueOutputType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: SelectRootChangeEventDetails,
      ) => void)
    | undefined;
}

export interface SelectRootState {}

export interface SelectRootActions {
  unmount: () => void;
}

export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.windowResize
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.cancelOpen
  | typeof REASONS.none;

export type SelectRootChangeEventDetails = BaseUIChangeEventDetails<SelectRootChangeEventReason>;

export namespace SelectRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectRootProps<
    Value,
    Multiple
  >;
  export type State = SelectRootState;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
