'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabsTab } from './useTabsTab';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TabsOrientation, TabValue } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
const TabsTab = React.forwardRef(function Tab(
  props: TabsTab.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { className, disabled = false, render, value: valueProp, id: idProp, ...other } = props;

  const {
    value: selectedTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const { activateOnFocus, highlightedTabIndex, onTabActivation, setHighlightedTabIndex } =
    useTabsListContext();

  const { getRootProps, index, selected } = useTabsTab({
    activateOnFocus,
    disabled,
    getTabPanelIdByTabValueOrIndex,
    highlightedTabIndex,
    id: idProp,
    onTabActivation,
    rootRef: forwardedRef,
    setHighlightedTabIndex,
    selectedTabValue,
    value: valueProp,
  });

  const highlighted = index > -1 && index === highlightedTabIndex;

  const state: TabsTab.State = React.useMemo(
    () => ({
      disabled,
      highlighted,
      selected,
      orientation,
    }),
    [disabled, highlighted, selected, orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    className,
    state,
    extraProps: other,
  });

  return renderElement();
});

namespace TabsTab {
  export interface Props extends BaseUIComponentProps<'button', TabsTab.State> {
    /**
     * The value of the Tab.
     * When not specified, the value is the child position index.
     */
    value?: TabValue;
  }

  export interface State {
    /**
     * Whether the component should ignore user actions.
     */
    disabled: boolean;
    selected: boolean;
    orientation: TabsOrientation;
  }
}

export { TabsTab };

TabsTab.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the Tab.
   * When not specified, the value is the child position index.
   */
  value: PropTypes.any,
} as any;
