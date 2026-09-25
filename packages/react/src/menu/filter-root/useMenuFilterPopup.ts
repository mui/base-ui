'use client';
import * as React from 'react';
import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  activeElement,
  contains,
  getTarget,
  isTypeableElement,
} from '../../floating-ui-react/utils';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import {
  focusByPointer,
  isPointerFocusInProgress,
} from '../../filter-dropdown/utils/focusByPointer';
import type { MenuRoot } from '../root/MenuRoot';
import { isCrossOrientationCloseKey } from '../../floating-ui-react/hooks/useListNavigation';
import { useDirection } from '../../internals/direction-context/DirectionContext';

export function useMenuFilterPopup(
  orientation: MenuRoot.Orientation,
): React.HTMLAttributes<HTMLDivElement> {
  const context = useFilterDropdownRootContext();
  const direction = useDirection();
  const { focusOwnerRef } = context;

  // Focus that entered a nested popup by keyboard or click stays there while the
  // pointer crosses the parent popup. Returning to a submenu trigger restores focus to the
  // parent input. Focus that merely followed the pointer in follows it back out.
  const nestedFocusRef = React.useRef<Element | null>(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && context.open && focusOwnerRef.current === null) {
      console.warn(
        'Base UI: a filterable menu opened without a <Menu.Input>. Render the input ' +
          'inside <Menu.Popup>, or drop <Menu.FilterProvider> for a menu that does not filter.',
      );
    }
  }, [context.open, focusOwnerRef]);

  function restoreInputFocus(event: React.MouseEvent<HTMLDivElement>, enteredTrigger: boolean) {
    const focusOwner = focusOwnerRef.current;
    if (!context.open || !focusOwner) {
      return;
    }

    const activeEl = activeElement(ownerDocument(event.currentTarget));
    if (activeEl === focusOwner || contains(event.currentTarget, activeEl)) {
      return;
    }

    // Nested popups are portalled, so their events still bubble through this React tree.
    // The composed path only contains this popup when the pointer is really over it, and a
    // closing popup must not re-capture focus during its exit transition.
    let submenuTrigger: HTMLElement | null = null;
    const nearestPopup = event.nativeEvent.composedPath().find((node) => {
      if (!isHTMLElement(node)) {
        return false;
      }
      if (node.getAttribute('role') === 'dialog' || node.hasAttribute('data-rootownerid')) {
        return true;
      }
      if (node.hasAttribute('aria-haspopup')) {
        submenuTrigger = node;
      }
      return false;
    });
    if (nearestPopup !== event.currentTarget) {
      return;
    }

    // A nested popup that took focus keeps it while the pointer moves over the parent popup.
    // Entering a submenu trigger returns focus to the parent's input.
    if (nestedFocusRef.current && !(enteredTrigger && submenuTrigger)) {
      return;
    }
    if (
      enteredTrigger &&
      submenuTrigger &&
      isElement(event.relatedTarget) &&
      contains(submenuTrigger, event.relatedTarget)
    ) {
      return;
    }
    focusByPointer(focusOwner);
  }

  return {
    // The input owns virtual focus.
    'aria-activedescendant': undefined,
    // Not valid on a dialog; the list's implicit orientation is already vertical.
    'aria-orientation': undefined,
    onMouseDown(event) {
      if (getTarget(event.nativeEvent) === event.currentTarget) {
        // Keep focus on the virtual focus owner when the popup's own background is pressed.
        event.preventDefault();
      }
    },
    onMouseMove(event) {
      restoreInputFocus(event, false);
    },
    onMouseOver(event) {
      if (nestedFocusRef.current) {
        restoreInputFocus(event, true);
      }
    },
    onFocus(event) {
      // `focusin` bubbles, so this also sees the owner itself being focused.
      const target = getTarget(event.nativeEvent);

      // Nested popups are portalled, so their focus events bubble through this React tree
      // while their elements sit outside this one in the DOM.
      if (target === focusOwnerRef.current) {
        nestedFocusRef.current = null;
      } else if (
        isHTMLElement(target) &&
        !contains(event.currentTarget, target) &&
        !isPointerFocusInProgress()
      ) {
        nestedFocusRef.current = target;
      }

      if (context.open && target === event.currentTarget) {
        focusOwnerRef.current?.focus({ preventScroll: true });
      }
    },
    onKeyDown(event) {
      const target = getTarget(event.nativeEvent);
      if (target === focusOwnerRef.current || isTypeableElement(target)) {
        return;
      }

      if (isCrossOrientationCloseKey(event.key, orientation, direction === 'rtl', false)) {
        focusOwnerRef.current?.focus({ preventScroll: true });
        // Nested popups bubble through this React tree, so keep the key from the parent.
        event.stopPropagation();
      }
    },
  };
}
