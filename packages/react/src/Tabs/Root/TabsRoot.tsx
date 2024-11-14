'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeList } from '../../Composite/List/CompositeList';
import { useTabsRoot } from './useTabsRoot';
import { TabsRootContext } from './TabsRootContext';
import { tabsStyleHookMapping } from './styleHooks';
import { TabPanelMetadata } from '../TabPanel/useTabPanel';

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
    defaultValue,
    direction: directionProp = 'ltr',
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    ...other
  } = props;

  const {
    getRootProps,
    direction,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    registerGetTabIdByPanelValueOrIndexFn,
    setTabMap,
    setTabPanelMap,
    tabActivationDirection,
    tabPanelRefs,
    value,
  } = useTabsRoot({
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp,
    direction: directionProp,
  });

  const tabsContextValue = React.useMemo(
    () => ({
      direction,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      registerGetTabIdByPanelValueOrIndexFn,
      setTabMap,
      tabActivationDirection,
      value,
    }),
    [
      direction,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      registerGetTabIdByPanelValueOrIndexFn,
      setTabMap,
      tabActivationDirection,
      value,
    ],
  );

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

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabPanelMetadata> elementsRef={tabPanelRefs} onMapChange={setTabPanelMap}>
        {renderElement()}
      </CompositeList>
    </TabsRootContext.Provider>
  );
});

export { TabsRoot };

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
    onValueChange?: (value: any | null, event?: Event) => void;
  }
}
