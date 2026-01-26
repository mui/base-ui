'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsRoot } from '../root/TabsRoot';
import type { TabsTab } from '../tab/TabsTab';
import { TabsPanelDataAttributes } from './TabsPanelDataAttributes';

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsPanel = React.forwardRef(function TabPanel(
  componentProps: TabsPanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, value, render, keepMounted = false, ...elementProps } = componentProps;

  const {
    value: selectedValue,
    getTabIdByPanelValue,
    orientation,
    tabActivationDirection,
    registerMountedTabPanel,
    unregisterMountedTabPanel,
  } = useTabsRootContext();

  const id = useBaseUiId();

  const metadata = React.useMemo(
    () => ({
      id,
      value,
    }),
    [id, value],
  );

  const { ref: listItemRef, index } = useCompositeListItem<TabsPanel.Metadata>({
    metadata,
  });

  const hidden = value !== selectedValue;

  const correspondingTabId = getTabIdByPanelValue(value);

  const state: TabsPanel.State = {
    hidden,
    orientation,
    tabActivationDirection,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef],
    props: [
      {
        'aria-labelledby': correspondingTabId,
        hidden,
        id: id ?? undefined,
        role: 'tabpanel',
        tabIndex: hidden ? -1 : 0,
        [TabsPanelDataAttributes.index as string]: index,
      },
      elementProps,
    ],
    stateAttributesMapping: tabsStateAttributesMapping,
  });

  useIsoLayoutEffect(() => {
    if (hidden && !keepMounted) {
      return undefined;
    }

    if (id == null) {
      return undefined;
    }

    registerMountedTabPanel(value, id);
    return () => {
      unregisterMountedTabPanel(value, id);
    };
  }, [hidden, keepMounted, value, id, registerMountedTabPanel, unregisterMountedTabPanel]);

  const shouldRender = !hidden || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface TabsPanelMetadata {
  id?: string | undefined;
  value: TabsTab.Value;
}

export interface TabsPanelState extends TabsRoot.State {
  hidden: boolean;
}

export interface TabsPanelProps extends BaseUIComponentProps<'div', TabsPanel.State> {
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is active.
   */
  value: TabsTab.Value;
  /**
   * Whether to keep the HTML element in the DOM while the panel is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TabsPanel {
  export type Metadata = TabsPanelMetadata;
  export type State = TabsPanelState;
  export type Props = TabsPanelProps;
}
