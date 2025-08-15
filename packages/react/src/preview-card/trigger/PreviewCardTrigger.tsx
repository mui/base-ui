'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardTrigger = React.forwardRef(function PreviewCardTrigger(
  componentProps: PreviewCardTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { open, triggerProps, setTriggerElement, coordsRef } = usePreviewCardRootContext();

  const state: PreviewCardTrigger.State = React.useMemo(() => ({ open }), [open]);

  const element = useRenderElement('a', componentProps, {
    ref: [setTriggerElement, forwardedRef],
    state,
    props: [
      triggerProps,
      {
        onFocus() {
          coordsRef.current = undefined;
        },
        onMouseMove(event) {
          if (open) {
            return;
          }

          const rects = Array.from(event.currentTarget.getClientRects());

          if (rects.length < 2) {
            return;
          }

          const hovered = rects.reduce(
            (best, rect, i) => {
              const d = Math.hypot(
                event.clientX - (rect.left + rect.width / 2),
                event.clientY - (rect.top + rect.height / 2),
              );
              return d < best.d ? { i, rect, d } : best;
            },
            { i: 0, rect: rects[0], d: Number.POSITIVE_INFINITY },
          );

          coordsRef.current = {
            rectIndex: hovered.i,
            x: event.clientX - hovered.rect.left,
            y: event.clientY - hovered.rect.top,
          };
        },
      },
      elementProps,
    ],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return element;
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
