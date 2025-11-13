'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * An individual command item in the command palette.
 * Renders a `<li>` element.
 */
export const CommandPaletteItem = React.forwardRef(function CommandPaletteItem(
  componentProps: CommandPaletteItem.Props,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
) {
  const {
    render,
    className,
    id: idProp,
    itemId,
    disabled = false,
    ...elementProps
  } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  const filteredItems = store.useState('filteredItems');
  const selectedIndex = store.useState('selectedIndex');

  // Find the index of this item in the filtered list
  const itemIndex = React.useMemo(() => {
    if (itemId === undefined) {
      return -1;
    }
    return filteredItems.findIndex(({ id }) => id === itemId);
  }, [filteredItems, itemId]);

  const highlighted = itemIndex !== -1 && selectedIndex === itemIndex;
  const item = itemIndex !== -1 ? filteredItems[itemIndex] : null;

  const id = useBaseUiId(idProp);
  const itemRefs = store.context.itemRefs;

  // Ensure array is large enough when itemIndex changes
  React.useEffect(() => {
    if (itemIndex !== -1 && itemRefs.current) {
      while (itemRefs.current.length <= itemIndex) {
        itemRefs.current.push(null);
      }
    }
  }, [itemIndex, itemRefs]);

  // Scroll into view when highlighted
  React.useEffect(() => {
    if (highlighted && itemRefs.current[itemIndex]) {
      itemRefs.current[itemIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, itemIndex, itemRefs]);

  const state = React.useMemo<CommandPaletteItem.State>(
    () => ({
      disabled: disabled || (item?.disabled ?? false),
      highlighted,
    }),
    [disabled, item?.disabled, highlighted],
  );

  const handleClick = React.useCallback(
    (_event: React.MouseEvent<HTMLLIElement>) => {
      if (disabled || item?.disabled) {
        return;
      }
      if (itemIndex !== -1) {
        store.selectItem(itemIndex);
      }
    },
    [disabled, item, itemIndex, store],
  );

  const handleMouseEnter = React.useCallback(() => {
    if (itemIndex !== -1) {
      store.setSelectedIndex(itemIndex);
    }
  }, [itemIndex, store]);

  const itemRefCallback = React.useCallback(
    // Callback ref to store the element in the itemRefs array
    (node: HTMLLIElement | null) => {
      if (itemIndex !== -1 && itemRefs.current) {
        while (itemRefs.current.length <= itemIndex) {
          itemRefs.current.push(null);
        }
        itemRefs.current[itemIndex] = node;
      }
    },
    [itemIndex, itemRefs],
  );

  const mergedRef = useMergedRefs(forwardedRef, itemRefCallback);

  return useRenderElement('li', componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        id,
        role: 'option',
        'aria-selected': highlighted,
        tabIndex: highlighted ? 0 : -1,
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
      },
      elementProps,
    ],
  });
});

export interface CommandPaletteItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface CommandPaletteItemProps
  extends BaseUIComponentProps<'li', CommandPaletteItem.State> {
  /**
   * The ID of the command item from the items array.
   * This is used to match the item with the data in the store.
   */
  itemId: string;
  /**
   * Whether the item should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
}

export namespace CommandPaletteItem {
  export type Props = CommandPaletteItemProps;
  export type State = CommandPaletteItemState;
}
