'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldsetLegend } from './useFieldsetLegend';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export const FieldsetLegend = React.forwardRef(function FieldsetLegend(
  props: FieldsetLegend.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, id, ...otherProps } = props;

  const { getLegendProps } = useFieldsetLegend({ id });

  const { disabled } = useFieldsetRootContext();

  const state: FieldsetLegend.State = React.useMemo(
    () => ({
      disabled: disabled ?? false,
    }),
    [disabled],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getLegendProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

export namespace FieldsetLegend {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
