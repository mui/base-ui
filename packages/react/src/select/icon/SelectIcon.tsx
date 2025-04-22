'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';

/**
 * An icon that indicates that the trigger button opens a select menu.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectIcon = React.forwardRef(function SelectIcon(
  props: SelectIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const state: SelectIcon.State = React.useMemo(() => ({}), []);

  const getIconProps = React.useCallback((externalProps: React.ComponentProps<'span'>) => {
    return mergeProps<'span'>(
      {
        'aria-hidden': true,
        children: '▼',
      },
      externalProps,
    );
  }, []);

  const { renderElement } = useComponentRenderer({
    propGetter: getIconProps,
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
  });

  return renderElement();
});

export namespace SelectIcon {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
