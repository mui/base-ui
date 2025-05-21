'use client';
import * as React from 'react';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useStateAttributesMapping } from '../utils/useStateAttributesMapping';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useForkRef } from '../../utils/useForkRef';
import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { fieldValidityMapping } from '../../field/utils/constants';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  props: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const rootState = useCheckboxRootContext();

  const rendered = rootState.checked || rootState.indeterminate;

  const { transitionStatus, setMounted } = useTransitionStatus(rendered);

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const state: CheckboxIndicator.State = React.useMemo(
    () => ({
      ...rootState,
      transitionStatus,
    }),
    [rootState, transitionStatus],
  );

  useOpenChangeComplete({
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  const baseMapping = useStateAttributesMapping(rootState);

  const stateAttributesMapping: StateAttributesMapping<CheckboxIndicator.State> = React.useMemo(
    () => ({
      ...baseMapping,
      ...transitionStatusMapping,
      ...fieldValidityMapping,
    }),
    [baseMapping],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: mergedRef,
    state,
    className,
    stateAttributesMapping,
    extraProps: otherProps,
  });

  const shouldRender = keepMounted || rendered;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

export namespace CheckboxIndicator {
  export interface State extends CheckboxRoot.State {
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the element in the DOM when the checkbox is not checked.
     * @default false
     */
    keepMounted?: boolean;
  }
}
