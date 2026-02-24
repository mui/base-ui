'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { progressStateAttributesMapping } from '../root/stateAttributesMapping';
import type { ProgressRoot } from '../root/ProgressRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressLabel = React.forwardRef(function ProgressLabel(
  componentProps: ProgressLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;

  const { setLabelId, state } = useProgressRootContext();

  const id = useRegisteredLabelId(idProp, setLabelId);

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        id,
      },
      elementProps,
    ],
    stateAttributesMapping: progressStateAttributesMapping,
  });

  return element;
});

export interface ProgressLabelProps extends BaseUIComponentProps<'span', ProgressRoot.State> {}

export namespace ProgressLabel {
  export type Props = ProgressLabelProps;
}
