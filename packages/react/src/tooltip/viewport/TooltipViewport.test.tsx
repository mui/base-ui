import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  recordTransitions,
  viewportConformanceTests,
} from '#test-utils';

import demoStyles from 'docs/src/app/(docs)/react/components/tooltip/demos/detached-triggers-full/css-modules/index.module.css';

describe('<Tooltip.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>{node}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  viewportConformanceTests({
    render,
    openOn: 'focus',
    createComponent: ({ root, triggers, portal, positioner, popup, viewport, renderContent }) => (
      <Tooltip.Root {...root}>
        {({ payload }) => (
          <React.Fragment>
            {triggers.map(({ key, ...triggerProps }, index) => (
              <Tooltip.Trigger key={key ?? index} delay={0} {...triggerProps} />
            ))}
            <Tooltip.Portal {...portal}>
              <Tooltip.Positioner {...positioner}>
                <Tooltip.Popup {...popup}>
                  <Tooltip.Viewport {...viewport}>{renderContent(payload)}</Tooltip.Viewport>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </React.Fragment>
        )}
      </Tooltip.Root>
    ),
  });

  describe.skipIf(isJSDOM)('detached trigger demo transitions', () => {
    it.each([{ stationary: true }, { stationary: false }])(
      'finishes the content slide with stationary positioner=$stationary',
      async ({ stationary }) => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
        function Test({ triggerId = 'first' }) {
          const anchorRef = React.useRef<HTMLDivElement>(null);
          return (
            <Tooltip.Root<string> open triggerId={triggerId}>
              {({ payload }) => (
                <React.Fragment>
                  <div
                    ref={anchorRef}
                    style={{ position: 'fixed', top: 200, left: 200, width: 80, height: 20 }}
                  />
                  <Tooltip.Trigger
                    id="first"
                    payload="First"
                    style={{ position: 'fixed', top: 200, left: 200, width: 80, height: 20 }}
                  >
                    First
                  </Tooltip.Trigger>
                  <Tooltip.Trigger
                    id="second"
                    payload="Second"
                    style={{ position: 'fixed', top: 200, left: 300, width: 80, height: 20 }}
                  >
                    Second
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner
                      data-testid="positioner"
                      anchor={stationary ? anchorRef : undefined}
                      className={demoStyles.Positioner}
                      style={{ transitionDuration: '200ms' }}
                    >
                      <Tooltip.Popup data-testid="popup" className={demoStyles.Popup}>
                        <Tooltip.Viewport data-testid="viewport" className={demoStyles.Viewport}>
                          <div style={{ width: 100 }}>{payload}</div>
                        </Tooltip.Viewport>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
          );
        }
        const { setProps } = await render(<Test />);
        const popup = screen.getByTestId('popup');
        await waitFor(() => expect(popup.style.transition).toBe(''));
        await waitFor(() => expect(popup.getAnimations()).toHaveLength(0));
        const positioner = screen.getByTestId('positioner');
        const initialLeft = positioner.getBoundingClientRect().left;
        const positionerTransitions = recordTransitions(positioner);
        const viewport = screen.getByTestId('viewport');
        const transitions = recordTransitions(viewport, { subtree: true });
        expect(viewport).not.toHaveAttribute('data-instant');

        await setProps({ triggerId: 'second' });
        await waitFor(() => expect(transitions.started).toContain('translate'));
        await waitFor(() => expect(transitions.finished).toContain('translate'));
        expect(transitions.canceled).not.toContain('translate');
        expect(positionerTransitions.started).toEqual(stationary ? [] : ['left']);
        expect(positioner.getBoundingClientRect().left).toBeCloseTo(
          initialLeft + (stationary ? 0 : 100),
          0,
        );
      },
    );
  });

  it.skipIf(isJSDOM)('should mirror the instant animation type of the tooltip', async () => {
    await render(
      <Tooltip.Root>
        <Tooltip.Trigger delay={0} closeDelay={0}>
          Trigger
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport data-testid="viewport">Content</Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });

    await act(async () => trigger.focus());

    await waitFor(() => {
      expect(screen.getByTestId('viewport')).toHaveAttribute('data-instant', 'focus');
    });
  });
});
