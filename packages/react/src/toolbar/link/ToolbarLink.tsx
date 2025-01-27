'use client';
import * as React from 'react';
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
