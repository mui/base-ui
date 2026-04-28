'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { NOOP } from '@base-ui/utils/empty';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList';
import { useIsHydrating } from '../../utils/useIsHydrating';
import { TabsRootContext } from './TabsRootContext';
import { tabsStateAttributesMapping } from './stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
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
    defaultValue: defaultValueProp,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

  // Treat `defaultValue={undefined}` the same as omitting the prop entirely.
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

  const isHydrating = useIsHydrating();
  // Panels may open from the selected value during SSR/hydration so the markup
  // matches. Fresh client-only renders start settled so orphan panels do not mount.
  const [tabRegistrationSettled, setTabRegistrationSettled] = React.useState(!isHydrating);

  useIsoLayoutEffect(() => {
    if (!tabRegistrationSettled) {
      setTabRegistrationSettled(true);
    }
  }, [tabRegistrationSettled]);

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

  const notifyAutoSelection = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      onValueChangeProp?.(newValue, eventDetails);
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
        if (tabMetadata != null && tabPanelValue === tabMetadata.value) {
          return tabMetadata.id;
        }
      }

      // `null` means no tab exists for this panel. `undefined` means a tab exists,
      // but React has not assigned its id yet.
      return null;
    },
    [tabMap],
  );

  const tabsContextValue: TabsRootContext = React.useMemo(
    () => ({
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      isControlled,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      tabRegistrationSettled,
      value,
    }),
    [
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      isControlled,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      tabRegistrationSettled,
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

  const firstEnabledTabValue = React.useMemo(() => {
    for (const tabMetadata of tabMap.values()) {
      if (tabMetadata != null && !tabMetadata.disabled) {
        return tabMetadata.value;
      }
    }

    return undefined;
  }, [tabMap]);

  // Automatically switch to the first enabled tab when:
  // - Initial render with no explicit value (fires onValueChange with 'initial' reason)
  // - The current selection is disabled (and wasn't explicitly set via defaultValue on initial render)
  // - The current selection is missing (no rendered tab matches the current value)
  // Falls back to null if all tabs are disabled and preserves that empty selection on later renders.
  const hasRunOnceRef = React.useRef(false);
  const hasRegisteredTabRef = React.useRef(false);

  // When `defaultValue` explicitly points to a disabled tab, we honor that choice
  // on mount (keeping the disabled tab selected). Any subsequent change to the value
  // or to that tab's disabled status ends the grace period — afterwards the disabled
  // selection is treated like any other dynamic disabled-selection fallback.
  const honorDisabledDefaultRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (tabMap.size > 0) {
      hasRegisteredTabRef.current = true;
    }

    // If no tabs have ever registered, defer automatic fallback. This preserves
    // explicit selections while tabs are conditionally rendered later.
    if (isControlled || (tabMap.size === 0 && !hasRegisteredTabRef.current)) {
      return;
    }

    const isInitialRun = !hasRunOnceRef.current;
    const selectionIsDisabled = selectedTabMetadata?.disabled === true;
    const selectionIsMissing = selectedTabMetadata == null && value !== null;
    let honorDisabledDefault = honorDisabledDefaultRef.current;

    if (isInitialRun) {
      honorDisabledDefault =
        hasExplicitDefaultValueProp && value === resolvedDefaultValue && selectionIsDisabled;
    }

    if (honorDisabledDefault && (value !== resolvedDefaultValue || !selectionIsDisabled)) {
      honorDisabledDefault = false;
    }

    hasRunOnceRef.current = true;
    honorDisabledDefaultRef.current = honorDisabledDefault;

    if (honorDisabledDefault) {
      return;
    }

    const isAutomaticDefault = isInitialRun && !hasExplicitDefaultValueProp;
    const needsAutoSelection = selectionIsDisabled || selectionIsMissing || isAutomaticDefault;

    if (!needsAutoSelection) {
      return;
    }

    const nextValue = firstEnabledTabValue ?? null;

    if (value === nextValue && !isAutomaticDefault) {
      return;
    }

    // When the implicit default has no enabled tab to select, silently clear it.
    // There is no meaningful tab value to report to `onValueChange`.
    if (isAutomaticDefault && nextValue === null) {
      setValue(nextValue);
      setActivationDirectionState({
        previousValue: nextValue,
        tabActivationDirection: 'none',
      });
      return;
    }

    let reason: typeof REASONS.disabled | typeof REASONS.initial | typeof REASONS.missing =
      REASONS.missing;
    if (isAutomaticDefault) {
      reason = REASONS.initial;
    } else if (selectionIsDisabled) {
      reason = REASONS.disabled;
    }

    // Keep automatic details intentionally non-cancelable. They preserve the
    // public event shape without creating the generic cancellable state.
    const eventDetails = {
      reason,
      event: new Event('base-ui'),
      cancel: NOOP,
      allowPropagation: NOOP,
      isCanceled: false,
      isPropagationAllowed: false,
      trigger: undefined,
      activationDirection: 'none',
    } as TabsRoot.ChangeEventDetails;

    // Notify the user's callback directly, bypassing the standard onValueChange
    // (which would recompute activationDirection). Automatic selections are not
    // cancelable because a disabled or missing tab can't remain selected.
    notifyAutoSelection(nextValue, eventDetails);
    setValue(nextValue);
    setActivationDirectionState({
      previousValue: nextValue,
      tabActivationDirection: 'none',
    });
  }, [
    firstEnabledTabValue,
    hasExplicitDefaultValueProp,
    isControlled,
    notifyAutoSelection,
    resolvedDefaultValue,
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
   *
   * The `eventDetails.reason` is `'none'` for user-initiated changes such as
   * clicks or keyboard navigation, `'initial'` for automatic selection on mount
   * when no `value` or `defaultValue` is provided, `'disabled'` when the selected
   * tab became disabled, and `'missing'` when the current value no longer maps to
   * any rendered tab. Automatic reasons are emitted only for uncontrolled roots;
   * controlled roots keep selection owned by the `value` prop.
   *
   * Calling `eventDetails.cancel()` prevents the value change for user-initiated
   * actions (`'none'`). For automatic selections (`'initial'`, `'disabled'`,
   * `'missing'`), `cancel()` and `allowPropagation()` are no-ops, and
   * `isCanceled` and `isPropagationAllowed` remain `false`.
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
