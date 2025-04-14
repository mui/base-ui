'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import { mergeProps } from '../../merge-props';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { inertValue } from '../../utils/inertValue';

const customStyleHookMapping: CustomStyleHookMapping<NavigationMenuContent.State> = {
  ...transitionStatusMapping,
  activationDirection(value) {
    if (value === 'left') {
      return { 'data-activation-direction': 'left' };
    }
    if (value === 'right') {
      return { 'data-activation-direction': 'right' };
    }
    return null;
  },
};

/**
 * A container for the content of the navigation menu item that is moved into the popup
 * when the item is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuContent = React.forwardRef(function NavigationMenuContent(
  componentProps: NavigationMenuContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const {
    mounted: popupMounted,
    viewportElement,
    value,
    activationDirection,
    currentContentRef,
  } = useNavigationMenuRootContext();
  const itemValue = useNavigationMenuItemContext();

  const open = popupMounted && value === itemValue;

  const ref = React.useRef<HTMLDivElement | null>(null);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useOpenChangeComplete({
    ref,
    open,
    onComplete() {
      if (!open) {
        setMounted(false);
      }
    },
  });

  const state: NavigationMenuContent.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
      activationDirection,
    }),
    [open, transitionStatus, activationDirection],
  );

  const handleCurrentContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        currentContentRef.current = node;
      }
    },
    [currentContentRef],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref, handleCurrentContentRef],
    props: mergeProps<'div'>(
      !open && mounted
        ? {
            style: { position: 'absolute', top: 0, left: 0 },
            inert: inertValue(true),
          }
        : {},
      elementProps,
    ),
    customStyleHookMapping,
  });

  if (!viewportElement || !mounted) {
    return null;
  }

  return ReactDOM.createPortal(
    <CompositeRoot render={renderElement()} stopEventPropagation />,
    viewportElement,
  );
});

namespace NavigationMenuContent {
  export interface State {
    /**
     * If `true`, the component is open.
     */
    open: boolean;
    /**
     * The transition status of the component.
     */
    transitionStatus: TransitionStatus;
    /**
     * The direction of the activation.
     */
    activationDirection: 'left' | 'right' | null;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

NavigationMenuContent.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NavigationMenuContent };
