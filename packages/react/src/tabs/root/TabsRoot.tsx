'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeList } from '../../composite/list/CompositeList';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { TabsRootContext } from './TabsRootContext';
import { tabsStateAttributesMapping } from './stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsRoot = React.forwardRef(function TabsRoot(
  componentProps: TabsRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultValue = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [mountedTabPanels, setMountedTabPanels] = React.useState(
    () => new Map<TabsTab.Value | number, string>(),
  );

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const [tabPanelMap, setTabPanelMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabsPanel.Metadata> | null>(),
  );
  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabsTab.Metadata> | null>(),
  );

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabsTab.ActivationDirection>('none');

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValue(newValue);
      setTabActivationDirection(eventDetails.activationDirection);
    },
  );

  const registerMountedTabPanel = useStableCallback(
    (panelValue: TabsTab.Value | number, panelId: string) => {
      setMountedTabPanels((prev) => {
        if (prev.get(panelValue) === panelId) {
          return prev;
        }

        const next = new Map(prev);
        next.set(panelValue, panelId);
        return next;
      });
    },
  );

  const unregisterMountedTabPanel = useStableCallback(
    (panelValue: TabsTab.Value | number, panelId: string) => {
      setMountedTabPanels((prev) => {
        if (!prev.has(panelValue) || prev.get(panelValue) !== panelId) {
          return prev;
        }

        const next = new Map(prev);
        next.delete(panelValue);
        return next;
      });
    },
  );

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValueOrIndex = React.useCallback(
    (tabValue: TabsTab.Value | undefined, index: number) => {
      if (tabValue === undefined && index < 0) {
        return undefined;
      }

      if (tabValue !== undefined) {
        const mountedPanelId = mountedTabPanels.get(tabValue);
        if (mountedPanelId) {
          return mountedPanelId;
        }
      }

      if (tabValue === undefined && index > -1) {
        const mountedPanelId = mountedTabPanels.get(index);
        if (mountedPanelId) {
          return mountedPanelId;
        }
      }

      for (const [tabPanelNode, tabPanelMetadata] of tabPanelMap.entries()) {
        if (!tabPanelNode.isConnected) {
          continue;
        }

        // find by tabValue
        if (tabValue !== undefined && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
          return tabPanelMetadata.id;
        }

        // find by index
        if (
          tabValue === undefined &&
          tabPanelMetadata?.index != null &&
          tabPanelMetadata?.index === index
        ) {
          return tabPanelMetadata.id;
        }
      }

      return undefined;
    },
    [mountedTabPanels, tabPanelMap],
  );

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValueOrIndex = React.useCallback(
    (tabPanelValue: TabsTab.Value | undefined, index: number) => {
      if (tabPanelValue === undefined && index < 0) {
        return undefined;
      }

      for (const tabMetadata of tabMap.values()) {
        // find by tabPanelValue
        if (
          tabPanelValue !== undefined &&
          index > -1 &&
          tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          return tabMetadata?.id;
        }

        // find by index
        if (
          tabPanelValue === undefined &&
          index > -1 &&
          index === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
        ) {
          return tabMetadata?.id;
        }
      }

      return undefined;
    },
    [tabMap],
  );

  // used in `useActivationDirectionDetector` for setting data-activation-direction
  const getTabElementBySelectedValue = React.useCallback(
    (selectedValue: TabsTab.Value | undefined): HTMLElement | null => {
      if (selectedValue === undefined) {
        return null;
      }

      for (const [tabElement, tabMetadata] of tabMap.entries()) {
        if (tabMetadata != null && selectedValue === (tabMetadata.value ?? tabMetadata.index)) {
          return tabElement as HTMLElement;
        }
      }

      return null;
    },
    [tabMap],
  );

  const tabsContextValue: TabsRootContext = React.useMemo(
    () => ({
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    }),
    [
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValueOrIndex,
      getTabPanelIdByTabValueOrIndex,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    ],
  );

  const state: TabsRoot.State = {
    orientation,
    tabActivationDirection,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: tabsStateAttributesMapping,
  });

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabsPanel.Metadata> elementsRef={tabPanelRefs} onMapChange={setTabPanelMap}>
        {element}
      </CompositeList>
    </TabsRootContext.Provider>
  );
});

export type TabsRootOrientation = BaseOrientation;

export interface TabsRootState {
  orientation: TabsRoot.Orientation;
  tabActivationDirection: TabsTab.ActivationDirection;
}

export interface TabsRootProps extends BaseUIComponentProps<'div', TabsRoot.State> {
  /**
   * The value of the currently active `Tab`. Use when the component is controlled.
   * When the value is `null`, no Tab will be active.
   */
  value?: TabsTab.Value;
  /**
   * The default value. Use when the component is not controlled.
   * When the value is `null`, no Tab will be active.
   * @default 0
   */
  defaultValue?: TabsTab.Value;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsRoot.Orientation;
  /**
   * Callback invoked when new value is being set.
   */
  onValueChange?: (value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void;
}

export type TabsRootChangeEventReason = typeof REASONS.none;
export type TabsRootChangeEventDetails = BaseUIChangeEventDetails<
  TabsRoot.ChangeEventReason,
  { activationDirection: TabsTab.ActivationDirection }
>;

export namespace TabsRoot {
  export type State = TabsRootState;
  export type Props = TabsRootProps;
  export type Orientation = TabsRootOrientation;
  export type ChangeEventReason = TabsRootChangeEventReason;
  export type ChangeEventDetails = TabsRootChangeEventDetails;
}
