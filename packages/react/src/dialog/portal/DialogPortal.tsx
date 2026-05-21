'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { FloatingPortal } from '../../floating-ui-react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogPortal = React.forwardRef(function DialogPortal(
  props: DialogPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');
  const open = store.useState('open');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  // Intentionally NOT passing `referenceElement` to `FloatingPortal`.
  // Dialogs (modal or non-modal), AlertDialogs and Drawers are not visually
  // anchored to a trigger the way Popover/Menu/Tooltip popups are - they
  // cover the viewport, slide in from a screen edge, or center themselves
  // with their own internal layout. If they're open while a fullscreen
  // element is active they should always be rerouted into that fullscreen
  // subtree, regardless of where the trigger lives. Opting out of the
  // anchor-aware heuristic falls back to FloatingPortal's simpler
  // "reroute when the default container is outside fullscreen" behaviour.
  return (
    <DialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps}>
        {mounted && modal === true && (
          <InternalBackdrop ref={store.context.internalBackdropRef} inert={inertValue(!open)} />
        )}
        {props.children}
      </FloatingPortal>
    </DialogPortalContext.Provider>
  );
});

export interface DialogPortalState {}

export interface DialogPortalProps extends FloatingPortal.Props<DialogPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?: FloatingPortal.Props<DialogPortalState>['container'] | undefined;
}

export namespace DialogPortal {
  export type State = DialogPortalState;
  export type Props = DialogPortalProps;
}
