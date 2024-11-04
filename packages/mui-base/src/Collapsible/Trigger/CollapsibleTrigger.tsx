'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useCollapsibleRootContext } from '../Root/CollapsibleRootContext';
import { CollapsibleRoot } from '../Root/CollapsibleRoot';
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

  const { panelId, open, setOpen, ownerState } = useCollapsibleRootContext();

  const { getRootProps } = useCollapsibleTrigger({
    panelId,
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
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

export { CollapsibleTrigger };

namespace CollapsibleTrigger {
  export type Props = BaseUIComponentProps<'button', CollapsibleRoot.OwnerState> & {};
}

CollapsibleTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
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
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
