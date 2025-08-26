'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxGroupContext } from './ComboboxGroupContext';

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 */
export const ComboboxGroup = React.forwardRef(function ComboboxGroup(
  componentProps: ComboboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return (
    <ComboboxGroupContext.Provider value={contextValue}>{element}</ComboboxGroupContext.Provider>
  );
});

export namespace ComboboxGroup {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
