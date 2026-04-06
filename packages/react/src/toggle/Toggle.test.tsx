import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { Toggle } from '@base-ui/react/toggle';
import { createRenderer, describeConformance } from '#test-utils';
import { ToggleGroup } from '../toggle-group/ToggleGroup';

describe('<Toggle />', () => {
  const { render } = createRenderer();

  describeConformance(<Toggle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
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

      await render(<App />);
      const checkbox = screen.getByRole('checkbox');
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'false');
      await act(async () => {
        checkbox.click();
      });

      expect(button).toHaveAttribute('aria-pressed', 'true');

      await act(async () => {
        checkbox.click();
      });

      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('uncontrolled', async () => {
      await render(<Toggle defaultPressed={false} />);

      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'false');
      await act(async () => {
        button.click();
      });

      expect(button).toHaveAttribute('aria-pressed', 'true');

      await act(async () => {
        button.click();
      });

      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('prop: onPressedChange', () => {
    it('is called when the pressed state changes', async () => {
      const handlePressed = vi.fn();

      await render(<Toggle defaultPressed={false} onPressedChange={handlePressed} />);

      const button = screen.getByRole('button');

      await act(async () => {
        button.click();
      });

      expect(handlePressed.mock.calls.length).toBe(1);
      expect(handlePressed.mock.calls[0][0]).toBe(true);
    });
  });

  describe('prop: disabled', () => {
    it('disables the component', async () => {
      const handlePressed = vi.fn();
      await render(<Toggle disabled onPressedChange={handlePressed} />);

      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-pressed', 'false');

      await act(async () => {
        button.click();
      });

      expect(handlePressed.mock.calls.length).toBe(0);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('prop: render', () => {
    it('should pass composite props', async () => {
      const renderSpy = vi.fn();

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

      expect(renderSpy.mock.lastCall?.[0]).toHaveProperty('tabIndex', 0);
    });
  });
});
