'use client';
import * as React from 'react';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { fieldValidityMapping } from '../utils/constants';
import { useFormContext } from '../../form/FormContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldError = React.forwardRef(function FieldError(
  componentProps: FieldError.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, id: idProp, className, match, forceShow, ...elementProps } = componentProps;

  const id = useBaseUiId(idProp);

  const { validityData, state, name, setMessageIds } = useFieldRootContext(false);

  const { errors } = useFormContext();

  const formError = name ? errors[name] : null;

  let rendered = false;
  if (formError || forceShow) {
    rendered = true;
  } else if (match) {
    rendered = Boolean(validityData.state[match]);
  } else if (forceShow == null) {
    rendered = validityData.state.valid === false;
  }

  useModernLayoutEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [rendered, id, setMessageIds]);

  const renderElement = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        id,
        children:
          formError ||
          (validityData.errors.length > 1
            ? React.createElement(
                'ul',
                {},
                validityData.errors.map((message) =>
                  React.createElement('li', { key: message }, message),
                ),
              )
            : validityData.error),
      },
      elementProps,
    ],
    customStyleHookMapping: fieldValidityMapping,
  });

  if (!rendered) {
    return null;
  }

  return renderElement();
});

export namespace FieldError {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines whether to show the error message according to the field’s
     * [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).
     */
    match?: keyof ValidityState;
    /**
     * Whether the error message should be shown regardless of the field’s validity.
     */
    forceShow?: boolean;
  }
}
