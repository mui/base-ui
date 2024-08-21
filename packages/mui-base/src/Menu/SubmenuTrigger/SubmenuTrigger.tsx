import * as React from 'react';
import PropTypes from 'prop-types';
import { useFloatingTree, useListItem } from '@floating-ui/react';
import { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useId } from '../../utils/useId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSubmenuTrigger } from './useSubmenuTrigger';
import { useForkRef } from '../../utils/useForkRef';

const SubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  props: SubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, disabled = false, label, id: idProp, ...other } = props;
  const id = useId(idProp);

  const { getTriggerProps, parentContext, setTriggerElement, clickAndDragEnabled, open } =
    useMenuRootContext();

  if (parentContext === null) {
    throw new Error('Base UI: ItemTrigger must be placed in a nested Menu.');
  }

  const { activeIndex, getItemProps } = parentContext;
  const item = useListItem();

  const highlighted = activeIndex === item.index;

  const mergedRef = useForkRef(forwardedRef, item.ref);

  const { events: menuEvents } = useFloatingTree()!;

  const { getRootProps } = useSubmenuTrigger({
    id,
    highlighted,
    ref: mergedRef,
    disabled,
    menuEvents,
    setTriggerElement,
    treatMouseupAsClick: clickAndDragEnabled,
  });

  const ownerState: SubmenuTrigger.OwnerState = { disabled, highlighted, open };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: (externalProps: GenericHTMLProps) =>
      getTriggerProps(getItemProps(getRootProps(externalProps))),
    customStyleHookMapping: commonStyleHooks,
    extraProps: other,
  });

  return renderElement();
});

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
    open: boolean;
  }
}

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
