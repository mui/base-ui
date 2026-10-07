import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { createAlertDialogHandle } from '../../alert-dialog/handle';
import { createDialogHandle } from '../../dialog/store/DialogHandle';
import type { DialogHandle } from '../../dialog/store/DialogHandle';
import { createMenuHandle } from '../../menu/store/MenuHandle';
import { createPopoverHandle } from '../../popover/store/PopoverHandle';
import { createPreviewCardHandle } from '../../preview-card/store/PreviewCardHandle';
import { createTooltipHandle } from '../../tooltip/store/TooltipHandle';
import { BasePopupHandle } from './popupHandle';
import { PopupTriggerMap } from './popupTriggerMap';

type SetOpen = (
  open: boolean,
  eventDetails: BaseUIChangeEventDetails<typeof REASONS.imperativeAction>,
) => void;

interface FakeStore {
  context: { triggerElements: PopupTriggerMap };
  setOpen: ReturnType<typeof vi.fn<SetOpen>>;
}

function createStore(): FakeStore {
  return {
    context: { triggerElements: new PopupTriggerMap() },
    setOpen: vi.fn<SetOpen>(),
  };
}

class TestHandle extends BasePopupHandle<FakeStore, FakeStore> {
  constructor(throwOnMissingTrigger?: boolean) {
    super(createStore(), 'Test', throwOnMissingTrigger);
  }

  get fallback() {
    return this.fallbackStore;
  }

  open(triggerId: string | null | undefined) {
    this.openByTrigger(triggerId);
  }

  close() {
    this.closePopup();
  }
}

function registerTrigger(store: FakeStore, id: string) {
  const element = document.createElement('button');
  store.context.triggerElements.add(id, element);
  return element;
}

function getSetOpenCall(store: FakeStore) {
  expect(store.setOpen).toHaveBeenCalledTimes(1);
  const [open, details] = store.setOpen.mock.calls[0];
  return { open, details };
}

const DETACHED_WARNING = 'no root using this handle is mounted';

function countWarnings(consoleWarn: { mock: { calls: unknown[][] } }, text: string) {
  return consoleWarn.mock.calls.filter(
    ([message]) => typeof message === 'string' && message.includes(text),
  ).length;
}

describe('BasePopupHandle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('store attachment', () => {
    it('exposes the fallback store until a root store attaches, and again after it detaches', () => {
      const handle = new TestHandle();
      const rootStore = createStore();

      expect(handle.store).toBe(handle.fallback);
      expect(handle.serverStore).toBe(handle.fallback);

      const detach = handle.attachStore(rootStore);
      expect(handle.store).toBe(rootStore);
      // The server snapshot stays on the fallback store so hydration is stable.
      expect(handle.serverStore).toBe(handle.fallback);

      detach();
      expect(handle.store).toBe(handle.fallback);
    });

    it('notifies subscribers only when the exposed store changes', () => {
      const handle = new TestHandle();
      const storeA = createStore();
      const storeB = createStore();
      const listener = vi.fn();
      const unsubscribe = handle.subscribeStore(listener);

      const detachA = handle.attachStore(storeA);
      expect(listener).toHaveBeenCalledTimes(1);

      const detachB = handle.attachStore(storeB);
      expect(listener).toHaveBeenCalledTimes(2);

      // Detaching a root that is not the active one leaves the exposed store unchanged.
      detachA();
      expect(handle.store).toBe(storeB);
      expect(listener).toHaveBeenCalledTimes(2);

      detachB();
      expect(handle.store).toBe(handle.fallback);
      expect(listener).toHaveBeenCalledTimes(3);

      unsubscribe();
      handle.attachStore(storeA);
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('restores control to the most recently attached root that is still attached', () => {
      const handle = new TestHandle();
      const storeA = createStore();
      const storeB = createStore();
      const storeC = createStore();

      const detachA = handle.attachStore(storeA);
      const detachB = handle.attachStore(storeB);
      const detachC = handle.attachStore(storeC);
      expect(handle.store).toBe(storeC);

      // The newest root detaches first (e.g. a canceled route transition).
      detachC();
      expect(handle.store).toBe(storeB);

      detachA();
      expect(handle.store).toBe(storeB);

      detachB();
      expect(handle.store).toBe(handle.fallback);
    });

    it('stays attached when the same root store detaches and reattaches (Strict Mode replay)', () => {
      const handle = new TestHandle();
      const rootStore = createStore();

      handle.attachStore(rootStore)();
      handle.attachStore(rootStore);

      expect(handle.store).toBe(rootStore);
      handle.close();
      expect(getSetOpenCall(rootStore).open).toBe(false);
    });
  });

  describe('overlapping roots warning', () => {
    const OVERLAP_WARNING =
      'Base UI: A handle is attached to more than one mounted root at the same time. ' +
      'The most recently mounted root takes over and the previous one stops being controlled by the handle. ' +
      'A handle should be used by a single root that stays mounted for the lifetime of the handle.';

    it('warns when more than one root is still attached a frame later', () => {
      vi.useFakeTimers();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = new TestHandle();

      handle.attachStore(createStore());
      handle.attachStore(createStore());
      // The check is deferred, so a transient overlap does not warn synchronously.
      expect(consoleWarn).not.toHaveBeenCalled();

      vi.advanceTimersToNextFrame();
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(OVERLAP_WARNING);
    });

    it.each([
      { name: 'the older root detaches', detachNewer: false },
      { name: 'the newer root detaches', detachNewer: true },
    ])('does not warn when $name before the next frame', ({ detachNewer: newerDetachesFirst }) => {
      vi.useFakeTimers();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = new TestHandle();
      const olderStore = createStore();
      const newerStore = createStore();

      const detachOlder = handle.attachStore(olderStore);
      const detachNewer = handle.attachStore(newerStore);
      (newerDetachesFirst ? detachNewer : detachOlder)();

      vi.advanceTimersToNextFrame();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(handle.store).toBe(newerDetachesFirst ? olderStore : newerStore);
    });

    it('does not warn for a single attached root', () => {
      vi.useFakeTimers();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = new TestHandle();

      handle.attachStore(createStore());
      vi.advanceTimersToNextFrame();

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('imperative methods while no root is attached', () => {
    it('ignores open() and close() with a warning before a root attaches and after it detaches', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = new TestHandle();
      const rootStore = createStore();
      registerTrigger(handle.fallback, 'trigger');

      handle.open('trigger');
      handle.close();
      expect(consoleWarn.mock.calls).toEqual([
        [
          'Base UI: TestHandle.open() was called while no root using this handle is mounted. ' +
            'The call was ignored; mount a root with this handle before opening it imperatively.',
        ],
        [
          'Base UI: TestHandle.close() was called while no root using this handle is mounted. ' +
            'The call was ignored.',
        ],
      ]);
      expect(handle.fallback.setOpen).not.toHaveBeenCalled();

      handle.attachStore(rootStore)();
      consoleWarn.mockClear();

      handle.open('trigger');
      handle.close();
      expect(countWarnings(consoleWarn, DETACHED_WARNING)).toBe(2);
      expect(rootStore.setOpen).not.toHaveBeenCalled();
      expect(handle.fallback.setOpen).not.toHaveBeenCalled();
    });
  });

  describe('open()', () => {
    it('opens the attached root with the trigger registered in its store', () => {
      const handle = new TestHandle();
      const rootStore = createStore();
      handle.attachStore(rootStore);
      registerTrigger(rootStore, 'other');
      const trigger = registerTrigger(rootStore, 'trigger');

      handle.open('trigger');

      const { open, details } = getSetOpenCall(rootStore);
      expect(open).toBe(true);
      expect(details.reason).toBe(REASONS.imperativeAction);
      expect(details.trigger).toBe(trigger);
    });

    it.each([
      { location: 'the fallback store', registeredIn: 'fallback' as const },
      { location: 'a previously attached root store', registeredIn: 'previous' as const },
    ])('resolves a trigger that is still registered in $location', ({ registeredIn }) => {
      // Keeps the deferred overlap warning from firing; it is not under test here.
      vi.useFakeTimers();
      const handle = new TestHandle();
      const previousStore = createStore();
      const activeStore = createStore();
      handle.attachStore(previousStore);
      handle.attachStore(activeStore);

      const trigger = registerTrigger(
        registeredIn === 'fallback' ? handle.fallback : previousStore,
        'trigger',
      );

      handle.open('trigger');

      expect(previousStore.setOpen).not.toHaveBeenCalled();
      expect(getSetOpenCall(activeStore).details.trigger).toBe(trigger);
    });

    it('prefers the newest attached store when several register the same id', () => {
      // Keeps the deferred overlap warning from firing; it is not under test here.
      vi.useFakeTimers();
      const handle = new TestHandle();
      const previousStore = createStore();
      const activeStore = createStore();
      handle.attachStore(previousStore);
      handle.attachStore(activeStore);
      registerTrigger(handle.fallback, 'trigger');
      registerTrigger(previousStore, 'trigger');
      const activeTrigger = registerTrigger(activeStore, 'trigger');

      handle.open('trigger');

      expect(getSetOpenCall(activeStore).details.trigger).toBe(activeTrigger);
    });

    it.each([{ triggerId: null }, { triggerId: undefined }])(
      'opens without a trigger when the id is $triggerId',
      ({ triggerId }) => {
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const handle = new TestHandle();
        const rootStore = createStore();
        handle.attachStore(rootStore);

        handle.open(triggerId);

        const { open, details } = getSetOpenCall(rootStore);
        expect(open).toBe(true);
        expect(details.trigger).toBe(undefined);
        expect(consoleWarn).not.toHaveBeenCalled();
      },
    );

    it('throws for an unregistered trigger id by default and does not open', () => {
      const handle = new TestHandle();
      const rootStore = createStore();
      handle.attachStore(rootStore);

      expect(() => handle.open('missing')).toThrow(
        'Base UI: TestHandle.open() was called with the trigger id "missing", ' +
          'but no matching trigger is registered with this handle. ' +
          'An anchored popup cannot open without a trigger to anchor to. ' +
          'Pass the id of a mounted Test.Trigger that has this handle set on its "handle" prop.',
      );
      expect(rootStore.setOpen).not.toHaveBeenCalled();
    });

    it('opens unassociated with a warning for an unregistered trigger id when throwing is disabled', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = new TestHandle(false);
      const rootStore = createStore();
      handle.attachStore(rootStore);

      handle.open('missing');

      expect(consoleWarn.mock.calls).toEqual([
        [
          'Base UI: TestHandle.open: No trigger found with id "missing". ' +
            'The popup will open, but the trigger will not be associated with it.',
        ],
      ]);
      const { open, details } = getSetOpenCall(rootStore);
      expect(open).toBe(true);
      expect(details.trigger).toBe(undefined);
    });
  });

  describe('close()', () => {
    it('closes the attached root', () => {
      const handle = new TestHandle();
      const rootStore = createStore();
      handle.attachStore(rootStore);

      handle.close();

      const { open, details } = getSetOpenCall(rootStore);
      expect(open).toBe(false);
      expect(details.reason).toBe(REASONS.imperativeAction);
      expect(details.trigger).toBe(undefined);
    });
  });
});

describe('concrete popup handles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each<{
    component: string;
    warningName: string;
    createHandle: () => { open(triggerId: string): void; close(): void; readonly isOpen: boolean };
  }>([
    { component: 'AlertDialog', warningName: 'Dialog', createHandle: createAlertDialogHandle },
    { component: 'Dialog', warningName: 'Dialog', createHandle: createDialogHandle },
    { component: 'Menu', warningName: 'Menu', createHandle: createMenuHandle },
    { component: 'Popover', warningName: 'Popover', createHandle: createPopoverHandle },
    { component: 'PreviewCard', warningName: 'PreviewCard', createHandle: createPreviewCardHandle },
    { component: 'Tooltip', warningName: 'Tooltip', createHandle: createTooltipHandle },
  ])(
    '$component handle is closed and names itself in warnings while no root is attached',
    ({ warningName, createHandle }) => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = createHandle();

      handle.open('trigger');
      handle.close();

      expect(handle.isOpen).toBe(false);
      expect(countWarnings(consoleWarn, `${warningName}Handle.open() was called while`)).toBe(1);
      expect(countWarnings(consoleWarn, `${warningName}Handle.close() was called while`)).toBe(1);
    },
  );

  it.each<{ component: string; createHandle: () => DialogHandle<number> }>([
    { component: 'AlertDialog', createHandle: createAlertDialogHandle },
    { component: 'Dialog', createHandle: createDialogHandle },
  ])(
    '$component handle ignores openWithPayload() with a warning while detached',
    ({ createHandle }) => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handle = createHandle();

      handle.openWithPayload(8);

      expect(handle.isOpen).toBe(false);
      expect(consoleWarn.mock.calls).toEqual([
        [
          'Base UI: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' +
            'The call and its payload were ignored; mount a root with this handle before opening it imperatively.',
        ],
      ]);
    },
  );
});
