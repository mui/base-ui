'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList';
import { TabsRootContext } from './TabsRootContext';
import { tabsStateAttributesMapping } from './stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

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
    style,
    ...elementProps
  } = componentProps;

  // Track whether the user explicitly provided a defined `defaultValue` prop.
  // Used to determine if we should honor a disabled tab selection.
  const hasExplicitDefaultValueProp = componentProps.defaultValue !== undefined;

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

  // Used for activation direction detection via tab element positions.
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

  const [activationDirectionState, setActivationDirectionState] = React.useState(() => ({
    previousValue: value,
    tabActivationDirection: 'none' as TabsTab.ActivationDirection,
  }));
  const { previousValue, tabActivationDirection: committedTabActivationDirection } =
    activationDirectionState;

  let tabActivationDirection = committedTabActivationDirection;
  let directionComputationIncomplete = false;

  // Compute activation direction during render when value changes so children see
  // the correct direction on their very first render after the selection update.
  // The previous value snapshot is stored in state and synced after commit.
  // https://github.com/mui/base-ui/issues/3873
  if (previousValue !== value) {
    tabActivationDirection = computeActivationDirection(previousValue, value, orientation, tabMap);

    // When a new tab is added and selected in the same controlled update,
    // the tab element may not yet be registered in tabMap, so direction was
    // computed from a value-based fallback. Keep the previous value snapshot
    // stale so we re-compute from DOM positions once tabMap is up to date.
    directionComputationIncomplete =
      previousValue != null && value != null && getTabElementBySelectedValue(value) == null;
  }
  const nextPreviousValue = directionComputationIncomplete ? previousValue : value;
  const shouldSyncActivationDirectionState =
    previousValue !== nextPreviousValue ||
    committedTabActivationDirection !== tabActivationDirection;

  useIsoLayoutEffect(() => {
    if (!shouldSyncActivationDirectionState) {
      return;
    }

    setActivationDirectionState({
      previousValue: nextPreviousValue,
      tabActivationDirection,
    });
  }, [nextPreviousValue, shouldSyncActivationDirectionState, tabActivationDirection]);

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      const activationDirection = computeActivationDirection(value, newValue, orientation, tabMap);
      eventDetails.activationDirection = activationDirection;

      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValue(newValue);
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
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    }),
    [
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
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

  const shouldNotifyInitialValueChangeRef = React.useRef(
    !isControlled && !hasExplicitDefaultValueProp,
  );
  const shouldHonorDisabledDefaultValueRef = React.useRef(hasExplicitDefaultValueProp);

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

    if (!selectionIsDisabled && value === defaultValueProp) {
      shouldHonorDisabledDefaultValueRef.current = false;
    }

    if (
      shouldHonorDisabledDefaultValueRef.current &&
      selectionIsDisabled &&
      value === defaultValueProp
    ) {
      return;
    }

    const shouldNotifyInitialValueChange = shouldNotifyInitialValueChangeRef.current;

    const notifyValueChange = (nextValue: TabsTab.Value, reason: TabsRoot.ChangeEventReason) => {
      onValueChangeProp?.(
        nextValue,
        createChangeEventDetails(reason, undefined, undefined, {
          activationDirection: 'none',
        }),
      );
    };

    if (shouldNotifyInitialValueChange) {
      shouldNotifyInitialValueChangeRef.current = false;

      if (firstEnabledTabValue !== undefined) {
        notifyValueChange(firstEnabledTabValue, REASONS.initial);
      }
    }

    if (!selectionIsDisabled && !selectionIsMissing) {
      return;
    }

    const fallbackValue = firstEnabledTabValue ?? null;

    if (value === fallbackValue) {
      return;
    }

    if (!shouldNotifyInitialValueChange) {
      notifyValueChange(fallbackValue, selectionIsDisabled ? REASONS.disabled : REASONS.missing);
    } else if (firstEnabledTabValue === undefined) {
      notifyValueChange(fallbackValue, REASONS.initial);
    }

    setValue(fallbackValue);
    setActivationDirectionState((prev) => {
      if (prev.previousValue === fallbackValue && prev.tabActivationDirection === 'none') {
        return prev;
      }

      return {
        previousValue: fallbackValue,
        tabActivationDirection: 'none',
      };
    });
  }, [
    defaultValueProp,
    firstEnabledTabValue,
    hasExplicitDefaultValueProp,
    isControlled,
    onValueChangeProp,
    selectedTabMetadata,
    setValue,
    tabMap,
    value,
  ]);

  const state: TabsRootState = {
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

function computeActivationDirection(
  oldValue: TabsTab.Value | null,
  newValue: TabsTab.Value | null,
  orientation: 'horizontal' | 'vertical',
  tabMap: Map<Node, CompositeMetadata<TabsTab.Metadata> | null>,
): TabsTab.ActivationDirection {
  if (oldValue == null || newValue == null) {
    return 'none';
  }

  let oldTab: HTMLElement | null = null;
  let newTab: HTMLElement | null = null;

  for (const [tabElement, tabMetadata] of tabMap.entries()) {
    if (tabMetadata == null) {
      continue;
    }
    const tabValue = tabMetadata.value ?? tabMetadata.index;
    if (oldValue === tabValue) {
      oldTab = tabElement as HTMLElement;
    }
    if (newValue === tabValue) {
      newTab = tabElement as HTMLElement;
    }
    if (oldTab != null && newTab != null) {
      break;
    }
  }

  if (oldTab == null || newTab == null) {
    // Fallback for dynamic tabs: when a tab element isn't registered yet
    // (e.g. added and selected in the same update), infer direction from
    // the values themselves. Works for comparable types (numbers, strings).
    if (
      oldTab !== newTab &&
      (typeof oldValue === 'number' || typeof oldValue === 'string') &&
      typeof oldValue === typeof newValue
    ) {
      if (orientation === 'horizontal') {
        return newValue > oldValue ? 'right' : 'left';
      }
      return newValue > oldValue ? 'down' : 'up';
    }
    return 'none';
  }

  const oldRect = oldTab.getBoundingClientRect();
  const newRect = newTab.getBoundingClientRect();

  if (orientation === 'horizontal') {
    if (newRect.left < oldRect.left) {
      return 'left';
    }
    if (newRect.left > oldRect.left) {
      return 'right';
    }
  } else {
    if (newRect.top < oldRect.top) {
      return 'up';
    }
    if (newRect.top > oldRect.top) {
      return 'down';
    }
  }

  return 'none';
}

export type TabsRootOrientation = BaseOrientation;

export interface TabsRootState {
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}

export interface TabsRootProps extends BaseUIComponentProps<'div', TabsRootState> {
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

export type TabsRootChangeEventReason =
  | typeof REASONS.none
  | typeof REASONS.disabled
  | typeof REASONS.missing
  | typeof REASONS.initial;
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
