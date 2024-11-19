'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext';
import { usePopoverPopup } from './usePopoverPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping';
import { FloatingFocusManager } from '@floating-ui/react';
import { InteractionType } from '@base_ui/react/utils/useEnhancedClickHandler';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.OwnerState> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

/**
 * Renders the popover popup element.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.com/components/react-popover/)
 *
 * API:
 *
 * - [PopoverPopup API](https://base-ui.com/components/react-popover/#api-reference-PopoverPopup)
 */
const PopoverPopup = React.forwardRef(function PopoverPopup(
  props: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...otherProps } = props;

  const {
    open,
    openMethod,
    instantType,
    transitionStatus,
    getRootPopupProps,
    titleId,
    descriptionId,
    popupRef,
    mounted,
  } = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

  const { getPopupProps } = usePopoverPopup({
    getProps: getRootPopupProps,
    titleId,
    descriptionId,
  });

  const ownerState: PopoverPopup.OwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
      instant: instantType,
      transitionStatus,
    }),
    [open, positioner.side, positioner.alignment, instantType, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = React.useCallback((interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef;
    }

    return 0;
  }, []);

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      return defaultInitialFocus(openMethod ?? '');
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [defaultInitialFocus, initialFocus, openMethod]);

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    ref: mergedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.positionerContext}
      modal={false}
      disabled={!mounted}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace PopoverPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Determines an element to focus when the popover is opened.
     * It can be either a ref to the element or a function that returns such a ref.
     * If not provided, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines an element to focus after the popover is closed.
     * If not provided, the focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement>;
  }
}

PopoverPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Determines an element to focus after the popover is closed.
   * If not provided, the focus returns to the trigger.
   */
  finalFocus: PropTypes.shape({
    current: (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
  }),
  /**
   * Determines an element to focus when the popover is opened.
   * It can be either a ref to the element or a function that returns such a ref.
   * If not provided, the first focusable element is focused.
   */
  initialFocus: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: (props, propName) => {
        if (props[propName] == null) {
          return null;
        }
        if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
          return new Error(`Expected prop '${propName}' to be of type Element`);
        }
        return null;
      },
    }),
  ]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverPopup };
