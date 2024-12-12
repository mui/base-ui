'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
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
const TabsPanel = React.forwardRef(function TabPanel(
  props: TabsPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, value: valueProp, render, keepMounted = false, ...other } = props;

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
    extraProps: { ...other, children: hidden && !keepMounted ? undefined : children },
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return renderElement();
});

namespace TabsPanel {
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

export { TabsPanel };

TabsPanel.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to keep the HTML element in the DOM while the panel is hidden.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value: PropTypes.any,
} as any;
