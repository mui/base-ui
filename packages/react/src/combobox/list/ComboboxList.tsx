'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { selectors } from '../store';
import { ComboboxCollection } from '../collection/ComboboxCollection';
import { stopEvent } from '../../floating-ui-react/utils';

/**
 * The container for the items.
 * Renders a `<div>` element.
 */
export const ComboboxList = React.forwardRef(function ComboboxList(
  componentProps: ComboboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;

  const { store, selectionMode, keyboardActiveRef, cols, handleEnterSelection, popupRef, listRef } =
    useComboboxRootContext();
  const floatingRootContext = useComboboxFloatingContext();
  const positioning = useComboboxPositionerContext(true);

  const multiple = selectionMode === 'multiple';
  const hasPositionerContext = Boolean(useComboboxPositionerContext(true));

  const popupProps = useStore(store, selectors.popupProps);

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const setListElement = useEventCallback((element) => {
    store.set('listElement', element);
  });

  const isPositioned = positioning ? positioning.isPositioned : true;

  // Prevent a layout shift flash when scrolling a long list on initial open
  // over `useListNavigation`'s `scrollItemIntoView`.
  useIsoLayoutEffect(() => {
    if (isPositioned && store.state.activeIndex !== null) {
      listRef.current[store.state.activeIndex]?.scrollIntoView?.({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isPositioned, store, listRef]);

  useIsoLayoutEffect(() => {
    // Only force inline mode when there is no Positioner AND no Popup present
    if (hasPositionerContext || popupRef.current) {
      return undefined;
    }

    store.set('inline', true);
    return () => {
      store.set('inline', false);
    };
  }, [hasPositionerContext, store, popupRef]);

  // Support "closed template" API: if children is a function, implicitly wrap it
  // with a Combobox.Collection that reads items from context/root.
  // Ensures this component's `popupProps` subscription does not cause <Combobox.Item>
  // to re-render on every active index change.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return <ComboboxCollection>{children}</ComboboxCollection>;
    }
    return children;
  }, [children]);

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement, hasPositionerContext ? null : setPositionerElement],
    props: [
      popupProps,
      {
        children: resolvedChildren,
        tabIndex: -1,
        id: floatingRootContext.floatingId,
        role: cols > 1 ? 'grid' : 'listbox',
        'aria-multiselectable': multiple ? 'true' : undefined,
        onKeyDown(event) {
          if (event.key === 'Enter') {
            stopEvent(event);
            handleEnterSelection(event.nativeEvent);
          }
        },
        onKeyDownCapture() {
          keyboardActiveRef.current = true;
        },
        onPointerMoveCapture() {
          keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
  });
});

export namespace ComboboxList {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'children'> {
    children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
  }
}
