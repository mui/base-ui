'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useCollapsibleContext } from '../Root/CollapsibleContext';
import { collapsibleStyleHookMapping } from '../Root/styleHooks';
import { useCollapsibleContent } from './useCollapsibleContent';
import { CollapsibleContentProps } from './CollapsibleContent.types';

const CollapsibleContent = React.forwardRef(function CollapsibleContent(
  props: CollapsibleContentProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ...otherProps } = props;

  const { mounted, open, contentId, setContentId, setMounted, ownerState } =
    useCollapsibleContext();

  const { getRootProps, height } = useCollapsibleContent({
    id: contentId,
    mounted,
    open,
    ref: forwardedRef,
    setContentId,
    setMounted,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: {
      ...otherProps,
      style: {
        '--collapsible-content-height': height ? `${height}px` : undefined,
      },
    },
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return renderElement();
});

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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CollapsibleContent };
