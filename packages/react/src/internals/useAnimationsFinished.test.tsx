import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { act, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createRenderer } from '#test-utils';
import { useAnimationsFinished } from './useAnimationsFinished';

function createAnimation() {
  let resolveFinished!: () => void;
  let rejectFinished!: () => void;

  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  return {
    animation: {
      finished,
      pending: false,
      playState: 'running',
    } as unknown as Animation,
    finish: resolveFinished,
    cancel: rejectFinished,
  };
}

interface TestProps {
  getAnimations: () => Animation[];
  onFinished: () => void;
  signal?: AbortSignal;
  batch?: boolean;
}

function Test({ getAnimations, onFinished, signal, batch }: TestProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(ref, false, batch);

  useIsoLayoutEffect(() => {
    if (ref.current) {
      ref.current.getAnimations = getAnimations;
    }
  }, [getAnimations]);

  React.useEffect(() => {
    runOnceAnimationsFinish(onFinished, signal ?? null);
  }, [onFinished, runOnceAnimationsFinish, signal]);

  return <div ref={ref} />;
}

describe('useAnimationsFinished', () => {
  const { render } = createRenderer();

  it('waits for a replacement animation after an animation is canceled', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const initialAnimation = createAnimation();
    const replacementAnimation = createAnimation();
    const onFinished = vi.fn();
    let animations: Animation[] = [initialAnimation.animation];
    let getAnimationsCallCount = 0;

    try {
      await render(
        <Test
          getAnimations={() => {
            getAnimationsCallCount += 1;
            return animations;
          }}
          onFinished={onFinished}
        />,
      );

      await waitFor(() => {
        expect(getAnimationsCallCount).toBeGreaterThan(0);
      });

      animations = [replacementAnimation.animation];

      await act(async () => {
        initialAnimation.cancel();
        await flushMicrotasks();
      });

      expect(onFinished).not.toHaveBeenCalled();

      animations = [];

      await act(async () => {
        replacementAnimation.finish();
        await flushMicrotasks();
      });

      expect(onFinished).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });

  it('finishes when a canceled animation has no replacement', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const initialAnimation = createAnimation();
    const onFinished = vi.fn();
    let animations: Animation[] = [initialAnimation.animation];
    let getAnimationsCallCount = 0;

    try {
      await render(
        <Test
          getAnimations={() => {
            getAnimationsCallCount += 1;
            return animations;
          }}
          onFinished={onFinished}
        />,
      );

      await waitFor(() => {
        expect(getAnimationsCallCount).toBeGreaterThan(0);
      });

      animations = [];

      await act(async () => {
        initialAnimation.cancel();
        await flushMicrotasks();
      });

      expect(onFinished).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });

  it('batches opted-in callbacks that finish in the same microtask into a single commit', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const first = createAnimation();
    const second = createAnimation();
    const getAnimationsCallCounts = [0, 0];
    let commitCount = 0;

    function Item({ index, animation }: { index: number; animation: Animation }) {
      const ref = React.useRef<HTMLDivElement>(null);
      const runOnceAnimationsFinish = useAnimationsFinished(ref, false, true);
      const [mounted, setMounted] = React.useState(true);

      useIsoLayoutEffect(() => {
        if (ref.current) {
          ref.current.getAnimations = () => {
            getAnimationsCallCounts[index] += 1;
            return [animation];
          };
        }
      });

      React.useEffect(() => {
        runOnceAnimationsFinish(() => setMounted(false));
      }, [runOnceAnimationsFinish]);

      return mounted ? <div data-testid={`item-${index}`} ref={ref} /> : null;
    }

    try {
      await render(
        <React.Profiler
          id="test"
          onRender={() => {
            commitCount += 1;
          }}
        >
          <Item index={0} animation={first.animation} />
          <Item index={1} animation={second.animation} />
        </React.Profiler>,
      );

      await waitFor(() => {
        expect(getAnimationsCallCounts[0]).toBeGreaterThan(0);
      });
      await waitFor(() => {
        expect(getAnimationsCallCounts[1]).toBeGreaterThan(0);
      });

      const commitCountBefore = commitCount;

      await act(async () => {
        first.finish();
        second.finish();
        await flushMicrotasks();
      });

      expect(screen.queryByTestId('item-0')).toBeNull();
      expect(screen.queryByTestId('item-1')).toBeNull();
      expect(commitCount).toBe(commitCountBefore + 1);
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });

  it('skips a callback whose signal aborts while the batch is flushing', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const first = createAnimation();
    const second = createAnimation();
    const secondController = new AbortController();
    const onFirstFinished = vi.fn(() => secondController.abort());
    const onSecondFinished = vi.fn();
    const firstGetAnimations = vi.fn(() => [first.animation]);
    const secondGetAnimations = vi.fn(() => [second.animation]);

    try {
      await render(
        <React.Fragment>
          <Test batch getAnimations={firstGetAnimations} onFinished={onFirstFinished} />
          <Test
            batch
            getAnimations={secondGetAnimations}
            onFinished={onSecondFinished}
            signal={secondController.signal}
          />
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(firstGetAnimations).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(secondGetAnimations).toHaveBeenCalled();
      });

      await act(async () => {
        first.finish();
        second.finish();
        await flushMicrotasks();
      });

      expect(onFirstFinished).toHaveBeenCalledTimes(1);
      expect(onSecondFinished).not.toHaveBeenCalled();
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });

  it('commits each callback separately by default so later callbacks observe earlier updates', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const first = createAnimation();
    const second = createAnimation();
    const firstGetAnimations = vi.fn(() => [first.animation]);
    const secondGetAnimations = vi.fn(() => [second.animation]);
    const onSecondUnmount = vi.fn();

    interface PopupProps {
      open: boolean;
      getAnimations: () => Animation[];
      onCloseComplete: () => void;
    }

    // Mirrors `useOpenChangeComplete`: the completion reads the latest `open` and only
    // unmounts while the popup is still closed.
    function Popup({ open, getAnimations, onCloseComplete }: PopupProps) {
      const ref = React.useRef<HTMLDivElement>(null);
      const runOnceAnimationsFinish = useAnimationsFinished(ref);

      const onComplete = useStableCallback(() => {
        if (!open) {
          onCloseComplete();
        }
      });

      useIsoLayoutEffect(() => {
        if (ref.current) {
          ref.current.getAnimations = getAnimations;
        }
      }, [getAnimations]);

      React.useEffect(() => {
        const abortController = new AbortController();
        runOnceAnimationsFinish(onComplete, abortController.signal);
        return () => abortController.abort();
      }, [open, onComplete, runOnceAnimationsFinish]);

      return <div ref={ref} />;
    }

    function App() {
      const [secondOpen, setSecondOpen] = React.useState(false);
      return (
        <React.Fragment>
          <Popup
            open={false}
            getAnimations={firstGetAnimations}
            onCloseComplete={() => setSecondOpen(true)}
          />
          <Popup
            open={secondOpen}
            getAnimations={secondGetAnimations}
            onCloseComplete={onSecondUnmount}
          />
        </React.Fragment>
      );
    }

    try {
      await render(<App />);

      await waitFor(() => {
        expect(firstGetAnimations).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(secondGetAnimations).toHaveBeenCalled();
      });

      // Both popups are closing. The first popup's close completion reopens the second,
      // which must prevent the second popup's queued completion from unmounting it.
      await act(async () => {
        first.finish();
        second.finish();
        await flushMicrotasks();
      });

      expect(onSecondUnmount).not.toHaveBeenCalled();
    } finally {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });
});
