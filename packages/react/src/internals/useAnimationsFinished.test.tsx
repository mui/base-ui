import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
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
}

function Test({ getAnimations, onFinished }: TestProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(ref);

  useIsoLayoutEffect(() => {
    if (ref.current) {
      ref.current.getAnimations = getAnimations;
    }
  }, [getAnimations]);

  React.useEffect(() => {
    runOnceAnimationsFinish(onFinished);
  }, [onFinished, runOnceAnimationsFinish]);

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

  it('batches callbacks that finish in the same microtask into a single commit', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const first = createAnimation();
    const second = createAnimation();
    const getAnimationsCallCounts = [0, 0];
    let commitCount = 0;

    function Item({ index, animation }: { index: number; animation: Animation }) {
      const ref = React.useRef<HTMLDivElement>(null);
      const runOnceAnimationsFinish = useAnimationsFinished(ref);
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

  it('runs every batched callback when one throws', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const first = createAnimation();
    const second = createAnimation();
    const error = new Error('test');
    const onSecondFinished = vi.fn();
    const firstGetAnimations = vi.fn(() => [first.animation]);
    const secondGetAnimations = vi.fn(() => [second.animation]);
    let flushQueuedCallbacks: VoidFunction | undefined;

    try {
      await render(
        <React.Fragment>
          <Test
            getAnimations={firstGetAnimations}
            onFinished={() => {
              throw error;
            }}
          />
          <Test getAnimations={secondGetAnimations} onFinished={onSecondFinished} />
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(firstGetAnimations).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(secondGetAnimations).toHaveBeenCalled();
      });

      vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
        flushQueuedCallbacks = callback;
      });

      await act(async () => {
        first.finish();
        second.finish();
        await flushMicrotasks();
      });

      expect(flushQueuedCallbacks).not.toBeUndefined();
      expect(() => flushQueuedCallbacks!()).toThrow(error);
      expect(onSecondFinished).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
      globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
    }
  });
});
