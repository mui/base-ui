import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act } from '@mui/internal-test-utils';
import { Toggle } from '@base-ui-components/react/toggle';
import { createRenderer, describeConformance } from '#test-utils';
import { ToggleGroup } from '../toggle-group/ToggleGroup';

describe('<Toggle />', () => {
  const { render } = createRenderer();

  describeConformance(<Toggle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));

  describe('pressed state', () => {
    it('controlled', async () => {
      function App() {
        const [pressed, setPressed] = React.useState(false);
        return (
          <div>
            <input type="checkbox" checked={pressed} onChange={() => setPressed(!pressed)} />
            <Toggle pressed={pressed} />;
          </div>
        );
      }

      const { getByRole } = await render(<App />);
      const checkbox = getByRole('checkbox');
      const button = getByRole('button');

      expect(button).to.have.attribute('aria-pressed', 'false');
      await act(async () => {
        checkbox.click();
      });

      expect(button).to.have.attribute('aria-pressed', 'true');

      await act(async () => {
        checkbox.click();
      });

      expect(button).to.have.attribute('aria-pressed', 'false');
    });

    it('uncontrolled', async () => {
      const { getByRole } = await render(<Toggle defaultPressed={false} />);

      const button = getByRole('button');

      expect(button).to.have.attribute('aria-pressed', 'false');
      await act(async () => {
        button.click();
      });

      expect(button).to.have.attribute('aria-pressed', 'true');

      await act(async () => {
        button.click();
      });

      expect(button).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('prop: onPressedChange', () => {
    it('is called when the pressed state changes', async () => {
      const handlePressed = spy();
      const { getByRole } = await render(
        <Toggle defaultPressed={false} onPressedChange={handlePressed} />,
      );

      const button = getByRole('button');

      await act(async () => {
        button.click();
      });

      expect(handlePressed.callCount).to.equal(1);
      expect(handlePressed.firstCall.args[0]).to.equal(true);
    });
  });

  describe('prop: disabled', () => {
    it('disables the component', async () => {
      const handlePressed = spy();
      const { getByRole } = await render(<Toggle disabled onPressedChange={handlePressed} />);

      const button = getByRole('button');

      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-pressed', 'false');

      await act(async () => {
        button.click();
      });

      expect(handlePressed.callCount).to.equal(0);
      expect(button).to.have.attribute('aria-pressed', 'false');
    });
  });

  describe('prop: render', async () => {
    it('should pass composite props', async () => {
      const renderSpy = spy();

      function ToggleRenderComponent({
        renderProps,
      }: {
        renderProps: React.ComponentProps<'button'>;
      }) {
        renderSpy(renderProps);
        return <button type="button" {...renderProps} />;
      }

      await render(
        <ToggleGroup defaultValue={['left']}>
          <Toggle value="left" render={(props) => <ToggleRenderComponent renderProps={props} />} />
        </ToggleGroup>,
      );

      expect(renderSpy.lastCall.args[0]).to.have.property('tabIndex', 0);
    });
  });
});
