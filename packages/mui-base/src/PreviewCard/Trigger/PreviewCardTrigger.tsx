'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { usePreviewCardRootContext } from '../Root/PreviewCardContext.js';
import { useForkRef } from '../../utils/useForkRef.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import { triggerOpenStateMapping } from '../../utils/popupOpenStateMapping.js';

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.netlify.app/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardTrigger API](https://base-ui.netlify.app/components/react-preview-card/#api-reference-PreviewCardTrigger)
 */
const PreviewCardTrigger = React.forwardRef(function PreviewCardTrigger(
  props: PreviewCardTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open, getRootTriggerProps, setTriggerElement } = usePreviewCardRootContext();

  const ownerState: PreviewCardTrigger.OwnerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(setTriggerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'a',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

namespace PreviewCardTrigger {
  export interface OwnerState {
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'a', OwnerState> {}
}

PreviewCardTrigger.propTypes /* remove-proptypes */ = {
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

export { PreviewCardTrigger };
