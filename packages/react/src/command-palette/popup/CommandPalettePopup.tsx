'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { useCommandPalettePortalContext } from '../portal/CommandPalettePortalContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * A container for the command palette contents.
 * Renders a `<div>` element.
 */
export const CommandPalettePopup = React.forwardRef(function CommandPalettePopup(
  componentProps: CommandPalettePopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const { store } = useCommandPaletteRootContext(true);
  useCommandPalettePortalContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');

  const id = useBaseUiId(idProp);
  const popupRef = store.context.popupRef;

  useIsoLayoutEffect(() => {
    if (popupRef.current) {
      store.set('popupElement', popupRef.current);
    }
  }, [store, popupRef]);

  const state = React.useMemo<CommandPalettePopup.State>(
    () => ({
      open,
      mounted,
      transitionStatus,
    }),
    [open, mounted, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [popupRef, forwardedRef],
    props: [
      {
        id,
        role: 'dialog',
        'aria-modal': true,
        'aria-label': 'Command palette',
      },
      elementProps,
    ],
  });
});

export interface CommandPalettePopupState {
  /**
   * Whether the command palette is open.
   */
  open: boolean;
  /**
   * Whether the command palette is mounted.
   */
  mounted: boolean;
  /**
   * The transition status of the command palette.
   */
  transitionStatus: 'starting' | 'ending' | 'idle' | undefined;
}

export interface CommandPalettePopupProps
  extends BaseUIComponentProps<'div', CommandPalettePopup.State> {}

export namespace CommandPalettePopup {
  export type Props = CommandPalettePopupProps;
  export type State = CommandPalettePopupState;
}
