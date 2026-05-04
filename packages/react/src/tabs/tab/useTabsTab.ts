'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { ACTIVE_COMPOSITE_ITEM } from '../../internals/composite/constants';
import { useCompositeItem } from '../../internals/composite/item/useCompositeItem';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { HTMLProps } from '../../internals/types';
import { useButton } from '../../internals/use-button';
import { mergeProps } from '../../merge-props';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { REASONS } from '../../internals/reasons';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab, TabsTabState } from './TabsTab';

export function useTabsTab(params: UseTabsTabParameters): UseTabsTabReturnValue {
  const { disabled, id: idProp, nativeButton, value } = params;

  const {
    value: activeTabValue,
    getTabPanelIdByValue,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const {
    activateOnFocus,
    highlightedTabIndex,
    onTabActivation,
    registerTabResizeObserverElement,
    setHighlightedTabIndex,
    tabsListElement,
  } = useTabsListContext();

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
  const tabElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const tabElement = tabElementRef.current;
    if (!tabElement) {
      return undefined;
    }

    return registerTabResizeObserverElement(tabElement);
  }, [registerTabResizeObserverElement]);

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

    // Don't highlight disabled tabs to prevent them from interfering with keyboard navigation.
    // Keyboard focus (tabIndex) should remain on an enabled tab even when a disabled tab is selected.
    if (!disabled) {
      setHighlightedTabIndex(index);
    }
  }, [active, index, highlightedTabIndex, setHighlightedTabIndex, disabled, tabsListElement]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const tabPanelId = getTabPanelIdByValue(value);

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  function onClick(event: React.MouseEvent<HTMLElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (active) {
      return;
    }

    if (
      event.defaultPrevented ||
      (!nativeButton &&
        (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))
    ) {
      return;
    }

    onTabActivation(
      value,
      createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
        activationDirection: 'none',
      }),
    );
  }

  function onFocus(event: React.FocusEvent<HTMLElement>) {
    if (active) {
      return;
    }

    // Only highlight enabled tabs when focused (disabled tabs remain focusable via focusableWhenDisabled).
    if (index > -1 && !disabled) {
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
        value,
        createChangeEventDetails(REASONS.none, event.nativeEvent, undefined, {
          activationDirection: 'none',
        }),
      );
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (active || disabled) {
      return;
    }

    isPressingRef.current = true;
    isMainButtonRef.current = event.button === 0;

    function handlePointerUp() {
      isPressingRef.current = false;
      isMainButtonRef.current = false;
    }

    const doc = ownerDocument(event.currentTarget);
    doc.addEventListener('pointerup', handlePointerUp, { once: true });
  }

  const state: TabsTabState = {
    disabled,
    active,
    orientation,
    tabActivationDirection,
  };

  function getTabProps(externalProps?: HTMLProps): HTMLProps {
    return mergeProps<'div'>(
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
      externalProps,
      getButtonProps,
    );
  }

  return {
    getTabProps,
    refs: [buttonRef, compositeRef, tabElementRef],
    state,
  };
}

export interface UseTabsTabParameters {
  disabled: boolean;
  id: string | undefined;
  nativeButton: boolean;
  value: TabsTab.Value;
}

export interface UseTabsTabReturnValue {
  getTabProps: (externalProps?: HTMLProps) => HTMLProps;
  refs: [React.Ref<HTMLElement>, React.Ref<HTMLElement>, React.RefObject<HTMLElement | null>];
  state: TabsTabState;
}
