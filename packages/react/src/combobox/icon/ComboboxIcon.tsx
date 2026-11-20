'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * An icon that indicates that the trigger button opens the popup.
 * Renders a `<span>` element.
 *
 * To render this without the default arrow glyph when using `render`, also pass
 * `children={null}` — for example `<Combobox.Icon children={null} render={<CustomIcon />} />`.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxIcon = React.forwardRef(function ComboboxIcon(
  componentProps: ComboboxIcon.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const element = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [
      {
        'aria-hidden': true,
        children: '▼',
      },
      elementProps,
    ],
  });

  return element;
});

export interface ComboboxIconState {}

export interface ComboboxIconProps extends BaseUIComponentProps<'span', ComboboxIconState> {}

export namespace ComboboxIcon {
  export type State = ComboboxIconState;
  export type Props = ComboboxIconProps;
}
