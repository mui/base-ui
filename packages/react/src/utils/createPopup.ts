import { createSelector, Store } from '@base-ui-components/utils/store';
import { HTMLProps } from './types';

export type OpenChangeHandler<Payload> = (
  nextOpen: boolean,
  payload: Payload | undefined,
  trigger: HTMLElement | undefined,
  event: Event | undefined,
  reason: string,
) => void;

interface PopupHandleState<Payload = unknown> {
  triggerProps: HTMLProps | null;
  triggers: Map<HTMLElement, (() => Payload) | undefined>;
  payload?: unknown | undefined;
}

export const selectors = {
  triggerProps: createSelector((state: PopupHandleState) => state.triggerProps),
  triggers: createSelector((state: PopupHandleState) => state.triggers),
  payload: createSelector((state: PopupHandleState) => state.payload),
};

export class PopupHandle<Payload = unknown> {
  readonly store: Store<PopupHandleState> = new Store<PopupHandleState>({
    triggerProps: null,
    triggers: new Map<HTMLElement, (() => Payload) | undefined>(),
    payload: undefined,
  });

  setPayload(payload: Payload) {
    this.store.apply({
      payload,
    });
  }

  registerPopup(triggerProps: HTMLProps) {
    this.store.apply({
      triggerProps,
    });
  }

  registerTrigger(triggerElement: HTMLElement, getPayload?: () => Payload) {
    const triggers = this.store.state.triggers;
    triggers.set(triggerElement, getPayload);

    this.store.apply({
      // TODO: verify if triggers need a new reference
      triggers: new Map(triggers),
    });
  }

  unregisterTrigger(triggerElement: HTMLElement) {
    const triggers = this.store.state.triggers;
    triggers.delete(triggerElement);

    this.store.apply({
      // TODO: verify if triggers need a new reference
      triggers: new Map(triggers),
    });
  }
}
