import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
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
});
