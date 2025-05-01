'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardTrigger = React.forwardRef(function PreviewCardTrigger(
  props: PreviewCardTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { render, className, ...otherProps } = props;

  const { open, getRootTriggerProps, setTriggerElement } = usePreviewCardRootContext();

  const state: PreviewCardTrigger.State = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(setTriggerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'a',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

export namespace PreviewCardTrigger {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
