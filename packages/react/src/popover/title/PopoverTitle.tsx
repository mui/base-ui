'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useEnhancedEffect } from '../../utils';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverTitle = React.forwardRef(function PopoverTitle(
  componentProps: PopoverTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { setTitleId } = usePopoverRootContext();

  const id = useBaseUiId(elementProps.id);

  useEnhancedEffect(() => {
    setTitleId(id);
    return () => {
      setTitleId(undefined);
    };
  }, [setTitleId, id]);

  const renderElement = useRenderElement('h2', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return renderElement();
});

namespace PopoverTitle {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', State> {}
}

export { PopoverTitle };
