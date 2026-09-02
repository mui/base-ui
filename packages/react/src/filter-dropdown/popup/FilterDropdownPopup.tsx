'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
import { focusByPointer, isPointerFocusInProgress } from '../utils/focusByPointer';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { resolveMenuPopupLabel } from '../../menu/popup/resolveMenuPopupLabel';

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
  const { focusOwnerRef } = context;
  const id = resolveRenderedId(componentProps, context.defaultPopupId);
  const { ariaLabelledBy } = resolveMenuPopupLabel(componentProps, null, context.triggerId ?? null);

  // The pointer may only restore focus to an owner that held it during this open session, or
  // hovering an inputless list would seed a highlight. Stores the element rather than a flag so
  // an owner swap doesn't inherit the claim, and clears on close for kept-mounted popups.
  const heldFocusOwnerRef = React.useRef<HTMLElement | null>(null);
  useIsoLayoutEffect(() => {
    if (!context.open) {
      heldFocusOwnerRef.current = null;
    }
  }, [context.open]);

  // Focus that entered a nested popup by keyboard, click, or `autoFocus` stays there until that
  // popup unmounts, so crossing this popup on the way to the submenu doesn't bounce focus between
  // the two inputs. Focus that merely followed the pointer in follows it back out.
  const nestedFocusRef = React.useRef<Element | null>(null);

  const state: FilterDropdownPopupState = { open: context.open };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
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
          // Only pull back focus that drifted outside the popup, unless a nested input retains it.
          if (
            activeEl === focusOwner ||
            activeEl === nestedFocusRef.current ||
            contains(event.currentTarget, activeEl)
          ) {
            return;
          }

          // An input takes focus on pointer enter so typing filters immediately. A list may only
          // restore focus it already held, since focusing it seeds the highlight.
          if (!isTypeableElement(focusOwner) && heldFocusOwnerRef.current !== focusOwner) {
            return;
          }

          // Nested popups are portalled, so their events still bubble through this React tree.
          // The composed path only contains this popup when the pointer is really over it, and a
          // closing popup must not re-capture focus during its exit transition.
          let overSubmenuTrigger = false;
          const nearestPopup = event.nativeEvent.composedPath().find((node) => {
            if (!isHTMLElement(node)) {
              return false;
            }
            if (node.getAttribute('role') === 'dialog' || node.hasAttribute('data-rootownerid')) {
              return true;
            }
            overSubmenuTrigger ||= node.hasAttribute('aria-haspopup');
            return false;
          });
          if (nearestPopup !== event.currentTarget) {
            return;
          }
          // After a submenu that held focus unmounts, a sibling trigger under the pointer may be
          // about to open a popup that takes focus, so leave focus alone until the pointer moves on.
          if (overSubmenuTrigger && nestedFocusRef.current) {
            return;
          }
          focusByPointer(focusOwner);
        },
        onFocus(event) {
          // `focusin` bubbles, so this also sees the owner itself being focused.
          const target = getTarget(event.nativeEvent);
          if (target === focusOwnerRef.current) {
            heldFocusOwnerRef.current = focusOwnerRef.current;
          }

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

          // The list is always vertical, so its cross-axis close key is the inline-start arrow.
          const closeKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
          if (event.key === closeKey) {
            focusOwnerRef.current?.focus({ preventScroll: true });
            // Nested popups bubble through this React tree, so keep the key from the parent.
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
