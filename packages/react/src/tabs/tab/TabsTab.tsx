'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants';
import { useCompositeItem } from '../../internals/composite/item/useCompositeItem';
import { useCompositeRootContext } from '../../internals/composite/root/CompositeRootContext';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsListContext } from '../list/TabsListContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { activeElement, contains } from '../../floating-ui-react/utils';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsTab = React.forwardRef(function TabsTab(
  componentProps: TabsTab.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    className,
    disabled = false,
    render,
    value,
    id: idProp,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const {
    value: activeTabValue,
    getTabPanelIdByValue,
    onValueChange,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const { activateOnFocus, registerTabResizeObserverElement, tabsListElement } =
    useTabsListContext();

  const { highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();

  const id = useBaseUiId(idProp);

  const tabMetadata = React.useMemo(() => ({ disabled, id, value }), [disabled, id, value]);

  const {
    compositeProps,
    compositeRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem<TabsTab.Metadata>({
    metadata: tabMetadata,
  });

  const active = value === activeTabValue;

  const isNavigatingRef = React.useRef(false);
  const unobserveTabElementRef = React.useRef<(() => void) | null>(null);

  // Registered from the ref callback rather than an effect so the observer
  // follows the rendered element when the `render` prop swaps the host element.
  const observeTabElement = useStableCallback((element: HTMLElement | null) => {
    unobserveTabElementRef.current?.();
    unobserveTabElementRef.current = element ? registerTabResizeObserverElement(element) : null;
  });

  // Keep the highlighted item in sync with the currently active tab
  // when the value prop changes externally (controlled mode)
  useIsoLayoutEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    if (!(active && index > -1 && highlightedIndex !== index)) {
      return;
    }

    // If focus is currently within the tabs list, don't override the roving
    // focus highlight. This keeps keyboard navigation relative to the focused
    // item after an external/asynchronous selection change.
    const listElement = tabsListElement;
    if (listElement != null) {
      const activeEl = activeElement(ownerDocument(listElement));
      if (activeEl && contains(listElement, activeEl)) {
        return;
      }
    }

    // Don't highlight disabled tabs to prevent them from interfering with keyboard navigation.
    // Keyboard focus (tabIndex) should remain on an enabled tab even when a disabled tab is selected.
    if (!disabled) {
      onHighlightedIndexChange(index);
    }
  }, [active, index, highlightedIndex, onHighlightedIndexChange, disabled, tabsListElement]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const tabPanelId = getTabPanelIdByValue(value);

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  // Both callers guard on `!active`, so the current value is never re-committed.
  function activate(event: React.SyntheticEvent) {
    onValueChange(
      value,
      createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
        activationDirection: 'none',
      }),
    );
  }

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (active || disabled) {
      return;
    }

    activate(event);
  }

  function onFocus(event: React.FocusEvent<HTMLButtonElement>) {
    if (active || disabled) {
      return;
    }

    if (
      activateOnFocus &&
      (!isPressingRef.current || // keyboard or touch focus
        isMainButtonRef.current) // main mouse button focus
    ) {
      activate(event);
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (active || disabled) {
      return;
    }

    isPressingRef.current = true;
    // Secondary presses (context menu, middle click) may focus the tab, but
    // must not activate it with `activateOnFocus`.
    isMainButtonRef.current = event.button === 0;

    // Registered for every button so a secondary press doesn't leave the tab
    // stuck in the pressing state, which would suppress later focus activation.
    const doc = ownerDocument(event.currentTarget);

    function handlePointerEnd() {
      isPressingRef.current = false;
      isMainButtonRef.current = false;
      doc.removeEventListener('pointerup', handlePointerEnd);
      doc.removeEventListener('pointercancel', handlePointerEnd);
    }

    doc.addEventListener('pointerup', handlePointerEnd);
    doc.addEventListener('pointercancel', handlePointerEnd);
  }

  const state: TabsTabState = {
    disabled,
    active,
    orientation,
    tabActivationDirection,
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeRef, observeTabElement],
    props: [
      compositeProps,
      {
        role: 'tab',
        'aria-controls': tabPanelId,
        'aria-selected': active,
        id,
        onClick,
        onFocus,
        onPointerDown,
        [ACTIVE_COMPOSITE_ITEM as string]: active ? '' : undefined,
        onKeyDownCapture() {
          isNavigatingRef.current = true;
        },
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping: tabsStateAttributesMapping,
  });

  return element;
});

export type TabsTabValue = any | null;

export type TabsTabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export interface TabsTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TabsTabSize {
  width: number;
  height: number;
}

export interface TabsTabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: TabsTab.Value | undefined;
}

export interface TabsTabState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component is active.
   */
  active: boolean;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}

export interface TabsTabProps
  extends NativeButtonProps, BaseUIComponentProps<'button', TabsTabState> {
  /**
   * The value of the Tab.
   */
  value: TabsTab.Value;
  /**
   * Whether the Tab is disabled.
   *
   * If a first Tab on a `<Tabs.List>` is disabled, it won't initially be selected.
   * Instead, the next enabled Tab will be selected.
   * However, it does not work like this during server-side rendering, as it is not known
   * during pre-rendering which Tabs are disabled.
   * To work around it, ensure that `defaultValue` or `value` on `<Tabs.Root>` is set to an enabled Tab's value.
   */
  disabled?: boolean | undefined;
}

export namespace TabsTab {
  export type Value = TabsTabValue;
  export type ActivationDirection = TabsTabActivationDirection;
  export type Position = TabsTabPosition;
  export type Size = TabsTabSize;
  export type Metadata = TabsTabMetadata;
  export type State = TabsTabState;
  export type Props = TabsTabProps;
}
