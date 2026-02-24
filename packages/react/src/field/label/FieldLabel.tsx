'use client';
import * as React from 'react';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRoot } from '../root/FieldRoot';
import { useRenderElement } from '../../utils/useRenderElement';
import { useLabel } from '../../label/useLabel';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldLabel = React.forwardRef(function FieldLabel(
  componentProps: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, id: idProp, nativeLabel = true, ...elementProps } = componentProps;

  const fieldRootContext = useFieldRootContext(false);

  const { labelRef, labelId, interactionProps } = useLabel({
    id: idProp,
    nativeLabel,
  });

  const element = useRenderElement('label', componentProps, {
    ref: [forwardedRef, labelRef],
    state: fieldRootContext.state,
    props: [{ id: labelId }, interactionProps, elementProps],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export type FieldLabelState = FieldRoot.State;

export interface FieldLabelProps extends BaseUIComponentProps<'label', FieldLabel.State> {
  /**
   * Whether the component renders a native `<label>` element when replacing it via the `render` prop.
   * Set to `false` if the rendered element is not a label (e.g. `<div>`).
   *
   * This is useful to avoid inheriting label behaviors on `<button>` controls (such as `<Select.Trigger>` and `<Combobox.Trigger>`), including avoiding `:hover` on the button when hovering the label, and preventing clicks on the label from firing on the button.
   * @default true
   */
  nativeLabel?: boolean | undefined;
}

export namespace FieldLabel {
  export type State = FieldLabelState;
  export type Props = FieldLabelProps;
}
