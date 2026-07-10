'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import {
  useComboboxRootContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../internals/composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { selectors } from '../store';
import { useButton } from '../../internals/use-button';
import { useComboboxRowContext } from '../row/ComboboxRowContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { AriaCombobox } from '../root/AriaCombobox';

interface ComboboxCreateItemInnerProps {
  componentProps: ComboboxCreateItem.Props;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
}

function ComboboxCreateItemInner(props: ComboboxCreateItemInnerProps) {
  const { componentProps, forwardedRef } = props;
  const {
    render,
    className,
    style,
    children,
    onCreate,
    disabled = false,
    nativeButton = false,
    ...elementProps
  } = componentProps;

  const store = useComboboxRootContext();
  const isRow = useComboboxRowContext();
  const { query } = useComboboxDerivedItemsContext();

  const rootId = useStore(store, selectors.id);
  const readOnly = useStore(store, selectors.readOnly);
  const itemProps = useStore(store, selectors.itemProps);

  const didPointerDownRef = React.useRef(false);
  const textRef = React.useRef<HTMLElement | null>(null);

  // Register in the composite list (like <Combobox.Item>) so the entry is keyboard-navigable. It
  // must render last so its index aligns with the create value appended to the root's list.
  const listItem = useCompositeListItem({
    textRef,
    indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
  });
  const index = listItem.index;
  const hasRegistered = index !== -1;

  const highlighted = useStore(store, selectors.isActive, index);

  const id = rootId != null && hasRegistered ? `${rootId}-${index}` : undefined;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
    composite: true,
  });

  const state: ComboboxCreateItem.State = {
    disabled,
    highlighted,
  };

  // Reached by both pointer click and keyboard Enter (the List dispatches a synthetic click).
  function commitCreate(nativeEvent: MouseEvent) {
    const overrideEvent = store.state.selectionEventRef.current ?? nativeEvent;
    store.state.selectionEventRef.current = null;

    const eventDetails = createChangeEventDetails(REASONS.createItemPress, overrideEvent);
    onCreate?.(query, eventDetails);

    // Canceling `onCreate` keeps the popup open. `handleCreate` builds its own event details.
    if (eventDetails.isCanceled) {
      return;
    }

    store.state.handleCreate(overrideEvent);
  }

  const resolvedChildren = typeof children === 'function' ? children(query) : children;

  const defaultProps: HTMLProps = {
    id,
    role: isRow ? 'gridcell' : 'option',
    'aria-selected': undefined,
    children: resolvedChildren,
    // Focusable items steal focus from the input upon mouseup.
    tabIndex: undefined,
    onPointerDownCapture(event) {
      didPointerDownRef.current = true;
      event.preventDefault();
    },
    onMouseDown(event) {
      // iOS Safari can emit a synthetic mousedown for touch taps without a preceding
      // pointerdown. Prevent default here too so tapping the entry does not blur the input.
      event.preventDefault();
    },
    onClick(event) {
      if (disabled || readOnly) {
        return;
      }

      commitCreate(event.nativeEvent);
    },
    onMouseUp(event) {
      const pointerStartedOnItem = didPointerDownRef.current;
      didPointerDownRef.current = false;

      if (disabled || readOnly || event.button !== 0 || pointerStartedOnItem || !highlighted) {
        return;
      }

      commitCreate(event.nativeEvent);
    },
  };

  return useRenderElement('div', componentProps, {
    ref: [buttonRef, forwardedRef, listItem.ref],
    state,
    props: [itemProps, defaultProps, elementProps, getButtonProps],
  });
}

/**
 * A special item that lets the user create a new option from the current query.
 * Renders a `<div>` element.
 *
 * Requires the `creatable` prop on `Combobox.Root`. Selecting it fires `onCreate` and closes the
 * popup without committing a value. It is keyboard-navigable like a regular item, and hides itself
 * automatically when the create entry should not be shown (empty or duplicate query).
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxCreateItem = React.forwardRef(function ComboboxCreateItem(
  componentProps: ComboboxCreateItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { shouldShowCreate } = useComboboxDerivedItemsContext();

  // Returning before the inner component mounts keeps its composite-list registration from running
  // while hidden, so it never occupies a phantom list slot.
  if (!shouldShowCreate) {
    return null;
  }

  return <ComboboxCreateItemInner componentProps={componentProps} forwardedRef={forwardedRef} />;
});

export interface ComboboxCreateItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface ComboboxCreateItemProps
  extends
    NonNativeButtonProps,
    Omit<BaseUIComponentProps<'div', ComboboxCreateItemState>, 'id' | 'children'> {
  /**
   * The content of the entry. When a function, it receives the current query string so the entry
   * can render something like `Create "{query}"`.
   */
  children?: React.ReactNode | ((query: string) => React.ReactNode);
  /**
   * Callback fired when the entry is selected (pointer click or keyboard Enter while highlighted).
   * Receives the current query and event details. Call `eventDetails.cancel()` to keep the popup
   * open. Selecting the entry does not commit a value to the combobox.
   */
  onCreate?: ((query: string, eventDetails: AriaCombobox.ChangeEventDetails) => void) | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxCreateItem {
  export type State = ComboboxCreateItemState;
  export type Props = ComboboxCreateItemProps;
}
