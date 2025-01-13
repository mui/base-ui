import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Menu.RadioItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.RadioItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup>
                <Menu.RadioItem value="">{node}</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
    },
  }));

  it('should remove the indicator when there is no exit animation defined', async function test(t = {}) {
    if (/jsdom/.test(window.navigator.userAgent)) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
    }

    function Test() {
      const [value, setValue] = React.useState('a');
      return (
        <div>
          <button onClick={() => setValue('b')}>Close</button>
          <Menu.Root open modal={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Popup>
                  <Menu.RadioGroup value={value}>
                    <Menu.RadioItem value="a">
                      <Menu.RadioItemIndicator data-testid="indicator" keepMounted />
                    </Menu.RadioItem>
                    <Menu.RadioItem value="b">
                      <Menu.RadioItemIndicator keepMounted />
                    </Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>
        </div>
      );
    }

    const { user } = await render(<Test />);

    expect(screen.getByTestId('indicator')).not.to.have.attribute('hidden');

    const closeButton = screen.getByText('Close');

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('indicator')).not.to.have.attribute('hidden');
    });
  });

  it('should remove the indicator when the animation finishes', async function test(t = {}) {
    if (/jsdom/.test(window.navigator.userAgent)) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
    }

    (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = false;

    let animationFinished = false;
    const notifyAnimationFinished = () => {
      animationFinished = true;
    };

    function Test() {
      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }
        .animation-test-indicator[data-ending-style] {
          animation: test-anim 50ms;
        }
      `;

      const [value, setValue] = React.useState('a');

      return (
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <button onClick={() => setValue('b')}>Close</button>
          <Menu.Root open modal={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioGroup value={value}>
                  <Menu.RadioItem value="a">
                    <Menu.RadioItemIndicator
                      className="animation-test-indicator"
                      data-testid="indicator"
                      keepMounted
                      onAnimationEnd={notifyAnimationFinished}
                    />
                  </Menu.RadioItem>
                  <Menu.RadioItem value="b">
                    <Menu.RadioItemIndicator keepMounted />
                  </Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>
        </div>
      );
    }

    const { user } = await render(<Test />);

    expect(screen.getByTestId('indicator')).not.to.have.attribute('hidden');

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(animationFinished).to.equal(true);
    });

  });
});
