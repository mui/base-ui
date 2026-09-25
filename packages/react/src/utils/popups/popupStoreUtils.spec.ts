import type { ReactStore } from '@base-ui/utils/store';
import type { HTMLProps } from '../../internals/types';
import type { BaseUIChangeEventDetails } from '../../types';
import { applyPopupOpenChange, usePopupInteractionProps } from './popupStoreUtils';
import type { PopupStoreContext, PopupStoreState, popupStoreSelectors } from './store';

type TestState = PopupStoreState<unknown> & {
  itemProps: HTMLProps;
};

type TestStore = ReactStore<TestState, PopupStoreContext<never>, typeof popupStoreSelectors>;

type OpenChangeDetails = BaseUIChangeEventDetails<string> & { preventUnmountOnClose(): void };

type OpenChangeStore = {
  readonly context: Pick<PopupStoreContext<OpenChangeDetails>, 'onOpenChange'>;
  readonly state: TestState;
  update<const Key extends keyof TestState>(state: Pick<TestState, Key>): void;
};

function useTypeTests(
  store: TestStore,
  openChangeStore: OpenChangeStore,
  details: OpenChangeDetails,
  props: HTMLProps,
) {
  usePopupInteractionProps(store, {
    activeTriggerProps: props,
    inactiveTriggerProps: props,
    popupProps: props,
    itemProps: props,
  });

  usePopupInteractionProps(store, {
    activeTriggerProps: props,
    inactiveTriggerProps: props,
    popupProps: props,
    // @ts-expect-error The store requires a defined item prop bag.
    itemProps: undefined,
  });

  // @ts-expect-error All three common popup prop bags are required.
  usePopupInteractionProps(store, {
    activeTriggerProps: props,
    inactiveTriggerProps: props,
    itemProps: props,
  });

  usePopupInteractionProps(store, {
    activeTriggerProps: props,
    inactiveTriggerProps: props,
    popupProps: props,
    // @ts-expect-error Additional store fields must use their declared value type.
    itemProps: 'invalid',
  });

  applyPopupOpenChange(openChangeStore, true, details, {
    // @ts-expect-error Extra state cannot contain unknown keys.
    extraState: { unknownKey: 1 },
  });

  applyPopupOpenChange(openChangeStore, true, details, {
    // @ts-expect-error A required extra-state field cannot explicitly be undefined.
    extraState: { itemProps: undefined },
  });

  applyPopupOpenChange(openChangeStore, true, details, {
    // @ts-expect-error Extra-state values must match their corresponding state fields.
    extraState: { itemProps: 'invalid' },
  });
}

void useTypeTests;
