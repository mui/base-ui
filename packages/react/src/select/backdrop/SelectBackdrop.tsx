'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

const stateAttributesMapping: StateAttributesMapping<SelectBackdrop.State> = {
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

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const transitionStatus = useStore(store, selectors.transitionStatus);

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
    stateAttributesMapping,
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
