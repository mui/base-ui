'use client';
import * as React from 'react';
import { useMeterRootContext } from '../root/MeterRootContext';
import type { MeterRoot } from '../root/MeterRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';

/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterLabel = React.forwardRef(function MeterLabel(
  componentProps: MeterLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;

  const { setLabelId } = useMeterRootContext();

  const id = useRegisteredLabelId(idProp, setLabelId);

  return useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [
      {
        id,
        role: 'presentation',
      },
      elementProps,
    ],
  });
});

export interface MeterLabelProps extends BaseUIComponentProps<'span', MeterRoot.State> {}

export namespace MeterLabel {
  export type Props = MeterLabelProps;
}
