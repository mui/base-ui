import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
} from '../../utils/popups';
import { useSyncedFloatingRootContext } from '../../floating-ui-react';
import { type PreviewCardRoot } from '../root/PreviewCardRoot';
import { REASONS } from '../../utils/reasons';
import { CLOSE_DELAY } from '../utils/constants';

export type State<Payload> = PopupStoreState<Payload> & {
  instantType: 'dismiss' | 'focus' | undefined;
  hasViewport: boolean;
};

export type Context = PopupStoreContext<PreviewCardRoot.ChangeEventDetails> & {
  closeDelayRef: React.RefObject<number>;
};

const selectors = {
  ...popupStoreSelectors,
  instantType: createSelector((state: State<unknown>) => state.instantType),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

function getElementDebugName(element: Element | null | undefined): string {
  if (!element) {
    return 'null';
  }

  const id = element.id ? `#${element.id}` : '';
  const testId = element.getAttribute('data-testid');
  const role = element.getAttribute('role');
  const text = element.textContent?.trim().slice(0, 40) ?? '';
  const testIdPart = testId ? `[data-testid="${testId}"]` : '';
  const rolePart = role ? `[role="${role}"]` : '';
  const textPart = text ? `("${text}")` : '';
  return `${element.tagName.toLowerCase()}${id}${testIdPart}${rolePart}${textPart}`;
}

export class PreviewCardStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  typeof selectors
> {
  constructor(initialState?: Partial<State<Payload>>) {
    super(
      { ...createInitialState(), ...initialState },
      {
        popupRef: React.createRef<HTMLElement | null>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerElements: new PopupTriggerMap(),
        closeDelayRef: { current: CLOSE_DELAY },
      },
      selectors,
    );
  }

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PreviewCardRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    // eslint-disable-next-line no-console
    console.log('[PreviewCardDebug][Store] setOpen called', {
      nextOpen,
      reason: eventDetails.reason,
      eventType: eventDetails.event?.type,
      trigger: getElementDebugName(eventDetails.trigger ?? null),
      prevOpen: this.state.open,
      prevActiveTriggerId: this.state.activeTriggerId,
      prevActiveTriggerElement: getElementDebugName(this.state.activeTriggerElement),
    });

    const reason = eventDetails.reason;

    const isHover = reason === REASONS.triggerHover;
    const isFocusOpen = nextOpen && reason === REASONS.triggerFocus;
    const isDismissClose =
      !nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey);

    (eventDetails as PreviewCardRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as PreviewCardRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = { open: nextOpen };

      if (isFocusOpen) {
        updatedState.instantType = 'focus';
      } else if (isDismissClose) {
        updatedState.instantType = 'dismiss';
      } else if (reason === REASONS.triggerHover) {
        updatedState.instantType = undefined;
      }

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        updatedState.activeTriggerId = newTriggerId;
        updatedState.activeTriggerElement = eventDetails.trigger ?? null;
      }

      this.update(updatedState);
      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Store] state updated', {
        open: this.state.open,
        activeTriggerId: this.state.activeTriggerId,
        activeTriggerElement: getElementDebugName(this.state.activeTriggerElement),
        transitionStatus: this.state.transitionStatus,
        mounted: this.state.mounted,
      });
    };

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  };

  public static useStore<Payload>(
    externalStore: PreviewCardStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const internalStore = useRefWithInit(() => {
      return new PreviewCardStore<Payload>(initialState);
    }).current;

    const store = externalStore ?? internalStore;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const floatingRootContext = useSyncedFloatingRootContext({
      popupStore: store,
      onOpenChange: store.setOpen,
    });

    // It's safe to set this here because when this code runs for the first time,
    // nothing has had a chance to subscribe to the `store` yet.
    // For subsequent renders, the `floatingRootContext` reference remains the same,
    // so it's basically a no-op.
    (store.state as State<Payload>).floatingRootContext = floatingRootContext;
    return store;
  }
}

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreState(),
    instantType: undefined,
    hasViewport: false,
  };
}
