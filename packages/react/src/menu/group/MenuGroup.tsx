'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { MenuGroupContext } from './MenuGroupContext';

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuGroup = React.forwardRef(function MenuGroup(
  componentProps: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const context = React.useMemo(() => ({ setLabelId }), [setLabelId]);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': labelId,
      ...elementProps,
    },
  });

  return <MenuGroupContext.Provider value={context}>{element}</MenuGroupContext.Provider>;
});

export namespace MenuGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  }

  export interface State {}
}
