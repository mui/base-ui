'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { BaseUIEvent } from '../../internals/types';

/**
 * Returns `click` and `mousedown` handlers that fix the behavior of triggers of popups that are toggled by different events.
 * For example, a button that opens a popup on mousedown and closes it on click.
 * This hook prevents the popup from closing immediately after the mouse button is released.
 */
export function useMixedToggleClickHandler(params: UseMixedToggleClickHandlerParameters) {
  const { enabled = true, mouseDownAction, open } = params;
  const ignoreClickRef = React.useRef(false);

  return React.useMemo(() => {
    if (!enabled) {
      return EMPTY_OBJECT;
    }

    function resolveMouseDownAction() {
      return typeof mouseDownAction === 'function' ? mouseDownAction() : mouseDownAction;
    }

    return {
      onMouseDown: (event: React.MouseEvent) => {
        const resolvedMouseDownAction = resolveMouseDownAction();

        if (
          (resolvedMouseDownAction === 'open' && !open) ||
          (resolvedMouseDownAction === 'close' && open)
        ) {
          ignoreClickRef.current = true;

          ownerDocument(event.currentTarget as Element).addEventListener(
            'click',
            () => {
              ignoreClickRef.current = false;
            },
            { once: true },
          );
        }
      },
      onClick: (event: BaseUIEvent<React.MouseEvent>) => {
        if (ignoreClickRef.current) {
          ignoreClickRef.current = false;
          event.preventBaseUIHandler();
        }
      },
    };
  }, [enabled, mouseDownAction, open]);
}

type MouseDownAction = 'open' | 'close' | 'none';

export interface UseMixedToggleClickHandlerParameters {
  /**
   * Whether the mixed toggle click handler is enabled.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Determines what action is performed on mousedown.
   */
  mouseDownAction: MouseDownAction | (() => MouseDownAction);
  /**
   * The current open state of the popup.
   */
  open: boolean;
}

export interface UseMixedToggleClickHandlerState {}
