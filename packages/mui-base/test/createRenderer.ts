import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  act,
} from '@mui/internal-test-utils';

function safeAct(callback: () => void) {
  if (navigator.userAgent.includes('jsdom')) {
    return act(callback);
  }

  return callback();
}

export function createRenderer(globalOptions?: CreateRendererOptions) {
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
