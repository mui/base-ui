'use client';
import * as React from 'react';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { tabsStyleHookMapping } from '../root/styleHooks';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsRoot } from '../root/TabsRoot';
import type { TabsTab } from '../tab/TabsTab';

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
  const {
    children,
    className,
    value,
    render,
    keepMounted = false,
    ...elementProps
  } = componentProps;

  const {
    value: selectedValue,
    getTabIdByPanelValue,
    orientation,
    tabActivationDirection,
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

  const correspondingTabId = React.useMemo(() => {
    return getTabIdByPanelValue(value);
  }, [getTabIdByPanelValue, value]);

  const state: TabsPanel.State = React.useMemo(
    () => ({
      hidden,
      orientation,
      tabActivationDirection,
      index,
    }),
    [hidden, orientation, tabActivationDirection, index],
  );

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
      },
      elementProps,
      { children: hidden && !keepMounted ? undefined : children },
    ],
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return element;
});

export namespace TabsPanel {
  export interface Metadata {
    id?: string;
    value: TabsTab.Value;
  }

  export interface State extends TabsRoot.State {
    hidden: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
     * If not provided, it will fall back to the index of the panel.
     * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
     * @type Tabs.Tab.Value
     */
    value: TabsTab.Value;
    /**
     * Whether to keep the HTML element in the DOM while the panel is hidden.
     * @default false
     */
    keepMounted?: boolean;
  }
}
