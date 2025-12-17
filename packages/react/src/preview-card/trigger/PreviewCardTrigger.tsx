'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { PreviewCardHandle } from '../store/PreviewCardHandle';
import { useTriggerDataForwarding } from '../../utils/popups';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import { safePolygon, useHoverReferenceInteraction } from '../../floating-ui-react';

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
  const {
    render,
    className,
    delay,
    closeDelay,
    id: idProp,
    payload,
    handle,
    ...elementProps
  } = componentProps;

  const store = usePreviewCardRootContext();
  const thisTriggerId = useBaseUiId(idProp);

  const open = store.useState('open');
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');

  const triggerElementRef = React.useRef<Element | null>(null);

  const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(
    thisTriggerId,
    triggerElementRef,
    store,
    {
      payload,
    },
  );

  const delayValue = delay ?? OPEN_DELAY;
  const closeDelayValue = closeDelay ?? CLOSE_DELAY;

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    delay: () => ({ open: delayValue, close: closeDelayValue }),
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
  });

  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.context.delayRef.current = delayValue;
      store.context.closeDelayRef.current = closeDelayValue;
    }
  }, [delayValue, closeDelayValue, isTriggerActive, store]);

  const state: PreviewCardTrigger.State = React.useMemo(() => ({ open }), [open]);

  const element = useRenderElement('a', componentProps, {
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    state,
    props: [hoverProps, rootTriggerProps, { id: thisTriggerId }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
});

export interface PreviewCardTriggerState {
  /**
   * Whether the preview card is currently open.
   */
  open: boolean;
}

export interface PreviewCardTriggerProps<Payload = unknown> extends BaseUIComponentProps<
  'a',
  PreviewCardTrigger.State
> {
  /**
   * A handle to associate the trigger with a tooltip.
   */
  handle?: PreviewCardHandle<Payload>;
  /**
   * A payload to pass to the tooltip when it is opened.
   */
  payload?: Payload;
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
  export type Props<Payload = unknown> = PreviewCardTriggerProps<Payload>;
}
