'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { DialogViewportDataAttributes } from './DialogViewportDataAttributes';
import { useCSPContext } from '../../csp-provider/CSPContext';
import { styleDisableScrollbar } from '../../utils/styles';

const stateAttributesMapping: StateAttributesMapping<DialogViewport.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nested(value) {
    return value ? { [DialogViewportDataAttributes.nested]: '' } : null;
  },
  nestedDialogOpen(value) {
    return value ? { [DialogViewportDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

// iOS scroll locking styles.
// This prevents background scrolling on iOS devices when a modal dialog is open and
// the navbar is collapsed as the scroll is trapped in the dialog viewport.
const SCROLLER_STYLES: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overscrollBehavior: 'none',
};
const OVERFLOW_WRAPPER_STYLES: React.CSSProperties = {
  height: 'calc(100% + 1px)',
};
const STICKY_WRAPPER_STYLES: React.CSSProperties = {
  position: 'sticky' as const,
  top: 0,
  bottom: 0,
  height: 'calc(100% - 1px)',
};

/**
 * A positioning container for the dialog popup that can be made scrollable.
 * This part also robustly locks the scroll on iOS devices.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogViewport = React.forwardRef(function DialogViewport(
  componentProps: DialogViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const keepMounted = useDialogPortalContext();
  const { store } = useDialogRootContext();
  const { disableStyleElements, nonce } = useCSPContext();

  const open = store.useState('open');
  const nested = store.useState('nested');
  const transitionStatus = store.useState('transitionStatus');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const state: DialogViewport.State = React.useMemo(
    () => ({
      open,
      nested,
      transitionStatus,
      nestedDialogOpen,
    }),
    [open, nested, transitionStatus, nestedDialogOpen],
  );

  const shouldRender = keepMounted || mounted;

  const element = useRenderElement('div', componentProps, {
    enabled: shouldRender,
    state,
    ref: [forwardedRef, store.useStateSetter('viewportElement')],
    stateAttributesMapping,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        children,
      },
      elementProps,
    ],
  });

  const scrollerStyles: React.CSSProperties = React.useMemo(
    () => ({
      ...SCROLLER_STYLES,
      overflowY: open ? 'auto' : 'hidden',
    }),
    [open],
  );

  return (
    <div style={modal ? scrollerStyles : undefined} className={styleDisableScrollbar.className}>
      <div style={modal ? OVERFLOW_WRAPPER_STYLES : undefined}>
        <div style={modal ? STICKY_WRAPPER_STYLES : undefined}>
          {!disableStyleElements && modal && styleDisableScrollbar.getElement(nonce)}
          {element}
        </div>
      </div>
    </div>
  );
});

export interface DialogViewportState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  transitionStatus: TransitionStatus;
  /**
   * Whether the dialog is nested within another dialog.
   */
  nested: boolean;
  /**
   * Whether the dialog has nested dialogs open.
   */
  nestedDialogOpen: boolean;
}

export interface DialogViewportProps extends BaseUIComponentProps<'div', DialogViewportState> {}

export namespace DialogViewport {
  export type State = DialogViewportState;
  export type Props = DialogViewportProps;
}
