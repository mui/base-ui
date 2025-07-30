import { Store } from '@base-ui-components/utils/store';
import { type HTMLProps } from '../../utils/types';
import { PopoverStore, State } from '../store';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';

const EMPTY_OBJ = {};

export class PopoverHandle<Payload = undefined> {
  readonly store: PopoverStore = new Store<State>({
    open: false,
    modal: false,
    activeTriggerElement: null,
    positionerElement: null,
    popupElement: null,
    triggers: new Map<HTMLElement, (() => Payload) | undefined>(),
    instantType: undefined,
    transitionStatus: 'idle',
    openMethod: null,
    openReason: null,
    titleId: undefined,
    descriptionId: undefined,
    floatingRootContext: getEmptyContext(),
    payload: undefined,
    triggerProps: EMPTY_OBJ as HTMLProps,
    popupProps: EMPTY_OBJ as HTMLProps,
    stickIfOpen: true,
  });

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
