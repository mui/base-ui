'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRegisteredLabelId } from '../../utils/useRegisteredLabelId';

/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export const FieldsetLegend = React.forwardRef(function FieldsetLegend(
  componentProps: FieldsetLegend.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const { disabled, legendId, defaultLegendId, setLegendId } = useFieldsetRootContext();

  // Register the explicit id (or the root's generated one) once layout effects run. Until then
  // render the id the root already points `aria-labelledby` at, so the server markup and the
  // hydrated tree stay associated. An explicit `id` therefore only reaches the DOM after
  // hydration, the same trade-off `Field.Label` makes for its control id.
  useRegisteredLabelId(idProp ?? defaultLegendId, setLegendId);
  const id = legendId ?? defaultLegendId;

  const state: FieldsetLegendState = {
    disabled,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export interface FieldsetLegendState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface FieldsetLegendProps extends BaseUIComponentProps<'div', FieldsetLegendState> {}

export namespace FieldsetLegend {
  export type State = FieldsetLegendState;
  export type Props = FieldsetLegendProps;
}
