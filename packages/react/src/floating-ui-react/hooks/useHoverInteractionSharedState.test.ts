import { vi } from 'vitest';
import type { FloatingRootContext, FloatingTreeType } from '../types';
import {
  closeHoverPopup,
  HOVER_CLOSE_UNSET,
  HoverInteraction,
} from './useHoverInteractionSharedState';

describe('closeHoverPopup', () => {
  it('emits a committed close even when the popup was not hover-opened', () => {
    const store = createMockStore();
    const instance = HoverInteraction.create();
    const tree = createMockTree();

    closeHoverPopup(
      store as FloatingRootContext,
      instance,
      tree as unknown as FloatingTreeType,
      new MouseEvent('mouseleave'),
      false,
      400,
    );

    expect(tree.emittedEvents).toEqual([['floating.closed', expect.any(MouseEvent)]]);
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
  });

  it('records reopen grace only for committed hover closes', () => {
    const store = createMockStore();
    const instance = HoverInteraction.create();
    const tree = createMockTree();
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(123);

    try {
      closeHoverPopup(
        store as FloatingRootContext,
        instance,
        tree as unknown as FloatingTreeType,
        new MouseEvent('mouseleave'),
        true,
        400,
      );

      expect(tree.emittedEvents).toEqual([['floating.closed', expect.any(MouseEvent)]]);
      expect(instance.lastHoverCloseTime).to.equal(123);
    } finally {
      performanceNowSpy.mockRestore();
    }
  });

  it('does not report a close when the request is canceled', () => {
    const store = createMockStore({ cancelClose: true });
    const instance = HoverInteraction.create();
    const tree = createMockTree();

    closeHoverPopup(
      store as FloatingRootContext,
      instance,
      tree as unknown as FloatingTreeType,
      new MouseEvent('mouseleave'),
      true,
      400,
    );

    expect(tree.emittedEvents).toEqual([]);
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
  });

  it('does not report a close when the effective controlled open state stays true', () => {
    const store = createMockStore({ controlledOpen: true });
    const instance = HoverInteraction.create();
    const tree = createMockTree();

    closeHoverPopup(
      store as FloatingRootContext,
      instance,
      tree as unknown as FloatingTreeType,
      new MouseEvent('mouseleave'),
      true,
      400,
    );

    expect(tree.emittedEvents).toEqual([]);
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
    expect(instance.pendingHoverClose).to.equal(null);
  });
});

function createMockStore(
  options: {
    cancelClose?: boolean;
    controlledOpen?: boolean;
  } = {},
) {
  let open = true;

  return {
    select(key: string) {
      if (key === 'open') {
        return options.controlledOpen ?? open;
      }

      return undefined;
    },
    setOpen(
      _open: boolean,
      eventDetails: {
        cancel: () => void;
      },
    ) {
      if (options.cancelClose) {
        eventDetails.cancel();
        return;
      }

      open = false;
    },
  };
}

function createMockTree() {
  const emittedEvents: Array<[string, unknown]> = [];
  return {
    emittedEvents,
    events: {
      emit(event: string, data: unknown) {
        emittedEvents.push([event, data]);
      },
    },
  };
}
