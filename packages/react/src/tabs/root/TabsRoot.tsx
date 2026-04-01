'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeList } from '../../composite/list/CompositeList';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
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
    defaultValue: defaultValueProp = 0,
    onValueChange: onValueChangeProp,
    orientation = 'horizontal',
    render,
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;

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

  const [tabActivationDirection, setTabActivationDirection] =
    React.useState<TabsTab.ActivationDirection>('none');

  const previousValueRef = React.useRef(value);
  const directionJustComputedRef = React.useRef(false);
  const directionComputationIncompleteRef = React.useRef(false);

  // Compute activation direction during render when value changes programmatically
  // so that children see the correct direction on their very first render.
  // Skipped when the click-path handler already computed it (directionJustComputedRef).
  // The ref is read-only here — updated only after commit via layout effect.
  // https://github.com/mui/base-ui/issues/3873
  if (previousValueRef.current !== value && !directionJustComputedRef.current) {
    const activationDirection = computeActivationDirection(
      previousValueRef.current,
      value,
      orientation,
      tabMap,
    );

    // When a new tab is added and selected in the same controlled update,
    // the tab element may not yet be registered in tabMap, so direction was
    // computed from a value-based fallback. Keep previousValueRef stale so
    // we re-compute from DOM positions once tabMap is up to date.
    const isIncomplete =
      previousValueRef.current != null &&
      value != null &&
      getTabElementBySelectedValue(value) == null;

    directionComputationIncompleteRef.current = isIncomplete;

    if (activationDirection !== tabActivationDirection) {
      setTabActivationDirection(activationDirection);
    }
  }

  // Sync the previous value ref after commit and reset the direction flag.
  // When direction computation was incomplete (new tab not yet in tabMap),
  // keep previousValueRef stale so a tabMap update triggers re-computation.
  useIsoLayoutEffect(() => {
    if (!directionComputationIncompleteRef.current) {
      previousValueRef.current = value;
    }
    directionJustComputedRef.current = false;
  });

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      const activationDirection = computeActivationDirection(value, newValue, orientation, tabMap);
      eventDetails.activationDirection = activationDirection;

      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      directionJustComputedRef.current = true;
      setValue(newValue);
      setTabActivationDirection(activationDirection);
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
