'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuCheckboxItem } from './useMenuCheckboxItem';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { itemMapping } from '../utils/styleHookMapping';

const InnerMenuCheckboxItem = React.forwardRef(function InnerMenuItem(
  props: InnerMenuCheckboxItemProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    className,
    closeOnClick = false,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    propGetter,
    render,
    treatMouseupAsClick,
    typingRef,
    ...other
  } = props;

  const { getRootProps, checked } = useMenuCheckboxItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: forwardedRef,
    treatMouseupAsClick,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    typingRef,
  });

  const ownerState: MenuCheckboxItem.OwnerState = React.useMemo(
    () => ({ disabled, highlighted, checked }),
    [disabled, highlighted, checked],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
    customStyleHookMapping: itemMapping,
    extraProps: other,
  });

  return (
    <MenuCheckboxItemContext.Provider value={ownerState}>
      {renderElement()}
    </MenuCheckboxItemContext.Provider>
  );
});

InnerMenuCheckboxItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.object,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toExponential: PropTypes.func.isRequired,
      toFixed: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toPrecision: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      then: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
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
   * @ignore
   */
  defaultChecked: PropTypes.bool,
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
   * @ignore
   */
  onCheckedChange: PropTypes.func,
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

const MemoizedInnerMenuCheckboxItem = React.memo(InnerMenuCheckboxItem);

/**
 * An unstyled checkbox menu item to be used within a Menu.
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuCheckboxItem API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuCheckboxItem)
 */
const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  props: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, clickAndDragEnabled, typingRef } = useMenuRootContext();
  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuCheckboxItem reads the context and re-renders the actual MenuCheckboxItem
  // only when it needs to.

  return (
    <MemoizedInnerMenuCheckboxItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      propGetter={getItemProps}
      treatMouseupAsClick={clickAndDragEnabled}
      typingRef={typingRef}
    />
  );
});

type InnerMenuCheckboxItemProps = MenuCheckboxItem.Props & {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  treatMouseupAsClick: boolean;
  typingRef: React.RefObject<boolean>;
};

namespace MenuCheckboxItem {
  export type OwnerState = {
    disabled: boolean;
    highlighted: boolean;
    checked: boolean;
  };

  export type Props = BaseUIComponentProps<'div', OwnerState> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean, event: Event) => void;
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
  };
}

MenuCheckboxItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.object,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toExponential: PropTypes.func.isRequired,
      toFixed: PropTypes.func.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toPrecision: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      key: PropTypes.string,
      props: PropTypes.object.isRequired,
      then: PropTypes.func.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * @ignore
   */
  defaultChecked: PropTypes.bool,
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
   * @ignore
   */
  onCheckedChange: PropTypes.func,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { MenuCheckboxItem };
