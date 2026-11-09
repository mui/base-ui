import type { PopupOpenChangeState, PopupStoreState, PopupUnmountState } from './store';

type TestState = PopupStoreState<unknown> & {
  instantType: 'dismiss' | 'focus' | undefined;
  extra: number;
};

function useTypeTests() {
  const openChange: PopupOpenChangeState<TestState>[] = [
    {},
    { instantType: 'focus' },
    { instantType: undefined },
    { extra: 1 },
    // @ts-expect-error Fields must use their declared value type.
    { extra: 'invalid' },
    // @ts-expect-error The open state is committed by the base store, not by a step.
    { open: true },
    // @ts-expect-error The active trigger is committed by the base store, not by a step.
    { activeTriggerElement: null },
    // @ts-expect-error The open change reason is committed by the base store, not by a step.
    { openChangeReason: null },
    // @ts-expect-error Only fields of the store's state can be returned.
    { unknownField: true },
  ];

  const unmount: PopupUnmountState<TestState>[] = [
    { extra: 0 },
    // @ts-expect-error `mounted` is reset by the base store on unmount.
    { mounted: false },
    // @ts-expect-error The active trigger is reset by the base store on unmount.
    { activeTriggerId: null },
  ];

  return [openChange, unmount];
}

void useTypeTests;
