import * as React from 'react';
import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  flushMicrotasks,
  Renderer,
  MuiRenderResult,
  act,
} from '@mui/internal-test-utils';

export type BaseUIRenderResult = Omit<MuiRenderResult, 'rerender' | 'setProps'> & {
  rerender: (newElement: React.ReactElement<DataAttributes>) => Promise<void>;
  setProps: (newProps: object) => Promise<void>;
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

      async function rerender(newElement: React.ReactElement<DataAttributes>) {
        await act(async () => result.rerender(newElement));
        await flushMicrotasks();
      }

      async function setProps(newProps: object) {
        await rerender(React.cloneElement(element, newProps));
        await flushMicrotasks();
      }

      return {
        ...result,
        rerender,
        setProps,
      };
    });

  return {
    ...createRendererResult,
    render,
  };
}
