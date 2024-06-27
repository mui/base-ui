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

export function createRenderer(globalOptions?: CreateRendererOptions): {
  // TODO: replace with Renderer from @mui/internal-test-utils once it's exported
  render: (element: React.ReactElement, options?: RenderOptions) => Promise<MuiRenderResult>;
} {
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
