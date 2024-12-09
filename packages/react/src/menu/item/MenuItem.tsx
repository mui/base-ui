'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';

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
 * An unstyled menu item to be used within a Menu.
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuItem API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuItem)
 */

InnerMenuItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
  /**
   * The id of the menu item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  treatMouseupAsClick: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
} as any;

/**
 * An unstyled menu item to be used within a Menu.
 *
 * Demos:
 *
 * - [Menu](https://base-ui.com/components/react-menu/)
 *
 * API:
 *
 * - [MenuItem API](https://base-ui.com/components/react-menu/#api-reference-MenuItem)
 */
const MenuItem = React.forwardRef(function MenuItem(
  props: MenuItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
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
     * If `true`, the menu item will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * A text representation of the menu item's content.
     * Used for keyboard text navigation matching.
     */
    label?: string;
    /**
     * The id of the menu item.
     */
    id?: string;
    /**
     * If `true`, the menu will close when the menu item is clicked.
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
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the menu item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { MenuItem };
