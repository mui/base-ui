'use client';
import * as React from 'react';
import { useFloatingTree } from '@floating-ui/react';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuSubmenuTrigger } from './useMenuSubmenuTrigger';
import { useForkRef } from '../../utils/useForkRef';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { mergeProps } from '../../merge-props';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuSubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  props: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, label, id: idProp, ...other } = props;
  const id = useBaseUiId(idProp);

  const {
    triggerProps: rootTriggerProps,
    parent,
    setTriggerElement,
    allowMouseUpTriggerRef,
    open,
    typingRef,
    disabled,
  } = useMenuRootContext();

  if (parent.type !== 'menu') {
    throw new Error('Base UI: SubmenuTrigger must be placed in a nested Menu.');
  }

  const { activeIndex, itemProps, setActiveIndex } = parent.context;
  const item = useCompositeListItem();

  const highlighted = activeIndex === item.index;

  const mergedRef = useForkRef(forwardedRef, item.ref);

  const { events: menuEvents } = useFloatingTree()!;

  const { getTriggerProps } = useMenuSubmenuTrigger({
    id,
    highlighted,
    ref: mergedRef,
    disabled,
    menuEvents,
    setTriggerElement,
    allowMouseUpTriggerRef,
    typingRef,
    setActiveIndex,
  });

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({ disabled, highlighted, open }),
    [disabled, highlighted, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    propGetter: (externalProps: HTMLProps) =>
      mergeProps(rootTriggerProps, itemProps, externalProps, getTriggerProps),
    customStyleHookMapping: triggerOpenStateMapping,
    extraProps: other,
  });

  return renderElement();
});

export namespace MenuSubmenuTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLElement>;
    /**
     * Overrides the text label to use when the item is matched during keyboard text navigation.
     */
    label?: string;
    /**
     * @ignore
     */
    id?: string;
  }

  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  }
}
