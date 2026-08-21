import * as React from 'react';
import { expect, vi, type Mock } from 'vitest';
import { createRenderer, act } from '@mui/internal-test-utils';
import { disposeSymbol } from './disposable';
import { useDisposable } from './useDisposable';

interface TestDisposable {
  dispose: Mock;
  [disposeSymbol](): void;
}

function createDisposable(): TestDisposable {
  const dispose = vi.fn();
  return {
    dispose,
    [disposeSymbol]() {
      this.dispose();
    },
  };
}

describe('useDisposable', () => {
  // `createRenderer().render` wraps the tree in `<React.StrictMode>` by default,
  // so the default render exercises the mount → unmount → mount replay.
  const { render } = createRenderer();

  // React 18 StrictMode resets a render-mutated ref between the two double-render
  // passes, so the factory runs an extra (throwaway) time; React 19 keeps it once.
  // Every behavioral difference between the two majors in these tests stems from
  // that one extra create, so the per-version expectations are grouped here.
  const expected = React.version.startsWith('19')
    ? {
        // No throwaway create.
        factoryCallCount: 1,
        createdCount: 2,
        // The committed instance is the first one created.
        committedIndex: 0,
      }
    : {
        // StrictMode adds one throwaway create up front.
        factoryCallCount: 2,
        createdCount: 3,
        // The throwaway sits at index 0, shifting the committed instance to 1.
        committedIndex: 1,
      };

  function setup() {
    let instance: TestDisposable | undefined;
    let effectMounts = 0;
    const factory = vi.fn(() => {
      instance = createDisposable();
      return instance;
    });
    function TestComponent() {
      useDisposable(factory);
      // Independent of `useDisposable`: counts real effect mounts so the tests
      // can assert the harness actually replayed the cycle (StrictMode) instead
      // of silently degrading to a single mount.
      React.useEffect(() => {
        effectMounts += 1;
      }, []);
      return null;
    }
    return {
      factory,
      getInstance: () => instance!,
      getEffectMounts: () => effectMounts,
      TestComponent,
    };
  }

  it('survives the StrictMode double mount and disposes once on the real unmount', () => {
    const { factory, getInstance, getEffectMounts, TestComponent } = setup();

    const { unmount } = render(<TestComponent />);

    // Guard the test itself: StrictMode must have replayed the mount cycle,
    // otherwise the assertions below wouldn't actually cover the double mount.
    expect(getEffectMounts()).toBe(2);
    // The committed instance survives the cycle (React 18 adds a throwaway create).
    expect(factory).toHaveBeenCalledTimes(expected.factoryCallCount);
    // ...and the simulated unmount does not dispose the committed instance.
    expect(getInstance().dispose).toHaveBeenCalledTimes(0);

    unmount();

    // The real unmount disposes exactly once, even inside `<StrictMode>`.
    expect(getInstance().dispose).toHaveBeenCalledTimes(1);
  });

  it('creates the instance once and disposes it on unmount (without StrictMode)', () => {
    const { factory, getInstance, getEffectMounts, TestComponent } = setup();

    const { unmount } = render(<TestComponent />, { strict: false });

    // No replay: a single mount, so the skip-the-simulated-unmount branch is
    // never taken.
    expect(getEffectMounts()).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(getInstance().dispose).toHaveBeenCalledTimes(0);

    unmount();

    expect(getInstance().dispose).toHaveBeenCalledTimes(1);
  });

  // Why this hook detects StrictMode instead of just disposing + recreating the
  // instance on every unmount (the simpler "null the ref on cleanup, rebuild it
  // on the next mount" shape). Recreation works for a remount that RE-RENDERS
  // first (e.g. `<Activity>` reveal), but StrictMode replays effects with NO
  // re-render between the simulated unmount and the remount, so the render-body
  // factory never re-runs inside the cycle — the component stays committed
  // against the instance it rendered with, which the cleanup has just disposed.
  it('should commit against a disposed instance if the hook recreated on remount instead of detecting StrictMode', () => {
    const timeline: string[] = [];
    const created: TestDisposable[] = [];
    let committedInstance: TestDisposable | undefined;

    // The proposed alternative shape, verbatim: rebuild in the effect, null on cleanup.
    function useDisposableRecreate(factory: () => TestDisposable): TestDisposable {
      const ref = React.useRef<TestDisposable | null>(null);
      if (ref.current === null) {
        ref.current = factory();
      }
      React.useEffect(() => {
        if (ref.current === null) {
          ref.current = factory();
        }
        timeline.push('mount');
        return () => {
          timeline.push('cleanup');
          ref.current![disposeSymbol]();
          ref.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return ref.current;
    }

    function TestComponent() {
      timeline.push('render');
      committedInstance = useDisposableRecreate(() => {
        const inst = createDisposable();
        created.push(inst);
        return inst;
      });
      return null;
    }

    const { unmount } = render(<TestComponent />); // StrictMode by default.

    // Root cause: React goes straight from the simulated unmount to the remount
    // with no render in between, so the `ref.current === null` rebuild in the
    // render body can never fire inside the StrictMode cycle.
    const cleanupIndex = timeline.indexOf('cleanup');
    expect(cleanupIndex).toBeGreaterThan(-1);
    expect(timeline[cleanupIndex + 1]).toBe('mount');
    expect(timeline.slice(0, cleanupIndex + 2)).toEqual([
      'render',
      'render',
      'mount',
      'cleanup',
      'mount',
    ]);

    // Consequence: the component is committed against an instance the cleanup
    // disposed. React 18's throwaway create sits at index 0, shifting committed to 1.
    expect(created).toHaveLength(expected.createdCount);
    expect(committedInstance).toBe(created[expected.committedIndex]);
    expect(created[expected.committedIndex].dispose).toHaveBeenCalledTimes(1);
    // The live, non-disposed instance is the last one, rebuilt in the remount
    // effect — the component never re-rendered to pick it up (split-brain).
    const live = created[created.length - 1];
    expect(live).not.toBe(committedInstance);
    expect(live.dispose).toHaveBeenCalledTimes(0);

    unmount();
  });

  // The flip side of the test above, and why detection (not recreation) is the
  // right call: a real fiber-preserving remount DOES re-render. `<Activity>`
  // hides by running the cleanup and then re-rendering the (hidden) subtree, so
  // the `ref.current = UNINITIALIZED` reset lets the render-body factory rebuild
  // a fresh instance the component is committed against — exactly what the
  // recreation strategy cannot do inside StrictMode's re-render-less replay.
  // `React.Activity` is React 19+, so this is skipped on the React 18 CI job.
  const ReactActivity = (React as { Activity?: React.ElementType }).Activity;
  const itActivity = ReactActivity ? it : it.skip;

  itActivity('rebuilds a fresh, live instance across an <Activity> hide/reveal', () => {
    const Activity = ReactActivity!;
    const created: TestDisposable[] = [];
    let committed: TestDisposable | undefined;
    let setMode: (mode: 'visible' | 'hidden') => void = () => {};

    function Child() {
      committed = useDisposable(() => {
        const inst = createDisposable();
        created.push(inst);
        return inst;
      });
      return null;
    }

    function App() {
      const [mode, setModeState] = React.useState<'visible' | 'hidden'>('visible');
      setMode = setModeState;
      return (
        <Activity mode={mode}>
          <Child />
        </Activity>
      );
    }

    // `strict: false` to isolate the Activity cycle from the StrictMode replay.
    render(<App />, { strict: false });
    expect(created).toHaveLength(1);
    const first = created[0];
    expect(first.dispose).toHaveBeenCalledTimes(0);

    // Hiding disconnects effects: the cleanup disposes the instance and clears
    // the ref.
    act(() => setMode('hidden'));
    expect(first.dispose).toHaveBeenCalledTimes(1);

    // Revealing re-renders before re-running effects, so the component is
    // committed against a fresh, never-disposed instance — not the torn-down one.
    act(() => setMode('visible'));
    expect(created.length).toBeGreaterThan(1);
    expect(committed).toBe(created[created.length - 1]);
    expect(committed!.dispose).toHaveBeenCalledTimes(0);
  });
});
