'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleContext } from '../Root/CollapsibleRootContext';
import type { CollapsibleRoot } from '../Root/CollapsibleRoot';
import { collapsibleStyleHookMapping } from '../Root/styleHooks';
import { useCollapsibleContent } from './useCollapsibleContent';

/**
 *
 * Demos:
 *
 * - [Collapsible](https://base-ui.netlify.app/components/react-collapsible/)
 *
 * API:
 *
 * - [CollapsibleContent API](https://base-ui.netlify.app/components/react-collapsible/#api-reference-CollapsibleContent)
 */
const CollapsibleContent = React.forwardRef(function CollapsibleContent(
  props: CollapsibleContent.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, htmlHidden, render, ...otherProps } = props;

  const { animated, mounted, open, contentId, setContentId, setMounted, setOpen, ownerState } =
    useCollapsibleContext();

  const { getRootProps, height } = useCollapsibleContent({
    animated,
    htmlHidden,
    id: contentId,
    mounted,
    open,
    ref: forwardedRef,
    setContentId,
    setMounted,
    setOpen,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: {
      ...otherProps,
      style: {
        ...otherProps.style,
        '--collapsible-content-height': height ? `${height}px` : undefined,
      },
    },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return renderElement();
});

namespace CollapsibleContent {
  export interface Props
    extends BaseUIComponentProps<'div', CollapsibleRoot.OwnerState>,
      Pick<useCollapsibleContent.Parameters, 'htmlHidden'> {}
}

CollapsibleContent.propTypes /* remove-proptypes */ = {
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
   * The hidden state when closed
   * @default 'hidden'
   */
  htmlHidden: PropTypes.oneOf(['hidden', 'until-found']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { CollapsibleContent };
