import { createSelector, Store } from '@base-ui-components/utils/store';
import { HTMLProps } from './types';

export type OpenChangeHandler<Payload> = (
  nextOpen: boolean,
  payload: Payload | undefined,
  trigger: HTMLElement | undefined,
  event: Event | undefined,
  reason: string,
) => void;

interface PopupHandleState {
  triggerProps: HTMLProps | null;
  triggers: Set<HTMLElement>;
}

export const selectors = {
  triggerProps: createSelector((state: PopupHandleState) => state.triggerProps),
  triggers: createSelector((state: PopupHandleState) => state.triggers),
};

export class PopupHandle<Payload = unknown> {
  #onOpenChange: OpenChangeHandler<Payload> | null = null;

  #popupElement: HTMLElement | null = null;

  readonly store: Store<PopupHandleState> = new Store<PopupHandleState>({
    triggerProps: null,
    triggers: new Set<HTMLElement>(),
  });

  public get popupElement(): HTMLElement | null {
    return this.#popupElement;
  }

  open(payload: Payload, trigger: HTMLElement, event: Event | undefined, reason: string) {
    this.#onOpenChange?.(true, payload, trigger, event, reason);
  }

  close(event: Event | undefined, reason: string) {
    this.#onOpenChange?.(false, undefined, undefined, event, reason);
  }

  registerPopup(
    element: HTMLElement | null,
    onOpenChange: OpenChangeHandler<Payload>,
    triggerProps: HTMLProps,
  ) {
    this.#popupElement = element;
    this.#onOpenChange = onOpenChange;

    this.store.apply({
      triggerProps,
    });
  }

  registerTrigger(triggerElement: HTMLElement) {
    const triggers = this.store.state.triggers;
    triggers.add(triggerElement);

    this.store.apply({
      // TODO: verify if triggers need a new reference
      triggers: new Set(triggers),
    });
  }

  unregisterTrigger(triggerElement: HTMLElement) {
    const triggers = this.store.state.triggers;
    triggers.delete(triggerElement);

    this.store.apply({
      // TODO: verify if triggers need a new reference
      triggers: new Set(triggers),
    });
  }

  unregisterPopup() {
    this.#popupElement = null;
    this.#onOpenChange = null;
  }
}
