'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { getTarget } from '../../floating-ui-react/utils';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { useRenderedId } from '../../internals/useRenderedId';

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
  const { focusOwnerRef, setPopupId } = context;
  const id = idProp ?? context.defaultPopupId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  const renderedIdRef = useRenderedId(setPopupId, context.defaultPopupId, idProp != null);

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
          // Nested popups are portalled, so their events still bubble through this React tree.
          // The composed path only contains this popup when the pointer is really over it, and a
          // closing popup must not re-capture focus during its exit transition.
          const nearestPopup = event.nativeEvent
            .composedPath()
            .find(
              (node) =>
                isHTMLElement(node) &&
                (node.getAttribute('role') === 'dialog' || node.hasAttribute('data-rootownerid')),
            );
          if (context.open && nearestPopup === event.currentTarget) {
            focusOwnerRef.current?.focus({ preventScroll: true });
          }
        },
        onFocus(event) {
          if (context.open && getTarget(event.nativeEvent) === event.currentTarget) {
            focusOwnerRef.current?.focus({ preventScroll: true });
          }
        },
        onKeyDown(event) {
          if (event.key === 'ArrowLeft' && event.target !== focusOwnerRef.current) {
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
