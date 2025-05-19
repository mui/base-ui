'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useTabsRoot } from './useTabsRoot';
import { TabsRootContext } from './TabsRootContext';
import { tabsMapping } from './stateAttributesMapping';
import { TabPanelMetadata } from '../panel/useTabsPanel';

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsRoot = React.forwardRef(function TabsRoot(
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

  const direction = useDirection();

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
      direction,
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
      direction,
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
    stateAttributesMapping: tabsMapping,
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

export namespace TabsRoot {
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
