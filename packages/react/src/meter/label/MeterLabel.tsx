'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useMeterRootContext } from '../root/MeterRootContext';
import type { MeterRoot } from '../root/MeterRoot';
import { BaseUIComponentProps } from '../../utils/types';

const EMPTY = {};
/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterLabel = React.forwardRef(function MeterLabel(
  props: MeterLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const id = useBaseUiId(idProp);

  const { setLabelId } = useMeterRootContext();

  useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    state: EMPTY,
    className,
    ref: forwardedRef,
    extraProps: mergeProps<'span'>({ id }, otherProps),
  });

  return renderElement();
});

export namespace MeterLabel {
  export interface Props extends BaseUIComponentProps<'span', MeterRoot.State> {}
}
