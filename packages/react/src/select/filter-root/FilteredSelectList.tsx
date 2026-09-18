'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { activeElement, getTarget } from '../../floating-ui-react/utils';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useCompositeListContext } from '../../internals/composite/list/CompositeListContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { resolveAriaLabelledBy } from '../../utils/resolveAriaLabelledBy';
import { styleDisableScrollbar } from '../../utils/styles';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { useSelectRootContext, useSelectRootPropsContext } from '../root/SelectRootContext';
import type { SelectListProps } from '../list/SelectList';

/**
 * The option list of a filterable select: a listbox inside the popup dialog that holds the
 * input. Keys that land on it are handed back to the input.
 */
export const FilteredSelectList = React.forwardRef(function FilteredSelectList(
  componentProps: SelectListProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = useSelectRootContext();
  const { multiple, readOnly, required } = useSelectRootPropsContext();
  const { labelId: fieldLabelId } = useLabelableContext();
  const { onItemsChange, focusOwnerRef, keyReplayRef } = useFilterDropdownRootContext();
  const { store: filterStore, listRef } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();

  const id = store.useState('id');
  const labelId = store.useState('labelId');
  const hasScrollArrows = store.useState('hasScrollArrows');
  const openMethod = store.useState('openMethod');
  const setListElement = store.useStateSetter('listElement');

  const handleKeyDown = useStableCallback(
    (event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
      const owner = focusOwnerRef.current;
      if (
        owner == null ||
        activeElement(ownerDocument(owner)) === owner ||
        !contains(event.currentTarget, getTarget(event.nativeEvent) as Element) ||
        // An option that already acted on the key keeps it.
        event.defaultPrevented
      ) {
        return;
      }

      // Real focus can land inside the list while the input still owns the keyboard: a scrollbar
      // press focuses the list itself, and a screen reader following `aria-activedescendant`
      // focuses the highlighted option. Hand focus back and replay the key on the input so its
      // handlers run instead of the list scrolling or the key being dropped; a typing key's
      // default action follows the moved focus into the input.
      keyReplayRef.current = true;
      try {
        owner.focus({ preventScroll: true });
      } finally {
        keyReplayRef.current = false;
      }
      const KeyboardEventConstructor = ownerWindow(owner).KeyboardEvent;
      const replayedEvent = new KeyboardEventConstructor(event.type, event.nativeEvent);
      const handled = !owner.dispatchEvent(replayedEvent) || replayedEvent.cancelBubble;
      // The replay already bubbled from the input through this tree; don't deliver it twice.
      event.stopPropagation();
      if (handled) {
        event.preventDefault();
      }
    },
  );

  // `null` distinguishes the initial registration from a list emptied by filtering.
  const previousItemsRef = React.useRef<readonly (HTMLElement | null)[] | null>(null);

  const handleItemMapChange = useStableCallback(() => {
    const items = [...listRef.current];
    const previousItems = previousItemsRef.current;
    if (
      previousItems !== null &&
      previousItems.length === items.length &&
      items.every((item, index) => item === previousItems[index])
    ) {
      return;
    }
    previousItemsRef.current = items;

    // Composite items receive their final indexes from this map update. Publish after their
    // synchronous layout updates commit so the active option's rendered id has settled.
    queueMicrotask(() => {
      if (previousItems !== null) {
        // A positional highlight must not silently move to another option when live items are
        // inserted, removed, or reordered.
        onItemsChange(items.length > 0);
        // The list's scroll range changed with its content.
        const listElement = store.state.listElement;
        if (listElement) {
          store.context.handleScrollArrowVisibility(listElement);
        }
      }
      filterStore.set('items', items);
    });
  });

  useIsoLayoutEffect(() => {
    return subscribeMapChange(handleItemMapChange);
  }, [subscribeMapChange, handleItemMapChange]);

  const listProps = mergeProps<typeof FilterDropdownList>(
    {
      id: id === undefined ? undefined : `${id}-list`,
      role: 'listbox',
      'aria-multiselectable': multiple || undefined,
      'aria-readonly': readOnly || undefined,
      // The trigger is a plain button here, which can't carry these; the listbox can.
      'aria-required': required || undefined,
      'aria-labelledby': resolveAriaLabelledBy(fieldLabelId, labelId),
      onKeyDown: handleKeyDown,
      onScroll(event: React.UIEvent<HTMLDivElement>) {
        store.context.scrollHandlerRef.current?.(event.currentTarget);
      },
      className:
        hasScrollArrows && openMethod !== 'touch' ? styleDisableScrollbar.className : undefined,
    },
    componentProps,
  );

  const ref = useMergedRefs(forwardedRef, setListElement);

  return <FilterDropdownList {...listProps} ref={ref} />;
});
