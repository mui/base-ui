import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Trigger /> (detached)', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  it('opens fullscreen when a detached trigger is clicked', async () => {
    const handle = Fullscreen.createHandle();

    function App() {
      return (
        <React.Fragment>
          <Fullscreen.Trigger handle={handle}>Toggle</Fullscreen.Trigger>
          <Fullscreen.Root handle={handle}>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    const container = screen.getByTestId('container');

    expect(trigger).toHaveAttribute('aria-controls', container.getAttribute('id'));
    expect(trigger).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(trigger);
    await flushMicrotasks();

    expect(stubs.request).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute('aria-pressed', 'true');
    expect(trigger).toHaveAttribute('data-fullscreen');
    expect(container).toHaveAttribute('data-fullscreen');

    fireEvent.click(trigger);
    await flushMicrotasks();

    expect(stubs.exit).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute('aria-pressed', 'false');
    expect(container).toHaveAttribute('data-not-fullscreen');
  });

  it('marks only the active trigger with `data-fullscreen` when multiple detached triggers share a handle', async () => {
    const handle = Fullscreen.createHandle();

    function App() {
      return (
        <React.Fragment>
          <Fullscreen.Trigger handle={handle} id="trigger-a">
            Trigger A
          </Fullscreen.Trigger>
          <Fullscreen.Trigger handle={handle} id="trigger-b">
            Trigger B
          </Fullscreen.Trigger>
          <Fullscreen.Root handle={handle}>
            <Fullscreen.Container />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    const triggerA = screen.getByRole('button', { name: 'Trigger A' });
    const triggerB = screen.getByRole('button', { name: 'Trigger B' });

    fireEvent.click(triggerA);
    await flushMicrotasks();

    expect(triggerA).toHaveAttribute('data-fullscreen');
    expect(triggerA).toHaveAttribute('aria-pressed', 'true');
    expect(triggerB).toHaveAttribute('data-not-fullscreen');
    expect(triggerB).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens fullscreen via `handle.open(triggerId)` and marks the corresponding trigger as active', async () => {
    const handle = Fullscreen.createHandle();

    function App() {
      return (
        <React.Fragment>
          <Fullscreen.Trigger handle={handle} id="trigger-a">
            Trigger A
          </Fullscreen.Trigger>
          <Fullscreen.Trigger handle={handle} id="trigger-b">
            Trigger B
          </Fullscreen.Trigger>
          <button type="button" onClick={() => handle.open('trigger-b')}>
            Imperative open via B
          </button>
          <Fullscreen.Root handle={handle}>
            <Fullscreen.Container />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    const triggerA = screen.getByRole('button', { name: 'Trigger A' });
    const triggerB = screen.getByRole('button', { name: 'Trigger B' });

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open via B' }));
    await flushMicrotasks();

    expect(triggerB).toHaveAttribute('data-fullscreen');
    expect(triggerB).toHaveAttribute('aria-pressed', 'true');
    expect(triggerA).toHaveAttribute('data-not-fullscreen');
    expect(triggerA).toHaveAttribute('aria-pressed', 'false');
  });

  it('throws when used without a handle and outside <Fullscreen.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let caught: unknown = null;

    class Boundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
      state = { error: null };

      static getDerivedStateFromError(error: unknown) {
        caught = error;
        return { error };
      }

      render() {
        return this.state.error ? null : this.props.children;
      }
    }

    await render(
      <Boundary>
        <Fullscreen.Trigger>Detached</Fullscreen.Trigger>
      </Boundary>,
    );

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/<Fullscreen\.Trigger>/);

    errorSpy.mockRestore();
  });
});
