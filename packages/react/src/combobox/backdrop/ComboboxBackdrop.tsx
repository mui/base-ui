'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxBackdrop.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the combobox popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxBackdrop = React.forwardRef(function ComboboxBackdrop(
  componentProps: ComboboxBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useComboboxRootContext();

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
  });
});

export namespace ComboboxBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the combobox popup is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
