'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { useListboxItemContext } from '../item/ListboxItemContext';

const TOGGLE_STYLE: React.CSSProperties = { touchAction: 'none' };

/**
 * A control inside a listbox item, such as a checkbox, that selects or deselects the item without
 * changing the rest of the selection when multiple items can be selected. Pressing it and dragging
 * over the toggles of other items selects or deselects them too.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemSelectionToggle = React.forwardRef(function ListboxItemSelectionToggle(
  componentProps: ListboxItemSelectionToggle.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const store = useListboxRootContext();
  const { selected, disabled, index } = useListboxItemContext();
  const multiple = store.useState('multiple') !== false;

  const toggleRef = React.useRef<HTMLSpanElement | null>(null);

  useIsoLayoutEffect(() => {
    const element = toggleRef.current;
    if (!element || index === -1) {
      return undefined;
    }
    return store.painting.registerToggle(element, index);
  }, [index, store]);

  // With single selection, and on a disabled item, a press is an ordinary press on the item.
  // Ctrl+click opens the context menu on macOS.
  function handlesPress(event: React.MouseEvent) {
    return multiple && !disabled && event.button === 0 && !(platform.os.mac && event.ctrlKey);
  }

  const state: ListboxItemSelectionToggleState = {
    selected,
    disabled,
  };

  const defaultProps: HTMLProps = {
    'aria-hidden': true,
    // A finger that goes down on the toggle drags over the other toggles instead of scrolling.
    style: multiple ? TOGGLE_STYLE : undefined,
    onPointerDown(event) {
      if (!handlesPress(event)) {
        return;
      }

      const nativeEvent = event.nativeEvent;
      store.painting.skipClick = true;
      store.focus.moveTo(index, nativeEvent);

      if (event.shiftKey) {
        store.selection.press(index, { shiftKey: true }, nativeEvent);
        return;
      }

      // The toggle selects on press rather than on click, so the drag that may follow knows which
      // state to give the other items.
      store.selection.press(index, { ctrlKey: true }, nativeEvent);
      store.painting.start(index, !selected, nativeEvent);
    },
    onMouseDown(event) {
      // The drag doesn't select text, and focus stays on the item that the press moved it to.
      if (handlesPress(event)) {
        event.preventDefault();
      }
    },
  };

  return useRenderElement('span', componentProps, {
    ref: [forwardedRef, toggleRef],
    state,
    props: [defaultProps, elementProps],
  });
});

export interface ListboxItemSelectionToggleState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
}

export interface ListboxItemSelectionToggleProps extends BaseUIComponentProps<
  'span',
  ListboxItemSelectionToggleState
> {
  children?: React.ReactNode;
}

export namespace ListboxItemSelectionToggle {
  export type State = ListboxItemSelectionToggleState;
  export type Props = ListboxItemSelectionToggleProps;
}
