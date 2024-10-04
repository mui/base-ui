import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  flushMicrotasks,
  Renderer,
  MuiRenderResult,
  act,
} from '@mui/internal-test-utils';

type BaseUITestRenderer = Omit<Renderer, 'render'> & {
  render: (
    element: React.ReactElement<unknown>,
    options?: RenderOptions,
  ) => Promise<MuiRenderResult>;
};

export function createRenderer(globalOptions?: CreateRendererOptions): BaseUITestRenderer {
  const createRendererResult = sharedCreateRenderer(globalOptions);
  const { render: originalRender } = createRendererResult;

  const render = async (element: React.ReactElement<unknown>, options?: RenderOptions) =>
    act(async () => {
      const result = await originalRender(element, options);
      await flushMicrotasks();
      return result;
    });

  return {
    ...createRendererResult,
    render,
  };
}
