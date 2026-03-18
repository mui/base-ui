'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeList } from '../../composite/list/CompositeList';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { TabsRootContext } from './TabsRootContext';
import { tabsStateAttributesMapping } from './stateAttributesMapping';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsPanel } from '../panel/TabsPanel';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
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
    defaultValue: defaultValueProp,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    ...elementProps
  } = componentProps;

  const direction = useDirection();

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

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabsTab.ActivationDirection>('none');
  const [hidePanelsWithoutMatchingTab, setHidePanelsWithoutMatchingTab] = React.useState(false);
  const noRenderedTabsTimeout = useTimeout();

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
      hidePanelsWithoutMatchingTab,
      direction,
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
      hidePanelsWithoutMatchingTab,
      direction,
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

  // Automatically switch to the first enabled tab when:
  // - Initial render with no explicit value (fires onValueChange with 'initial' reason)
  // - The current selection is disabled
  // - The current selection is missing (no rendered tab matches the current value)
  // Falls back to null if all tabs are disabled and preserves that empty selection on later renders.
  const hasRunOnceRef = React.useRef(false);
  const hasRegisteredTabRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (tabMap.size > 0) {
      hasRegisteredTabRef.current = true;
    }
    if (isControlled || (tabMap.size === 0 && !hasRegisteredTabRef.current)) {
      return;
    }

    const selectionIsDisabled = selectedTabMetadata?.disabled === true;
    const selectionIsMissing = selectedTabMetadata == null && value !== null;
    const isInitialRun = !hasRunOnceRef.current;

    hasRunOnceRef.current = true;

    // Need to auto-select if:
    // - Selection is disabled
    // - Selection is missing (no rendered tab matches the current value)
    // - Initial run with no explicit defaultValue (automatic default to 0)
    const hasImplicitDefaultValue = !hasExplicitDefaultValueProp;
    const isAutomaticDefault = isInitialRun && hasImplicitDefaultValue;
    const needsAutoSelection = selectionIsDisabled || selectionIsMissing || isAutomaticDefault;

    if (!needsAutoSelection) {
      return;
    }

    const fallbackValue = firstEnabledTabValue ?? null;

    // Skip if value already matches fallback, UNLESS this is an automatic default selection
    // (where value happens to match fallback but we still need to notify)
    if (value === fallbackValue && !isAutomaticDefault) {
      return;
    }

    // When all tabs are disabled on initial render with no explicit default,
    // set value to null silently (no callback) — there's no meaningful selection
    // to report to the user.
    if (isAutomaticDefault && fallbackValue === null) {
      setValue(fallbackValue);
      setTabActivationDirection('none');
      return;
    }

    let reason: TabsRoot.ChangeEventReason = REASONS.missing;
    if (isAutomaticDefault) {
      reason = REASONS.initial;
    } else if (selectionIsDisabled) {
      reason = REASONS.disabled;
    }

    const eventDetails = createChangeEventDetails(reason, undefined, undefined, {
      activationDirection: 'none' as const,
    });

    // Notify via onValueChange (which calls the user's callback), then always
    // apply the fallback. The second setValue/setTabActivationDirection call
    // ensures cancel() is a no-op for automatic selections — the disabled/missing
    // tab can't stay selected. React deduplicates the redundant setState when
    // the user doesn't cancel.
    onValueChange(fallbackValue, eventDetails);
    setValue(fallbackValue);
    setTabActivationDirection('none');
  }, [
    firstEnabledTabValue,
    hasExplicitDefaultValueProp,
    isControlled,
    onValueChange,
    selectedTabMetadata,
    setTabActivationDirection,
    setValue,
    tabMap,
    value,
  ]);

  useIsoLayoutEffect(() => {
    if (tabMap.size > 0 || mountedTabPanels.size === 0 || value === null) {
      noRenderedTabsTimeout.clear();
      setHidePanelsWithoutMatchingTab(false);
      return undefined;
    }

    noRenderedTabsTimeout.start(0, () => {
      if (tabMap.size > 0 || mountedTabPanels.size === 0 || value === null) {
        return;
      }

      setHidePanelsWithoutMatchingTab(true);
    });

    return noRenderedTabsTimeout.clear;
  }, [mountedTabPanels, noRenderedTabsTimeout, tabMap, value]);

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
