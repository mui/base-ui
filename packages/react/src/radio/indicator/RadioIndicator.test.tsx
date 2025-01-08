import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { Radio } from '@base-ui-components/react/radio';
import { expect } from 'chai';
import { RadioGroup } from '@base-ui-components/react/radio-group';

describe('<Radio.Indicator />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Radio.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Radio.Root value="">{node}</Radio.Root>);
    },
  }));

  it('should remove the indicator when there is no exit animation defined', async ({ skip }) => {
    if (/jsdom/.test(window.navigator.userAgent)) {
      skip();
    }

    function Test() {
      const [value, setValue] = React.useState('a');
      return (
        <div>
          <button onClick={() => setValue('b')}>Close</button>
          <RadioGroup value={value}>
            <Radio.Root value="a">
              <Radio.Indicator
                className="animation-test-indicator"
                keepMounted
                data-testid="indicator-a"
              />
            </Radio.Root>
            <Radio.Root value="a">
              <Radio.Indicator className="animation-test-indicator" keepMounted />
            </Radio.Root>
          </RadioGroup>
        </div>
      );
    }

    const { user } = await render(<Test />);

    expect(screen.getByTestId('indicator-a')).not.to.have.attribute('hidden');

    const closeButton = screen.getByText('Close');

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('indicator-a')).to.have.attribute('hidden');
    });
  });

  it('should remove the indicator when the animation finishes', async ({ skip }) => {
    if (/jsdom/.test(window.navigator.userAgent)) {
      skip();
    }

    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

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
          <RadioGroup value={value}>
            <Radio.Root value="a">
              <Radio.Indicator
                className="animation-test-indicator"
                keepMounted
                onAnimationEnd={notifyAnimationFinished}
                data-testid="indicator-a"
              />
            </Radio.Root>
            <Radio.Root value="a">
              <Radio.Indicator className="animation-test-indicator" keepMounted />
            </Radio.Root>
          </RadioGroup>
        </div>
      );
    }

    const { user } = await render(<Test />);

    expect(screen.getByTestId('indicator-a')).not.to.have.attribute('hidden');

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('indicator-a')).to.have.attribute('hidden');
    });

    expect(animationFinished).to.equal(true);
  });
});
