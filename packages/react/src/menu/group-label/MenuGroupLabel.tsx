'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useMenuGroupRootContext } from '../group/MenuGroupContext';
import { useLayoutEffect } from '../../utils/useLayoutEffect';

const state = {};

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuGroupLabel = React.forwardRef(function MenuGroupLabelComponent(
  props: MenuGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...other } = props;

  const id = useBaseUiId(idProp);

  const { setLabelId } = useMenuGroupRootContext();

  useLayoutEffect(() => {
    setLabelId(id);
    return () => {
      setLabelId(undefined);
    };
  }, [setLabelId, id]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    extraProps: { role: 'presentation', id, ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

export namespace MenuGroupLabel {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
