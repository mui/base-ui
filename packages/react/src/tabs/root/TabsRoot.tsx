'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList';
import { TabsRootContext } from './TabsRootContext';
import { tabsStateAttributesMapping } from './stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

interface DerivedTabData {
  firstEnabledTabValue: TabsTab.Value | undefined;
  selectedTabMetadata: TabsTab.Metadata | undefined;
  tabElementByValue: Map<TabsTab.Value | number, HTMLElement>;
  tabIdByValue: Map<TabsTab.Value, string | undefined>;
}

interface ResolveAutoSelectionInput {
  firstEnabledTabValue: TabsTab.Value | undefined;
  hasExplicitDefaultValueProp: boolean;
  isInitialRun: boolean;
  previousHonorDisabledDefault: boolean;
  resolvedDefaultValue: TabsTab.Value;
  selectedTabMetadata: TabsTab.Metadata | undefined;
  value: TabsTab.Value;
}

type ResolveAutoSelectionResult =
  | {
      action: 'none';
      nextHonorDisabledDefault: boolean;
    }
  | {
      action: 'apply';
      nextHonorDisabledDefault: boolean;
      nextValue: TabsTab.Value;
      reason: typeof REASONS.disabled | typeof REASONS.initial | typeof REASONS.missing | null;
    };

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
    defaultValue: defaultValueProp,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

  // Treat `defaultValue={undefined}` the same as omitting the prop entirely.
  // This keeps mount-time fallback behavior aligned with React's usual prop semantics.
  const hasExplicitDefaultValueProp = defaultValueProp !== undefined;
  const resolvedDefaultValue = hasExplicitDefaultValueProp ? defaultValueProp : 0;

  const tabPanelRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [mountedTabPanels, setMountedTabPanels] = React.useState(
    () => new Map<TabsTab.Value | number, string>(),
  );

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: resolvedDefaultValue,
    name: 'Tabs',
    state: 'value',
  });

  const isControlled = valueProp !== undefined;

  const [tabMap, setTabMap] = React.useState(
    () => new Map<Node, CompositeMetadata<TabsTab.Metadata> | null>(),
  );

  const [hidePanelsWithoutMatchingTab, setHidePanelsWithoutMatchingTab] = React.useState(false);
  const noRenderedTabsTimeout = useTimeout();

  const derivedTabData = React.useMemo<DerivedTabData>(() => {
    // Derive all tab lookups from a single pass so selection, ids, and element
    // access stay in sync as the rendered tab set changes.
    const tabElementByValue = new Map<TabsTab.Value | number, HTMLElement>();
    const tabIdByValue = new Map<TabsTab.Value, string | undefined>();
    let firstEnabledTabValue: TabsTab.Value | undefined;
    let selectedTabMetadata: TabsTab.Metadata | undefined;

    for (const [tabElement, tabMetadata] of tabMap.entries()) {
      if (tabMetadata == null) {
        continue;
      }

      if (selectedTabMetadata == null && tabMetadata.value === value) {
        selectedTabMetadata = tabMetadata;
      }

      if (firstEnabledTabValue === undefined && !tabMetadata.disabled) {
        firstEnabledTabValue = tabMetadata.value;
      }

      if (!tabIdByValue.has(tabMetadata.value)) {
        tabIdByValue.set(tabMetadata.value, tabMetadata.id);
      }

      const selectedValue = tabMetadata.value ?? tabMetadata.index;
      if (!tabElementByValue.has(selectedValue)) {
        tabElementByValue.set(selectedValue, tabElement as HTMLElement);
      }
    }

    return {
      firstEnabledTabValue,
      selectedTabMetadata,
      tabElementByValue,
      tabIdByValue,
    };
  }, [tabMap, value]);

  // Used for activation direction detection via tab element positions.
  const getTabElementBySelectedValue = React.useCallback(
    (selectedValue: TabsTab.Value | undefined): HTMLElement | null => {
      if (selectedValue === undefined) {
        return null;
      }

      return derivedTabData.tabElementByValue.get(selectedValue) ?? null;
    },
    [derivedTabData],
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
      return derivedTabData.tabIdByValue.get(tabPanelValue);
    },
    [derivedTabData],
  );

  const isPanelOpen = React.useCallback(
    (panelValue: TabsTab.Value) => {
      if (panelValue !== value) {
        return false;
      }

      return !hidePanelsWithoutMatchingTab || derivedTabData.tabIdByValue.has(panelValue);
    },
    [derivedTabData, hidePanelsWithoutMatchingTab, value],
  );

  const tabsContextValue: TabsRootContext = React.useMemo(
    () => ({
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      isPanelOpen,
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
      isPanelOpen,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      value,
    ],
  );

  // Automatically switch to the first enabled tab when:
  // - Initial render with no explicit value (fires onValueChange with 'initial' reason)
  // - The current selection is disabled (and wasn't explicitly set via defaultValue on initial render)
  // - The current selection is missing (no rendered tab matches the current value)
  // Falls back to null if all tabs are disabled and preserves that empty selection on later renders.
  const hasRunOnceRef = React.useRef(false);
  const hasRegisteredTabRef = React.useRef(false);

  // When `defaultValue` explicitly points to a disabled tab, we honor that choice
  // on mount (keeping the disabled tab selected). But once the tab becomes enabled
  // and then disabled again, we treat it as a dynamic change and fire onValueChange.
  // This ref tracks whether the initial "honor disabled default" grace period is active.
  const honorDisabledDefaultRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (tabMap.size > 0) {
      hasRegisteredTabRef.current = true;
    }
    if (isControlled || (tabMap.size === 0 && !hasRegisteredTabRef.current)) {
      return;
    }

    const isInitialRun = !hasRunOnceRef.current;
    const decision = resolveAutoSelection({
      firstEnabledTabValue: derivedTabData.firstEnabledTabValue,
      hasExplicitDefaultValueProp,
      isInitialRun,
      previousHonorDisabledDefault: honorDisabledDefaultRef.current,
      resolvedDefaultValue,
      selectedTabMetadata: derivedTabData.selectedTabMetadata,
      value,
    });

    hasRunOnceRef.current = true;
    honorDisabledDefaultRef.current = decision.nextHonorDisabledDefault;

    if (decision.action === 'none') {
      return;
    }

    if (decision.reason == null) {
      setValue(decision.nextValue);
      setActivationDirectionState({
        previousValue: decision.nextValue,
        tabActivationDirection: 'none',
      });
      return;
    }

    const eventDetails = createChangeEventDetails(decision.reason, undefined, undefined, {
      activationDirection: 'none' as const,
    });

    // Notify the user's callback directly (bypassing the standard onValueChange
    // which would recompute activationDirection). Then always apply the fallback
    // — cancel() is a no-op for automatic selections since the disabled/missing
    // tab can't stay selected.
    onValueChangeProp?.(decision.nextValue, eventDetails);
    setValue(decision.nextValue);
    setActivationDirectionState({
      previousValue: decision.nextValue,
      tabActivationDirection: 'none',
    });
  }, [
    derivedTabData.firstEnabledTabValue,
    derivedTabData.selectedTabMetadata,
    hasExplicitDefaultValueProp,
    isControlled,
    onValueChangeProp,
    resolvedDefaultValue,
    setValue,
    tabMap,
    value,
  ]);

  useIsoLayoutEffect(() => {
    if (tabMap.size > 0 || mountedTabPanels.size === 0 || value === null) {
      noRenderedTabsTimeout.clear();

      if (hidePanelsWithoutMatchingTab) {
        setHidePanelsWithoutMatchingTab(false);
      }

      return undefined;
    }

    // When panels exist without any rendered tabs, hide the selected panel on the
    // client after registration settles. This preserves SSR-selected content while
    // still cleaning up stale keepMounted panels in the "no tabs rendered" case.
    noRenderedTabsTimeout.start(0, () => {
      if (tabMap.size > 0 || mountedTabPanels.size === 0 || value === null) {
        return;
      }

      setHidePanelsWithoutMatchingTab((prev) => prev || true);
    });

    return noRenderedTabsTimeout.clear;
  }, [hidePanelsWithoutMatchingTab, mountedTabPanels, noRenderedTabsTimeout, tabMap, value]);

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
   *
   * The `eventDetails.reason` indicates why the value changed:
   * - `'none'`: User-initiated change (click, keyboard navigation).
   * - `'initial'`: Automatic selection on mount when no `value`/`defaultValue` is provided.
   * - `'disabled'`: The selected tab became disabled.
   * - `'missing'`: The current value no longer maps to any rendered tab.
   *
   * Calling `eventDetails.cancel()` prevents the value change for user-initiated
   * actions (`'none'`). It is a no-op for automatic selections (`'initial'`,
   * `'disabled'`, `'missing'`), as the component must move away from a
   * disabled or missing selection.
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

function resolveAutoSelection(input: ResolveAutoSelectionInput): ResolveAutoSelectionResult {
  const {
    firstEnabledTabValue,
    hasExplicitDefaultValueProp,
    isInitialRun,
    previousHonorDisabledDefault,
    resolvedDefaultValue,
    selectedTabMetadata,
    value,
  } = input;

  const selectionIsDisabled = selectedTabMetadata?.disabled === true;
  const selectionIsMissing = selectedTabMetadata == null && value !== null;

  let nextHonorDisabledDefault = previousHonorDisabledDefault;

  // An explicit disabled default is honored only for the initial mount state.
  // Once that tab becomes enabled and later disabled again, we treat it like any
  // other dynamic disabled-selection fallback.
  if (isInitialRun) {
    nextHonorDisabledDefault =
      hasExplicitDefaultValueProp && value === resolvedDefaultValue && selectionIsDisabled;
  }

  if (nextHonorDisabledDefault && (value !== resolvedDefaultValue || !selectionIsDisabled)) {
    nextHonorDisabledDefault = false;
  }

  if (nextHonorDisabledDefault) {
    return {
      action: 'none',
      nextHonorDisabledDefault,
    };
  }

  const hasImplicitDefaultValue = !hasExplicitDefaultValueProp;
  const isAutomaticDefault = isInitialRun && hasImplicitDefaultValue;
  const needsAutoSelection = selectionIsDisabled || selectionIsMissing || isAutomaticDefault;

  if (!needsAutoSelection) {
    return {
      action: 'none',
      nextHonorDisabledDefault,
    };
  }

  const fallbackValue = firstEnabledTabValue ?? null;
  if (value === fallbackValue && !isAutomaticDefault) {
    return {
      action: 'none',
      nextHonorDisabledDefault,
    };
  }

  if (isAutomaticDefault && fallbackValue === null) {
    return {
      action: 'apply',
      nextHonorDisabledDefault,
      nextValue: fallbackValue,
      reason: null,
    };
  }

  let reason: typeof REASONS.disabled | typeof REASONS.initial | typeof REASONS.missing =
    REASONS.missing;
  if (isAutomaticDefault) {
    reason = REASONS.initial;
  } else if (selectionIsDisabled) {
    reason = REASONS.disabled;
  }

  return {
    action: 'apply',
    nextHonorDisabledDefault,
    nextValue: fallbackValue,
    reason,
  };
}
