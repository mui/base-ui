'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeList } from '../../composite/list/CompositeList';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { TabsRootContext } from './TabsRootContext';
import { tabsStyleHookMapping } from './styleHooks';
import type { TabMetadata } from '../tab/TabsTab';
import type { TabPanelMetadata } from '../panel/TabsPanel';

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
    () => new Map<Node, CompositeMetadata<TabPanelMetadata> | null>(),
  );
  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabMetadata> | null>(),
  );

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabActivationDirection>('none');

  const onValueChange = useEventCallback(
    (newValue: TabValue, activationDirection: TabActivationDirection, event: Event | undefined) => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      onValueChangeProp?.(newValue, event);
    },
  );

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValueOrIndex = React.useCallback(
    (tabValue: TabValue | undefined, index: number) => {
      if (tabValue === undefined && index < 0) {
        return undefined;
      }

      for (const tabPanelMetadata of tabPanelMap.values()) {
        // find by tabValue
        if (tabValue !== undefined && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
          return tabPanelMetadata.id;
        }

        // find by index
        if (
          tabValue === undefined &&
          tabPanelMetadata?.index &&
          tabPanelMetadata?.index === index
        ) {
          return tabPanelMetadata.id;
        }
      }

      return undefined;
    },
    [tabPanelMap],
  );

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValueOrIndex = React.useCallback(
    (tabPanelValue: TabValue | undefined, index: number) => {
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
    (selectedValue: TabValue | undefined): HTMLElement | null => {
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
      setTabMap,
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
      setTabMap,
      tabActivationDirection,
      value,
    ],
  );

  const state: TabsRoot.State = {
    orientation,
    tabActivationDirection,
  };

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabPanelMetadata> elementsRef={tabPanelRefs} onMapChange={setTabPanelMap}>
        {renderElement()}
      </CompositeList>
    </TabsRootContext.Provider>
  );
});

export type TabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';
export type TabValue = any | null;

export namespace TabsRoot {
  export type State = {
    orientation: Orientation;
    tabActivationDirection: TabActivationDirection;
  };

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * The value of the currently selected `Tab`. Use when the component is controlled.
     * When the value is `null`, no Tab will be selected.
     */
    value?: TabValue;
    /**
     * The default value. Use when the component is not controlled.
     * When the value is `null`, no Tab will be selected.
     * @default 0
     */
    defaultValue?: TabValue;
    /**
     * The component orientation (layout flow direction).
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: TabValue, event?: Event) => void;
  }
}
