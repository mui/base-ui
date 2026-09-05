import * as React from 'react';
import { afterEach, beforeEach, expect, vi, describe, it } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { useResizeObserver } from './useResizeObserver';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  observed: Element[] = [];

  disconnected = false;

  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true;
  }
}

/** Elements currently observed by an observer that has not been disconnected. */
function activeTargets() {
  return FakeResizeObserver.instances
    .filter((instance) => !instance.disconnected)
    .flatMap((instance) => instance.observed);
}

describe('useResizeObserver', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function Target({ open, enabled }: { open: boolean; enabled?: boolean }) {
    const ref = React.useRef<HTMLDivElement>(null);
    useResizeObserver(ref, () => {}, enabled);
    return open ? <div ref={ref} data-testid="box" /> : null;
  }

  it('observes an element present on mount', () => {
    render(<Target open />, { strict: false });

    expect(activeTargets()).toEqual([screen.getByTestId('box')]);
  });

  it('observes an element that only appears on a later render', () => {
    const { setProps } = render(<Target open={false} />, { strict: false });
    expect(activeTargets()).toEqual([]);

    setProps({ open: true });

    expect(activeTargets()).toEqual([screen.getByTestId('box')]);
  });

  it('stops observing an element that is removed', () => {
    const { setProps } = render(<Target open />, { strict: false });

    setProps({ open: false });

    expect(activeTargets()).toEqual([]);
  });

  it('does not observe while disabled, and observes once enabled', () => {
    const { setProps } = render(<Target open enabled={false} />, { strict: false });
    expect(activeTargets()).toEqual([]);

    setProps({ enabled: true });

    expect(activeTargets()).toEqual([screen.getByTestId('box')]);
  });

  it('disconnects on unmount', () => {
    const { unmount } = render(<Target open />, { strict: false });

    unmount();

    expect(activeTargets()).toEqual([]);
  });
});
