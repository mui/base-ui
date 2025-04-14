'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeItem } from '../../composite/item/CompositeItem';

/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuLink = React.forwardRef(function NavigationMenuLink(
  componentProps: NavigationMenuLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const renderElement = useRenderElement('a', componentProps, {
    ref: forwardedRef,
    props: [
      {
        tabIndex: 0,
      },
      elementProps,
    ],
  });

  return <CompositeItem render={renderElement()} />;
});

namespace NavigationMenuLink {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'a', State> {}
}

NavigationMenuLink.propTypes /* remove-proptypes */ = {
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

export { NavigationMenuLink };
