import * as React from 'react';
import PropTypes from 'prop-types';
import { useListItem } from '@floating-ui/react';
import { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useMenuPopupContext } from '../Popup/MenuPopupContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useId } from '../../utils/useId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSubmenuTrigger } from './useSubmenuTrigger';
import { useForkRef } from '../../utils/useForkRef';

namespace SubmenuTrigger {
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

const SubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  props: SubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, disabled = false, label, id: idProp, ...other } = props;
  const id = useId(idProp);

  const { dispatch, parentContext, topmostContext, getTriggerProps, state } = useMenuRootContext();
  const { compoundParentContext } = useMenuPopupContext();

  if (parentContext === null) {
    throw new Error('Base UI: ItemTrigger must be placed in a nested Menu.');
  }

  const { state: parentState, dispatch: parentDispatch, getItemProps } = parentContext;

  const highlighted = parentState.highlightedValue === id;
  const { orientation, direction } = parentState.settings;

  const item = useListItem();
  const mergedRef = useForkRef(forwardedRef, item.ref);

  const { getRootProps } = useSubmenuTrigger({
    dispatch,
    parentDispatch,
    rootDispatch: topmostContext?.dispatch ?? dispatch,
    id,
    highlighted,
    compoundParentContext,
    rootRef: mergedRef,
    label,
    disabled,
    orientation,
    direction,
    state,
  });

  const ownerState: SubmenuTrigger.OwnerState = { disabled, highlighted };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: (externalProps: GenericHTMLProps) =>
      getTriggerProps(getItemProps(getRootProps(externalProps))),
    extraProps: other,
  });

  return renderElement();
});

SubmenuTrigger.propTypes /* remove-proptypes */ = {
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
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the menu item won't receive focus when the mouse moves over it.
   *
   * @default false
   */
  disableFocusOnHover: PropTypes.bool,
  /**
   * @ignore
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
  onClick: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SubmenuTrigger };
