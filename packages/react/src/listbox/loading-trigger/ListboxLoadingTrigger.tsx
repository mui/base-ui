'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { selectors } from '../store';

/**
 * A sentinel element that triggers loading more items when scrolled into view.
 * Renders a `<div>` element.
 *
 * Place at the end of the listbox items. When it becomes visible in the
 * scrollable list container, the `onLoadMore` callback on `Listbox.Root` is called.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxLoadingTrigger = React.forwardRef(function ListboxLoadingTrigger(
  componentProps: ListboxLoadingTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const keepMounted = componentProps.keepMounted ?? false;

  const { store, onLoadMore } = useListboxRootContext();
  const loading = useStore(store, selectors.loading);

  const shouldRender = keepMounted || loading || !!onLoadMore;
  if (!shouldRender) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return <Inner {...componentProps} ref={forwardedRef} />;
});

const Inner = React.forwardRef(function ListboxLoadingTriggerInner(
  componentProps: ListboxLoadingTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted, ...elementProps } = componentProps;

  const { store, onLoadMore } = useListboxRootContext();
  const loading = useStore(store, selectors.loading);
  const listElement = useStore(store, selectors.listElement);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const handleIntersect = useStableCallback(() => {
    if (!store.state.loading && onLoadMore) {
      onLoadMore();
    }
  });

  useIsoLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listElement;
    if (!sentinel || !root) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            handleIntersect();
          }
        }
      },
      {
        root,
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [listElement, handleIntersect]);

  const state: ListboxLoadingTriggerState = {
    loading,
  };

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, sentinelRef],
    state,
    props: elementProps,
  });
});

export interface ListboxLoadingTriggerState {
  /**
   * Whether items are currently being loaded.
   */
  loading: boolean;
}

export interface ListboxLoadingTriggerProps extends BaseUIComponentProps<
  'div',
  ListboxLoadingTriggerState
> {
  /**
   * Whether to keep the HTML element in the DOM when not loading.
   */
  keepMounted?: boolean | undefined;
}

export namespace ListboxLoadingTrigger {
  export type State = ListboxLoadingTriggerState;
  export type Props = ListboxLoadingTriggerProps;
}
