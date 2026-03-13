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
import { isJSDOM } from '@base-ui/utils/testUtils';

export type BaseUIRenderResult = Omit<MuiRenderResult, 'user' | 'rerender' | 'setProps'> & {
  user: MuiRenderResult['user'];
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

  const render = async (element: React.ReactElement<DataAttributes>, options?: RenderOptions) => {
    const result = await act(async () => {
      const renderResult = await originalRender(element, options);
      await flushMicrotasks();
      return renderResult;
    });

    async function rerender(newElement: React.ReactElement<DataAttributes>) {
      await act(async () => result.rerender(newElement));
    }

    async function setProps(newProps: object) {
      await rerender(React.cloneElement(element, newProps));
    }

    if (!isJSDOM) {
      const { userEvent: vitestUserEvent } = await import('vitest/browser');
      const originalUser = vitestUserEvent.setup();

      const proxyHandler: ProxyHandler<any> = {
        get: (target, prop) => {
          if (typeof target[prop] !== 'function') {
            return target[prop];
          }

          return async (...args: unknown[]) => {
            await act(async () => target[prop](...args));
          };
        },
      };

      return {
        ...result,
        user: new Proxy(originalUser, proxyHandler) as MuiRenderResult['user'],
        rerender,
        setProps,
      };
    }

    return { ...result, rerender, setProps };
  };

  return {
    ...createRendererResult,
    render,
  };
}
