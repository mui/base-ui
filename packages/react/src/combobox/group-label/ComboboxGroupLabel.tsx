'use client';
import * as React from 'react';
import { useModernLayoutEffect } from '@base-ui-components/utils/useModernLayoutEffect';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComboboxGroupContext } from '../group/ComboboxGroupContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxGroupLabel = React.forwardRef(function ComboboxGroupLabel(
  componentProps: ComboboxGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, id: idProp, ...elementProps } = componentProps;

  const { setLabelId } = useComboboxGroupContext();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return element;
});

export namespace ComboboxGroupLabel {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
