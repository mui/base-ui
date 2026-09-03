'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument } from '@base-ui/utils/owner';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { type MenuSubmenuRoot, type MenuSubmenuRootProps } from '../submenu-root/MenuSubmenuRoot';
import { MenuRootInternal, type MenuRoot } from '../root/MenuRoot';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import type { MenuFilterRootFilterProps } from '../filter-root/MenuFilterRootFilterProps';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuFilterDropdown } from '../filter-root/MenuFilterDropdown';
import { MenuFilterImplContext } from '../filter-root/MenuFilterContext';
import { MENU_FILTER_IMPL } from '../filter-root/MenuFilterImpl';
import { isKeyboardOpen } from '../filter-root/isKeyboardOpen';
import { useMenuFilterWebkitItemSelected } from '../filter-root/useMenuFilterWebkitItemSelected';
import type { BaseUIEvent } from '../../internals/types';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';
import { activeElement, contains, stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { findNonDisabledListIndex } from '../../floating-ui-react/utils/composite';
import { MenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import type { MenuStore } from '../store/MenuStore';

type ParentReference = { reference: HTMLElement; trigger: HTMLElement };

/**
 * Groups all parts of a filterable submenu. Takes the place of `Menu.SubmenuRoot`.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuFilterSubmenuRoot(props: MenuFilterSubmenuRoot.Props): React.JSX.Element {
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
    name: 'MenuFilterSubmenuRoot',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'MenuFilterSubmenuRoot',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);
  const [inputAutoFocus, setInputAutoFocus] = React.useState(false);

  const parentReferenceRef = React.useRef<ParentReference | null>(null);
  const focusOwnerRef = React.useRef<HTMLElement | null>(null);
  const webkitItemSelected = useMenuFilterWebkitItemSelected();

  const disabled = parentDisabled || disabledProp;

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: MenuFilterSubmenuRoot.InputValueChangeEventDetails) => {
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

  function handleOpenChange(nextOpen: boolean, details: MenuFilterSubmenuRoot.ChangeEventDetails) {
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
        // can hold real focus: the parent's input, not its untabbable trigger.
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
      webkitItemSelected={webkitItemSelected}
      virtualFocusRef={focusOwnerRef}
      virtualFocusAutoFocus={inputAutoFocus}
      allowEscape={!autoHighlight}
      resetOnPointerLeave={autoHighlight !== 'always'}
      renderVirtualFocusChildren={(_, inputProps) => (
        <MenuFilterSubmenuNavigation
          parentStore={parentStore}
          inputAutoFocus={inputAutoFocus}
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
          <MenuFilterImplContext.Provider value={MENU_FILTER_IMPL}>
            <MenuFilterDropdown
              open={open}
              inputFocusVisible={inputFocusVisible}
              value={inputValue}
              query={closeQuery.query}
              filter={filter}
              autoHighlight={autoHighlight}
              locale={locale}
              inputProps={inputProps}
              onValueChange={handleInputValueChange}
              onInputAutoFocusChange={setInputAutoFocus}
            >
              {children}
            </MenuFilterDropdown>
          </MenuFilterImplContext.Provider>
        </MenuFilterSubmenuNavigation>
      )}
    />
  );
}

interface MenuFilterSubmenuNavigationProps {
  children: React.ReactNode;
  parentStore: MenuStore<unknown>;
  parentOrientation: MenuRoot.Orientation;
  parentLoopFocus: boolean;
  inputAutoFocus: boolean;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
  getReturnElement(): HTMLElement | null;
}

function MenuFilterSubmenuNavigation(props: MenuFilterSubmenuNavigationProps) {
  const {
    children,
    parentStore,
    parentOrientation,
    parentLoopFocus,
    inputAutoFocus,
    onSubmenuEnter,
    onSubmenuExit,
    getReturnElement,
  } = props;

  const { store, orientation, virtualFocusRef } = useMenuRootContext();
  const direction = useDirection();
  const mounted = store.useState('mounted');
  const wasMountedRef = React.useRef(false);

  const handleGetReturnElement = useStableCallback(getReturnElement);

  const handleReturnFocus = useStableCallback(() => {
    // With auto-focusing submenus, a sibling trigger under the pointer is about to open a popup
    // that takes focus, so returning focus to the parent input in the meantime would only flash
    // its highlight. If that submenu never opens, the parent popup reclaims focus on the next
    // pointer move.
    const activeIndex = parentStore.select('activeIndex');
    const highlighted =
      activeIndex == null ? null : parentStore.context.itemDomElements.current[activeIndex];
    if (
      inputAutoFocus &&
      highlighted &&
      highlighted.hasAttribute('aria-haspopup') &&
      !store.context.triggerElements.hasElement(highlighted)
    ) {
      return false;
    }
    return handleGetReturnElement();
  });

  // A hover close makes the focus manager skip its return focus, which would strand the
  // submenu input's focus on the body once the popup unmounts. This runs in the effect body
  // rather than a cleanup: React drops the focus event when it fires during the mutation phase,
  // so the input would never learn it holds focus.
  useIsoLayoutEffect(() => {
    const wasMounted = wasMountedRef.current;
    wasMountedRef.current = mounted;
    if (mounted || !wasMounted) {
      return;
    }

    const returnElement = handleReturnFocus();
    if (!returnElement || !parentStore.select('open')) {
      return;
    }
    const doc = ownerDocument(returnElement);
    const activeEl = activeElement(doc);
    if (activeEl === doc.body || contains(store.select('popupElement'), activeEl)) {
      returnElement.focus({ preventScroll: true });
    }
  }, [mounted, store, parentStore, handleReturnFocus]);

  function close(event: React.KeyboardEvent) {
    if (!store.select('open')) {
      return;
    }

    // If this close key is also the parent's navigation key, let it through so the parent
    // navigates too. Otherwise stop propagating it.
    if (!isMainOrientationKey(event.key, parentOrientation)) {
      stopEvent(event);
    }

    const eventDetails = createChangeEventDetails(REASONS.listNavigation, event.nativeEvent);
    store.setOpen(false, eventDetails);

    if (!eventDetails.isCanceled) {
      onSubmenuExit();
    }

    // `onSubmenuExit` bails when the submenu was opened by pointer, so return focus here.
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

  const contextValue = React.useMemo(
    () => ({
      getReturnElement: handleReturnFocus,
      onTriggerKeyDown: handleTriggerKeyDown,
      onPopupKeyDown: handlePopupKeyDown,
    }),
    [handleReturnFocus, handleTriggerKeyDown, handlePopupKeyDown],
  );

  return (
    <MenuSubmenuRootContext.Provider value={contextValue}>
      {children}
    </MenuSubmenuRootContext.Provider>
  );
}

export type MenuFilterSubmenuRootProps = Omit<
  MenuSubmenuRootProps,
  'actionsRef' | 'open' | 'defaultOpen' | 'onOpenChange' | 'orientation'
> &
  Omit<MenuFilterRootFilterProps, 'defaultInputValue' | 'onInputValueChange'> & {
    /**
     * A ref to imperative actions.
     */
    actionsRef?: React.RefObject<MenuFilterSubmenuRootActions | null> | undefined;
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
      ((open: boolean, eventDetails: MenuFilterSubmenuRoot.ChangeEventDetails) => void) | undefined;
    /**
     * The uncontrolled filter query when the submenu is initially rendered.
     * To render a controlled query, use the `inputValue` prop instead.
     */
    defaultInputValue?: string | undefined;
    /**
     * Event handler called when the filter query changes.
     */
    onInputValueChange?:
      | ((value: string, eventDetails: MenuFilterSubmenuRoot.InputValueChangeEventDetails) => void)
      | undefined;
    children?: React.ReactNode;
  };

export interface MenuFilterSubmenuRootState extends MenuSubmenuRoot.State {}
export type MenuFilterSubmenuRootActions = MenuRoot.Actions;
export type MenuFilterSubmenuRootChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
export type MenuFilterSubmenuRootChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
export type MenuFilterSubmenuRootInputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type MenuFilterSubmenuRootInputValueChangeEventDetails =
  FilterDropdownRoot.ChangeEventDetails;

export namespace MenuFilterSubmenuRoot {
  export type Props = MenuFilterSubmenuRootProps;
  export type State = MenuFilterSubmenuRootState;
  export type Actions = MenuFilterSubmenuRootActions;
  export type ChangeEventReason = MenuFilterSubmenuRootChangeEventReason;
  export type ChangeEventDetails = MenuFilterSubmenuRootChangeEventDetails;
  export type InputValueChangeEventReason = MenuFilterSubmenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuFilterSubmenuRootInputValueChangeEventDetails;
}
