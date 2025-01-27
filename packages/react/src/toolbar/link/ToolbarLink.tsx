'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarOrientation } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

const ToolbarLink = React.forwardRef(function ToolbarLink(
  props: ToolbarLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, ...otherProps } = props;

  const { orientation } = useToolbarRootContext();

  const { getButtonProps } = useButton({
    buttonRef: forwardedRef,
    elementName: 'a',
  });

  const state: ToolbarLink.State = React.useMemo(
    () => ({
      orientation,
    }),
    [orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getButtonProps,
    render: render ?? 'a',
    state,
    className,
    extraProps: otherProps,
  });

  return <CompositeItem render={renderElement()} />;
});

export namespace ToolbarLink {
  export interface State {
    orientation: ToolbarOrientation;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}

export { ToolbarLink };

ToolbarLink.propTypes /* remove-proptypes */ = {
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
