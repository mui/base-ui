'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { isMouseWithinBounds } from '@base-ui/utils/isMouseWithinBounds';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useCompositeListItem } from '../../internals/composite';
import { findItemIndex } from '../../internals/itemEquality';
import { useListboxRootContext } from '../root/ListboxRootContext';
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

    const listItem = useCompositeListItem({
      guess: true,
      label,
    });

    const store = useListboxRootContext();

    const highlightTimeout = useTimeout();

    const multiple = store.useState('multiple');
    const optInMode = multiple === 'opt-in';
    const highlightItemOnHover = store.useState('highlightItemOnHover');
    const rootDisabled = store.useState('disabled');
    const highlighted = store.useState('isActive', listItem.index);
    const selected = store.useState('isSelected', listItem.index, itemValue);
    const isItemEqualToValue = store.useState('isItemEqualToValue');
    const { disabledItemsRef, lastSelectedIndexRef, setValue, valuesRef } = store.context;

    const index = listItem.index;
    const hasRegistered = index !== -1;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useValueAsRef(index);
    useListItemValueRegistration({
      index,
      itemValue,
      hasRegistered,
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
      // Touch has no modifier keys, so `multiple="opt-in"` toggles on tap like `multiple`.
      const replaceOnPress = optInMode && !touch;

      if (shiftKey && multiple) {
        if (replaceOnPress && ctrlKey) {
          // Ctrl/Cmd+Shift adds the range to the existing selection.
          const anchorIndex = lastSelectedIndexRef.current;
          action =
            anchorIndex === null
              ? { type: 'toggle', index }
              : { type: 'selectRange', from: anchorIndex, to: index };
        } else {
          action = { type: 'extendTo', index, anchorIndex: lastSelectedIndexRef.current };
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
      setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));

      // Update selection anchor (used by Shift+Click range selection)
      if (action.type !== 'extendTo') {
        lastSelectedIndexRef.current = index;
      }
    }

    function handleItemKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
      lastKeyRef.current = event.key;
      const currentIndex = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
      const resolvedIndex = currentIndex === -1 ? index : currentIndex;

      store.setActiveIndex(resolvedIndex, event.nativeEvent);

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
      tabIndex: highlighted ? 0 : -1,
      onFocus(event) {
        store.setActiveIndex(index, event.nativeEvent);
      },
      onMouseMove(event) {
        if (highlightItemOnHover) {
          store.setActiveIndex(index, event.nativeEvent);
          itemRef.current?.focus();
        }
      },
      onMouseLeave(event) {
        if (!highlightItemOnHover || isMouseWithinBounds(event)) {
          return;
        }

        const nativeEvent = event.nativeEvent;
        highlightTimeout.start(0, () => {
          if (store.state.activeIndex === index) {
            store.setActiveIndex(null, nativeEvent);
          }
        });
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
