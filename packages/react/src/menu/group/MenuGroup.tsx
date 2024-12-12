'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuGroupContext } from './MenuGroupContext';

const state = {};

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuGroup = React.forwardRef(function MenuGroup(
  props: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const context = React.useMemo(() => ({ setLabelId }), [setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    extraProps: {
      role: 'group',
      'aria-labelledby': labelId,
      ...other,
    },
    ref: forwardedRef,
  });

  return <MenuGroupContext.Provider value={context}>{renderElement()}</MenuGroupContext.Provider>;
});

MenuGroup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
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

namespace MenuGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  }

  export interface State {}
}

export { MenuGroup };
