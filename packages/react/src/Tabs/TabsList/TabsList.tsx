'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeRoot } from '../../Composite/Root/CompositeRoot';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { TabsRoot } from '../Root/TabsRoot';
import { type TabMetadata } from '../Tab/useTab';
import { useTabsList } from './useTabsList';
import { TabsListContext } from './TabsListContext';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.com/components/react-tabs/)
 *
 * API:
 *
 * - [TabsList API](https://base-ui.com/components/react-tabs/#api-reference-TabsList)
 */
const TabsList = React.forwardRef(function TabsList(
  props: TabsList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { activateOnFocus = true, className, loop = true, render, ...other } = props;

  const {
    direction = 'ltr',
    getTabElementBySelectedValue,
    onValueChange,
    orientation = 'horizontal',
    value,
    setTabMap,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = React.useState(0);

  const tabsListRef = React.useRef<HTMLElement>(null);

  const { getRootProps, onTabActivation } = useTabsList({
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    rootRef: forwardedRef,
    setTabMap,
    tabsListRef,
    value,
  });

  const ownerState: TabsList.OwnerState = React.useMemo(
    () => ({
      direction,
      orientation,
      tabActivationDirection,
    }),
    [direction, orientation, tabActivationDirection],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  const tabsListContextValue: TabsListContext = React.useMemo(
    () => ({
      activateOnFocus,
      highlightedTabIndex,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListRef,
      value,
    }),
    [
      activateOnFocus,
      highlightedTabIndex,
      onTabActivation,
      setHighlightedTabIndex,
      tabsListRef,
      value,
    ],
  );

  return (
    <TabsListContext.Provider value={tabsListContextValue}>
      <CompositeRoot<TabMetadata>
        activeIndex={highlightedTabIndex}
        enableHomeAndEndKeys
        loop={loop}
        onActiveIndexChange={setHighlightedTabIndex}
        onMapChange={setTabMap}
        render={renderElement()}
      />
    </TabsListContext.Provider>
  );
});

TabsList.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the tab will be activated whenever it is focused.
   * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
   *
   * @default true
   */
  activateOnFocus: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   *
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TabsList };

namespace TabsList {
  export type OwnerState = TabsRoot.OwnerState;

  export interface Props extends BaseUIComponentProps<'div', TabsList.OwnerState> {
    /**
     * If `true`, the tab will be activated whenever it is focused.
     * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
     *
     * @default true
     */
    activateOnFocus?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  }
}
