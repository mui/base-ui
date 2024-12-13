'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloatingTree } from '@floating-ui/react';
import { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuSubmenuTrigger } from './useMenuSubmenuTrigger';
import { useForkRef } from '../../utils/useForkRef';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuSubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  props: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, disabled = false, label, id: idProp, ...other } = props;
  const id = useBaseUiId(idProp);

  const {
    getTriggerProps,
    parentContext,
    setTriggerElement,
    clickAndDragEnabled,
    open,
    typingRef,
  } = useMenuRootContext();

  if (parentContext === undefined) {
    throw new Error('Base UI: ItemTrigger must be placed in a nested Menu.');
  }

  const { activeIndex, getItemProps } = parentContext;
  const item = useCompositeListItem();

  const highlighted = activeIndex === item.index;

  const mergedRef = useForkRef(forwardedRef, item.ref);

  const { events: menuEvents } = useFloatingTree()!;

  const { getRootProps } = useMenuSubmenuTrigger({
    id,
    highlighted,
    ref: mergedRef,
    disabled,
    menuEvents,
    setTriggerElement,
    treatMouseupAsClick: clickAndDragEnabled,
    typingRef,
  });

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({ disabled, highlighted, open }),
    [disabled, highlighted, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    propGetter: (externalProps: GenericHTMLProps) =>
      getTriggerProps(getItemProps(getRootProps(externalProps))),
    customStyleHookMapping: triggerOpenStateMapping,
    extraProps: other,
  });

  return renderElement();
});

namespace MenuSubmenuTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
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

MenuSubmenuTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
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
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuSubmenuTrigger };
