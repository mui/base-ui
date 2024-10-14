'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabPanel } from './useTabPanel';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { TabsRoot } from '../Root/TabsRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.netlify.app/components/react-tabs/)
 *
 * API:
 *
 * - [TabPanel API](https://base-ui.netlify.app/components/react-tabs/#api-reference-TabPanel)
 */
const TabPanel = React.forwardRef(function TabPanel(
  props: TabPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, value, render, keepMounted = false, ...other } = props;

  const { hidden, getRootProps, orientation, direction, tabActivationDirection } = useTabPanel({
    ...props,
    rootRef: forwardedRef,
  });

  const ownerState: TabPanel.OwnerState = {
    hidden,
    orientation,
    direction,
    tabActivationDirection,
  };

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: { ...other, children: hidden && !keepMounted ? undefined : children },
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return renderElement();
});

namespace TabPanel {
  export interface OwnerState extends TabsRoot.OwnerState {
    hidden: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
     * If not provided, it will fall back to the index of the panel.
     * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
     */
    value?: any;
    /**
     * If `true`, keeps the contents of the hidden TabPanel in the DOM.
     * @default false
     */
    keepMounted?: boolean;
  }
}

TabPanel.propTypes /* remove-proptypes */ = {
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
   * If `true`, keeps the contents of the hidden TabPanel in the DOM.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
   * If not provided, it will fall back to the index of the panel.
   * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
   */
  value: PropTypes.any,
} as any;

export { TabPanel };
