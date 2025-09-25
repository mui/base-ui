'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { getTarget } from '../../floating-ui-react/utils';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../root/LabelableContext';
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

  const fieldRootContext = useFieldRootContext();
  const { controlId, setLabelId, labelId } = useLabelableContext();

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    if (controlId != null || idProp) {
      setLabelId(id);
    }
    return () => {
      setLabelId(undefined);
    };
  }, [controlId, id, idProp, setLabelId]);

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

export type FieldLabelState = FieldRoot.State;

export interface FieldLabelProps extends BaseUIComponentProps<'label', FieldLabel.State> {}

export namespace FieldLabel {
  export type State = FieldLabelState;
  export type Props = FieldLabelProps;
}
