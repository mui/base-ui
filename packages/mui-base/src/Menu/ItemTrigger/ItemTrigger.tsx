import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '@base_ui/react/utils/types';
import { useMenuPopupContext } from '../Popup/MenuPopupContext';
import { useMenuItem } from '../Item/useMenuItem';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useId } from '../../utils/useId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { useForkRef } from '../../utils/useForkRef';

namespace ItemTrigger {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
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
     * If `true`, the menu item won't receive focus when the mouse moves over it.
     *
     * @default false
     */
    disableFocusOnHover?: boolean;
    id?: string;
  }

  export interface OwnerState {
    disabled: boolean;
    highlighted: boolean;
  }
}

const ItemTrigger = React.forwardRef(function ItemTriggerComponent(
  props: ItemTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, disabled = false, label, id: idProp, ...other } = props;
  const id = useId(idProp);

  const { dispatch, parentContext } = useMenuRootContext();
  const { compoundParentContext } = useMenuPopupContext();

  if (parentContext === null) {
    throw new Error('Base UI: ItemTrigger must be placed in a nested Menu.');
  }

  const { state: parentState, dispatch: parentDispatch } = parentContext;

  const highlighted = parentState.highlightedValue === id;

  const { getRootProps: getMenuItemProps, rootRef: menuItemRef } = useMenuItem({
    compoundParentContext,
    disabled,
    dispatch: parentDispatch,
    highlighted,
    id,
    label,
    rootRef: forwardedRef,
    closeOnClick: false,
    disableFocusOnHover: !parentState.settings.disabledItemsFocusable,
  });

  const registerTrigger = React.useCallback(
    (element: HTMLElement | null) => {
      dispatch({
        type: MenuActionTypes.registerTrigger,
        triggerElement: element,
      });
    },
    [dispatch],
  );

  const menuTriggerRef = useForkRef(menuItemRef, registerTrigger);

  const ownerState: ItemTrigger.OwnerState = { disabled, highlighted };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: getMenuItemProps,
    extraProps: other,
    ref: menuTriggerRef,
  });

  return renderElement();
});

ItemTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { ItemTrigger };
