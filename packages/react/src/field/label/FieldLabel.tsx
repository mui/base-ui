'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { getTarget } from '../../floating-ui-react/utils';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldItemContext } from '../item/FieldItemContext';
import { fieldValidityMapping } from '../utils/constants';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldLabel = React.forwardRef(function FieldLabel(
  componentProps: FieldLabel.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;

  const fieldRootContext = useFieldRootContext(false);
  const fieldItemContext = useFieldItemContext();

  const controlId =
    fieldItemContext?.controlId !== undefined
      ? fieldItemContext.controlId
      : fieldRootContext.controlId;
  const setLabelId = fieldItemContext?.setLabelId ?? fieldRootContext.setLabelId;
  const labelId = fieldItemContext?.labelId ?? fieldRootContext.labelId;

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    if (controlId != null || idProp) {
      setLabelId(id);
    }
    return () => {
      setLabelId(undefined);
    };
  }, [controlId, fieldItemContext, id, idProp, setLabelId]);

  const element = useRenderElement('label', componentProps, {
    ref: forwardedRef,
    state: fieldRootContext.state,
    props: [
      {
        id: labelId,
        htmlFor: controlId ?? undefined,
        onMouseDown(event) {
          const target = getTarget(event.nativeEvent) as HTMLElement | null;
          if (target?.closest('button,input,select,textarea')) {
            return;
          }

          // Prevent text selection when double clicking label.
          if (!event.defaultPrevented && event.detail > 1) {
            event.preventDefault();
          }
        },
      },
      elementProps,
    ],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'label', State> {}
}
