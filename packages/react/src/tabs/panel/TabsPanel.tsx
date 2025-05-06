'use client';
import * as React from 'react';
import { useTabsPanel } from './useTabsPanel';
import { tabsStyleHookMapping } from '../root/styleHooks';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { TabsRoot, type TabValue } from '../root/TabsRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsPanel = React.forwardRef(function TabPanel(
  props: TabsPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {  className, value: valueProp, render, keepMounted = false, ...other } = props;

  const {
    value: selectedValue,
    getTabIdByPanelValueOrIndex,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const { hidden, getRootProps } = useTabsPanel({
    getTabIdByPanelValueOrIndex,
    rootRef: forwardedRef,
    selectedValue,
    value: valueProp,
  });

  const state: TabsPanel.State = React.useMemo(
    () => ({
      hidden,
      orientation,
      tabActivationDirection,
    }),
    [hidden, orientation, tabActivationDirection],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    state,
    extraProps: other,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  if (hidden && !keepMounted) {
    return null;
  }

  return renderElement();
});

export namespace TabsPanel {
  export interface State extends TabsRoot.State {
    hidden: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
     * If not provided, it will fall back to the index of the panel.
     * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
     */
    value?: TabValue;
    /**
     * Whether to keep the HTML element in the DOM while the panel is hidden.
     * @default false
     */
    keepMounted?: boolean;
  }
}
