'use client';
import * as React from 'react';
import { useFloatingTree } from '@floating-ui/react';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useForkRef } from '../../utils/useForkRef';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuItem } from '../item/useMenuItem';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuSubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  componentProps: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, label, id: idProp, ...elementProps } = componentProps;
  const id = useBaseUiId(idProp);

  const {
    triggerProps: rootTriggerProps,
    parent,
    setTriggerElement,
    open,
    typingRef,
    disabled,
    allowMouseUpTriggerRef,
  } = useMenuRootContext();

  if (parent.type !== 'menu') {
    throw new Error('Base UI: SubmenuTrigger must be placed in a nested Menu.');
  }

  const parentMenuContext = parent.context;

  const { activeIndex, itemProps, setActiveIndex } = parentMenuContext;
  const item = useCompositeListItem();

  const highlighted = activeIndex === item.index;

  const mergedRef = useForkRef(forwardedRef, item.ref);

  const { events: menuEvents } = useFloatingTree()!;

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: mergedRef,
    allowMouseUpTriggerRef,
    typingRef,
  });

  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  const getTriggerProps = React.useCallback(
    (externalProps?: HTMLProps) => {
      return {
        ...getItemProps(externalProps),
        tabIndex: open || highlighted ? 0 : -1,
        onBlur() {
          if (highlighted) {
            setActiveIndex(null);
          }
        },
      };
    },
    [getItemProps, highlighted, open, setActiveIndex],
  );

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({ disabled, highlighted, open }),
    [disabled, highlighted, open],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [triggerRef, itemRef, setTriggerElement],
    customStyleHookMapping: triggerOpenStateMapping,
    props: [rootTriggerProps, itemProps, elementProps, getTriggerProps],
  });
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
