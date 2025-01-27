import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  flushMicrotasks,
  Renderer,
  MuiRenderResult,
  act,
} from '@mui/internal-test-utils';

type BaseUIRenderResult = Omit<MuiRenderResult, 'rerender'> & {
  rerender: (newElement: React.ReactElement<DataAttributes>) => Promise<void>;
};

type BaseUITestRenderer = Omit<Renderer, 'render'> & {
  render: (
    element: React.ReactElement<DataAttributes>,
    options?: RenderOptions,
  ) => Promise<BaseUIRenderResult>;
};

interface DataAttributes {
  [key: `data-${string}`]: string;
}

export function createRenderer(globalOptions?: CreateRendererOptions): BaseUITestRenderer {
  const createRendererResult = sharedCreateRenderer(globalOptions);
  const { render: originalRender } = createRendererResult;

  const render = async (element: React.ReactElement<DataAttributes>, options?: RenderOptions) =>
    act(async () => {
      const result = await originalRender(element, options);
      await flushMicrotasks();
      return {
        ...result,
        rerender: async (newElement: React.ReactElement<DataAttributes>) => {
          await act(async () => result.rerender(newElement));
          await flushMicrotasks();
        },
      };
    });

  return {
    ...createRendererResult,
    render,
  };
}
