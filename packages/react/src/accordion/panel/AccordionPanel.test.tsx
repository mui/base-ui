import { expect } from 'vitest';
import { reactMajor, screen, waitFor } from '@mui/internal-test-utils';
import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const PANEL_CONTENT = 'This is panel content';

describe('<Accordion.Panel />', () => {
  const { render, renderToString } = createRenderer();

  function getActivity() {
    type ActivityProps = {
      mode: 'visible' | 'hidden';
      children: React.ReactNode;
    };

    return (React as typeof React & { Activity: React.ComponentType<ActivityProps> }).Activity;
  }

  describeConformance(<Accordion.Panel keepMounted />, () => ({
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));

  describe('server-side rendering', () => {
    it('suppresses the initial keyframe animation from inline styles when rendered open', async () => {
      await renderToString(
        <React.Fragment>
          <style>{`
            @keyframes panel-slide-down {
              from {
                height: 0;
              }

              to {
                height: var(--accordion-panel-height);
              }
            }
          `}</style>

          <Accordion.Root defaultValue={[0]}>
            <Accordion.Item value={0}>
              <Accordion.Header>
                <Accordion.Trigger>Trigger</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel
                data-testid="panel"
                style={{
                  animationDuration: '100ms',
                  animationName: 'panel-slide-down',
                  animationTimingFunction: 'linear',
                }}
              >
                {PANEL_CONTENT}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </React.Fragment>,
      );

      const panel = screen.getByTestId('panel');

      expect(panel.style.animationName).toBe('none');
      expect(panel.style.animationDuration).toBe('100ms');
    });
  });

  describe.skipIf(isJSDOM || reactMajor < 19)('React.Activity', () => {
    it('does not replay open keyframe animations from inline styles when revealing a panel opened by the user', async () => {
      const Activity = getActivity();

      function App() {
        const [visible, setVisible] = React.useState(true);

        return (
          <React.Fragment>
            <style>{`
              @keyframes panel-slide-down {
                from {
                  height: 0;
                }

                to {
                  height: var(--accordion-panel-height);
                }
              }
            `}</style>

            <button type="button" onClick={() => setVisible((prev) => !prev)}>
              toggle activity
            </button>

            <Activity mode={visible ? 'visible' : 'hidden'}>
              <Accordion.Root>
                <Accordion.Item value={0}>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel
                    data-testid="panel"
                    keepMounted
                    style={{
                      animationDuration: '100ms',
                      animationName: 'panel-slide-down',
                      animationTimingFunction: 'linear',
                      overflow: 'hidden',
                    }}
                  >
                    {PANEL_CONTENT}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>
            </Activity>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);

      const toggle = screen.getByRole('button', { name: 'toggle activity' });
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      const panel = screen.getByTestId('panel');

      await user.click(trigger);

      await waitFor(() => {
        expect(panel).toHaveAttribute('data-open');
      });

      await waitFor(() => {
        expect(panel.getAnimations().length).toBe(0);
      });

      await user.click(toggle);
      await user.click(toggle);

      await waitFor(() => {
        expect(panel).toHaveAttribute('data-open');
      });

      expect(panel.getAnimations().length).toBe(0);
    });
  });
});
