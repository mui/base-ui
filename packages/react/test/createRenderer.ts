import * as React from 'react';
import { onTestFinished } from 'vitest';
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
import type { UserEvent as VitestUserEvent } from 'vitest/browser';

// In browser mode `user` is Vitest's browser `userEvent`, which the proxy below augments with
// Testing Library's `userEvent` as a fallback for methods Vitest doesn't implement (e.g. `pointer`).
// The intersection exposes both APIs so tests can use Vitest-specific options (such as `click`
// options) as well as the Testing Library methods used in JSDOM.
type BaseUIUserEvent = MuiRenderResult['user'] & VitestUserEvent;

export type BaseUIRenderResult = Omit<MuiRenderResult, 'user' | 'rerender' | 'setProps'> & {
  user: BaseUIUserEvent;
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
      // Vitest drives the real browser keyboard, whose pressed-key state persists across
      // `userEvent` instances (unlike Testing Library, which isolates it per test). A test that
      // holds a modifier without releasing it (e.g. `keyboard('{Shift>}{ArrowDown}')`) would
      // otherwise leak that modifier into later tests. Releasing it when the test finishes
      // restores the per-test isolation tests rely on.
      onTestFinished(() => originalUser.cleanup?.());
      const fallbackUser = result.user;
      const actionabilitySensitiveMethods = new Set([
        'click',
        'dblClick',
        'tripleClick',
        'hover',
        'unhover',
        'clear',
        'selectOptions',
        'deselectOptions',
      ]);

      function getTargetElement(args: unknown[]) {
        const [target] = args;

        return target instanceof HTMLElement ? target : null;
      }

      function shouldUseFallbackUser(prop: string | symbol, args: unknown[]) {
        if (typeof prop !== 'string' || !actionabilitySensitiveMethods.has(prop)) {
          return false;
        }

        const target = getTargetElement(args);

        if (target == null) {
          return false;
        }

        return (
          target.matches(':disabled') ||
          target.getAttribute('aria-disabled') === 'true' ||
          target.getClientRects().length === 0
        );
      }

      function isActionabilityError(error: unknown) {
        return (
          error instanceof Error &&
          (error.message.includes('Timeout') ||
            error.message.includes('waiting for element to be visible') ||
            error.message.includes('waiting for element to be visible, enabled and stable') ||
            error.message.includes('element is not enabled') ||
            error.message.includes('element is not visible'))
        );
      }

      const proxyHandler: ProxyHandler<any> = {
        get: (target, prop) => {
          const browserMethod = target[prop];
          const fallbackMethod = fallbackUser[prop as keyof typeof fallbackUser];

          if (typeof browserMethod !== 'function' && typeof fallbackMethod !== 'function') {
            return browserMethod ?? fallbackMethod;
          }

          return async (...args: unknown[]) => {
            let returnValue: unknown;
            const shouldFallback =
              typeof fallbackMethod === 'function' && shouldUseFallbackUser(prop, args);
            const method =
              shouldFallback || typeof browserMethod !== 'function'
                ? fallbackMethod
                : browserMethod.bind(target);

            try {
              // Wrap the interaction in `act` so React flushes the effects that follow it
              // (e.g. Base UI's focus management) before assertions run. The browser test setup
              // pins `IS_REACT_ACT_ENVIRONMENT` to `true`, which keeps these real-event-driven
              // updates from tripping "not configured to support act(...)" errors.
              await act(async () => {
                returnValue = await method(...args);
                await flushMicrotasks();
              });
            } catch (error) {
              if (
                !shouldFallback &&
                typeof fallbackMethod === 'function' &&
                isActionabilityError(error)
              ) {
                await act(async () => {
                  returnValue = await (fallbackMethod as (...callArgs: unknown[]) => unknown)(
                    ...args,
                  );
                  await flushMicrotasks();
                });
              } else {
                throw error;
              }
            }

            return returnValue;
          };
        },
      };

      return {
        ...result,
        user: new Proxy(originalUser, proxyHandler) as BaseUIUserEvent,
        rerender,
        setProps,
      };
    }

    return { ...result, user: result.user as BaseUIUserEvent, rerender, setProps };
  };

  return {
    ...createRendererResult,
    render,
  };
}
