'use client';
import * as React from 'react';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { mergeProps } from '../../merge-props';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  props: NumberFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { state } = useNumberFieldRootContext();

  const getGroupProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          role: 'group',
        },
        externalProps,
      ),
    [],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getGroupProps,
    ref: forwardedRef,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
    stateAttributesMapping: stateAttributesMapping,
  });

  return renderElement();
});

export namespace NumberFieldGroup {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'div', State> {}
}
