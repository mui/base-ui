import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Menu.CheckboxItemIndicator />', () => {
  beforeEach(() => {
    (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Menu.CheckboxItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Menu.Root open>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem>{node}</Menu.CheckboxItem>
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
      const [checked, setChecked] = React.useState(true);
      return (
        <div>
          <button onClick={() => setChecked(false)}>Close</button>
          <Menu.Root open modal={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem checked={checked}>
                  <Menu.CheckboxItemIndicator data-testid="indicator" keepMounted />
                </Menu.CheckboxItem>
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
      expect(screen.getByTestId('indicator')).to.have.attribute('hidden');
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

      const [checked, setChecked] = React.useState(true);

      return (
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <button onClick={() => setChecked(false)}>Close</button>
          <Menu.Root open modal={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem checked={checked}>
                  <Menu.CheckboxItemIndicator
                    className="animation-test-indicator"
                    data-testid="indicator"
                    keepMounted
                    onAnimationEnd={notifyAnimationFinished}
                  />
                </Menu.CheckboxItem>
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
      expect(screen.getByTestId('indicator')).to.have.attribute('hidden');
    });

    expect(animationFinished).to.equal(true);
  });
});
