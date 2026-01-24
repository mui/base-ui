'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useRadioRootContext } from '../root/RadioRootContext';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export const RadioIndicator = React.forwardRef(function RadioIndicator(
  componentProps: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...elementProps } = componentProps;

  const rootState = useRadioRootContext();

  const rendered = rootState.checked;

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  const state: RadioIndicator.State = {
    ...rootState,
    transitionStatus,
  };

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const shouldRender = keepMounted || rendered;

  const element = useRenderElement('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, indicatorRef],
    state,
    props: elementProps,
    stateAttributesMapping,
  });

  useOpenChangeComplete({
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface RadioIndicatorProps extends BaseUIComponentProps<'span', RadioIndicator.State> {
  /**
   * Whether to keep the HTML element in the DOM when the radio button is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface RadioIndicatorState {
  /**
   * Whether the radio button is currently selected.
   */
  checked: boolean;
  transitionStatus: TransitionStatus;
}

export namespace RadioIndicator {
  export type Props = RadioIndicatorProps;
  export type State = RadioIndicatorState;
}
