'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { ownerDocument } from '@base-ui/utils/owner';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useCompositeListItem } from '../../internals/composite';
import { findItemIndex } from '../../internals/itemEquality';
import { useListboxRootContext } from '../root/ListboxRootContext';
import type { ListboxRoot } from '../root/ListboxRoot';
import { ListboxItemContext } from './ListboxItemContext';
import { selectionReducer } from '../utils/selectionReducer';
import type { SelectionAction } from '../utils/selectionReducer';

function useListItemValueRegistration(params: {
  index: number;
  itemValue: any;
  hasRegistered: boolean;
  valuesRef: React.RefObject<Array<any>>;
}) {
  const { index, itemValue, hasRegistered, valuesRef } = params;

  useIsoLayoutEffect(() => {
    if (!hasRegistered) {
      return undefined;
    }

    const values = valuesRef.current;
    values[index] = itemValue;

    return () => {
      delete values[index];
    };
  }, [hasRegistered, index, itemValue, valuesRef]);
}

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
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const store = useListboxRootContext();
    const items = store.useState('items');
    const isItemEqualToValue = store.useState('isItemEqualToValue');

    // With `items`, the item's position comes from its value, since a virtualized list renders
    // only some of the items and their order in the DOM doesn't match their position.
    const indexFromItems = React.useMemo(
      () => (items ? findItemIndex(items, itemValue, isItemEqualToValue) : undefined),
      [items, itemValue, isItemEqualToValue],
    );

    const listItem = useCompositeListItem({
      guess: true,
      label,
      index: indexFromItems,
    });

    const multiple = store.useState('multiple');
    const optInMode = multiple === 'opt-in';
    const highlightItemOnHover = store.useState('highlightItemOnHover');
    const rootDisabled = store.useState('disabled');
    const active = store.useState('isActive', listItem.index);
    const highlighted = store.useState('isHighlighted', listItem.index);
    const selected = store.useState('isSelected', listItem.index, itemValue);
    const { disabledItemsRef, lastSelectedIndexRef, setValue, valuesRef } = store.context;

    const index = listItem.index;
    const hasRegistered = index !== -1;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useValueAsRef(index);
    // With `items`, the root already knows every value.
    useListItemValueRegistration({
      index,
      itemValue,
      hasRegistered: hasRegistered && !items,
      valuesRef,
    });

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const disabledItems = disabledItemsRef.current;
      disabledItems[index] = rootDisabled || disabled;

      return () => {
        delete disabledItems[index];
      };
    }, [disabled, disabledItemsRef, hasRegistered, index, rootDisabled]);

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
      const { pendingFocusIndexRef } = store.context;
      if (!hasRegistered || pendingFocusIndexRef.current !== index) {
        return;
      }
      const listElement = store.state.listElement;
      if (activeElement(ownerDocument(listElement)) !== listElement) {
        return;
      }
      pendingFocusIndexRef.current = null;
      itemRef.current?.focus();
    }, [hasRegistered, index, store]);

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

    /**
     * Maps a click event (with modifier keys) to a SelectionAction,
     * then dispatches it through the reducer.
     */
    function commitSelection(
      event: MouseEvent | KeyboardEvent,
      {
        shiftKey = false,
        ctrlKey = false,
        touch = false,
      }: {
        shiftKey?: boolean | undefined;
        ctrlKey?: boolean | undefined;
        touch?: boolean | undefined;
      } = {},
    ) {
      let action: SelectionAction;
      let eventDetails: ListboxRoot.ChangeEventDetails = createChangeEventDetails(
        REASONS.itemPress,
        event,
      );
      // Touch has no modifier keys, so `multiple="opt-in"` toggles on tap like `multiple`.
      const replaceOnPress = optInMode && !touch;
      const anchorIndex = lastSelectedIndexRef.current;

      if (shiftKey && multiple) {
        if (replaceOnPress && ctrlKey) {
          // Ctrl/Cmd+Shift adds the range to the existing selection.
          if (anchorIndex === null) {
            action = { type: 'toggle', index };
          } else {
            action = { type: 'selectRange', from: anchorIndex, to: index };
            eventDetails = createChangeEventDetails(REASONS.itemPress, event, undefined, {
              range: {
                from: Math.min(anchorIndex, index),
                to: Math.max(anchorIndex, index),
                mode: 'add',
              },
            });
          }
        } else {
          action = { type: 'extendTo', index, anchorIndex };
          if (anchorIndex !== null) {
            eventDetails = createChangeEventDetails(REASONS.itemPress, event, undefined, {
              range: {
                from: Math.min(anchorIndex, index),
                to: Math.max(anchorIndex, index),
                mode: 'replace',
              },
            });
          }
        }
      } else if (multiple && (!replaceOnPress || ctrlKey)) {
        // `multiple` toggles on every press; `multiple="opt-in"` toggles with Ctrl/Cmd.
        action = { type: 'toggle', index };
      } else {
        // Single selection, or `multiple="opt-in"` without a modifier.
        action = { type: 'select', index };
      }

      const currentValue = store.state.value;
      const nextValue = selectionReducer(
        action,
        currentValue,
        valuesRef.current,
        disabledItemsRef.current,
        isItemEqualToValue,
      );
      setValue(nextValue, eventDetails);

      // Update selection anchor (used by Shift+Click range selection)
      if (action.type !== 'extendTo') {
        lastSelectedIndexRef.current = index;
      }
    }

    function handleItemKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
      lastKeyRef.current = event.key;
      const currentIndex = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
      const resolvedIndex = currentIndex === -1 ? index : currentIndex;

      store.highlightItem(resolvedIndex, event.nativeEvent);

      // macOS reserves Ctrl+Space and Cmd+Space, so Option+Space toggles the focused item there.
      // Option+Space types a non-breaking space on macOS, so match the physical key.
      if (
        platform.os.mac &&
        multiple &&
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.code === 'Space'
      ) {
        event.preventDefault();
        event.preventBaseUIHandler();
        if (!disabled && !rootDisabled) {
          commitSelection(event.nativeEvent, { shiftKey: event.shiftKey, ctrlKey: true });
        }
      }
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: active ? 0 : -1,
      onFocus(event) {
        store.context.pendingFocusIndexRef.current = null;
        store.highlightItem(index, event.nativeEvent);
        store.context.onItemFocus(index);
      },
      onBlur(event) {
        // Moving focus to another item keeps the highlight; it moves with focus instead. So does
        // the list holding focus for an item that isn't rendered yet.
        const listElement = store.state.listElement;
        const nextTarget = event.relatedTarget;
        if (
          contains(listElement, nextTarget) &&
          (nextTarget !== listElement || store.context.pendingFocusIndexRef.current !== null)
        ) {
          return;
        }
        store.unhighlightItem(event.nativeEvent);
      },
      onMouseMove(event) {
        if (!highlightItemOnHover) {
          return;
        }
        store.hoverItem(index, event.nativeEvent);

        // Hovering only moves focus once focus is in the list, so it never takes focus from
        // another control. Until then, the hovered item is highlighted without focus. Opt-in mode
        // never moves focus on hover, since arrow keys move the selection from the focused item.
        const listElement = store.state.listElement;
        const element = itemRef.current;
        if (!optInMode && element && contains(listElement, activeElement(ownerDocument(element)))) {
          store.highlightItem(index, event.nativeEvent);
          element.focus();
        }
      },
      onKeyDownCapture(event: BaseUIEvent<React.KeyboardEvent>) {
        if (disabled && !rootDisabled) {
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

        if (disabled || rootDisabled) {
          return;
        }

        lastKeyRef.current = null;
        commitSelection(event.nativeEvent, {
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey || event.metaKey,
          touch: event.type !== 'keydown' && lastPointerTypeRef.current === 'touch',
        });
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [defaultProps, elementProps, getButtonProps],
    });

    const contextValue: ListboxItemContext = React.useMemo(
      () => ({
        selected,
        indexRef,
        hasRegistered,
      }),
      [selected, indexRef, hasRegistered],
    );

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
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Overrides the text used for keyboard text navigation.
   * Falls back to the rendered text when not provided.
   */
  label?: string | undefined;
}

export namespace ListboxItem {
  export type State = ListboxItemState;
  export type Props = ListboxItemProps;
}
