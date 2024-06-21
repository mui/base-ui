'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TabProps, TabOwnerState } from './Tab.types';
import { useTab } from './useTab';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useTabsContext } from '../Root/TabsContext';
import { useTabsListContext } from '../TabsList/TabsListContext';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/)
 *
 * API:
 *
 * - [Tab API](https://mui.com/base-ui/react-tabs/components-api/#tab)
 */
const Tab = React.forwardRef(function Tab(
  props: TabProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { className, disabled = false, render, value: valueProp, ...other } = props;

  const { getTabPanelId, orientation } = useTabsContext();
  const { compoundParentContext, dispatch, state } = useTabsListContext();

  const { getRootProps, value } = useTab({
    ...props,
    rootRef: forwardedRef,
    orientation,
    getTabPanelId,
    compoundParentContext,
    state,
    dispatch,
    value: valueProp,
  });

  const ownerState: TabOwnerState = {
    disabled,
    selected: state.selectedValues.includes(value),
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
