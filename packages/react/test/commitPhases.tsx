import * as React from 'react';
import { act, flushMicrotasks } from '@mui/internal-test-utils';
import { waitSingleFrame } from './wait';

export type CommitPhase = 'mount' | 'update' | 'nested-update';

/**
 * Records the React commit phases of a subtree.
 *
 * `React.Profiler` fires once per commit of the wrapped tree, so this counts commits rather than
 * individual component renders: it catches effect-driven re-render cascades and extra commits per
 * interaction, but not how many components re-rendered within a single commit.
 *
 * Wrap the scenario with `wrap()`, then snapshot `get()`:
 *
 * ```tsx
 * const phases = createCommitPhases();
 * await render(phases.wrap(<Scenario />));
 * expect(phases.get()).toMatchInlineSnapshot();
 * ```
 *
 * Not every tree can be snapshotted this way. A part that re-renders itself from a
 * `ResizeObserver` callback commits a number of times that depends on how the layout settles and
 * on machine load, so no amount of waiting makes it reproducible. `Tabs.Indicator` and
 * `ScrollArea`'s scrollbars both behave that way. Measure a scenario over repeated runs before
 * committing its snapshot, and leave such parts out rather than weakening the assertion.
 *
 * Recorded sequences are also specific to one React version, and the legacy React workflow re-runs
 * this whole suite against React 18, so gate a scenario with
 * `describe.skipIf(isJSDOM || reactMajor < 19)`.
 */
export function createCommitPhases() {
  const phases: CommitPhase[] = [];

  return {
    wrap(children: React.ReactNode) {
      return (
        <React.Profiler
          id="commit-phases"
          onRender={(_id, phase) => {
            phases.push(phase);
          }}
        >
          {children}
        </React.Profiler>
      );
    },
    /**
     * The phases recorded so far, oldest first.
     */
    get() {
      return phases.slice();
    },
    /**
     * Drops everything recorded so far, to isolate an interaction from the initial mount.
     */
    reset() {
      phases.length = 0;
    },
    /**
     * Waits until the tree stops committing.
     *
     * Mounting can schedule follow-up work that lands one or more frames later, such as a
     * `ResizeObserver` callback forcing a rerender. Whether that commit arrives before the
     * assertion runs is a matter of timing, so without this the snapshot records however much of
     * the work happened to land in time and varies between runs. Waiting for quiescence makes a
     * snapshot mean "the commits this scenario settles into", which is both stable and the number
     * worth guarding.
     */
    async waitForQuiescence(idleFrames = 12) {
      let idle = 0;

      while (idle < idleFrames) {
        const before = phases.length;
        // eslint-disable-next-line no-await-in-loop
        await act(async () => {
          await waitSingleFrame();
          await flushMicrotasks();
        });
        idle = phases.length === before ? idle + 1 : 0;
      }
    },
  };
}
