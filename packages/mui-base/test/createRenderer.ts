import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  act,
} from '@mui/internal-test-utils';

export function createRenderer(globalOptions?: CreateRendererOptions) {
  const createRendererResult = sharedCreateRenderer(globalOptions);
  const { render: originalRender } = createRendererResult;

  const render = async (element: React.ReactElement, options?: RenderOptions) => {
    const result = originalRender(element, options);

    // Wait for async tasks.
    await act(async () => {
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
