'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTab } from './useTab';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { TabsOrientation } from '../Root/TabsRoot';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.netlify.app/components/react-tabs/)
 *
 * API:
 *
 * - [Tab API](https://base-ui.netlify.app/components/react-tabs/#api-reference-Tab)
 */
const Tab = React.forwardRef(function Tab(
  props: Tab.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { className, disabled = false, render, value, ...other } = props;

  const { selected, getRootProps, orientation } = useTab({
    ...props,
    rootRef: forwardedRef,
  });

  const ownerState: Tab.OwnerState = {
    disabled,
    selected,
    orientation,
  };

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    className,
    ownerState,
    extraProps: other,
  });

  return renderElement();
});

namespace Tab {
  export interface Props extends BaseUIComponentProps<'button', Tab.OwnerState> {
    /**
     * You can provide your own value. Otherwise, it falls back to the child position index.
     */
    value?: any;
  }

  export interface OwnerState {
    disabled: boolean;
    selected: boolean;
    orientation: TabsOrientation;
  }
}

Tab.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * You can provide your own value. Otherwise, it falls back to the child position index.
   */
  value: PropTypes.any,
} as any;

export { Tab };
