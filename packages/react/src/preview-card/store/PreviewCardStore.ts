import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore } from '@base-ui/utils/store';
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
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';

export type State<Payload> = PopupStoreState<Payload> & {
  instantType: 'dismiss' | 'focus' | undefined;
};

export type Context = PopupStoreContext<PreviewCardRoot.ChangeEventDetails> & {
  delayRef: React.RefObject<number>;
  closeDelayRef: React.RefObject<number>;
};

const selectors = {
  ...popupStoreSelectors,
};

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
        delayRef: { current: OPEN_DELAY },
        closeDelayRef: { current: CLOSE_DELAY },
      },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => {
    const isHover = eventDetails.reason === REASONS.triggerHover;
    const isFocusOpen = nextOpen && eventDetails.reason === REASONS.triggerFocus;
    const isDismissClose =
      !nextOpen &&
      (eventDetails.reason === REASONS.triggerPress || eventDetails.reason === REASONS.escapeKey);

    (eventDetails as PreviewCardRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const changeState = () => {
      this.set('open', nextOpen);
    };

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }

    if (isFocusOpen || isDismissClose) {
      this.set('instantType', isFocusOpen ? 'focus' : 'dismiss');
    } else if (eventDetails.reason === REASONS.triggerHover) {
      this.set('instantType', undefined);
    }
  };

  public static useStore<Payload>(
    externalStore: PreviewCardStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const store = useRefWithInit(() => {
      return externalStore ?? new PreviewCardStore<Payload>(initialState);
    }).current;

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
  };
}
