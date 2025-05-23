'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useMenuGroupRootContext } from '../group/MenuGroupContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

const state = {};

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuGroupLabel = React.forwardRef(function MenuGroupLabelComponent(
  componentProps: MenuGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...elementProps } = componentProps;

  const id = useBaseUiId(idProp);

  const { setLabelId } = useMenuGroupRootContext();

  useModernLayoutEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [setLabelId, id]);

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: {
      id,
      role: 'presentation',
      ...elementProps,
    },
  });
});

export namespace MenuGroupLabel {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
