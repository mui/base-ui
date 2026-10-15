import { afterEach, beforeEach, expect, vi, describe, it, onTestFinished } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { createRenderer, isJSDOM } from '#test-utils';
import { useAnimationsFinished } from './useAnimationsFinished';

const mockedAnimations = new Map<Element, () => Animation[]>();

afterEach(() => {
  mockedAnimations.clear();
  Reflect.deleteProperty(document, 'getAnimations');
});

/**
 * Mocks the element's animations. Elements checked in the same frame can be looked up through
 * `document.getAnimations()`, so it returns the mocked animations too.
 */
function mockAnimations(element: Element, getAnimations: () => Animation[]) {
  element.getAnimations = getAnimations;
  mockedAnimations.set(element, getAnimations);
  document.getAnimations = () =>
    Array.from(mockedAnimations, ([target, getTargetAnimations]) =>
      getTargetAnimations().map(
        (animation) =>
          ({ ...animation, effect: { ...animation.effect, target } }) as unknown as Animation,
      ),
    ).flat();
}

function createAnimation(iterations = 1, duration = 1) {
  let resolveFinished!: () => void;
  let rejectFinished!: () => void;

  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  return {
    animation: {
      finished,
      effect: { getTiming: () => ({ duration, iterations }) },
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
      mockAnimations(ref.current, getAnimations);
    }
  }, [getAnimations]);

  React.useEffect(() => {
    runOnceAnimationsFinish(onFinished, signal ?? null);
  }, [onFinished, runOnceAnimationsFinish, signal]);

  return <div ref={ref} />;
}

describe('useAnimationsFinished', () => {
  const { render } = createRenderer();

  it.each(['finish', 'cancel'] as const)(
    'ignores infinite animations when a finite animation completes via %s',
    async (completion) => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const finite = createAnimation();
      const infinite = createAnimation(Infinity);
      const onFinished = vi.fn();
      let animations = [finite.animation, infinite.animation];
      const getAnimations = vi.fn(() => animations);

      try {
        await render(<Test getAnimations={getAnimations} onFinished={onFinished} />);
        await waitFor(() => expect(getAnimations).toHaveBeenCalled());
        expect(onFinished).not.toHaveBeenCalled();

        animations = [infinite.animation];
        await act(async () => {
          finite[completion]();
          await flushMicrotasks();
        });

        expect(onFinished).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

  it.each([
    ['iteration count', Infinity, 1],
    ['duration', 1, Infinity],
  ] as const)(
    'finishes when the element only has an animation with an infinite %s',
    async (_timing, iterations, duration) => {
      const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      const infinite = createAnimation(iterations, duration);
      const onFinished = vi.fn();

      try {
        await render(<Test getAnimations={() => [infinite.animation]} onFinished={onFinished} />);
        await waitFor(() => expect(onFinished).toHaveBeenCalledTimes(1));
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
      }
    },
  );

  it('waits for a replacement animation after an animation is canceled', async () => {
    const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const initialAnimation = createAnimation();
    const replacementAnimation = createAnimation();
    const infiniteAnimation = createAnimation(Infinity);
    const onFinished = vi.fn();
    let animations: Animation[] = [initialAnimation.animation, infiniteAnimation.animation];
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

      animations = [replacementAnimation.animation, infiniteAnimation.animation];

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
          mockAnimations(ref.current, () => {
            getAnimationsCallCounts[index] += 1;
            return [animation];
          });
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
          mockAnimations(ref.current, getAnimations);
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

  describe.skipIf(isJSDOM)('elements checked in the same frame', () => {
    const FADE: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];

    interface WatchedElement {
      onFinished: () => void;
      animate?: ((element: HTMLElement) => Animation | Animation[]) | undefined;
      signal?: AbortSignal | undefined;
    }

    function Watched({ onFinished, animate, signal }: WatchedElement) {
      const ref = React.useRef<HTMLDivElement>(null);
      const runOnceAnimationsFinish = useAnimationsFinished(ref);

      useIsoLayoutEffect(() => {
        const animations = [animate?.(ref.current!) ?? []].flat();
        return () => animations.forEach((animation) => animation.cancel());
      }, [animate]);

      React.useEffect(() => {
        runOnceAnimationsFinish(onFinished, signal ?? null);
      }, [onFinished, runOnceAnimationsFinish, signal]);

      return <div ref={ref} />;
    }

    function createWatchedElements(timings: Array<KeyframeAnimationOptions | null>) {
      const animations: Animation[] = [];
      const elements: WatchedElement[] = timings.map((timing, index) => ({
        onFinished: vi.fn(),
        animate: timing
          ? (element: HTMLElement) => {
              animations[index] = element.animate(FADE, timing);
              return animations[index];
            }
          : undefined,
      }));
      return { animations, elements };
    }

    function renderWatched(elements: WatchedElement[]) {
      return (
        <React.Fragment>
          {elements.map((element, index) => (
            <Watched key={index} {...element} />
          ))}
        </React.Fragment>
      );
    }

    function spyOnLookups() {
      const getDocumentAnimations = vi.spyOn(document, 'getAnimations');
      const getElementAnimations = vi.spyOn(Element.prototype, 'getAnimations');
      onTestFinished(() => {
        getDocumentAnimations.mockRestore();
        getElementAnimations.mockRestore();
      });
      return { getDocumentAnimations, getElementAnimations };
    }

    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    it('serves the other elements of the tree with one root lookup once one has animations', async () => {
      const { getDocumentAnimations, getElementAnimations } = spyOnLookups();

      const { animations, elements } = createWatchedElements([
        { duration: 1000, iterations: Infinity },
        { duration: 10_000 },
        { duration: 10_000 },
      ]);
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(getDocumentAnimations).toHaveBeenCalledTimes(1);
      });
      expect(getElementAnimations).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(elements[0].onFinished).toHaveBeenCalledTimes(1);
      });
      expect(elements[1].onFinished).not.toHaveBeenCalled();
      expect(elements[2].onFinished).not.toHaveBeenCalled();

      await act(async () => {
        animations[2].finish();
        await flushMicrotasks();
      });

      expect(elements[2].onFinished).toHaveBeenCalledTimes(1);
      expect(elements[1].onFinished).not.toHaveBeenCalled();
    });

    it('ignores animations of pseudo-elements in the root lookup', async () => {
      const { getDocumentAnimations } = spyOnLookups();

      const { elements } = createWatchedElements([
        { duration: 10_000 },
        { duration: 10_000, pseudoElement: '::after' },
        null,
      ]);
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(elements[1].onFinished).toHaveBeenCalledTimes(1);
      });
      expect(getDocumentAnimations).toHaveBeenCalledTimes(1);
      expect(elements[0].onFinished).not.toHaveBeenCalled();
    });

    it.each([
      { name: 'no animations', timing: null },
      {
        name: 'only pseudo-element animations',
        timing: { duration: 10_000, pseudoElement: '::after' },
      },
    ])('looks up each element on its own when they have $name', async ({ timing }) => {
      const { getDocumentAnimations } = spyOnLookups();

      const { elements } = createWatchedElements([timing, timing, timing]);
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(elements[2].onFinished).toHaveBeenCalledTimes(1);
      });
      expect(elements[0].onFinished).toHaveBeenCalledTimes(1);
      expect(elements[1].onFinished).toHaveBeenCalledTimes(1);
      expect(getDocumentAnimations).not.toHaveBeenCalled();
    });

    it('waits for every animation of an element served by the root lookup', async () => {
      const { getDocumentAnimations } = spyOnLookups();
      let firstAnimation: Animation;
      let secondAnimation: Animation;
      const { elements } = createWatchedElements([{ duration: 10_000 }, null, null]);
      elements[1].animate = (element) => {
        firstAnimation = element.animate(FADE, 10_000);
        secondAnimation = element.animate(FADE, 10_000);
        return [firstAnimation, secondAnimation];
      };
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(getDocumentAnimations).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        secondAnimation!.finish();
        await flushMicrotasks();
      });
      expect(elements[1].onFinished).not.toHaveBeenCalled();

      await act(async () => {
        firstAnimation!.finish();
        await flushMicrotasks();
      });
      expect(elements[1].onFinished).toHaveBeenCalledTimes(1);
    });

    it.each([
      { name: 'a single animated element', timings: [{ duration: 10_000 }] },
      {
        name: 'two animated elements',
        timings: [{ duration: 10_000 }, { duration: 10_000 }],
      },
      {
        name: 'an animated element followed by a nonanimated element',
        timings: [{ duration: 10_000 }, null],
      },
      {
        name: 'a nonanimated element followed by an animated element',
        timings: [null, { duration: 10_000 }],
      },
    ])('looks up $name individually without scanning the root', async ({ timings }) => {
      const { getDocumentAnimations, getElementAnimations } = spyOnLookups();

      const { animations, elements } = createWatchedElements(timings);
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(getElementAnimations).toHaveBeenCalledTimes(elements.length);
      });
      expect(getDocumentAnimations).not.toHaveBeenCalled();
      const animatedIndex = timings.findIndex((timing) => timing !== null);
      expect(elements[animatedIndex].onFinished).not.toHaveBeenCalled();

      await act(async () => {
        animations.forEach((animation) => animation.finish());
        await flushMicrotasks();
      });

      expect(elements[0].onFinished).toHaveBeenCalledTimes(1);
      expect(elements.at(-1)!.onFinished).toHaveBeenCalledTimes(1);
    });

    it('deduplicates lookups of two distinct elements without scanning the root', async () => {
      const { getDocumentAnimations, getElementAnimations } = spyOnLookups();
      const onFirstFinished = vi.fn();
      const onSecondFinished = vi.fn();
      const { elements } = createWatchedElements([null]);
      let animation: Animation | undefined;

      function TwiceWatched() {
        const ref = React.useRef<HTMLDivElement>(null);
        const runFirst = useAnimationsFinished(ref);
        const runSecond = useAnimationsFinished(ref);

        useIsoLayoutEffect(() => {
          const currentAnimation = ref.current!.animate(FADE, { duration: 10_000 });
          animation = currentAnimation;
          return () => currentAnimation.cancel();
        }, []);

        React.useEffect(() => {
          runFirst(onFirstFinished);
          runSecond(onSecondFinished);
        }, [runFirst, runSecond]);

        return <div ref={ref} />;
      }

      await render(
        <React.Fragment>
          <TwiceWatched />
          {renderWatched(elements)}
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(elements[0].onFinished).toHaveBeenCalledTimes(1);
      });
      expect(getElementAnimations).toHaveBeenCalledTimes(2);
      expect(getDocumentAnimations).not.toHaveBeenCalled();
      expect(onFirstFinished).not.toHaveBeenCalled();
      expect(onSecondFinished).not.toHaveBeenCalled();

      await act(async () => {
        animation!.finish();
        await flushMicrotasks();
      });

      expect(onFirstFinished).toHaveBeenCalledTimes(1);
      expect(onSecondFinished).toHaveBeenCalledTimes(1);
    });

    it('skips the callback of an aborted element that was looked up with others', async () => {
      const { getDocumentAnimations } = spyOnLookups();
      const abortController = new AbortController();
      const { animations, elements } = createWatchedElements([
        { duration: 10_000 },
        { duration: 10_000 },
        { duration: 10_000 },
      ]);
      elements[1] = { ...elements[1], signal: abortController.signal };
      await render(renderWatched(elements));

      await waitFor(() => {
        expect(getDocumentAnimations).toHaveBeenCalledTimes(1);
      });
      abortController.abort();

      await act(async () => {
        animations.forEach((animation) => animation.finish());
        await flushMicrotasks();
      });

      expect(elements[0].onFinished).toHaveBeenCalledTimes(1);
      expect(elements[1].onFinished).not.toHaveBeenCalled();
      expect(elements[2].onFinished).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        name: 'a shadow root',
        createContainer() {
          const host = document.createElement('div');
          document.body.append(host);
          return { container: host.attachShadow({ mode: 'open' }), remove: () => host.remove() };
        },
      },
      {
        name: 'an iframe',
        createContainer() {
          const iframe = document.createElement('iframe');
          document.body.append(iframe);
          return { container: iframe.contentDocument!.body, remove: () => iframe.remove() };
        },
      },
    ])('looks up elements in $name through their own root', async ({ createContainer }) => {
      const { container, remove } = createContainer();
      const root = container.getRootNode() as Document | ShadowRoot;
      const getRootAnimations = vi.spyOn(root, 'getAnimations');
      const { getDocumentAnimations } = spyOnLookups();
      onTestFinished(remove);

      const { animations, elements } = createWatchedElements([
        { duration: 10_000 },
        { duration: 10_000 },
        { duration: 10_000 },
      ]);
      await render(
        <React.Fragment>
          {ReactDOM.createPortal(renderWatched(elements), container)}
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(getRootAnimations).toHaveBeenCalledTimes(1);
      });
      expect(getDocumentAnimations).not.toHaveBeenCalled();
      await act(async () => {
        await flushMicrotasks();
      });
      expect(elements[0].onFinished).not.toHaveBeenCalled();
      expect(elements[1].onFinished).not.toHaveBeenCalled();

      await act(async () => {
        animations[1].finish();
        await flushMicrotasks();
      });

      expect(elements[1].onFinished).toHaveBeenCalledTimes(1);
      expect(elements[0].onFinished).not.toHaveBeenCalled();
    });
  });
});
