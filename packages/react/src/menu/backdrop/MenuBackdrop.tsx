'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { mergeProps } from '../../merge-props';

const customStyleHookMapping: CustomStyleHookMapping<MenuBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuBackdrop = React.forwardRef(function MenuBackdrop(
  props: MenuBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...other } = props;
  const { open, mounted, transitionStatus, lastOpenChangeReason } = useMenuRootContext();

  const state: MenuBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: mergeProps<'div'>(
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          pointerEvents: lastOpenChangeReason === 'trigger-hover' ? 'none' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      other,
    ),
    customStyleHookMapping,
  });

  return renderElement();
});

export namespace MenuBackdrop {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
