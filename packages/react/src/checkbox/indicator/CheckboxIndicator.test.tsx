import * as React from 'react';
import { expect } from 'chai';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { CheckboxRootContext } from '../root/CheckboxRootContext';

const testContext = {
  checked: true,
  disabled: false,
  readOnly: false,
  required: false,
  indeterminate: false,
  dirty: false,
  touched: false,
  valid: null,
};

describe('<Checkbox.Indicator />', () => {
  beforeEach(() => {
    (globalThis as any).BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Checkbox.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <CheckboxRootContext.Provider value={testContext}>{node}</CheckboxRootContext.Provider>,
      );
    },
  }));

  it('should not render indicator by default', async () => {
    const { container } = await render(
      <Checkbox.Root>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.equal(null);
  });

  it('should render indicator when checked', async () => {
    const { container } = await render(
      <Checkbox.Root checked>
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).not.to.equal(null);
  });

  it('should spread extra props', async () => {
    const { container } = await render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-extra-prop="Lorem ipsum" />
      </Checkbox.Root>,
    );
    const indicator = container.querySelector('span');
    expect(indicator).to.have.attribute('data-extra-prop', 'Lorem ipsum');
  });

  describe('keepMounted prop', () => {
    it('should keep indicator mounted when unchecked', async () => {
      const { container } = await render(
        <Checkbox.Root>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).to.have.attribute('hidden');
    });

    it('should keep indicator mounted when checked', async () => {
      const { container } = await render(
        <Checkbox.Root checked>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).not.to.have.attribute('hidden');
    });

    it('should keep indicator mounted when indeterminate', async () => {
      const { container } = await render(
        <Checkbox.Root indeterminate>
          <Checkbox.Indicator keepMounted />
        </Checkbox.Root>,
      );
      const indicator = container.querySelector('span');
      expect(indicator).not.to.equal(null);
      expect(indicator).not.to.have.attribute('hidden');
    });
  });

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
          <Checkbox.Root checked={checked}>
            <Checkbox.Indicator data-testid="indicator" keepMounted />
          </Checkbox.Root>
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
          <Checkbox.Root checked={checked}>
            <Checkbox.Indicator
              className="animation-test-indicator"
              data-testid="indicator"
              onAnimationEnd={notifyAnimationFinished}
              keepMounted
            />
          </Checkbox.Root>
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
