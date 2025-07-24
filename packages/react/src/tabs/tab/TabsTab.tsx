'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';

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
    compositeProps,
    compositeRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem<TabsTab.Metadata>({ metadata: tabMetadata });

  const tabValue = valueProp ?? index;

  // the `selected` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the selectedTabValue from the TabsContext
  const selected = React.useMemo(() => {
    if (valueProp === undefined) {
      return index < 0 ? false : index === selectedTabValue;
    }

    return valueProp === selectedTabValue;
  }, [index, selectedTabValue, valueProp]);

  const isNavigatingRef = React.useRef(false);

  // Keep the highlighted item in sync with the currently selected tab
  // when the value prop changes externally (controlled mode)
  useIsoLayoutEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    if (selected && index > -1 && highlightedTabIndex !== index) {
      setHighlightedTabIndex(index);
    }
  }, [selected, index, highlightedTabIndex, setHighlightedTabIndex, disabled]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueProp, index) : undefined;

  const isPressingRef = React.useRef(false);
  const isMainButtonRef = React.useRef(false);

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

    if (index > -1) {
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
      selected,
      orientation,
    }),
    [disabled, selected, orientation],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeRef],
    props: [
      compositeProps,
      {
        role: 'tab',
        'aria-controls': tabPanelId,
        'aria-selected': selected,
        id,
        onClick,
        onFocus,
        onPointerDown,
        [ACTIVE_COMPOSITE_ITEM as string]: selected ? '' : undefined,
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

export namespace TabsTab {
  export type Value = any | null;

  export type ActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

  export interface Position {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  export interface Size {
    width: number;
    height: number;
  }

  export interface Metadata {
    disabled: boolean;
    id: string | undefined;
    value: any | undefined;
  }

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
    value?: Value;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
