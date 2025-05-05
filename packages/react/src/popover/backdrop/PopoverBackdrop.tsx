'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useRenderElement } from '../../utils/useRenderElement';

const customStyleHookMapping: CustomStyleHookMapping<PopoverBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverBackdrop = React.forwardRef(function PopoverBackdrop(
  props: PopoverBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = props;

  const { open, mounted, transitionStatus, openReason } = usePopoverRootContext();

  const state: PopoverBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const renderElement = useRenderElement('div', props, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: openReason === 'hover' ? 'none' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return renderElement();
});

export namespace PopoverBackdrop {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
