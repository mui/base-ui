'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuGroupContext } from './MenuGroupContext';

const state = {};

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.com/components/react-menu/)
 *
 * API:
 *
 * - [MenuGroup API](https://base-ui.com/components/react-menu/#api-reference-MenuGroup)
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
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
