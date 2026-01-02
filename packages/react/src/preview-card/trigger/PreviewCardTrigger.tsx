'use client';
import * as React from 'react';
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

  const rootContext = usePreviewCardRootContext(true);
  const store = handle?.store ?? rootContext;
  if (!store) {
    throw new Error(
      'Base UI: <Tooltip.Trigger> must be either used within a <Tooltip.Root> component or provided with a handle.',
    );
  }

  const thisTriggerId = useBaseUiId(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');

  const triggerElementRef = React.useRef<Element | null>(null);

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? CLOSE_DELAY;

  const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(
    thisTriggerId,
    triggerElementRef,
    store,
    {
      payload,
      closeDelay: closeDelayWithDefault,
    },
  );

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    delay: () => ({ open: delayWithDefault, close: closeDelayWithDefault }),
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
  });

  const state: PreviewCardTrigger.State = React.useMemo(
    () => ({ open: isOpenedByThisTrigger }),
    [isOpenedByThisTrigger],
  );

  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);

  const element = useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [hoverProps, rootTriggerProps, { id: thisTriggerId }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
}) as PreviewCardTrigger;

export interface PreviewCardTrigger {
  <Payload>(
    componentProps: PreviewCardTrigger.Props<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

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
   * A handle to associate the trigger with a preview card.
   */
  handle?: PreviewCardHandle<Payload>;
  /**
   * A payload to pass to the preview card when it is opened.
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
