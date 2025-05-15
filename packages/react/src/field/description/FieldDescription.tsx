'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
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

  const { state } = useFieldRootContext(false);

  const id = useBaseUiId(idProp);

  const { setMessageIds } = useFieldRootContext();

  useLayoutEffect(() => {
    if (!id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [id, setMessageIds]);

  const renderElement = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    state,
    props: [{ id }, elementProps],
    customStyleHookMapping: fieldValidityMapping,
  });

  return renderElement();
});

export namespace FieldDescription {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'p', State> {}
}
