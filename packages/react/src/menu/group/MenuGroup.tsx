'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuGroupContext } from './MenuGroupContext';

const state = {};

/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuGroup = React.forwardRef(function MenuGroup(
  props: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const context = React.useMemo(() => ({ setLabelId }), [setLabelId]);

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    extraProps: {
      role: 'group',
      'aria-labelledby': labelId,
      ...other,
    },
    ref: forwardedRef,
  });

  return <MenuGroupContext.Provider value={context}>{renderElement()}</MenuGroupContext.Provider>;
});

namespace MenuGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  }

  export interface State {}
}

export { MenuGroup };
