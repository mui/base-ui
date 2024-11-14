'use client';
import * as React from 'react';
import { useTab } from './useTab';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TabsOrientation } from '../Root/TabsRoot';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { useTabsListContext } from '../TabsList/TabsListContext';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.com/components/react-tabs/)
 *
 * API:
 *
 * - [Tab API](https://base-ui.com/components/react-tabs/#api-reference-Tab)
 */
const Tab = React.forwardRef(function Tab(
  props: Tab.Props,
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

  const { getRootProps, index, selected } = useTab({
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

  const ownerState: Tab.OwnerState = React.useMemo(
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
    ownerState,
    extraProps: other,
  });

  return renderElement();
});

export { Tab };

namespace Tab {
  export interface Props extends BaseUIComponentProps<'button', Tab.OwnerState> {
    /**
     * You can provide your own value. Otherwise, it falls back to the child position index.
     */
    value?: any;
  }

  export interface OwnerState {
    disabled: boolean;
    selected: boolean;
    orientation: TabsOrientation;
  }
}
