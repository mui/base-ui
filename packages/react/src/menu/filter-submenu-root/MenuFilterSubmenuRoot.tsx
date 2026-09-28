'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isHTMLElement } from '@floating-ui/utils/dom';
import type { MenuSubmenuRoot, MenuSubmenuRootProps } from '../submenu-root/MenuSubmenuRoot';
import { MenuRootInternal } from '../root/MenuRoot';
import type { MenuRoot } from '../root/MenuRoot';
import type { MenuFilterProviderOptions } from '../filter-provider/MenuFilterProviderOptions';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuFilterDropdown } from '../filter-root/MenuFilterDropdown';
import { isKeyboardOpen } from '../filter-root/isKeyboardOpen';
import { useMenuFilterRoot } from '../filter-root/useMenuFilterRoot';
import type { BaseUIEvent } from '../../internals/types';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/hooks/useListNavigation';
import { activeElement, contains, stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { moveHighlightFrom } from '../filter-root/moveHighlightFrom';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { MenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import type { MenuStore } from '../store/MenuStore';

type ParentReference = { reference: HTMLElement; trigger: HTMLElement };
type TriggerKeyDownEvent = BaseUIEvent<React.KeyboardEvent<HTMLElement>>;

/**
 * The filterable implementation of `Menu.SubmenuRoot`, rendered in its place when the submenu
 * root sits inside `Menu.FilterProvider`.
 *
 * @internal
 */
export function MenuFilterSubmenuRoot(props: MenuFilterSubmenuRootProps): React.JSX.Element {
  const parent = useMenuRootContext();
  const parentStore = parent.store;

  const parentDisabled = parentStore.useState('disabled');
  // A filterable parent's filter root, which this submenu renders inside of.
  const parentFilter = useFilterDropdownRootContext(true);

  const { rootProps, dropdownProps } = useMenuFilterRoot(props);

  const parentReferenceRef = React.useRef<ParentReference | null>(null);

  function handleSubmenuEnter(trigger: HTMLElement) {
    const focusedElement = parent.virtualFocus
      ? parentStore.context.virtualFocusRef?.current
      : activeElement(ownerDocument(trigger));

    if (isHTMLElement(focusedElement)) {
      parentReferenceRef.current = { reference: focusedElement, trigger };
      parentStore.setActiveIndex(null, REASONS.keyboard);
    }
  }

  function highlightTrigger(trigger: HTMLElement) {
    parentStore.highlightItem(trigger, REASONS.keyboard);
  }

  function handleSubmenuExit() {
    const parentReference = parentReferenceRef.current;
    if (!parentReference) {
      return;
    }

    parentReference.reference.focus({ preventScroll: true });
    highlightTrigger(parentReference.trigger);
  }

  function handleOpenChange(nextOpen: boolean, details: MenuSubmenuRoot.ChangeEventDetails) {
    rootProps.onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    if (!nextOpen) {
      if (details.reason === REASONS.escapeKey && isHTMLElement(details.trigger)) {
        highlightTrigger(details.trigger);
        // `MenuPopup` returns focus through `getReturnElement`, so point it at the element that
        // can hold real focus: the parent's input, not its untabbable trigger.
        parentReferenceRef.current = {
          reference: parent.virtualFocus
            ? (parentStore.context.virtualFocusRef?.current ?? details.trigger)
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
      {...rootProps}
      isSubmenu
      disabled={parentDisabled || props.disabled}
      onOpenChange={handleOpenChange}
    >
      <MenuFilterSubmenuNavigation
        parentStore={parentStore}
        parentVirtualFocus={parent.virtualFocus}
        parentAllowEscape={parent.virtualFocus && !parentFilter?.autoHighlight}
        parentOrientation={parent.orientation}
        parentLoopFocus={parent.loopFocus}
        getReturnElement={() =>
          parentReferenceRef.current?.reference ??
          (parent.virtualFocus ? parentStore.context.virtualFocusRef?.current : null) ??
          null
        }
        onSubmenuEnter={handleSubmenuEnter}
        onSubmenuExit={handleSubmenuExit}
      >
        <MenuFilterDropdown {...dropdownProps}>{props.children}</MenuFilterDropdown>
      </MenuFilterSubmenuNavigation>
    </MenuRootInternal>
  );
}

interface MenuFilterSubmenuNavigationProps {
  children: React.ReactNode;
  parentStore: MenuStore<unknown>;
  parentVirtualFocus: boolean;
  parentAllowEscape: boolean;
  parentOrientation: MenuRoot.Orientation;
  parentLoopFocus: boolean;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
  getReturnElement(): HTMLElement | null;
}

function MenuFilterSubmenuNavigation(props: MenuFilterSubmenuNavigationProps) {
  const {
    children,
    parentStore,
    parentVirtualFocus,
    parentAllowEscape,
    parentOrientation,
    parentLoopFocus,
    onSubmenuEnter,
    onSubmenuExit,
    getReturnElement,
  } = props;

  const { store, orientation } = useMenuRootContext();
  const direction = useDirection();

  const mounted = store.useState('mounted');

  const wasMountedRef = React.useRef(false);

  const handleReturnFocus = useStableCallback(() => {
    // A plain parent has no input to return to. Focus the trigger this submenu opened from, as a
    // plain submenu does, so a hover close doesn't strand focus on the body.
    const [ownTrigger] = store.context.triggerElements.elements();
    return getReturnElement() ?? (isHTMLElement(ownTrigger) ? ownTrigger : null);
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

  function moveInParent(from: HTMLElement, key: string) {
    const item = moveHighlightFrom(
      parentStore,
      from,
      key,
      parentOrientation,
      direction === 'rtl',
      parentLoopFocus,
      parentAllowEscape,
    );
    if (!parentVirtualFocus) {
      item?.focus({ preventScroll: true });
    }
  }

  function close(event: React.KeyboardEvent) {
    if (!store.select('open')) {
      return;
    }

    // The key can reach this popup re-dispatched on its highlighted item, so it can't be left to
    // bubble to the parent. A close key that also navigates the parent moves it from here.
    stopEvent(event);
    const trigger = store.select('activeTriggerElement');

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

    if (
      !store.select('open') &&
      isHTMLElement(trigger) &&
      isMainOrientationKey(event.key, parentOrientation)
    ) {
      moveInParent(trigger, event.key);
    }
  }

  const handleTriggerKeyDown = useStableCallback((event: TriggerKeyDownEvent) => {
    if (isMainOrientationKey(event.key, parentOrientation)) {
      moveInParent(event.currentTarget, event.key);
      event.preventBaseUIHandler();
      stopEvent(event);
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
      store.setActiveIndex(null, REASONS.keyboard);
      store.context.virtualFocusRef?.current?.focus({ preventScroll: true });
      return;
    }

    store.setOpen(
      true,
      createChangeEventDetails(REASONS.listNavigation, event.nativeEvent, event.currentTarget),
    );
  });

  const handlePopupKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    // A key that composes text in the input must not close the submenu.
    if (event.which === 229) {
      return;
    }
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

export type MenuFilterSubmenuRootProps = MenuSubmenuRootProps & MenuFilterProviderOptions;
