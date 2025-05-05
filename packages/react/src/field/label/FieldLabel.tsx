'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldLabel } from './useFieldLabel';
import { fieldValidityMapping } from '../utils/constants';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldLabel = React.forwardRef(function FieldLabel(
  props: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, id: idProp, ...otherProps } = props;

  const { setLabelId, state } = useFieldRootContext(false);

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [id, setLabelId]);

  const { getLabelProps } = useFieldLabel();

  const { renderElement } = useComponentRenderer({
    propGetter: getLabelProps,
    render: render ?? 'label',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return renderElement();
});

export namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
