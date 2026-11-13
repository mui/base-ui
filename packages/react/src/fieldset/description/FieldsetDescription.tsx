'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFieldsetRootContext } from '../root/FieldsetRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * A paragraph with additional information about the fieldset.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export const FieldsetDescription = React.forwardRef(function FieldsetDescription(
  componentProps: FieldsetDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const { disabled, setDescriptionIds } = useFieldsetRootContext();

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    if (!id) {
      return undefined;
    }

    setDescriptionIds((ids) => ids.concat(id));

    return () => {
      setDescriptionIds((ids) => ids.filter((item) => item !== id));
    };
  }, [id, setDescriptionIds]);

  const state: FieldsetDescriptionState = {
    disabled,
  };

  const element = useRenderElement('p', componentProps, {
    state,
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export interface FieldsetDescriptionState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface FieldsetDescriptionProps extends BaseUIComponentProps<
  'p',
  FieldsetDescriptionState
> {}

export namespace FieldsetDescription {
  export type State = FieldsetDescriptionState;
  export type Props = FieldsetDescriptionProps;
}
