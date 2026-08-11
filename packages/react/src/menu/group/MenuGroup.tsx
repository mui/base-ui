'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuGroupContext } from './MenuGroupContext';

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuGroup = React.forwardRef(function MenuGroup(
  componentProps: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;
  // Optional so the group renders standalone (e.g. in conformance tests and previews).
  const rootContext = useMenuRootContext(true);
  const filterIntegration = rootContext ? rootContext.store.select('filterIntegration') : null;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': labelId,
      ...elementProps,
    },
  });

  // Hides the whole group, label included, when the query filters out every item in it.
  const composed = filterIntegration ? <filterIntegration.Group render={element} /> : element;

  return <MenuGroupContext.Provider value={setLabelId}>{composed}</MenuGroupContext.Provider>;
});

export interface MenuGroupProps extends BaseUIComponentProps<'div', MenuGroupState> {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
}

export interface MenuGroupState {}

export namespace MenuGroup {
  export type Props = MenuGroupProps;
  export type State = MenuGroupState;
}
