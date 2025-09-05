'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeItem } from '../../composite/item/CompositeItem';

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
  const { className, render, ...elementProps } = componentProps;

  const { orientation } = useToolbarRootContext();

  const state: ToolbarLink.State = React.useMemo(
    () => ({
      orientation,
    }),
    [orientation],
  );

  return (
    <CompositeItem
      tag="a"
      render={render}
      className={className}
      metadata={TOOLBAR_LINK_METADATA}
      state={state}
      refs={[forwardedRef]}
      props={[elementProps]}
    />
  );
});

export namespace ToolbarLink {
  export interface State {
    orientation: ToolbarRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
