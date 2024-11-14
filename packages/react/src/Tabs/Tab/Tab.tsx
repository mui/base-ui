'use client';
import * as React from 'react';
import { useTab } from './useTab';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useCompositeRootContext } from '../../Composite/Root/CompositeRootContext';
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
    value: selectedValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const { activateOnFocus, onTabActivation } = useTabsListContext();

  // this is the context of TabsList
  const { activeIndex } = useCompositeRootContext();
  // console.log('activeIndex', activeIndex);

  const { getRootProps, index, selected } = useTab({
    disabled,
    getTabPanelIdByTabValueOrIndex,
    id: idProp,
    isSelected: valueProp === selectedValue,
    onTabActivation,
    rootRef: forwardedRef,
    value: valueProp,
  });

  const highlighted = index > -1 && index === activeIndex;

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
