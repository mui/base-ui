'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { ownerDocument } from '@base-ui/utils/owner';
import { error } from '@base-ui/utils/error';
import { warn } from '@base-ui/utils/warn';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { ListboxItemContext } from './ListboxItemContext';

/**
 * An individual option in the listbox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItem = React.memo(
  React.forwardRef(function ListboxItem(
    componentProps: ListboxItem.Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const {
      render,
      className,
      style,
      value: itemValue = null,
      label,
      disabled: disabledProp,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const store = useListboxRootContext();
    const items = store.useState('items');

    // With `items`, the item's position comes from its value, since a virtualized list renders
    // only some of the items and their order in the DOM doesn't match their position.
    const indexFromItems = items ? items.indexOf(itemValue) : undefined;

    const listItem = useCompositeListItem({
      guess: true,
      label,
      index: indexFromItems,
    });

    const rootDisabled = store.useState('disabled');
    const active = store.useState('isActive', listItem.index);
    const highlighted = store.useState('isHighlighted', listItem.index);
    const selected = store.useState('isSelected', itemValue);

    const index = listItem.index;
    const hasRegistered = index !== -1;
    // With `items`, the data decides whether an item is disabled, so the answer doesn't depend on
    // whether the item is rendered.
    const itemDisabled = items
      ? hasRegistered && items.getDisabled(index)
      : (disabledProp ?? false);
    const disabled = rootDisabled || itemDisabled;

    if (process.env.NODE_ENV !== 'production') {
      if (items && (disabledProp !== undefined || label !== undefined)) {
        warn(
          '<Listbox.Item> ignores the `disabled` and `label` props when <Listbox.Root> has `items`, ' +
            "because the list must know every item's state and label, including those that aren't " +
            'rendered. Use the `getDisabled` and `getLabel` options of `Listbox.createItems()` instead.',
        );
      }
      // Checked after the commit against the root's current `items`, which this render may not
      // have seen yet when the items and the data change together.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useEffect(() => {
        if (store.state.items?.indexOf(itemValue) === -1) {
          error(
            `A <Listbox.Item> has the value ${String(itemValue)}, which is not in the \`items\` passed to ` +
              "<Listbox.Root>, so it can't be highlighted or selected. Give each item the value " +
              'that `getValue` returns for it.',
          );
        }
      }, [items, itemValue, store]);
    }

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useValueAsRef(index);
    // With `items`, the root already knows every value and disabled state.
    useIsoLayoutEffect(() => {
      if (!hasRegistered || items) {
        return undefined;
      }

      const values = store.context.valuesRef.current;
      const disabledItems = store.context.disabledItemsRef.current;
      values[index] = itemValue;
      disabledItems[index] = itemDisabled;

      // A selected item holds the tab stop, which was placed before this position was known when
      // the item mounted out of order.
      if (store.state.value.some((selectedValue) => Object.is(selectedValue, itemValue))) {
        store.syncTabStop();
      }

      return () => {
        delete values[index];
        delete disabledItems[index];
      };
    }, [hasRegistered, index, itemValue, itemDisabled, items, store]);

    // In a virtualized list, the list tracks whether the item holding the tab stop is rendered,
    // and takes its place in the tab order while it isn't.
    useIsoLayoutEffect(() => {
      if (!active || !hasRegistered) {
        return undefined;
      }
      store.set('activeItemRendered', true);
      return () => {
        store.set('activeItemRendered', false);
      };
    }, [active, hasRegistered, store]);

    // The list holds focus while it waits for this item to render, such as after an arrow key
    // moved past the rendered items of a virtualized list. Take focus from it.
    useIsoLayoutEffect(() => {
      if (hasRegistered) {
        store.focus.itemRendered(index, itemRef.current);
      }
    }, [hasRegistered, index, store]);

    // A virtualized list stops rendering the focused item when it scrolls out of view. The list
    // takes focus in its place, so the keyboard keeps working, and gives it back once the item
    // renders again.
    const hasItems = items != null;
    useIsoLayoutEffect(() => {
      if (!hasItems) {
        return undefined;
      }
      const element = itemRef.current;
      return () => {
        if (element && activeElement(ownerDocument(element)) === element) {
          // The item's position when it stops rendering, not when the effect ran.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          store.focus.hold(indexRef.current);
        }
      };
    }, [hasItems, indexRef, store]);

    const state: ListboxItemState = {
      disabled,
      selected,
      highlighted,
    };

    const lastKeyRef = React.useRef<string | null>(null);
    // The pointer type of the last press, so a touch tap can be told apart from a click.
    const lastPointerTypeRef = React.useRef<string | null>(null);

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
      composite: true,
    });

    function handleItemKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
      lastKeyRef.current = event.key;
      store.highlightItem(index, event.nativeEvent);

      // macOS reserves Ctrl+Space and Cmd+Space, so Option+Space toggles the focused item there.
      // Option+Space types a non-breaking space on macOS, so match the physical key.
      if (
        platform.os.mac &&
        store.state.multiple &&
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.code === 'Space'
      ) {
        event.preventDefault();
        event.preventBaseUIHandler();
        if (!disabled) {
          store.selection.press(
            index,
            { shiftKey: event.shiftKey, ctrlKey: true },
            event.nativeEvent,
          );
        }
      }
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: active && !rootDisabled ? 0 : -1,
      onFocus(event) {
        if (rootDisabled) {
          return;
        }
        store.highlightItem(index, event.nativeEvent);
        store.focus.itemFocused(index);
      },
      onBlur(event) {
        // Moving focus to another item keeps the highlight; it moves with focus instead. So does
        // the list holding focus for an item that isn't rendered yet.
        const listElement = store.state.listElement;
        const nextTarget = event.relatedTarget;
        if (
          contains(listElement, nextTarget) &&
          (nextTarget !== listElement || store.focus.isPending())
        ) {
          return;
        }
        store.unhighlightItem(event.nativeEvent);
      },
      onMouseMove(event) {
        if (!store.state.highlightItemOnHover || rootDisabled) {
          return;
        }
        store.hoverItem(index, event.nativeEvent);

        // Hovering only moves focus once focus is in the list, so it never takes focus from
        // another control. Until then, the hovered item is highlighted without focus. Opt-in mode
        // never moves focus on hover, since arrow keys move the selection from the focused item.
        const listElement = store.state.listElement;
        const element = itemRef.current;
        if (
          store.state.multiple !== 'opt-in' &&
          element &&
          contains(listElement, activeElement(ownerDocument(element)))
        ) {
          store.highlightItem(index, event.nativeEvent);
          element.focus();
        }
      },
      onKeyDownCapture(event: BaseUIEvent<React.KeyboardEvent>) {
        // A disabled item's button ignores key presses, so they're handled here.
        if (itemDisabled && !rootDisabled) {
          handleItemKeyDown(event);
        }
      },
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        handleItemKeyDown(event);
      },
      onPointerDown(event) {
        lastPointerTypeRef.current = event.pointerType;
      },
      onClick(event) {
        // useButton in composite mode synthesizes a click from keydown (Space/Enter).
        // lastKeyRef is set in our onKeyDown and cleared below. If lastKeyRef is
        // null but the event type is 'keydown', it means a synthetic click arrived
        // without a real keydown we tracked — ignore it to avoid double-selection.
        if (event.type === 'keydown' && lastKeyRef.current === null) {
          return;
        }

        if (disabled) {
          return;
        }

        lastKeyRef.current = null;
        store.selection.press(
          index,
          {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey || event.metaKey,
            touch: event.type !== 'keydown' && lastPointerTypeRef.current === 'touch',
          },
          event.nativeEvent,
        );
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [defaultProps, elementProps, getButtonProps],
    });

    const contextValue: ListboxItemContext = React.useMemo(() => ({ selected }), [selected]);

    return (
      <ListboxItemContext.Provider value={contextValue}>{element}</ListboxItemContext.Provider>
    );
  }),
);

export interface ListboxItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface ListboxItemProps
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', ListboxItemState>, 'id'> {
  children?: React.ReactNode;
  /**
   * A unique value that identifies this listbox item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   *
   * Ignored when the root has `items`. Use the `getDisabled` option of `Listbox.createItems()`
   * instead.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Specifies the text label to use when the item is matched during keyboard text navigation.
   *
   * Defaults to the item text content if not provided.
   *
   * Ignored when the root has `items`. Use the `getLabel` option of `Listbox.createItems()`
   * instead.
   */
  label?: string | undefined;
}

export namespace ListboxItem {
  export type State = ListboxItemState;
  export type Props = ListboxItemProps;
}
