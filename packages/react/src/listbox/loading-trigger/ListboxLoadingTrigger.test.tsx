import { expect, vi } from 'vitest';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { act, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

async function withMockIntersectionObserver(
  test: (notifyIntersectionObserver: () => void) => Promise<void>,
) {
  const originalIntersectionObserver = window.IntersectionObserver;
  let notifyIntersectionObserver: (() => void) | null = null;

  class IntersectionObserverMock implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds = [0];
    callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe() {
      notifyIntersectionObserver = () => {
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this);
      };
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return [];
    }
  }

  window.IntersectionObserver = IntersectionObserverMock;

  try {
    await test(() => {
      expect(notifyIntersectionObserver).not.toBe(null);
      notifyIntersectionObserver?.();
    });
  } finally {
    window.IntersectionObserver = originalIntersectionObserver;
  }
}

describe('<Listbox.LoadingTrigger />', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  it('should reset eager loading when the parent does not reflect loading=true', async () => {
    await withMockIntersectionObserver(async (notifyIntersectionObserver) => {
      const handleLoadMore = vi.fn();

      await render(
        <Listbox.Root onLoadMore={handleLoadMore}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.LoadingTrigger
              render={(props, state) => <div {...props}>{state.loading ? 'Loading' : 'Idle'}</div>}
            />
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      expect(screen.getByText('Idle')).toBeVisible();

      act(() => {
        notifyIntersectionObserver();
      });

      expect(handleLoadMore).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Loading')).toBeVisible();

      await clock.tickAsync(0);
      await flushMicrotasks();

      expect(screen.getByText('Idle')).toBeVisible();
    });
  });
});
