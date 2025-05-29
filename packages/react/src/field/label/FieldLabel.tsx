'use client';
import * as React from 'react';
import { getTarget } from '@floating-ui/react/utils';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
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

  const { labelId, setLabelId, state, controlId } = useFieldRootContext(false);

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [id, setLabelId]);

  const element = useRenderElement('label', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        id: labelId,
        htmlFor: controlId,
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
    customStyleHookMapping: fieldValidityMapping,
  });

  return element;
});

export namespace FieldLabel {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'label', State> {}
}
