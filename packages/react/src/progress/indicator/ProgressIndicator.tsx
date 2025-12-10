'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
import type { ProgressRoot } from '../root/ProgressRoot';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStateAttributesMapping } from '../root/stateAttributesMapping';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressIndicator = React.forwardRef(function ProgressIndicator(
  componentProps: ProgressIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { max, min, value, state } = useProgressRootContext();

  const percentageValue =
    Number.isFinite(value) && value !== null ? valueToPercent(value, min, max) : null;

  const getStyles = React.useCallback(() => {
    if (percentageValue == null) {
      return {};
    }

    return {
      insetInlineStart: 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        style: getStyles(),
      },
      elementProps,
    ],
    stateAttributesMapping: progressStateAttributesMapping,
  });

  return element;
});

export interface ProgressIndicatorProps extends BaseUIComponentProps<'div', ProgressRoot.State> {}

export namespace ProgressIndicator {
  export type Props = ProgressIndicatorProps;
}
