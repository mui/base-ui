'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeList } from '../../composite/list/CompositeList';
import { useTabsRoot } from './useTabsRoot';
import { TabsRootContext } from './TabsRootContext';
import { tabsStyleHookMapping } from './styleHooks';
import { TabPanelMetadata } from '../tab-panel/useTabsTabPanel';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.com/components/react-tabs/)
 *
 * API:
 *
 * - [TabsRoot API](https://base-ui.com/components/react-tabs/#api-reference-TabsRoot)
 */
const TabsRoot = React.forwardRef(function TabsRoot(
  props: TabsRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultValue = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    ...other
  } = props;

  const {
    getTabElementBySelectedValue,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    setTabMap,
    setTabPanelMap,
    tabActivationDirection,
    tabPanelRefs,
    value,
  } = useTabsRoot({
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp,
  });

  const tabsContextValue: TabsRootContext = React.useMemo(
    () => ({
      getTabElementBySelectedValue,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      setTabMap,
      tabActivationDirection,
      value,
    }),
    [
      getTabElementBySelectedValue,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      setTabMap,
      tabActivationDirection,
      value,
    ],
  );

  const state: TabsRoot.State = {
    orientation,
    tabActivationDirection,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    extraProps: other,
    ref: forwardedRef,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabPanelMetadata> elementsRef={tabPanelRefs} onMapChange={setTabPanelMap}>
        {renderElement()}
      </CompositeList>
    </TabsRootContext.Provider>
  );
});

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';
export type TabValue = any | null;

namespace TabsRoot {
  export type State = {
    orientation: TabsOrientation;
    tabActivationDirection: TabActivationDirection;
  };

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * The value of the currently selected `Tab`. Use when the component is controlled.
     * When the value is `null`, no Tab will be selected.
     */
    value?: TabValue;
    /**
     * The default value. Use when the component is not controlled.
     * When the value is `null`, no Tab will be selected.
     * @default 0
     */
    defaultValue?: TabValue;
    /**
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: TabsOrientation;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: TabValue, event?: Event) => void;
  }
}

export { TabsRoot };

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
   * When the value is `null`, no Tab will be selected.
   * @default 0
   */
  defaultValue: PropTypes.any,
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
   * The value of the currently selected `Tab`. Use when the component is controlled.
   * When the value is `null`, no Tab will be selected.
   */
  value: PropTypes.any,
} as any;
