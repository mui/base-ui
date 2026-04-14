'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeItem } from '../../internals/composite/item/CompositeItem';

const TOOLBAR_LINK_METADATA = {
  // links cannot be disabled, this metadata is only used for deriving `disabledIndices``
  // TODO: better name
  focusableWhenDisabled: true,
};

/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarLink = React.forwardRef(function ToolbarLink(
  componentProps: ToolbarLink.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const { orientation } = useToolbarRootContext();

  const state: ToolbarLinkState = {
    orientation,
  };

  return (
    <CompositeItem
      tag="a"
      render={render}
      className={className}
      style={style}
      metadata={TOOLBAR_LINK_METADATA}
      state={state}
      refs={[forwardedRef]}
      props={[elementProps]}
    />
  );
});

export interface ToolbarLinkState {
  /**
   * The component orientation.
   */
  orientation: ToolbarRoot.Orientation;
}

export interface ToolbarLinkProps extends BaseUIComponentProps<'a', ToolbarLinkState> {}

export namespace ToolbarLink {
  export type State = ToolbarLinkState;
  export type Props = ToolbarLinkProps;
}
