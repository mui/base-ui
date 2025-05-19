'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useRadioRootContext } from '../root/RadioRootContext';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useForkRef } from '../../utils/useForkRef';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export const RadioIndicator = React.forwardRef(function RadioIndicator(
  props: RadioIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const rootState = useRadioRootContext();

  const rendered = rootState.checked;

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  const state: RadioIndicator.State = React.useMemo(
    () => ({
      ...rootState,
      transitionStatus,
    }),
    [rootState, transitionStatus],
  );

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: mergedRef,
    className,
    state,
    extraProps: otherProps,
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

  const shouldRender = keepMounted || rendered;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

export namespace RadioIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio button is inactive.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
    transitionStatus: TransitionStatus;
  }
}
