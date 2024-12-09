'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import { CollapsibleRoot } from '../root/CollapsibleRoot';
import { useCollapsibleTrigger } from './useCollapsibleTrigger';

/**
 */
const CollapsibleTrigger = React.forwardRef(function CollapsibleTrigger(
  props: CollapsibleTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, disabled = false, id, render, ...otherProps } = props;

  const { panelId, open, setOpen, state } = useCollapsibleRootContext();

  const { getRootProps } = useCollapsibleTrigger({
    disabled,
    panelId,
    open,
    setOpen,
    rootRef: forwardedRef,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    state,
    className,
    extraProps: otherProps,
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

export { CollapsibleTrigger };

namespace CollapsibleTrigger {
  export interface Props extends BaseUIComponentProps<'button', CollapsibleRoot.State> {}
}

CollapsibleTrigger.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
