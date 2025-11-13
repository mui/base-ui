'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A text input to search for items in the command palette.
 * Renders an `<input>` element.
 */
export const CommandPaletteInput = React.forwardRef(function CommandPaletteInput(
  componentProps: CommandPaletteInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    id: idProp,
    ...elementProps
  } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  const query = store.useState('query');
  const open = store.useState('open');
  const inputRef = store.context.inputRef;

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    if (inputRef.current) {
      store.set('inputElement', inputRef.current);
    }
  }, [store, inputRef]);

  // Focus input when opened
  useIsoLayoutEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, inputRef]);

  const state = React.useMemo<CommandPaletteInput.State>(
    () => ({
      disabled: disabledProp,
      open,
    }),
    [disabledProp, open],
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = event.target.value;
      store.setQuery(newQuery);
      store.context.onOpenChange?.(
        true,
        createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
      );
    },
    [store],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        store.setOpen(false, createChangeEventDetails(REASONS.escapeKey, event.nativeEvent));
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const filteredItems = store.state.filteredItems;
        if (filteredItems.length > 0) {
          const currentIndex = store.state.selectedIndex;
          const nextIndex =
            currentIndex === null ? 0 : Math.min(currentIndex + 1, filteredItems.length - 1);
          store.setSelectedIndex(nextIndex);
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const filteredItems = store.state.filteredItems;
        if (filteredItems.length > 0) {
          const currentIndex = store.state.selectedIndex;
          const nextIndex =
            currentIndex === null ? filteredItems.length - 1 : Math.max(currentIndex - 1, 0);
          store.setSelectedIndex(nextIndex);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selectedIndex = store.state.selectedIndex;
        if (selectedIndex !== null) {
          store.selectItem(selectedIndex);
        }
      }
    },
    [store],
  );

  return useRenderElement('input', componentProps, {
    state,
    ref: [inputRef, forwardedRef],
    props: [
      {
        id,
        type: 'text',
        value: query,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        'aria-autocomplete': 'list',
        'aria-controls': id ? `${id}-list` : undefined,
        autoComplete: 'off',
        disabled: disabledProp,
      },
      elementProps,
    ],
  });
});

export interface CommandPaletteInputState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the command palette is open.
   */
  open: boolean;
}

export interface CommandPaletteInputProps
  extends BaseUIComponentProps<'input', CommandPaletteInput.State> {}

export namespace CommandPaletteInput {
  export type Props = CommandPaletteInputProps;
  export type State = CommandPaletteInputState;
}
