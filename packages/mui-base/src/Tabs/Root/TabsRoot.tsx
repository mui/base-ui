'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TabsRootOwnerState, TabsRootProps } from './TabsRoot.types';
import { useTabs } from './useTabs';
import { TabsProvider } from './TabsProvider';
import { useTabsStyleHooks } from './useTabsRootStyleHooks';
import { resolveClassName } from '../../utils/resolveClassName';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

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
const TabsRoot = React.forwardRef(function TabsRoot(
  props: TabsRootProps,
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

  const { contextValue, getRootProps, tabActivationDirection } = useTabs({
    value,
    defaultValue,
    onChange,
    orientation,
    direction,
  });

  const ownerState: TabsRootOwnerState = {
    orientation,
    direction,
    tabActivationDirection,
  };

  const className = resolveClassName(classNameProp, ownerState);
  const styleHooks = useTabsStyleHooks(ownerState);
  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const rootProps = getRootProps({ ...styleHooks, ...other, className, ref: mergedRef });

  return (
    <TabsProvider value={contextValue}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </TabsProvider>
  );
});

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
  onChange: PropTypes.func,
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

export { TabsRoot as Tabs };
