'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { fieldValidityMapping } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A paragraph with additional information about the field.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldDescription = React.forwardRef(function FieldDescription(
  componentProps: FieldDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, id: idProp, className, ...elementProps } = componentProps;

  const id = useBaseUiId(idProp);

  const fieldRootContext = useFieldRootContext(false);
  const { setMessageIds } = useLabelableContext();

  useIsoLayoutEffect(() => {
    if (!id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [id, setMessageIds]);

  const element = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    state: fieldRootContext.state,
    props: [{ id }, elementProps],
    stateAttributesMapping: fieldValidityMapping,
  });

  return element;
});

export type FieldDescriptionState = FieldRoot.State;

export interface FieldDescriptionProps extends BaseUIComponentProps<'p', FieldDescription.State> {}

export namespace FieldDescription {
  export type State = FieldDescriptionState;
  export type Props = FieldDescriptionProps;
}
