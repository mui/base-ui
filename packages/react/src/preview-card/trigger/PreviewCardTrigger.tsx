'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
  const { render, className, delay, closeDelay, ...elementProps } = componentProps;

  const { open, triggerProps, setTriggerElement, writeDelayRefs, coordsRef } = usePreviewCardRootContext();

  useIsoLayoutEffect(() => {
    writeDelayRefs({ delay, closeDelay });
  });

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

export interface PreviewCardTriggerState {
  /**
   * Whether the preview card is currently open.
   */
  open: boolean;
}

export interface PreviewCardTriggerProps extends BaseUIComponentProps<
  'a',
  PreviewCardTrigger.State
> {
  /**
   * How long to wait before the preview card opens. Specified in milliseconds.
   * @default 600
   */
  delay?: number;
  /**
   * How long to wait before closing the preview card. Specified in milliseconds.
   * @default 300
   */
  closeDelay?: number;
}

export namespace PreviewCardTrigger {
  export type State = PreviewCardTriggerState;
  export type Props = PreviewCardTriggerProps;
}
