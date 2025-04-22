'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useEnhancedEffect } from '../../utils';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverDescription = React.forwardRef(function PopoverDescription(
  componentProps: PopoverDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { setDescriptionId } = usePopoverRootContext();

  const id = useBaseUiId(elementProps.id);

  useEnhancedEffect(() => {
    setDescriptionId(id);
    return () => {
      setDescriptionId(undefined);
    };
  }, [setDescriptionId, id]);

  const renderElement = useRenderElement('p', componentProps, {
    ref: forwardedRef,
    props: [{ id }, elementProps],
  });

  return renderElement();
});

namespace PopoverDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

export { PopoverDescription };
