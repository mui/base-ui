import { vi, it, describe, expect } from 'vitest';
import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isJSDOM, useTestInteractions } from '#test-utils';
import { useFloating, useListNavigation } from '../index';

vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    ...actual,
    platform: {
      ...actual.platform,
      os: { ...actual.platform.os, mac: true, apple: true },
      engine: { ...actual.platform.engine, webkit: true },
      screenReader: { ...actual.platform.screenReader, voiceOver: true },
    },
  };
});

function NestedKeyboardMenu({ keepMountedAfterOpen = false }: { keepMountedAfterOpen?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [wasOpened, setWasOpened] = React.useState(false);
  const listRef = React.useRef<Array<HTMLLIElement | null>>([]);
  const [activeIndex, setActiveIndex] = React.useState<null | number>(null);
  const { refs, context } = useFloating({
    open,
    onOpenChange(nextOpen) {
      setOpen(nextOpen);
      if (nextOpen) {
        setWasOpened(true);
      }
    },
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useTestInteractions([
    useListNavigation(context, {
      listRef,
      activeIndex,
      nested: true,
      parentOrientation: 'vertical',
      onNavigate: setActiveIndex,
    }),
  ]);

  const mounted = open || (keepMountedAfterOpen && wasOpened);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })}>Open</button>
      <button type="button" onClick={() => setOpen(false)}>
        Close
      </button>
      {mounted && (
        <div role="menu" {...getFloatingProps({ ref: refs.setFloating })}>
          <ul>
            <li
              data-testid="item-0"
              role="menuitem"
              data-active={activeIndex === 0 ? '' : undefined}
              tabIndex={-1}
              {...getItemProps({
                ref(node: HTMLLIElement | null) {
                  listRef.current[0] = node;
                },
              })}
            >
              One
            </li>
          </ul>
        </div>
      )}
    </React.Fragment>
  );
}

function mockAnimationFrames() {
  const frameCallbacks = new Map<number, FrameRequestCallback>();
  let frameId = 0;

  const requestAnimationFrameSpy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
  const cancelAnimationFrameSpy = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation((id) => {
      frameCallbacks.delete(id);
    });

  function flushAnimationFrames() {
    let flushes = 0;

    while (frameCallbacks.size > 0) {
      if (flushes === 5) {
        throw new Error('Expected queued animation frames to settle');
      }

      act(() => {
        const callbacks = Array.from(frameCallbacks.values());
        frameCallbacks.clear();
        callbacks.forEach((callback) => callback(performance.now()));
      });

      flushes += 1;
    }
  }

  function restore() {
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  }

  return {
    flushAnimationFrames,
    restore,
  };
}

describe('useListNavigation WebKit VoiceOver behavior', () => {
  it.skipIf(isJSDOM)('delays initial DOM focus while activating the item immediately', async () => {
    const user = userEvent.setup();
    const animationFrames = mockAnimationFrames();

    try {
      render(<NestedKeyboardMenu />);

      await user.tab();
      await user.keyboard('{ArrowRight}');

      const item = await screen.findByTestId('item-0');

      await waitFor(() => {
        expect(item).toHaveAttribute('data-active');
      });
      expect(item).not.toHaveFocus();

      animationFrames.flushAnimationFrames();

      expect(item).toHaveFocus();
    } finally {
      animationFrames.restore();
    }
  });

  it.skipIf(isJSDOM)(
    'does not move focus into a submenu that closed before focus landed',
    async () => {
      const user = userEvent.setup();
      const animationFrames = mockAnimationFrames();

      try {
        render(<NestedKeyboardMenu keepMountedAfterOpen />);

        await user.tab();
        await user.keyboard('{ArrowRight}');

        const item = await screen.findByTestId('item-0');

        await waitFor(() => {
          expect(item).toHaveAttribute('data-active');
        });
        expect(item).not.toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Close' }));

        animationFrames.flushAnimationFrames();

        expect(item).not.toHaveFocus();
        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
      } finally {
        animationFrames.restore();
      }
    },
  );
});
