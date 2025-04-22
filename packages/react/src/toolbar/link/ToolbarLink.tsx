'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useButton } from '../../use-button';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarItemMetadata } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

const TOOLBAR_LINK_METADATA = {
  focusableWhenDisabled: true,
};
/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
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

  return (
    <CompositeItem<ToolbarItemMetadata> metadata={TOOLBAR_LINK_METADATA} render={renderElement()} />
  );
});

namespace ToolbarLink {
  export interface State {
    orientation: Orientation;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}

export { ToolbarLink };
