import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  act,
  MuiRenderResult,
} from '@mui/internal-test-utils';

function safeAct(callback: () => void) {
  if (navigator.userAgent.includes('jsdom')) {
    return act(callback);
  }

  return callback();
}

interface Clock {
  /**
   * Runs all timers until there are no more remaining.
   * WARNING: This may cause an infinite loop if a timeout constantly schedules another timeout.
   * Prefer to to run only pending timers with `runToLast` and unmount your component directly.
   */
  runAll(): void;
  /**
   * Runs only the currently pending timers.
   */
  runToLast(): void;
  /**
   * Tick the clock ahead `timeoutMS` milliseconds.
   * @param timeoutMS
   */
  tick(timeoutMS: number): void;
  /**
   * Returns true if we're running with "real" i.e. native timers.
   */
  isReal(): boolean;
  /**
   * Runs the current test suite (i.e. `describe` block) with fake timers.
   */
  withFakeTimers(): void;
  /**
   * Restore the real timer
   */
  restore(): void;
}

// TODO: replace with Renderer from @mui/internal-test-utils once it's exported
interface CreateRendererResult {
  render: (element: React.ReactElement, options?: RenderOptions) => Promise<MuiRenderResult>;
  clock: Clock;
}

export function createRenderer(globalOptions?: CreateRendererOptions): CreateRendererResult {
  const createRendererResult = sharedCreateRenderer(globalOptions);
  const { render: originalRender } = createRendererResult;

  const render = async (element: React.ReactElement, options?: RenderOptions) => {
    const result = await originalRender(element, options);

    // flush microtasks
    await safeAct(() => async () => {});

    return result;
  };

  return {
    ...createRendererResult,
    render,
  };
}
