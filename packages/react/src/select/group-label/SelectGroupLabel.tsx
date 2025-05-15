'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useSelectGroupContext } from '../group/SelectGroupContext';
import { useLayoutEffect } from '../../utils/useLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectGroupLabel = React.forwardRef(function SelectGroupLabel(
  componentProps: SelectGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const { setLabelId } = useSelectGroupContext();

  const id = useBaseUiId(idProp);

  useLayoutEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const renderElement = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return renderElement();
});

export namespace SelectGroupLabel {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
