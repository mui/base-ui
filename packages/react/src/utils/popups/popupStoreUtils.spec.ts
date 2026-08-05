import type { ReactStore } from '@base-ui/utils/store';
import type { HTMLProps } from '../../internals/types';
import { usePopupInteractionProps } from './popupStoreUtils';
import type { PopupStoreContext, PopupStoreState, popupStoreSelectors } from './store';

type TestState = PopupStoreState<unknown> & {
  itemProps: HTMLProps;
};

type TestStore = ReactStore<TestState, PopupStoreContext<never>, typeof popupStoreSelectors>;

function useTypeTests(store: TestStore, props: HTMLProps) {
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
}

void useTypeTests;
