import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRenderer, createCommitPhases } from '#test-utils';

describe('createCommitPhases', () => {
  const { render } = createRenderer({ strict: false });

  it('records a single commit for a static tree', async () => {
    const phases = createCommitPhases();

    await render(phases.wrap(<div />));

    expect(phases.get()).toEqual(['mount']);
  });

  it('records an update when an effect commits a state change', async () => {
    function Test() {
      const [value, setValue] = React.useState(0);

      React.useEffect(() => {
        setValue(1);
      }, []);

      return <div>{value}</div>;
    }

    const phases = createCommitPhases();

    await render(phases.wrap(<Test />));

    expect(phases.get()).toEqual(['mount', 'update']);
  });

  it('waits for a commit scheduled a frame after mount', async () => {
    function Test() {
      const [value, setValue] = React.useState(0);

      React.useEffect(() => {
        const frame = requestAnimationFrame(() => setValue(1));
        return () => cancelAnimationFrame(frame);
      }, []);

      return <div>{value}</div>;
    }

    const phases = createCommitPhases();

    await render(phases.wrap(<Test />));
    // Without the wait this commit lands after the assertion on most runs.
    await phases.waitForQuiescence();

    expect(phases.get()).toEqual(['mount', 'update']);
  });

  it('drops previously recorded phases on reset', async () => {
    const phases = createCommitPhases();

    await render(phases.wrap(<div />));
    phases.reset();

    expect(phases.get()).toEqual([]);
  });
});
