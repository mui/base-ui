import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  waitFor,
  act,
  MuiRenderResult,
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

    // flush microtasks
    await waitFor(async () => {});

    return result;
  };

  return {
    ...createRendererResult,
    render,
  };
}
