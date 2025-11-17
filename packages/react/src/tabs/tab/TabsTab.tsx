'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { activeElement, contains } from '../../floating-ui-react/utils';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsTab = React.forwardRef(function TabsTab(
  componentProps: TabsTab.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    className,
    disabled = false,
    render,
    value: valueProp,
    id: idProp,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const {
    value: activeTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const {
    activateOnFocus,
    highlightedTabIndex,
    onTabActivation,
    setHighlightedTabIndex,
    tabsListElement,
  } = useTabsListContext();

  const id = useBaseUiId(idProp);

  const tabMetadata = React.useMemo(
    () => ({ disabled, id, value: valueProp }),
    [disabled, id, valueProp],
  );

  const {
    compositeProps,
    compositeRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem<TabsTab.Metadata>({ metadata: tabMetadata });

  const tabValue = valueProp ?? index;

  // the `active` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the activeTabValue from the TabsContext
  const active = React.useMemo(() => {
    if (valueProp === undefined) {
      return index < 0 ? false : index === activeTabValue;
    }

    return valueProp === activeTabValue;
  }, [index, activeTabValue, valueProp]);

  const isNavigatingRef = React.useRef(false);

  // Keep the highlighted item in sync with the currently active tab
  // when the value prop changes externally (controlled mode)
  useIsoLayoutEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    if (!(active && index > -1 && highlightedTabIndex !== index)) {
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

    setHighlightedTabIndex(index);
  }, [active, index, highlightedTabIndex, setHighlightedTabIndex, disabled, tabsListElement]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueProp, index) : undefined;

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (active || disabled) {
      return;
    }

    onTabActivation(
      tabValue,
      createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
        activationDirection: 'none',
      }),
    );
  }

  function onFocus(event: React.FocusEvent<HTMLButtonElement>) {
    if (active) {
      return;
    }

    if (index > -1) {
      setHighlightedTabIndex(index);
    }

    if (disabled) {
      return;
    }

    if (
      activateOnFocus &&
      (!isPressingRef.current || // keyboard or touch focus
        (isPressingRef.current && isMainButtonRef.current)) // mouse focus
    ) {
      onTabActivation(
        tabValue,
        createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
          activationDirection: 'none',
        }),
      );
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (active || disabled) {
      return;
    }

    isPressingRef.current = true;

    function handlePointerUp() {
      isPressingRef.current = false;
      isMainButtonRef.current = false;
    }

    if (!event.button || event.button === 0) {
      isMainButtonRef.current = true;

      const doc = ownerDocument(event.currentTarget);
      doc.addEventListener('pointerup', handlePointerUp, { once: true });
    }
  }

  const state: TabsTab.State = React.useMemo(
    () => ({
      disabled,
      active,
      orientation,
    }),
    [disabled, active, orientation],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeRef],
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
  value: any | undefined;
}

export interface TabsTabState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  active: boolean;
  orientation: TabsRoot.Orientation;
}

export interface TabsTabProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', TabsTab.State> {
  /**
   * The value of the Tab.
   * When not specified, the value is the child position index.
   */
  value?: TabsTab.Value;
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
