'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeList } from '../../composite/list/CompositeList';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { TabsRootContext } from './TabsRootContext';
import { tabsStyleHookMapping } from './styleHooks';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';

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

  const onValueChange = useEventCallback(
    (
      newValue: TabsTab.Value,
      activationDirection: TabsTab.ActivationDirection,
      event: Event | undefined,
    ) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChangeProp?.(newValue, event);
    },
  );

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValue = React.useCallback(
    (tabValue: TabsTab.Value) => {
      for (const tabPanelMetadata of tabPanelMap.values()) {
        if (tabValue !== undefined && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
          return tabPanelMetadata.id;
        }
      }

      return undefined;
    },
    [tabPanelMap],
  );

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValue = React.useCallback(
    (tabPanelValue: TabsTab.Value) => {
      for (const tabMetadata of tabMap.values()) {
        if (tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)) {
          return tabMetadata?.id;
        }
      }

      return undefined;
    },
    [tabMap],
  );

  // used in `useActivationDirectionDetector` for setting data-activation-direction
  const getTabElementBySelectedValue = React.useCallback(
    (selectedValue: TabsTab.Value): HTMLElement | null => {
      for (const [tabElement, tabMetadata] of tabMap.entries()) {
        if (tabMetadata != null && selectedValue === tabMetadata.value) {
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
      getTabIdByPanelValue,
      getTabPanelIdByTabValue,
      onValueChange,
      orientation,
      setTabMap,
      tabActivationDirection,
      value,
    }),
    [
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByTabValue,
      onValueChange,
      orientation,
      setTabMap,
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
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabsPanel.Metadata> elementsRef={tabPanelRefs} onMapChange={setTabPanelMap}>
        {element}
      </CompositeList>
    </TabsRootContext.Provider>
  );
});

export namespace TabsRoot {
  export type Orientation = BaseOrientation;

  export type State = {
    /**
     * @type Tabs.Root.Orientation
     */
    orientation: Orientation;
    /**
     * @type Tabs.Tab.ActivationDirection
     */
    tabActivationDirection: TabsTab.ActivationDirection;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The value of the currently selected `Tab`. Use when the component is controlled.
     * When the value is `null`, no Tab will be selected.
     * @type Tabs.Tab.Value
     */
    value?: TabsTab.Value;
    /**
     * The default value. Use when the component is not controlled.
     * When the value is `null`, no Tab will be selected.
     * @type Tabs.Tab.Value
     * @default 0
     */
    defaultValue?: TabsTab.Value;
    /**
     * The component orientation (layout flow direction).
     * @type Tabs.Root.Orientation
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: TabsTab.Value, event?: Event) => void;
  }
}
