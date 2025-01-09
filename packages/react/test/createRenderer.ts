import {
  CreateRendererOptions,
  RenderOptions,
  createRenderer as sharedCreateRenderer,
  flushMicrotasks,
  Renderer,
  MuiRenderResult,
  act,
} from '@mui/internal-test-utils';
import { type UserEvent as VitestUserEvent } from '@vitest/browser/context';
import { type UserEvent as RtlUserEvent } from '@testing-library/user-event';
import { isJSDOM } from './utils';

export type BaseUIRenderResult = Omit<MuiRenderResult, 'user'> & {
  user: VitestUserEvent | RtlUserEvent;
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
    const renderResult = await act(async () => {
      const result = await originalRender(element, options);
      await flushMicrotasks();
      return result;
    });

    if (!isJSDOM) {
      const { userEvent: vitestUserEvent } = await import('@vitest/browser/context');

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

      const patchedUser = new Proxy(originalUser, proxyHandler);

      return {
        ...renderResult,
        user: patchedUser,
      };
    }

    return renderResult;
  };

  return {
    ...createRendererResult,
    render,
  };
}
