'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

const customStyleHookMapping: CustomStyleHookMapping<SelectBackdrop.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectBackdrop = React.forwardRef(function SelectBackdrop(
  componentProps: SelectBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useSelectRootContext();

  const open = useSelector(store, selectors.isOpen);
  const mounted = useSelector(store, selectors.isMounted);
  const transitionStatus = useSelector(store, selectors.transitionStatus);

  const state: SelectBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
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
    customStyleHookMapping,
  });

  return element;
});

export namespace SelectBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
