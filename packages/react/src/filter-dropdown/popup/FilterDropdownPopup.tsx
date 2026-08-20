'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { popupStateMapping } from '../../utils/popupStateMapping';
import {
  activeElement,
  contains,
  getTarget,
  isTypeableElement,
} from '../../floating-ui-react/utils';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { useRenderedId } from '../../internals/useRenderedId';
import { useDirection } from '../../internals/direction-context/DirectionContext';

const stateAttributesMapping: StateAttributesMapping<FilterDropdownPopupState> = {
  open: popupStateMapping.open,
};

/**
 * @internal
 */
export const FilterDropdownPopup = React.forwardRef(function FilterDropdownPopup(
  componentProps: FilterDropdownPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const context = useFilterDropdownRootContext();
  const direction = useDirection();
  const { focusOwnerRef, setPopupId } = context;
  const id = idProp ?? context.defaultPopupId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  const renderedIdRef = useRenderedId(setPopupId, context.defaultPopupId, idProp != null);
  // The pointer may only restore focus to an owner that held it during THIS open session.
  // Moving the pointer into a popup whose owner has never been focused (an inputless list opened
  // by a pointer, where focus stays on the trigger) must not hand it focus, because that seeds a
  // highlight on the first item while the cursor is nowhere near it. Stores the element rather
  // than a flag so swapping the owner (an input unmounting, leaving the list) does not inherit
  // the previous owner's claim, and clears on close so a kept-mounted popup starts over.
  const heldFocusOwnerRef = React.useRef<HTMLElement | null>(null);
  if (!context.open && heldFocusOwnerRef.current !== null) {
    heldFocusOwnerRef.current = null;
  }

  const state: FilterDropdownPopupState = { open: context.open };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, renderedIdRef],
    props: [
      {
        id,
        role: 'dialog',
        'aria-labelledby': ariaLabelledBy,
        // The input, or the list when the input is omitted, owns virtual focus.
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
          // This fires for every pointer frame over the popup, so bail before the path walk.
          const focusOwner = focusOwnerRef.current;
          if (!context.open || !focusOwner) {
            return;
          }

          const activeEl = activeElement(ownerDocument(event.currentTarget));
          // Already where it belongs, or deliberately on another control inside this popup (a
          // header button, a secondary field). Only focus that drifted outside is pulled back.
          if (activeEl === focusOwner || contains(event.currentTarget, activeEl)) {
            return;
          }

          // An input takes focus on pointer enter so typing filters immediately. A list cannot:
          // focusing it seeds the highlight onto the first item, so the pointer may only restore
          // focus it already held (for example after a submenu handed it back).
          if (!isTypeableElement(focusOwner) && heldFocusOwnerRef.current !== focusOwner) {
            return;
          }

          // Nested popups are portalled, so their events still bubble through this React tree.
          // The composed path only contains this popup when the pointer is really over it, and a
          // closing popup must not re-capture focus during its exit transition.
          let overOpenSubmenuTrigger = false;
          const nearestPopup = event.nativeEvent.composedPath().find((node) => {
            if (!isHTMLElement(node)) {
              return false;
            }
            if (node.getAttribute('role') === 'dialog' || node.hasAttribute('data-rootownerid')) {
              return true;
            }
            overOpenSubmenuTrigger ||= node.hasAttribute('data-popup-open');
            return false;
          });
          // An open submenu owns focus while the pointer rests on its trigger, so don't pull
          // focus back from the submenu's input.
          if (!overOpenSubmenuTrigger && nearestPopup === event.currentTarget) {
            focusOwner.focus({ preventScroll: true });
          }
        },
        onFocus(event) {
          // `focusin` bubbles, so this also sees the owner itself being focused.
          const target = getTarget(event.nativeEvent);
          if (target === focusOwnerRef.current) {
            heldFocusOwnerRef.current = focusOwnerRef.current;
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

          // The list is always vertical, so its cross-axis close key is the inline-start arrow.
          const closeKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
          if (event.key === closeKey) {
            focusOwnerRef.current?.focus({ preventScroll: true });
            event.stopPropagation();
          }
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });
});

export interface FilterDropdownPopupState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
}

export interface FilterDropdownPopupProps extends BaseUIComponentProps<
  'div',
  FilterDropdownPopupState
> {
  id?: string | undefined;
}

export namespace FilterDropdownPopup {
  export type Props = FilterDropdownPopupProps;
  export type State = FilterDropdownPopupState;
}
