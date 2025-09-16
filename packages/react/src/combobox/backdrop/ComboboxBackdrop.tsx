'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

const stateAttributesMapping: StateAttributesMapping<ComboboxBackdrop.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 */
export const ComboboxBackdrop = React.forwardRef(function ComboboxBackdrop(
  componentProps: ComboboxBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useComboboxRootContext();

  const open = useStore(store, selectors.open);
  const mounted = useStore(store, selectors.mounted);
  const transitionStatus = useStore(store, selectors.transitionStatus);

  const state: ComboboxBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    stateAttributesMapping,
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
  });
});

export namespace ComboboxBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the popup is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
