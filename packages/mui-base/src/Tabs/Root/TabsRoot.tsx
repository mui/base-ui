'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabsRoot } from './useTabsRoot';
import { tabsStyleHookMapping } from './styleHooks';
import { TabsProvider } from './TabsProvider';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.netlify.app/components/react-tabs/)
 *
 * API:
 *
 * - [TabsRoot API](https://base-ui.netlify.app/components/react-tabs/#api-reference-TabsRoot)
 */
const TabsRoot = React.forwardRef(function TabsRoot(
  props: TabsRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultValue,
    direction = 'ltr',
    onValueChange,
    orientation = 'horizontal',
    render,
    value,
    ...other
  } = props;

  const { contextValue, getRootProps, tabActivationDirection } = useTabsRoot({
    value,
    defaultValue,
    onValueChange,
    orientation,
    direction,
  });

  const ownerState: TabsRoot.OwnerState = {
    orientation,
    direction,
    tabActivationDirection,
  };

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: other,
    ref: forwardedRef,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return <TabsProvider value={contextValue}>{renderElement()}</TabsProvider>;
});

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsDirection = 'ltr' | 'rtl';
export type TabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

namespace TabsRoot {
  export type OwnerState = {
    orientation: TabsOrientation;
    direction: TabsDirection;
    tabActivationDirection: TabActivationDirection;
  };

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The value of the currently selected `Tab`.
     * If you don't want any selected `Tab`, you can set this prop to `null`.
     */
    value?: any | null;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: any | null;
    /**
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: TabsOrientation;
    /**
     * The direction of the text.
     * @default 'ltr'
     */
    direction?: TabsDirection;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: any | null, event: React.SyntheticEvent | null) => void;
  }
}

TabsRoot.propTypes /* remove-proptypes */ = {
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
   * The default value. Use when the component is not controlled.
   */
  defaultValue: PropTypes.any,
  /**
   * The direction of the text.
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * Callback invoked when new value is being set.
   */
  onValueChange: PropTypes.func,
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `null`.
   */
  value: PropTypes.any,
} as any;

export { TabsRoot };
