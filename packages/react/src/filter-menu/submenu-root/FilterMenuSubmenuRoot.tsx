'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument } from '@base-ui/utils/owner';
import { useControlled } from '@base-ui/utils/useControlled';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import {
  type MenuSubmenuRoot,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { MenuRootInternal, type MenuRoot } from '../../menu/root/MenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterMenuFilter } from '../root/FilterMenuRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { FilterMenuProvider, isKeyboardOpen } from '../root/FilterMenuRoot';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../utils/listNavigation';
import { activeElement, stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { getMinListIndex } from '../../floating-ui-react/utils/composite';
import { MenuSubmenuRootContext } from '../../menu/submenu-root/MenuSubmenuRootContext';
import type { MenuStore } from '../../menu/store/MenuStore';

type ParentReference = { reference: HTMLElement; trigger: HTMLElement };

export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    filter,
    disabled: disabledProp,
    locale,
    children,
    ...submenuProps
  } = props;

  const parent = useMenuRootContext();
  const parentStore = parent.store;
  const parentDisabled = parentStore.useState('disabled');

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterMenuSubmenu',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterMenuSubmenu',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);

  const parentReferenceRef = React.useRef<ParentReference | null>(null);
  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const inputPropsRef = React.useRef<HTMLProps>({});

  const disabled = parentDisabled || disabledProp;

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  const closeQuery = useFilterDropdownCloseQuery({
    open,
    value: inputValue,
    onValueChange: handleInputValueChange,
    onOpenChangeComplete,
  });

  function handleSubmenuEnter(trigger: HTMLElement) {
    const focusedElement = parent.virtualFocus
      ? parent.virtualFocusRef?.current
      : activeElement(ownerDocument(trigger));

    if (isHTMLElement(focusedElement)) {
      parentReferenceRef.current = { reference: focusedElement, trigger };
      parentStore.set('activeIndex', null);
    }
  }

  function handleSubmenuExit() {
    const parentReference = parentReferenceRef.current;
    if (!parentReference) {
      return;
    }

    const triggerIndex = parentStore.context.itemDomElements.current.indexOf(
      parentReference.trigger,
    );

    parentReference.reference.focus({ preventScroll: true });
    if (triggerIndex > -1) {
      parentStore.set('activeIndex', triggerIndex);
    }
  }

  function handleParentNavigation() {
    if (parent.virtualFocus) {
      parent.virtualFocusRef?.current?.focus({ preventScroll: true });
    }
  }

  function handleOpenChange(nextOpen: boolean, details: FilterMenuSubmenuRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    closeQuery.handleOpenChange(nextOpen);
    setOpen(nextOpen);
    setInputFocusVisible(nextOpen && isKeyboardOpen(details));

    if (!nextOpen) {
      if (details.reason === REASONS.escapeKey && isHTMLElement(details.trigger)) {
        const triggerIndex = parentStore.context.itemDomElements.current.indexOf(details.trigger);
        if (triggerIndex > -1) {
          parentStore.set('activeIndex', triggerIndex);
        }
        parentReferenceRef.current = {
          reference: parent.virtualFocus
            ? (parent.virtualFocusRef?.current ?? details.trigger)
            : details.trigger,
          trigger: details.trigger,
        };
      }
      return;
    }

    parentReferenceRef.current = null;
    if (isHTMLElement(details.trigger) && isKeyboardOpen(details)) {
      handleSubmenuEnter(details.trigger);
    }
  }

  return (
    <MenuRootInternal
      {...submenuProps}
      isSubmenu
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      virtualFocus
      virtualFocusRef={focusOwnerRef}
      virtualFocusPropsRef={inputPropsRef}
    >
      <FilterMenuSubmenuNavigation
        parentStore={parentStore}
        parentOrientation={parent.orientation}
        parentLoopFocus={parent.loopFocus}
        getReturnElement={() =>
          parentReferenceRef.current?.reference ??
          (parent.virtualFocus ? parent.virtualFocusRef?.current : null) ??
          null
        }
        onSubmenuEnter={handleSubmenuEnter}
        onSubmenuExit={handleSubmenuExit}
        onParentNavigation={handleParentNavigation}
      >
        <FilterMenuProvider
          open={open}
          inputFocusVisible={inputFocusVisible}
          value={inputValue}
          query={closeQuery.query}
          filter={filter}
          locale={locale}
          onValueChange={handleInputValueChange}
        >
          {children}
        </FilterMenuProvider>
      </FilterMenuSubmenuNavigation>
    </MenuRootInternal>
  );
}

interface FilterMenuSubmenuNavigationProps {
  children: React.ReactNode;
  parentStore: MenuStore<unknown>;
  parentOrientation: MenuRoot.Orientation;
  parentLoopFocus: boolean;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
  onParentNavigation(): void;
  getReturnElement(): HTMLElement | null;
}

function FilterMenuSubmenuNavigation(props: FilterMenuSubmenuNavigationProps) {
  const {
    children,
    parentStore,
    parentOrientation,
    parentLoopFocus,
    onSubmenuEnter,
    onSubmenuExit,
    onParentNavigation,
    getReturnElement,
  } = props;

  const { store, orientation, virtualFocus, virtualFocusRef } = useMenuRootContext();
  const direction = useDirection();

  function close(event: React.KeyboardEvent) {
    if (!store.select('open')) {
      return;
    }

    if (!isMainOrientationKey(event.key, parentOrientation)) {
      stopEvent(event);
    }

    const eventDetails = createChangeEventDetails(REASONS.listNavigation, event.nativeEvent);
    store.setOpen(false, eventDetails);

    if (!eventDetails.isCanceled) {
      onSubmenuExit();
    }

    const returnElement = getReturnElement() ?? store.select('activeTriggerElement');
    if (
      !store.select('open') &&
      isHTMLElement(returnElement) &&
      activeElement(ownerDocument(returnElement)) !== returnElement
    ) {
      returnElement.focus();
    }
  }

  const handleTriggerKeyDown = useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (isMainOrientationKey(event.key, parentOrientation)) {
      const items = parentStore.context.itemDomElements.current;
      const currentIndex = items.indexOf(event.currentTarget);
      const movesForward =
        parentOrientation === 'vertical'
          ? event.key === 'ArrowDown'
          : event.key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      let nextIndex = currentIndex;

      for (let offset = 0; offset < items.length; offset += 1) {
        nextIndex += movesForward ? 1 : -1;
        if (nextIndex < 0 || nextIndex >= items.length) {
          if (!parentLoopFocus) {
            break;
          }
          nextIndex = nextIndex < 0 ? items.length - 1 : 0;
        }

        const item = items[nextIndex];
        if (item && !isElementDisabled(item)) {
          parentStore.set('activeIndex', nextIndex);
          item.focus({ preventScroll: true });
          break;
        }
      }

      (event as unknown as BaseUIEvent<React.KeyboardEvent>).preventBaseUIHandler();
      event.stopPropagation();
      onParentNavigation();
      return;
    }

    const open = store.select('open');
    const isRtl = direction === 'rtl';
    const isCloseKey = isCrossOrientationCloseKey(event.key, orientation, isRtl, false);

    if (open && isCloseKey) {
      close(event);
      return;
    }

    const isOpenKey = isCrossOrientationOpenKey(event.key, parentOrientation, isRtl);
    if (!isOpenKey) {
      return;
    }

    stopEvent(event);

    if (open) {
      onSubmenuEnter(event.currentTarget);
      if (virtualFocus) {
        store.set('activeIndex', null);
        virtualFocusRef?.current?.focus({ preventScroll: true });
      } else {
        const firstItemIndex = getMinListIndex(store.context.itemDomElements, EMPTY_ARRAY);
        store.set('activeIndex', firstItemIndex === -1 ? null : firstItemIndex);
      }
      return;
    }

    store.setOpen(
      true,
      createChangeEventDetails(REASONS.listNavigation, event.nativeEvent, event.currentTarget),
    );
  });

  const handlePopupKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    const isCloseKey = isCrossOrientationCloseKey(
      event.key,
      orientation,
      direction === 'rtl',
      false,
    );
    if (isCloseKey) {
      close(event);
    }
  });

  const handleGetReturnElement = useStableCallback(getReturnElement);
  const contextValue = React.useMemo(
    () => ({
      getReturnElement: handleGetReturnElement,
      onTriggerKeyDown: handleTriggerKeyDown,
      onPopupKeyDown: handlePopupKeyDown,
    }),
    [handleGetReturnElement, handleTriggerKeyDown, handlePopupKeyDown],
  );

  return (
    <MenuSubmenuRootContext.Provider value={contextValue}>
      {children}
    </MenuSubmenuRootContext.Provider>
  );
}

export type FilterMenuSubmenuRootProps = Omit<
  MenuSubmenuRootProps,
  'open' | 'defaultOpen' | 'onOpenChange'
> & {
  /**
   * Whether the submenu is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the submenu is initially open.
   *
   * To render a controlled submenu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the submenu is opened or closed.
   */
  onOpenChange?:
    ((open: boolean, eventDetails: FilterMenuSubmenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Replaces the default case-insensitive substring matching for item text.
   * Receives an item's filter text and the trimmed query. When provided, this function is
   * authoritative and item keywords are ignored.
   */
  filter?: FilterMenuFilter | undefined;
  /**
   * Locale used when comparing an item against the query.
   * Defaults to the runtime's default locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The uncontrolled filter query when the submenu is initially rendered.
   * To render a controlled query, use the `inputValue` prop instead.
   */
  defaultInputValue?: string | undefined;
  /**
   * The filter query. Use when controlled.
   * The query is cleared when the popup closes.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the filter query changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => void)
    | undefined;
  children?: React.ReactNode;
};

export type FilterMenuSubmenuRootState = MenuSubmenuRoot.State;
export type FilterMenuSubmenuRootChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
export type FilterMenuSubmenuRootChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
export type FilterMenuSubmenuRootInputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type FilterMenuSubmenuRootInputValueChangeEventDetails =
  FilterDropdownRoot.ChangeEventDetails;

export namespace FilterMenuSubmenuRoot {
  export type Props = FilterMenuSubmenuRootProps;
  export type State = FilterMenuSubmenuRootState;
  export type ChangeEventReason = FilterMenuSubmenuRootChangeEventReason;
  export type ChangeEventDetails = FilterMenuSubmenuRootChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuSubmenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuSubmenuRootInputValueChangeEventDetails;
}
