'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardTrigger = React.forwardRef(function PreviewCardTrigger(
  props: PreviewCardTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open, getRootTriggerProps, setTriggerElement } = usePreviewCardRootContext();

  const state: PreviewCardTrigger.State = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(setTriggerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'a',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

namespace PreviewCardTrigger {
  export interface State {
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PreviewCardTrigger };
