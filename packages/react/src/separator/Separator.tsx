'use client';
import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { mergeProps } from '../merge-props';
import { useComponentRenderer } from '../utils/useComponentRenderer';

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export const Separator = React.forwardRef(function SeparatorComponent(
  props: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, orientation = 'horizontal', ...other } = props;

  const state: Separator.State = React.useMemo(() => ({ orientation }), [orientation]);

  const getSeparatorProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          'aria-orientation': orientation,
        },
        externalProps,
      ),
    [orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSeparatorProps,
    render: render ?? 'div',
    className,
    state,
    extraProps: { role: 'separator', ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

export namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: Orientation;
  }

  export interface State {
    /**
     * The orientation of the separator.
     */
    orientation: Orientation;
  }
}
