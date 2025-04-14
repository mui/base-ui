'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuViewport = React.forwardRef(function NavigationMenuViewport(
  componentProps: NavigationMenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { setViewportElement } = useNavigationMenuRootContext();

  const renderElement = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setViewportElement],
    props: [
      {
        style: {
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
        },
      },
      elementProps,
    ],
  });

  return renderElement();
});

namespace NavigationMenuViewport {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

NavigationMenuViewport.propTypes /* remove-proptypes */ = {
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

export { NavigationMenuViewport };
