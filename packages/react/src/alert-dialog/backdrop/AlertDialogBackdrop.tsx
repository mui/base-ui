'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogBackdrop = React.forwardRef(function AlertDialogBackdrop(
  props: AlertDialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, renderMode = 'root', ...other } = props;
  const { open, nested, mounted, transitionStatus, backdropRef, nestedOpenDialogCount } =
    useAlertDialogRootContext();

  const state: AlertDialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const mergedRef = useForkRef(backdropRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: mergeProps(
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      other,
    ),
    customStyleHookMapping,
  });

  let shouldRender = true;
  if (renderMode === 'root') {
    shouldRender = !nested;
  } else if (renderMode === 'leaf') {
    shouldRender = nestedOpenDialogCount === 0;
  }

  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

export namespace AlertDialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * How to render the backdrop when dialogs are nested in the React tree.
     * @default 'root'
     * @description
     * - `root`: Render only one backdrop at the root dialog.
     * - `leaf`: Render only one backdrop at the leaf dialog.
     * - `always`: Always render the backdrop regardless of nesting.
     */
    renderMode?: 'root' | 'leaf' | 'always';
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
