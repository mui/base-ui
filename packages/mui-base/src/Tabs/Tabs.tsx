'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TabsOwnerState, TabsProps } from './Tabs.types';
import { useTabs } from '../useTabs';
import { TabsProvider } from '../useTabs/TabsProvider';
import { resolveClassName } from '../utils/resolveClassName';
import { useTabsStyleHooks } from './useTabsStyleHooks';
import { defaultRenderFunctions } from '../utils/defaultRenderFunctions';

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/)
 *
 * API:
 *
 * - [Tabs API](https://mui.com/base-ui/react-tabs/components-api/#tabs)
 */
const Tabs = React.forwardRef(function Tabs(
  props: TabsProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className: classNameProp,
    defaultValue,
    direction = 'ltr',
    onChange,
    orientation = 'horizontal',
    render: renderProp,
    value,
    ...other
  } = props;

  const render = renderProp ?? defaultRenderFunctions.div;

  const ownerState: TabsOwnerState = {
    orientation,
    direction,
  };

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabsStyleHooks(ownerState);

  const { contextValue } = useTabs({
    value,
    defaultValue,
    onChange,
    orientation,
    direction,
  });

  const rootProps = { ...styleHooks, ...other, className, ref: forwardedRef };

  return <TabsProvider value={contextValue}>{render(rootProps, ownerState)}</TabsProvider>;
});

Tabs.propTypes /* remove-proptypes */ = {
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
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * The direction of the text.
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * Callback invoked when new value is being set.
   */
  onChange: PropTypes.func,
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `null`.
   */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
} as any;

export { Tabs };
