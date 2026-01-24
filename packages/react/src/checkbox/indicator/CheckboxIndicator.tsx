'use client';
import * as React from 'react';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useStateAttributesMapping } from '../utils/useStateAttributesMapping';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { fieldValidityMapping } from '../../field/utils/constants';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  componentProps: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...elementProps } = componentProps;

  const rootState = useCheckboxRootContext();

  const rendered = rootState.checked || rootState.indeterminate;

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const state: CheckboxIndicator.State = {
    ...rootState,
    transitionStatus,
  };

  useOpenChangeComplete({
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  const baseStateAttributesMapping = useStateAttributesMapping(rootState);

  const stateAttributesMapping: StateAttributesMapping<CheckboxIndicator.State> = React.useMemo(
    () => ({
      ...baseStateAttributesMapping,
      ...transitionStatusMapping,
      ...fieldValidityMapping,
    }),
    [baseStateAttributesMapping],
  );

  const shouldRender = keepMounted || rendered;

  const element = useRenderElement('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, indicatorRef],
    state,
    stateAttributesMapping,
    props: elementProps,
  });

  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface CheckboxIndicatorState extends CheckboxRoot.State {
  transitionStatus: TransitionStatus;
}

export interface CheckboxIndicatorProps extends BaseUIComponentProps<
  'span',
  CheckboxIndicator.State
> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace CheckboxIndicator {
  export type State = CheckboxIndicatorState;
  export type Props = CheckboxIndicatorProps;
}
