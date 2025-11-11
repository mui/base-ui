'use client';
import * as React from 'react';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the command palette.
 * Renders a `<button>` element.
 */
export const CommandPaletteTrigger = React.forwardRef(function CommandPaletteTrigger(
  componentProps: CommandPaletteTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  const open = store.useState('open');

  const state = React.useMemo<CommandPaletteTrigger.State>(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      store.setOpen(!open, createChangeEventDetails(REASONS.triggerPress, event.nativeEvent));
    },
    [disabled, open, store],
  );

  return useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [
      {
        onClick: handleClick,
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export interface CommandPaletteTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the command palette is open.
   */
  open: boolean;
}

export interface CommandPaletteTriggerProps
  extends NativeButtonProps,
    BaseUIComponentProps<'button', CommandPaletteTrigger.State> {}

export namespace CommandPaletteTrigger {
  export type Props = CommandPaletteTriggerProps;
  export type State = CommandPaletteTriggerState;
}
