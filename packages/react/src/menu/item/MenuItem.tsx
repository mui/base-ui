'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-react';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../utils/types';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';

const InnerMenuItem = React.memo(
  React.forwardRef(function InnerMenuItem(
    componentProps: InnerMenuItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      className,
      closeOnClick = true,
      disabled = false,
      highlighted,
      id,
      menuEvents,
      itemProps,
      render,
      allowMouseUpTriggerRef,
      typingRef,
      nativeButton,
      nodeId,
      ...elementProps
    } = componentProps;

    const { getItemProps, itemRef } = useMenuItem({
      closeOnClick,
      disabled,
      highlighted,
      id,
      menuEvents,
      allowMouseUpTriggerRef,
      typingRef,
      nativeButton,
      nodeId,
      itemMetadata: REGULAR_ITEM,
    });

    const state: MenuItem.State = React.useMemo(
      () => ({
        disabled,
        highlighted,
      }),
      [disabled, highlighted],
    );

    return useRenderElement('div', componentProps, {
      state,
      ref: [itemRef, forwardedRef],
      props: [itemProps, elementProps, getItemProps],
    });
  }),
);

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuItem = React.forwardRef(function MenuItem(
  props: MenuItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, nativeButton = false, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useCompositeListItem({ label });
  const mergedRef = useMergedRefs(forwardedRef, listItem.ref, itemRef);

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const menuPositionerContext = useMenuPositionerContext(true);
  const id = useBaseUiId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.

  return (
    <InnerMenuItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      itemProps={itemProps}
      allowMouseUpTriggerRef={allowMouseUpTriggerRef}
      typingRef={typingRef}
      nativeButton={nativeButton}
      nodeId={menuPositionerContext?.floatingContext.nodeId}
    />
  );
});

interface InnerMenuItemProps extends MenuItem.Props {
  highlighted: boolean;
  itemProps: HTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  typingRef: React.RefObject<boolean>;
  nativeButton: boolean;
  nodeId: string | undefined;
}

export interface MenuItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface MenuItemProps
  extends NonNativeButtonProps,
    BaseUIComponentProps<'div', MenuItem.State> {
  children?: React.ReactNode;
  /**
   * The click handler for the menu item.
   */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string;
  /**
   * @ignore
   */
  id?: string;
  /**
   * Whether to close the menu when the item is clicked.
   *
   * @default true
   */
  closeOnClick?: boolean;
}

export namespace MenuItem {
  export type State = MenuItemState;
  export type Props = MenuItemProps;
}
