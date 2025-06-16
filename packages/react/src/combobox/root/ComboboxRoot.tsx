import * as React from 'react';
import {
  ElementProps,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
} from '@floating-ui/react';
import { contains, getTarget } from '@floating-ui/react/utils';
import { useClick } from '../../utils/floating-ui/useClick';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { ComboboxFloatingContext, ComboboxRootContext } from './ComboboxRootContext';
import { useControlled, useId, useModernLayoutEffect, useTransitionStatus } from '../../utils';
import { selectors, type State as StoreState } from '../store';
import { Store, useSelector } from '../../utils/store';
import { useLazyRef } from '../../utils/useLazyRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useOnFirstRender } from '../../utils/useOnFirstRender';
import { CompositeList } from '../../composite/list/CompositeList';

/**
 * Groups all parts of a combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Value>(props: ComboboxRoot.Props<Value>) {
  const {
    id: idProp,
    onOpenChangeComplete,
    defaultValue = '',
    selectable = false,
    onItemHighlighted: onItemHighlightedProp,
  } = props;

  const id = useId(idProp);

  const [value, setValueUnwrapped] = useControlled<any>({
    controlled: props.value,
    default: defaultValue,
    name: 'Combobox',
    state: 'value',
  });

  const [openRaw, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(openRaw);

  const store = useLazyRef(
    () =>
      new Store<StoreState>({
        id,
        value,
        open: openRaw,
        mounted,
        transitionStatus,
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const triggerElement = useSelector(store, selectors.triggerElement);
  const positionerElement = useSelector(store, selectors.positionerElement);
  const inline = useSelector(store, selectors.inline);
  const open = inline ? true : openRaw;

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: BaseOpenChangeReason | undefined) => {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.set('activeIndex', null);
    onItemHighlighted(undefined, 'pointer');
    onOpenChangeComplete?.(false);
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

  const setValue = useEventCallback(
    (nextValue: any, event: Event | undefined, reason: string | undefined) => {
      props.onValueChange?.(nextValue, event, reason);
      setValueUnwrapped(nextValue);
      queueMicrotask(() => {
        triggerElement?.focus();
      });
    },
  );

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    const index = suppliedIndex ?? valuesRef.current.indexOf(value);
    const hasIndex = index !== -1;

    if (hasIndex || value === null) {
      store.apply({ selectedIndex: index });
    }
  });

  useModernLayoutEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerSelectedItem(undefined);
  }, [value, registerSelectedItem]);

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

  const role: ElementProps = React.useMemo(
    () => ({
      reference: {
        role: 'combobox',
        'aria-expanded': open ? 'true' : 'false',
        'aria-haspopup': 'listbox',
        'aria-controls': open ? floatingRootContext.floatingId : undefined,
      },
      floating: {
        role: 'presentation',
      },
    }),
    [open, floatingRootContext.floatingId],
  );

  const click = useClick(floatingRootContext, {
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    bubbles: true,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return !contains(triggerRef.current, target);
    },
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    listRef,
    activeIndex,
    virtual: true,
    loop: true,
    allowEscape: true,
    focusItemOnOpen: false,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      const type = keyboardActiveRef.current ? 'keyboard' : 'pointer';
      if (nextActiveIndex !== null) {
        onItemHighlighted(valuesRef.current[nextActiveIndex], type);
      } else {
        onItemHighlighted(undefined, type);
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
      value,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  }, [store, id, value, open, mounted, transitionStatus, getFloatingProps, getReferenceProps]);

  const contextValue: ComboboxRootContext = React.useMemo(
    () => ({
      selectable,
      mounted,
      value,
      setValue,
      open,
      setOpen,
      listRef,
      popupRef,
      triggerRef,
      valuesRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      triggerElement,
      positionerElement,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
    }),
    [
      selectable,
      mounted,
      open,
      positionerElement,
      setOpen,
      setValue,
      triggerElement,
      value,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
    ],
  );

  return (
    <ComboboxRootContext.Provider value={contextValue}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <CompositeList elementsRef={listRef}>{props.children}</CompositeList>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

export namespace ComboboxRoot {
  export interface State {}

  export interface Props<Value> {
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
     * The value of the combobox.
     */
    value?: Value;
    /**
     * Callback fired when the value of the combobox changes. Use when controlled.
     */
    onValueChange?: (value: Value, event: Event | undefined, reason: string | undefined) => void;
    /**
     * The uncontrolled value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `value` prop instead.
     * @default null
     */
    defaultValue?: Value | null;
    /**
     * Whether the combobox popup is initially open.
     *
     * To render a controlled combobox popup, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the combobox popup is opened or closed.
     * @type (open: boolean, event?: Event, reason?: combobox.Root.OpenChangeReason) => void
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
     * A ref to imperative actions.
     * - `unmount`: When specified, the combobox will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the combobox manually.
     * Useful when the combobox's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Whether the combobox should be selectable.
     * @default true
     */
    selectable?: boolean;
    /**
     * Callback fired when the user navigates the list and highlights an item.
     * Passes the item's `value` or `undefined` when no item is highlighted.
     */
    onItemHighlighted?: (value: Value | undefined, type: 'keyboard' | 'pointer') => void;
  }

  export interface Actions {
    unmount: () => void;
  }
}
