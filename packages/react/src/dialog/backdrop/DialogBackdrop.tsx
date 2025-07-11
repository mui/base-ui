'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

const customStyleHookMapping: CustomStyleHookMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  componentProps: DialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, forceRender = false, ...elementProps } = componentProps;
  const { open, nested, mounted, transitionStatus, backdropRef } = useDialogRootContext();

  const state: DialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [backdropRef, forwardedRef],
    customStyleHookMapping,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
    enabled: forceRender || !nested,
  });
});

export namespace DialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the backdrop is forced to render even when nested.
     * @default false
     */
    forceRender?: boolean;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
