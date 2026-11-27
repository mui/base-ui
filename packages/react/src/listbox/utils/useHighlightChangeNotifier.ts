'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createGenericEventDetails } from '../../internals/createBaseUIEventDetails';
import { getHighlightReason } from '../../utils/getHighlightReason';
import { getHighlightedIndex } from '../store';
import type { ListboxStore } from '../store';
import type { ListboxRoot } from '../root/ListboxRoot';

/**
 * Calls `onItemHighlighted` when the highlighted item changes.
 *
 * Subscribes to the store's highlighted item (the hovered item, or the focused item when the pointer
 * isn't over an item), resolves its value, and derives the reason from the event recorded by the
 * store.
 */
export function useHighlightChangeNotifier<Value>(params: {
  store: ListboxStore;
  onItemHighlighted:
    | ((itemValue: Value | undefined, eventDetails: ListboxRoot.HighlightEventDetails) => void)
    | undefined;
}): void {
  const { store, onItemHighlighted } = params;

  const notify = useStableCallback((index: number, value: Value | undefined) => {
    if (!onItemHighlighted) {
      return;
    }
    const event = store.context.highlightEvent;
    onItemHighlighted(
      value,
      createGenericEventDetails(getHighlightReason(event), event, {
        index,
      }) as ListboxRoot.HighlightEventDetails,
    );
  });

  // Nothing is highlighted at position `-1`, which has no value.
  const lastReportedRef = React.useRef<{ index: number; value: Value | undefined }>({
    index: -1,
    value: undefined,
  });

  // A layout effect, so a highlight made by a layout effect outside the listbox is reported. The
  // highlighted item is tracked without a listener too, so one added later starts from it.
  useIsoLayoutEffect(() => {
    // `settled` is `false` while rendered items may be registering, when the highlighted position
    // can briefly have no item.
    function report(settled: boolean) {
      let index = getHighlightedIndex(store.state) ?? -1;
      if (index !== -1 && !store.hasItemAt(index)) {
        if (!settled) {
          return;
        }
        // The tab stop stays on a position after its item is removed, but nothing is highlighted.
        index = -1;
      }
      const value = store.getValueAt(index);
      const last = lastReportedRef.current;
      // The item at a position can change without the position changing, so the value is compared
      // too.
      if (index === last.index && Object.is(value, last.value)) {
        return;
      }
      lastReportedRef.current = { index, value };
      notify(index, value);
    }

    // An item highlighted earlier in this commit, such as by a layout effect inside the listbox.
    report(true);
    store.context.reportHighlightedItem = () => report(true);
    const unsubscribe = store.subscribe(() => report(false));
    return () => {
      unsubscribe();
      store.context.reportHighlightedItem = undefined;
    };
  }, [store, notify]);
}
