'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

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

  const { getButtonProps, buttonRef } = useButton({
    native: 'a',
  });

  const state: ToolbarLink.State = React.useMemo(
    () => ({
      orientation,
    }),
    [orientation],
  );

  const element = useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [elementProps, getButtonProps],
  });

  return (
    <CompositeItem<ToolbarRoot.ItemMetadata> metadata={TOOLBAR_LINK_METADATA} render={element} />
  );
});

export namespace ToolbarLink {
  export interface State {
    orientation: ToolbarRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
