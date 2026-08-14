'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Store, useStore } from '@base-ui/utils/store';
import { useFloatingRootContext, useListNavigation } from '../../floating-ui-react';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useItemRegistry } from '../../internals/useItemRegistry';
import type { HTMLProps } from '../../internals/types';
import {
  FilterDropdownRootContext,
  FilterDropdownValueContext,
  type FilterDropdownItemRegistration,
  type FilterDropdownFilter,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from './FilterDropdownRootContext';
import type { NavigationState } from '../store';

/**
 * @internal
 */
export function FilterDropdownRoot(props: FilterDropdownRoot.Props): React.JSX.Element {
  const {
    children,
    open,
    disabled = false,
    inputFocusVisible = false,
    selectedIndex = null,
    focusItemOnOpen = false,
    empty,
    locale,
    value,
    onValueChange,
    filter,
    triggerId: externalTriggerId,
    triggerElement: externalTriggerElement,
    listRef,
    contextRef,
  } = props;

  const parentContext = React.useContext(FilterDropdownRootContext);
  const [liveRegionElement, setLiveRegionElement] = React.useState<HTMLDivElement | null>(null);
  const [registeredTriggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [registeredPopupElement, setPopupElement] = React.useState<HTMLElement | null>(null);
  const [registeredTriggerId, setTriggerId] = React.useState<string | undefined>(undefined);
  const [registeredPopupId, setPopupId] = React.useState<string | undefined>(undefined);
  const [registeredItems, registerItem] = useItemRegistry<symbol, FilterDropdownItemRegistration>();
  const [navigationFocusVisible, setNavigationFocusVisible] = React.useState(inputFocusVisible);
  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultTriggerId = useBaseUiId();
  const defaultPopupId = useBaseUiId();
  const triggerElement = externalTriggerElement ?? registeredTriggerElement;
  const triggerId = externalTriggerId ?? registeredTriggerId ?? defaultTriggerId;
  const popupId = registeredPopupId ?? defaultPopupId;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardNavigationCountRef = React.useRef(0);
  const handleValueChange = useStableCallback(onValueChange);

  const navigationStore = useRefWithInit(
    () => new Store<NavigationState>({ activeIndex: null }),
  ).current;

  const activeIndex = useStore(navigationStore, (state) => state.activeIndex);

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: () => {},
    elements: {
      reference: triggerElement,
      floating: registeredPopupElement,
    },
  });

  const listNavigation = useListNavigation(floatingContext, {
    enabled: open,
    id: popupId,
    listRef,
    activeIndex,
    virtual: true,
    loopFocus: true,
    allowEscape: true,
    resetOnReferenceFocus: true,
    focusItemOnOpen,
    selectedIndex,
    onNavigate(nextActiveIndex, event) {
      if (event?.type === 'focus') {
        return;
      }
      navigationStore.set('activeIndex', nextActiveIndex);
      if (nextActiveIndex === null && open) {
        inputRef.current?.focus({ preventScroll: true });
      }
      if (event?.type !== 'focus') {
        if (event?.type === 'keydown') {
          keyboardNavigationCountRef.current += 1;
          setNavigationFocusVisible(keyboardNavigationCountRef.current > 1);
        } else {
          keyboardNavigationCountRef.current = 0;
          setNavigationFocusVisible(false);
        }
      }
    },
  });

  useIsoLayoutEffect(() => {
    keyboardNavigationCountRef.current = 0;
    setNavigationFocusVisible(inputFocusVisible);
  }, [inputFocusVisible]);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const previousValueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    if (previousValueRef.current === value) {
      if (open && value.trim() === '' && activeIndex === null && selectedIndex != null) {
        navigationStore.set('activeIndex', selectedIndex);
      }
      return;
    }
    previousValueRef.current = value;
    navigationStore.set('activeIndex', value.trim() === '' ? selectedIndex : null);
  }, [activeIndex, navigationStore, open, selectedIndex, value]);

  // Nested popups can be portalled while their events still bubble through the parent React tree.
  // Share a registry so each popup can ignore events owned by a nested popup.
  const popupElements = useRefWithInit(
    () => parentContext?.popupElements ?? new WeakSet<EventTarget>(),
  ).current;

  const contextValue: FilterDropdownRootContext = React.useMemo(
    () => ({
      parent: parentContext,
      open,
      disabled,
      inputFocusVisible: navigationFocusVisible,
      setInputFocusVisible: setNavigationFocusVisible,
      empty,
      popupElements,
      liveRegionElement,
      popupId,
      setPopupId,
      triggerId,
      setTriggerId,
      setTriggerElement,
      setPopupElement,
      setLiveRegionElement,
      inputRef,
      listRef,
      registeredItems,
      registerItem,
      navigationStore,
      activeIndex,
      setActiveIndex(index) {
        navigationStore.set('activeIndex', index);
      },
      navigation: {
        trigger: listNavigation.trigger ?? ({} as HTMLProps),
        reference: listNavigation.reference ?? ({} as HTMLProps),
        floating: listNavigation.floating ?? ({} as HTMLProps),
        item: listNavigation.item ?? ({} as HTMLProps),
      },
      onValueChange: handleValueChange,
      locale,
      filter,
    }),
    [
      parentContext,
      open,
      disabled,
      navigationFocusVisible,
      empty,
      popupElements,
      liveRegionElement,
      popupId,
      triggerId,
      inputRef,
      listRef,
      registeredItems,
      registerItem,
      listNavigation.trigger,
      listNavigation.reference,
      listNavigation.floating,
      listNavigation.item,
      activeIndex,
      navigationStore,
      locale,
      filter,
      handleValueChange,
    ],
  );

  useIsoLayoutEffect(() => {
    if (contextRef) {
      contextRef.current = contextValue;
    }
  }, [contextRef, contextValue]);

  return (
    <FilterDropdownRootContext.Provider value={contextValue}>
      <FilterDropdownValueContext.Provider value={value}>
        {children}
      </FilterDropdownValueContext.Provider>
      {triggerElement &&
        ReactDOM.createPortal(
          <div
            ref={setLiveRegionElement}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={visuallyHidden}
          />,
          ownerDocument(triggerElement).body,
        )}
    </FilterDropdownRootContext.Provider>
  );
}

export interface FilterDropdownRootProps {
  children?: React.ReactNode;
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /** Whether the filter controls should be disabled. */
  disabled?: boolean | undefined;
  /** Whether virtual focus was entered through keyboard navigation. */
  inputFocusVisible?: boolean | undefined;
  /** The item to highlight when the popup opens or its value is cleared. */
  selectedIndex?: number | null | undefined;
  /** Whether to seed virtual focus when the popup opens. */
  focusItemOnOpen?: boolean | 'auto' | undefined;
  /**
   * Whether the current query matched no items, when the host's data pass drives the list.
   * When omitted, the popup's item registry decides.
   */
  empty?: boolean | undefined;
  /**
   * Locale used for filtering comparisons.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The filter input value. Use when controlled.
   */
  value: string;
  /**
   * Event handler called when the filter input value changes.
   */
  onValueChange?:
    | ((value: string, eventDetails: FilterDropdownRootNamespace.ChangeEventDetails) => void)
    | undefined;
  /**
   * Custom filter logic used when filtering items.
   */
  filter?: FilterDropdownFilter | undefined;
  /**
   * ID of a trigger rendered outside this root, which cannot register itself through the context.
   */
  triggerId?: string | null | undefined;
  /**
   * Trigger rendered outside this root, used to mount the live region in the trigger's document.
   */
  triggerElement?: Element | null | undefined;
  /**
   * DOM-ordered list of item elements used by virtual focus navigation.
   */
  listRef: React.RefObject<Array<HTMLElement | null>>;
  /**
   * Receives the root's context value, for owners that need it above the provider.
   */
  contextRef?: React.RefObject<FilterDropdownRootContext | null> | undefined;
}

export namespace FilterDropdownRoot {
  export type Props = FilterDropdownRootProps;
  export type ChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type ChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
