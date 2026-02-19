'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { fieldValidityMapping } from '../utils/constants';
import { useFormContext } from '../../form/FormContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';

const stateAttributesMapping: StateAttributesMapping<FieldError.State> = {
  ...fieldValidityMapping,
  ...transitionStatusMapping,
};

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
  const { render, id: idProp, className, match, ...elementProps } = componentProps;

  const id = useBaseUiId(idProp);

  const { validityData, state: fieldState, name } = useFieldRootContext(false);
  const { setMessageIds } = useLabelableContext();

  const { errors } = useFormContext();

  const formError = name ? errors[name] : null;

  let rendered = false;
  if (formError || match === true) {
    rendered = true;
  } else if (match) {
    rendered = Boolean(validityData.state[match]);
  } else {
    rendered = validityData.state.valid === false;
  }

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  useIsoLayoutEffect(() => {
    if (!rendered || !id) {
      return undefined;
    }

    setMessageIds((v) => v.concat(id));

    return () => {
      setMessageIds((v) => v.filter((item) => item !== id));
    };
  }, [rendered, id, setMessageIds]);

  const errorRef = React.useRef<HTMLDivElement | null>(null);
  const [lastRenderedMessage, setLastRenderedMessage] = React.useState<React.ReactNode>(null);
  const [lastRenderedMessageKey, setLastRenderedMessageKey] = React.useState<string | null>(null);

  const errorMessage =
    formError ||
    (validityData.errors.length > 1 ? (
      <ul>
        {validityData.errors.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    ) : (
      validityData.error
    ));

  let errorKey = validityData.error;
  if (formError != null) {
    errorKey = Array.isArray(formError) ? JSON.stringify(formError) : formError;
  } else if (validityData.errors.length > 1) {
    errorKey = JSON.stringify(validityData.errors);
  }

  if (rendered && errorKey !== lastRenderedMessageKey) {
    setLastRenderedMessageKey(errorKey);
    setLastRenderedMessage(errorMessage);
  }

  useOpenChangeComplete({
    open: rendered,
    ref: errorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  const state: FieldError.State = {
    ...fieldState,
    transitionStatus,
  };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, errorRef],
    state,
    props: [
      {
        id,
        children: rendered ? errorMessage : lastRenderedMessage,
      },
      elementProps,
    ],
    stateAttributesMapping,
    enabled: mounted,
  });

  if (!mounted) {
    return null;
  }

  return element;
});

export interface FieldErrorState extends FieldRoot.State {
  transitionStatus: TransitionStatus;
}

export interface FieldErrorProps extends BaseUIComponentProps<'div', FieldError.State> {
  /**
   * Determines whether to show the error message according to the field’s
   * [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).
   * Specifying `true` will always show the error message, and lets external libraries
   * control the visibility.
   */
  match?: boolean | keyof ValidityState | undefined;
}

export namespace FieldError {
  export type State = FieldErrorState;
  export type Props = FieldErrorProps;
}
