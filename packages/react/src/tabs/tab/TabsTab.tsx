'use client';
import * as React from 'react';
import { ownerDocument } from '../../utils/owner';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import type { TabsRoot, TabValue } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';

export interface TabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: any | undefined;
}
/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsTab = React.forwardRef(function Tab(
  componentProps: TabsTab.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    className,
    disabled = false,
    render,
    value: valueProp,
    id: idProp,
    ...elementProps
  } = componentProps;

  const {
    value: selectedTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const { activateOnFocus, highlightedTabIndex, onTabActivation, setHighlightedTabIndex } =
    useTabsListContext();

  const id = useBaseUiId(idProp);

  const tabMetadata = React.useMemo(
    () => ({ disabled, id, value: valueProp }),
    [disabled, id, valueProp],
  );

  const {
    props: compositeItemProps,
    ref: compositeItemRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem<TabMetadata>({ metadata: tabMetadata });

  const tabValue = valueProp ?? index;

  // the `selected` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the selectedTabValue from the TabsContext
  const selected = React.useMemo(() => {
    if (valueProp === undefined) {
      return index < 0 ? false : index === selectedTabValue;
    }

    return valueProp === selectedTabValue;
  }, [index, selectedTabValue, valueProp]);

  const isSelectionSyncedWithHighlightRef = React.useRef(false);

  useModernLayoutEffect(() => {
    if (isSelectionSyncedWithHighlightRef.current === true) {
      return;
    }
    if (activateOnFocus && selected && index > -1 && highlightedTabIndex !== index) {
      setHighlightedTabIndex(index);
      isSelectionSyncedWithHighlightRef.current = true;
    }
  }, [activateOnFocus, highlightedTabIndex, index, selected, setHighlightedTabIndex]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  // const handleRef = useForkRef(compositeItemRef, buttonRef, externalRef);

  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueProp, index) : undefined;

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

  const highlighted = index > -1 && index === highlightedTabIndex;

  const onClick = useEventCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (selected || disabled) {
      return;
    }

    onTabActivation(tabValue, event.nativeEvent);
  });

  const onFocus = useEventCallback((event: React.FocusEvent<HTMLButtonElement>) => {
    if (selected) {
      return;
    }

    if (index > 1 && index !== highlightedTabIndex) {
      setHighlightedTabIndex(index);
    }

    if (disabled) {
      return;
    }

    if (
      (activateOnFocus && !isPressingRef.current) || // keyboard focus
      (isPressingRef.current && isMainButtonRef.current) // focus caused by pointerdown
    ) {
      onTabActivation(tabValue, event.nativeEvent);
    }
  });

  const onPointerDown = useEventCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (selected || disabled) {
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
  });

  const state: TabsTab.State = React.useMemo(
    () => ({
      disabled,
      highlighted,
      selected,
      orientation,
    }),
    [disabled, highlighted, selected, orientation],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeItemRef],
    props: [
      {
        role: 'tab',
        'aria-controls': tabPanelId,
        'aria-selected': selected,
        id,
        onClick,
        onFocus,
        onPointerDown,
      },
      elementProps,
      getButtonProps,
      compositeItemProps,
    ],
  });

  return element;
});

export namespace TabsTab {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    selected: boolean;
    orientation: TabsRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * The value of the Tab.
     * When not specified, the value is the child position index.
     */
    value?: TabValue;
  }
}
