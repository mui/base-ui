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

function computeActivationDirection(
  oldValue: TabsTab.Value | null,
  newValue: TabsTab.Value | null,
  tabRenderOrder: TabsTab.Value[],
  orientation: 'horizontal' | 'vertical',
  isRtl: boolean,
): TabsTab.ActivationDirection {
  if (oldValue == null || newValue == null) {
    return 'none';
  }

  const oldIdx = tabRenderOrder.indexOf(oldValue);
  const newIdx = tabRenderOrder.indexOf(newValue);

  if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) {
    return 'none';
  }

  if (orientation === 'horizontal') {
    return newIdx > oldIdx !== isRtl ? 'right' : 'left';
  }

  return newIdx > oldIdx ? 'down' : 'up';
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

  // Used by TabsIndicator to position itself relative to the active tab.
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

  // Populated by each Tab during render with its value (in render order).
  // Since tabs render before panels in the React tree, panels can read this
  // to determine direction even when a newly added tab is not yet in tabMap.
  const tabRenderOrderRef = React.useRef<TabsTab.Value[]>([]);
  tabRenderOrderRef.current = [];

  // Binds the pure computeActivationDirection helper with component-level args
  // so callers only need to supply old/new values.
  const getActivationDirection = React.useCallback(
    (oldVal: TabsTab.Value | null, newVal: TabsTab.Value | null) =>
      computeActivationDirection(
        oldVal,
        newVal,
        tabRenderOrderRef.current,
        orientation,
        direction === 'rtl',
      ),
    [orientation, direction],
  );

  // Resolves the activation direction for consumers (panels) that render
  // after tabs in the React tree. When the value has changed but the layout
  // effect hasn't committed yet, the state may be stale, so we recompute
  // from render-order indices. Tabs push their values to tabRenderOrderRef
  // during render before panels read this.
  const resolveTabActivationDirection = React.useCallback((): TabsTab.ActivationDirection => {
    if (previousValueRef.current === value) {
      return tabActivationDirection;
    }
    return getActivationDirection(previousValueRef.current, value);
  }, [tabActivationDirection, value, getActivationDirection]);

  // Commit activation direction to state after render for the root's
  // data-activation-direction attribute. Tabs populate tabRenderOrderRef
  // during render (before this effect runs), so the order is always
  // up-to-date — even for newly added tabs.
  useIsoLayoutEffect(() => {
    if (previousValueRef.current === value) {
      return;
    }

    const newDirection = resolveTabActivationDirection();

    previousValueRef.current = value;

    if (newDirection !== tabActivationDirection) {
      setTabActivationDirection(newDirection);
    }
  }, [value, resolveTabActivationDirection, tabActivationDirection]);

  const onValueChange = useStableCallback(
    (newValue: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => {
      const activationDirection = getActivationDirection(value, newValue);
      eventDetails.activationDirection = activationDirection;

      onValueChangeProp?.(newValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

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
      direction,
      getTabElementBySelectedValue,
      getTabIdByPanelValue,
      getTabPanelIdByValue,
      onValueChange,
      orientation,
      registerMountedTabPanel,
      resolveTabActivationDirection,
      setTabMap,
      unregisterMountedTabPanel,
      tabActivationDirection,
      tabRenderOrderRef,
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
      resolveTabActivationDirection,
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
