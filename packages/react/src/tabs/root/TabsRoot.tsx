'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

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
    defaultValue: defaultValueProp = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  // Track whether the user explicitly provided a `defaultValue` prop.
  // Used to determine if we should honor a disabled tab selection.
  const hasExplicitDefaultValueProp = Object.hasOwn(componentProps, 'defaultValue');

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [mountedTabPanels, setMountedTabPanels] = React.useState(
    () => new Map<TabsTab.Value | number, string>(),
  );

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValueProp,
    name: 'Tabs',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;

  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabsTab.Metadata> | null>(),
  );

  const [tabsListElement, setTabsListElement] = React.useState<HTMLElement | null>(null);

  // Refs for tracking previous value and edge position for direction calculation
  const previousValueRef = React.useRef<TabsTab.Value | undefined>(undefined);
  const previousTabEdgeRef = React.useRef<number | null>(null);
  // Track values that were handled by internal changes (clicks) to avoid recalculating
  const valueHandledInternallyRef = React.useRef<TabsTab.Value | undefined>(undefined);

  // Helper to get tab element by value
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

  // Calculate direction based on comparing edges
  const calculateDirection = React.useCallback(
    (newTabEdge: number, previousEdge: number): TabsTab.ActivationDirection => {
      if (orientation === 'horizontal') {
        if (newTabEdge < previousEdge) {
          return 'left';
        }
        if (newTabEdge > previousEdge) {
          return 'right';
        }
      } else {
        if (newTabEdge < previousEdge) {
          return 'up';
        }
        if (newTabEdge > previousEdge) {
          return 'down';
        }
      }
      return 'none';
    },
    [orientation],
  );

  // Compute the activation direction during render for external value changes
  const computeActivationDirection = React.useCallback((): TabsTab.ActivationDirection => {
    // If value hasn't changed or was handled internally, don't compute
    if (value === previousValueRef.current || value === valueHandledInternallyRef.current) {
      return 'none';
    }

    // Clear the internal handling flag
    valueHandledInternallyRef.current = undefined;

    if (value == null || tabsListElement == null) {
      return 'none';
    }

    const newTabElement = getTabElementBySelectedValue(value);
    if (newTabElement == null) {
      return 'none';
    }

    const { left, top } = getInset(newTabElement, tabsListElement);
    const newTabEdge = orientation === 'horizontal' ? left : top;

    if (previousTabEdgeRef.current == null) {
      return 'none';
    }

    return calculateDirection(newTabEdge, previousTabEdgeRef.current);
  }, [value, tabsListElement, getTabElementBySelectedValue, orientation, calculateDirection]);

  // Compute direction for external changes
  const externalChangeDirection = computeActivationDirection();

  // State for activation direction - this gets updated via internal changes or external computation
  const [tabActivationDirectionState, setTabActivationDirection] =
    React.useState<TabsTab.ActivationDirection>('none');

  // The actual direction to use - either from external computation or state
  const tabActivationDirection =
    externalChangeDirection !== 'none' ? externalChangeDirection : tabActivationDirectionState;

  // Update refs after computing direction
  useIsoLayoutEffect(() => {
    if (value == null || tabsListElement == null) {
      previousValueRef.current = value;
      previousTabEdgeRef.current = null;
      return;
    }

    const tabElement = getTabElementBySelectedValue(value);
    if (tabElement == null) {
      previousValueRef.current = value;
      previousTabEdgeRef.current = null;
      return;
    }

    const { left, top } = getInset(tabElement, tabsListElement);
    const newTabEdge = orientation === 'horizontal' ? left : top;

    previousValueRef.current = value;
    previousTabEdgeRef.current = newTabEdge;

    // Also update the state if we computed a direction for external change
    if (externalChangeDirection !== 'none') {
      setTabActivationDirection(externalChangeDirection);
    }
  }, [value, tabsListElement, getTabElementBySelectedValue, orientation, externalChangeDirection]);

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      // Mark this value as handled internally so we don't recompute direction
      valueHandledInternallyRef.current = newValue;

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
  const getTabPanelIdByValue = React.useCallback(
    (tabValue: TabsTab.Value) => {
      return mountedTabPanels.get(tabValue);
    },
    [mountedTabPanels],
  );

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValue = React.useCallback(
    (tabPanelValue: TabsTab.Value) => {
      for (const tabMetadata of tabMap.values()) {
        if (tabPanelValue === tabMetadata?.value) {
          return tabMetadata?.id;
        }
      }
      return undefined;
    },
    [tabMap],
  );

  const tabsContextValue: TabsRootContext = React.useMemo(
    () => ({
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabActivationDirection,
      setTabMap,
      setTabsListElement,
      tabsListElement,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    }),
    [
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabActivationDirection,
      setTabMap,
      setTabsListElement,
      tabsListElement,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    ],
  );

  const selectedTabMetadata = React.useMemo(() => {
    for (const tabMetadata of tabMap.values()) {
      if (tabMetadata != null && tabMetadata.value === value) {
        return tabMetadata;
      }
    }
    return undefined;
  }, [tabMap, value]);

  // Find the first non-disabled tab value.
  // Used as a fallback when the current selection is disabled or missing.
  const firstEnabledTabValue = React.useMemo(() => {
    for (const tabMetadata of tabMap.values()) {
      if (tabMetadata != null && !tabMetadata.disabled) {
        return tabMetadata.value;
      }
    }
    return undefined;
  }, [tabMap]);

  // Automatically switch to the first enabled tab when:
  // - The current selection is disabled (and wasn't explicitly set via defaultValue)
  // - The current selection is missing (tab was removed from DOM)
  // Falls back to null if all tabs are disabled.
  useIsoLayoutEffect(() => {
    if (isControlled || tabMap.size === 0) {
      return;
    }

    const selectionIsDisabled = selectedTabMetadata?.disabled;
    const selectionIsMissing = selectedTabMetadata == null && value !== null;

    const shouldHonorExplicitDefaultSelection =
      hasExplicitDefaultValueProp && selectionIsDisabled && value === defaultValueProp;

    if (shouldHonorExplicitDefaultSelection) {
      return;
    }

    if (!selectionIsDisabled && !selectionIsMissing) {
      return;
    }

    const fallbackValue = firstEnabledTabValue ?? null;

    if (value === fallbackValue) {
      return;
    }

    setValue(fallbackValue);
    setTabActivationDirection('none');
  }, [
    defaultValueProp,
    firstEnabledTabValue,
    hasExplicitDefaultValueProp,
    isControlled,
    selectedTabMetadata,
    setTabActivationDirection,
    setValue,
    tabMap,
    value,
  ]);

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
      <CompositeList<TabsPanel.Metadata> elementsRef={tabPanelRefs}>{element}</CompositeList>
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
  value?: TabsTab.Value | undefined;
  /**
   * The default value. Use when the component is not controlled.
   * When the value is `null`, no Tab will be active.
   * @default 0
   */
  defaultValue?: TabsTab.Value | undefined;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsRoot.Orientation | undefined;
  /**
   * Callback invoked when new value is being set.
   */
  onValueChange?:
    | ((value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void)
    | undefined;
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
