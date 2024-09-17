'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleContext } from '../Root/CollapsibleContext';
import { CollapsibleRoot } from '../Root/CollapsibleRoot';
import { collapsibleStyleHookMapping } from '../Root/styleHooks';
import { useCollapsibleTrigger } from './useCollapsibleTrigger';

/**
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.netlify.app/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsibleTrigger API](https://base-ui.netlify.app/components/react-collapsible/#api-reference-CollapsibleTrigger)
 */
const CollapsibleTrigger = React.forwardRef(function CollapsibleTrigger(
  props: CollapsibleTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ...otherProps } = props;

  const { contentId, open, setOpen, ownerState } = useCollapsibleContext();

  const { getRootProps } = useCollapsibleTrigger({
    contentId,
    open,
    setOpen,
    rootRef: forwardedRef,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ownerState,
    className,
    extraProps: otherProps,
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return renderElement();
});

export { CollapsibleTrigger };

namespace CollapsibleTrigger {
  export interface Props extends BaseUIComponentProps<'button', CollapsibleRoot.OwnerState> {}
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
