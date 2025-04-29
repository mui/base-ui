'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useSelectGroupContext } from '../group/SelectGroupContext';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

const state = {};

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectGroupLabel = React.forwardRef(function SelectGroupLabel(
  props: SelectGroupLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, id: idProp, ...otherProps } = props;

  const { setLabelId } = useSelectGroupContext();

  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setLabelId(id);
  }, [id, setLabelId]);

  const getSelectItemGroupLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          id,
        },
        externalProps,
      ),
    [id],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSelectItemGroupLabelProps,
    render: render ?? 'div',
    ref: forwardedRef,
    state,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectGroupLabel {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { SelectGroupLabel };
