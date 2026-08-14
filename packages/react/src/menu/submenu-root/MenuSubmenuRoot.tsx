'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { MenuRoot } from '../root/MenuRoot';
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
 * Whether an accepted submenu open came from the keyboard: list navigation, or a trigger/item
 * press whose click carries no mouse gesture (`detail === 0`).
 */
export function isKeyboardOpenReason(details: MenuSubmenuRoot.ChangeEventDetails): boolean {
  const isMouseEvent = ((details.event as MouseEvent | undefined)?.detail ?? 0) > 0;
  return (
    details.reason === REASONS.listNavigation ||
    ((details.reason === REASONS.triggerPress || details.reason === REASONS.itemPress) &&
      !isMouseEvent)
  );
}

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuRoot(props: MenuSubmenuRoot.Props) {
  const { ...rootProps } = props;
  const parent = useMenuRootContext();
  const parentReferenceRef = React.useRef<ParentReference | null>(null);

  function handleSubmenuEnter(trigger: HTMLElement) {
    const focusedElement = parent.store.select('virtualFocus')
      ? parent.store.context.inputRef.current
      : activeElement(ownerDocument(trigger));

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
      parent.store.set('activeIndex', triggerIndex);
    }
  }

  // Handle every accepted keyboard open event (e.g. Click or Space) here so any open
  // will record where to return focus and activeIndex.
  function handleOpenChange(nextOpen: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) {
    props.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled || !isHTMLElement(eventDetails.trigger)) {
      return;
    }

    if (!nextOpen) {
      if (eventDetails.reason === REASONS.escapeKey) {
        parentReferenceRef.current = {
          reference: eventDetails.trigger,
          trigger: eventDetails.trigger,
        };
      }
      return;
    }

    if (isKeyboardOpenReason(eventDetails)) {
      handleSubmenuEnter(eventDetails.trigger);
    }
  }

  return (
    <MenuRoot {...rootProps} isSubmenu onOpenChange={handleOpenChange}>
      <MenuSubmenuRootImpl
        parentOrientation={parent.orientation}
        getReturnElement={() =>
          // Return to the element that actually held focus on entry. This is usually the input in
          // a virtually focused parent, but can be the list's Safari + VoiceOver fallback target.
          parentReferenceRef.current?.reference ??
          (parent.store.select('virtualFocus') ? parent.store.context.inputRef.current : null) ??
          null
        }
        onSubmenuEnter={handleSubmenuEnter}
        onSubmenuExit={handleSubmenuExit}
      >
        {props.children}
      </MenuSubmenuRootImpl>
    </MenuRoot>
  );
}

interface MenuSubmenuRootImplProps {
  children: React.ReactNode;
  parentOrientation: MenuRoot.Orientation;
  onSubmenuEnter(trigger: HTMLElement): void;
  onSubmenuExit(): void;
  getReturnElement(): HTMLElement | null;
}

function MenuSubmenuRootImpl(props: MenuSubmenuRootImplProps) {
  const { children, parentOrientation, onSubmenuEnter, onSubmenuExit, getReturnElement } = props;
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

    const returnElement = getReturnElement() ?? store.select('activeTriggerElement');
    if (
      !store.select('open') &&
      isHTMLElement(returnElement) &&
      activeElement(ownerDocument(returnElement)) !== returnElement
    ) {
      returnElement.focus();
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
      onSubmenuEnter(event.currentTarget);
      if (store.select('virtualFocus')) {
        // Real focus lives on the input, so entering the submenu focuses it rather than
        // highlighting an item.
        store.set('activeIndex', null);
        store.context.inputRef.current?.focus({ preventScroll: true });
      } else {
        const firstItemIndex = getMinListIndex(store.context.itemDomElements, EMPTY_ARRAY);
        const activeIndex = firstItemIndex === -1 ? null : firstItemIndex;
        store.set('activeIndex', activeIndex);
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
   * @ignore
   * Keeps real focus on an input inside the popup and navigates the list with
   * `aria-activedescendant`. Set by parts that render such an input.
   */
  virtualFocus?: boolean | undefined;
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
