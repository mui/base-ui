'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument } from '@base-ui/utils/owner';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import {
  type MenuSubmenuRoot,
  type MenuSubmenuRootProps,
} from '../../menu/submenu-root/MenuSubmenuRoot';
import { MenuRootInternal, type MenuRoot } from '../../menu/root/MenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterMenuRootFilterProps } from '../utils/FilterMenuRootFilterProps';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { FilterMenuProvider, isKeyboardOpen } from '../root/FilterMenuRoot';
import type { BaseUIEvent } from '../../internals/types';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';
import { activeElement, stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { findNonDisabledListIndex } from '../../floating-ui-react/utils/composite';
import { MenuSubmenuRootContext } from '../../menu/submenu-root/MenuSubmenuRootContext';
import type { MenuStore } from '../../menu/store/MenuStore';

type ParentReference = { reference: HTMLElement; trigger: HTMLElement };

/**
 * Groups all parts of a filterable submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
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
    autoHighlight = false,
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
  const [hasInput, setHasInput] = React.useState(false);

  const parentReferenceRef = React.useRef<ParentReference | null>(null);
  const focusOwnerRef = React.useRef<HTMLElement | null>(null);

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

  function highlightTrigger(trigger: HTMLElement) {
    const triggerIndex = parentStore.context.itemDomElements.current.indexOf(trigger);
    if (triggerIndex > -1) {
      parentStore.set('activeIndex', triggerIndex);
    }
  }

  function handleSubmenuExit() {
    const parentReference = parentReferenceRef.current;
    if (!parentReference) {
      return;
    }

    parentReference.reference.focus({ preventScroll: true });
    highlightTrigger(parentReference.trigger);
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
        highlightTrigger(details.trigger);
        // `MenuPopup` returns focus through `getReturnElement`, so point it at the element that
        // can hold real focus: the parent's input under virtual focus, not its tabbable-less
        // trigger.
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
      virtualFocusInput={hasInput}
      allowEscape={hasInput && !autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={(_, inputProps) => (
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
        >
          <FilterMenuProvider
            open={open}
            inputFocusVisible={inputFocusVisible}
            value={inputValue}
            query={closeQuery.query}
            filter={filter}
            autoHighlight={autoHighlight}
            locale={locale}
            inputProps={inputProps}
            onValueChange={handleInputValueChange}
            onInputElementChange={setHasInput}
          >
            {children}
          </FilterMenuProvider>
        </FilterMenuSubmenuNavigation>
      )}
    />
  );
}

interface FilterMenuSubmenuNavigationProps {
  children: React.ReactNode;
  parentStore: MenuStore<unknown>;
  parentOrientation: MenuRoot.Orientation;
  parentLoopFocus: boolean;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
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
    getReturnElement,
  } = props;

  const { store, orientation, virtualFocusRef } = useMenuRootContext();
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
      const decrement = !movesForward;
      // `EMPTY_ARRAY` is what the parent menu passes to `useListNavigation`, and it keeps
      // `aria-disabled` items reachable so they stay discoverable. Omitting the option makes
      // `findNonDisabledListIndex` fall back to the attribute check and skip them, which would
      // make arrowing past this trigger behave differently from arrowing between ordinary items.
      let nextIndex = findNonDisabledListIndex(items, {
        startingIndex: currentIndex,
        decrement,
        disabledIndices: EMPTY_ARRAY,
      });

      if (parentLoopFocus && (nextIndex < 0 || nextIndex >= items.length)) {
        nextIndex = findNonDisabledListIndex(items, {
          startingIndex: decrement ? items.length : -1,
          decrement,
          disabledIndices: EMPTY_ARRAY,
        });
      }

      const item = items[nextIndex];
      if (item) {
        parentStore.set('activeIndex', nextIndex);
        item.focus({ preventScroll: true });
        item.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }

      (event as unknown as BaseUIEvent<React.KeyboardEvent>).preventBaseUIHandler();
      event.stopPropagation();
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
      // Re-entering an already-open submenu hands the cursor to its own focus owner. The submenu
      // is always virtually focused, so there is no roving-focus branch here.
      onSubmenuEnter(event.currentTarget);
      store.set('activeIndex', null);
      virtualFocusRef?.current?.focus({ preventScroll: true });
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
  'actionsRef' | 'open' | 'defaultOpen' | 'onOpenChange' | 'orientation'
> &
  Omit<FilterMenuRootFilterProps, 'defaultInputValue' | 'onInputValueChange'> & {
    /**
     * A ref to imperative actions.
     */
    actionsRef?: React.RefObject<FilterMenuSubmenuRootActions | null> | undefined;
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
     * The uncontrolled filter query when the submenu is initially rendered.
     * To render a controlled query, use the `inputValue` prop instead.
     */
    defaultInputValue?: string | undefined;
    /**
     * Event handler called when the filter query changes.
     */
    onInputValueChange?:
      | ((value: string, eventDetails: FilterMenuSubmenuRoot.InputValueChangeEventDetails) => void)
      | undefined;
    children?: React.ReactNode;
  };

export interface FilterMenuSubmenuRootState extends MenuSubmenuRoot.State {}
export type FilterMenuSubmenuRootActions = MenuRoot.Actions;
export type FilterMenuSubmenuRootChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
export type FilterMenuSubmenuRootChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
export type FilterMenuSubmenuRootInputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type FilterMenuSubmenuRootInputValueChangeEventDetails =
  FilterDropdownRoot.ChangeEventDetails;

export namespace FilterMenuSubmenuRoot {
  export type Props = FilterMenuSubmenuRootProps;
  export type State = FilterMenuSubmenuRootState;
  export type Actions = FilterMenuSubmenuRootActions;
  export type ChangeEventReason = FilterMenuSubmenuRootChangeEventReason;
  export type ChangeEventDetails = FilterMenuSubmenuRootChangeEventDetails;
  export type InputValueChangeEventReason = FilterMenuSubmenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = FilterMenuSubmenuRootInputValueChangeEventDetails;
}
