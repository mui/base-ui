'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree } from '@floating-ui/react';
import { useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';

const InnerMenuItem = React.forwardRef(function InnerMenuItem(
  props: InnerMenuItemProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    className,
    closeOnClick = true,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    propGetter,
    render,
    allowMouseUpTriggerRef,
    typingRef,
    ...other
  } = props;

  const { getRootProps } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: forwardedRef,
    allowMouseUpTriggerRef,
    typingRef,
    trigger: false,
  });

  const state: MenuItem.State = React.useMemo(
    () => ({ disabled, highlighted }),
    [disabled, highlighted],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
    extraProps: other,
  });

  return renderElement();
});

const MemoizedInnerMenuItem = React.memo(InnerMenuItem);

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */

InnerMenuItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  allowMouseUpTriggerRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to close the menu when the item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label: PropTypes.string,
  /**
   * @ignore
   */
  menuEvents: PropTypes.shape({
    emit: PropTypes.func.isRequired,
    off: PropTypes.func.isRequired,
    on: PropTypes.func.isRequired,
  }).isRequired,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  propGetter: PropTypes.func.isRequired,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
} as any;

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuItem = React.forwardRef(function MenuItem(
  props: MenuItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useCompositeListItem({ label });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.

  return (
    <MemoizedInnerMenuItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      propGetter={getItemProps}
      allowMouseUpTriggerRef={allowMouseUpTriggerRef}
      typingRef={typingRef}
    />
  );
});

interface InnerMenuItemProps extends MenuItem.Props {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  typingRef: React.RefObject<boolean>;
}

namespace MenuItem {
  export type State = {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
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
}

MenuItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Whether to close the menu when the item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label: PropTypes.string,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { MenuItem };
