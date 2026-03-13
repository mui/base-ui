import { vi } from 'vitest';
import type { FloatingRootContext } from '../types';
import {
  closeHoverPopup,
  emitCommittedHoverClose,
  HOVER_CLOSE_UNSET,
  HoverInteraction,
} from './useHoverInteractionSharedState';

describe('closeHoverPopup', () => {
  it('reports a committed close even when the popup was not hover-opened', () => {
    const store = createMockStore();
    const instance = HoverInteraction.create();

    const result = closeHoverPopup(
      store as FloatingRootContext,
      instance,
      new MouseEvent('mouseleave'),
      false,
      400,
    );

    expect(result).to.deep.equal({ closed: true });
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
  });

  it('records reopen grace only for committed hover closes', () => {
    const store = createMockStore();
    const instance = HoverInteraction.create();
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(123);

    try {
      const result = closeHoverPopup(
        store as FloatingRootContext,
        instance,
        new MouseEvent('mouseleave'),
        true,
        400,
      );

      expect(result).to.deep.equal({ closed: true });
      emitCommittedHoverClose(instance, null);
      expect(instance.lastHoverCloseTime).to.equal(123);
    } finally {
      performanceNowSpy.mockRestore();
    }
  });

  it('does not report a close when the request is canceled', () => {
    const store = createMockStore({ cancelClose: true });
    const instance = HoverInteraction.create();

    const result = closeHoverPopup(
      store as FloatingRootContext,
      instance,
      new MouseEvent('mouseleave'),
      true,
      400,
    );

    expect(result).to.deep.equal({ closed: false });
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
  });

  it('does not report a close when the effective controlled open state stays true', () => {
    const store = createMockStore({ controlledOpen: true });
    const instance = HoverInteraction.create();

    const result = closeHoverPopup(
      store as FloatingRootContext,
      instance,
      new MouseEvent('mouseleave'),
      true,
      400,
    );

    expect(result).to.deep.equal({ closed: false });
    expect(instance.lastHoverCloseTime).to.equal(HOVER_CLOSE_UNSET);
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
