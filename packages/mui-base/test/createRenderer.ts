import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  act,
  MuiRenderResult,
  waitFor,
} from '@mui/internal-test-utils';

export function createRenderer(globalOptions?: CreateRendererOptions) {
  const createRendererResult = sharedCreateRenderer(globalOptions);
  const { render: originalRender } = createRendererResult;

  const render = async (element: React.ReactElement, options?: RenderOptions) => {
    let result: MuiRenderResult;

    if (navigator.userAgent.includes('jsdom')) {
      result = await act(() => originalRender(element, options));
    } else {
      result = await originalRender(element, options);
    }

    // Flush microtasks and animation frames
    await waitFor(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    return result;
  };

  return {
    ...createRendererResult,
    render,
  };
}
