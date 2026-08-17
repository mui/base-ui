'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { MenuRoot, MenuRootImpl } from '../root/MenuRoot';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuSubmenuRootContext } from './MenuSubmenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';
import { activeElement, stopEvent } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { getMinListIndex } from '../../floating-ui-react/utils/composite';

export { useMenuSubmenuRootContext } from './MenuSubmenuRootContext';

type ParentReference = { reference: HTMLElement; trigger: HTMLElement };

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuRoot(props: MenuSubmenuRoot.Props) {
  const parent = useMenuRootContext();
  const parentReferenceRef = React.useRef<ParentReference | null>(null);

  function handleSubmenuEnter(trigger: HTMLElement) {
    const focusedElement = activeElement(ownerDocument(trigger));

    if (isHTMLElement(focusedElement)) {
      // Store a reference to the parent reference element (this might be the trigger or an input)
      // and the trigger that opened the submenu.
      parentReferenceRef.current = { reference: focusedElement, trigger };
      parent.store.set('activeIndex', null);
    }
  }

  function handleSubmenuExit() {
    const parentReference = parentReferenceRef.current;
    if (!parentReference) {
      return;
    }

    const parentElements = parent.store.context.itemDomElements;
    const triggerIndex = parentElements.current.indexOf(parentReference.trigger);

    // Restore keyboard exits immediately: FloatingFocusManager also uses this reference as its
    // fallback, but waits for popup unmount, which would delay parent navigation during an exit
    // animation. Both paths therefore share one recorded return target.
    parentReference.reference.focus({ preventScroll: true });
    if (triggerIndex > -1) {
      parent.store.update({ activeIndex: triggerIndex, inputFocusVisible: false });
    }
  }

  // Handle every accepted keyboard open event (e.g. Click or Space) here so any open
  // will record where to return focus and activeIndex.
  function handleOpenChange(nextOpen: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) {
    props.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled || !nextOpen || !isHTMLElement(eventDetails.trigger)) {
      return;
    }

    const isTriggerPress = eventDetails.reason === REASONS.triggerPress;
    const isItemPress = eventDetails.reason === REASONS.itemPress;
    const isListNavigation = eventDetails.reason === REASONS.listNavigation;
    const isMouseEvent = (eventDetails.event as MouseEvent).detail > 0;
    const isKeyboardClick = (isTriggerPress || isItemPress) && !isMouseEvent;

    if (isListNavigation || isKeyboardClick) {
      handleSubmenuEnter(eventDetails.trigger);
    }
  }

  return (
    <MenuRootImpl {...props} isSubmenu onOpenChange={handleOpenChange}>
      <MenuSubmenuRootImpl
        parentOrientation={parent.orientation}
        parentFilterable={parent.store.select('filterable')}
        getReturnElement={() => parentReferenceRef.current?.reference ?? null}
        onSubmenuEnter={handleSubmenuEnter}
        onSubmenuExit={handleSubmenuExit}
      >
        {props.children}
      </MenuSubmenuRootImpl>
    </MenuRootImpl>
  );
}

interface MenuSubmenuRootImplProps {
  children: React.ReactNode;
  parentOrientation: MenuRoot.Orientation;
  parentFilterable: boolean;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
  getReturnElement(): HTMLElement | null;
}

function MenuSubmenuRootImpl(props: MenuSubmenuRootImplProps) {
  const {
    children,
    parentOrientation,
    parentFilterable,
    onSubmenuEnter,
    onSubmenuExit,
    getReturnElement,
  } = props;
  const { store, orientation } = useMenuRootContext();
  const direction = useDirection();

  function close(event: React.KeyboardEvent) {
    if (!isMainOrientationKey(event.key, parentOrientation)) {
      stopEvent(event);
    }

    const eventDetails = createChangeEventDetails(REASONS.listNavigation, event.nativeEvent);
    store.setOpen(false, eventDetails);

    if (!eventDetails.isCanceled) {
      onSubmenuExit();
    }

    const triggerElement = store.select('activeTriggerElement');
    if (!store.select('open') && !parentFilterable && isHTMLElement(triggerElement)) {
      triggerElement.focus();
    }
  }

  // Submenu entry and exit use cross-axis keys derived from both the parent and child
  // orientations. Enter and Space continue through useClick and are handled on open change.
  const handleTriggerKeyDown = useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
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
      const filterable = store.select('filterable');
      onSubmenuEnter(event.currentTarget);

      if (filterable) {
        store.context.inputRef.current?.focus({ preventScroll: true });
        store.update({ activeIndex: null, inputFocusVisible: true });
      } else {
        const firstItemIndex = getMinListIndex(store.context.itemDomElements, EMPTY_ARRAY);
        const activeIndex = firstItemIndex === -1 ? null : firstItemIndex;
        store.update({ activeIndex, inputFocusVisible: false });
      }
      return;
    }

    const eventDetails = createChangeEventDetails(
      REASONS.listNavigation,
      event.nativeEvent,
      event.currentTarget,
    );

    store.setOpen(true, eventDetails);
  });

  const handlePopupKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    const isRtl = direction === 'rtl';
    const isCloseKey = isCrossOrientationCloseKey(event.key, orientation, isRtl, false);
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

type MenuSubmenuRootBaseProps = Omit<
  MenuRoot.Props,
  | 'modal'
  | 'openOnHover'
  | 'onOpenChange'
  | 'handle'
  | 'triggerId'
  | 'defaultTriggerId'
  | 'children'
>;

export type MenuSubmenuRootProps = MenuSubmenuRootBaseProps & {
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * When in a submenu, determines whether pressing the Escape key
   * closes the entire menu, or only the current child menu.
   * @default false
   */
  closeParentOnEsc?: boolean | undefined;
  /**
   * The content of the submenu.
   */
  children?: React.ReactNode;
};

export interface MenuSubmenuRootState {}

export type MenuSubmenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuSubmenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;

export namespace MenuSubmenuRoot {
  export type Props = MenuSubmenuRootProps;
  export type State = MenuSubmenuRootState;
  export type ChangeEventReason = MenuSubmenuRootChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRootChangeEventDetails;
}
