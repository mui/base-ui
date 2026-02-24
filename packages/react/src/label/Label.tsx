'use client';
import * as React from 'react';
import { LabelableProvider } from '../labelable-provider/LabelableProvider';
import { useLabelableContext } from '../labelable-provider/LabelableContext';
import { NOOP } from '../utils/noop';
import type { BaseUIComponentProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';
import { useLabel } from './useLabel';

/**
 * An accessible label that can be associated with labelable controls.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Label](https://base-ui.com/react/components/label)
 */
const LabelInner = React.forwardRef(function LabelInner(
  componentProps: Label.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, id: idProp, nativeLabel = true, ...elementProps } = componentProps;

  const { labelRef, labelId, interactionProps } = useLabel({
    id: idProp,
    nativeLabel,
  });

  const element = useRenderElement('label', componentProps, {
    ref: [forwardedRef, labelRef],
    props: [{ id: labelId ?? idProp }, interactionProps, elementProps],
  });

  return element;
});

export const Label = React.forwardRef(function Label(
  componentProps: Label.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { id: idProp } = componentProps;
  const labelableContext = useLabelableContext();
  const hasLabelableContext = labelableContext.registerControlId !== NOOP;

  if (hasLabelableContext) {
    return <LabelInner {...componentProps} ref={forwardedRef} />;
  }

  return (
    <LabelableProvider initialLabelId={idProp} generateLabelIdFromControlId={idProp == null}>
      <LabelInner {...componentProps} ref={forwardedRef} />
    </LabelableProvider>
  );
});

export interface LabelState {}

export interface LabelProps extends BaseUIComponentProps<'label', Label.State> {
  /**
   * Whether the component renders a native `<label>` element when replacing it via the `render` prop.
   * Set to `false` if the rendered element is not a label (e.g. `<div>`).
   *
   * This is useful to avoid inheriting label behaviors on `<button>` controls (such as `<Select.Trigger>` and `<Combobox.Trigger>`), including avoiding `:hover` on the button when hovering the label, and preventing clicks on the label from firing on the button.
   * @default true
   */
  nativeLabel?: boolean | undefined;
}

export namespace Label {
  export type State = LabelState;
  export type Props = LabelProps;
}
