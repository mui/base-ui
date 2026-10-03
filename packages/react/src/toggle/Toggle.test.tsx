import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { Toggle } from '@base-ui/react/toggle';
import { Toolbar } from '@base-ui/react/toolbar';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
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

    it('does not change the pressed state when the event is canceled', async () => {
      await render(
        <Toggle
          defaultPressed={false}
          onPressedChange={(_pressed, eventDetails) => {
            eventDetails.cancel();
          }}
        />,
      );

      const button = screen.getByRole('button');

      await act(async () => {
        button.click();
      });

      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('canceling in a grouped Toggle prevents the group value from changing', async () => {
      const onValueChange = vi.fn();

      await render(
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle
            value="one"
            onPressedChange={(_pressed, eventDetails) => {
              eventDetails.cancel();
            }}
          />
          <Toggle value="two" />
        </ToggleGroup>,
      );

      const [button1] = screen.getAllByRole('button');

      await act(async () => {
        button1.click();
      });

      expect(button1).toHaveAttribute('aria-pressed', 'false');
      expect(onValueChange.mock.calls.length).toBe(0);
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

  describe('prop: focusableWhenDisabled', () => {
    it('remains focusable but ignores interactions', async () => {
      const handlePressedChange = vi.fn();
      const handleClick = vi.fn();

      const { user } = await render(
        <Toggle
          disabled
          focusableWhenDisabled
          onPressedChange={handlePressedChange}
          onClick={handleClick}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.click(button);
      await user.keyboard('[Space]');
      await user.keyboard('[Enter]');

      expect(handlePressedChange).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not toggle a group value', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <ToggleGroup onValueChange={onValueChange}>
          <Toggle value="one" disabled focusableWhenDisabled />
        </ToggleGroup>,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await user.click(button);
      await user.keyboard('[Enter]');

      expect(onValueChange).toHaveBeenCalledTimes(0);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('is natively disabled by default', async () => {
      await render(<Toggle disabled />);

      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });

    it.skipIf(isJSDOM)('is reachable by roving focus in a toolbar', async () => {
      const { user } = await render(
        <Toolbar.Root>
          <Toolbar.Button />
          <Toggle disabled focusableWhenDisabled />
          <Toggle disabled />
        </Toolbar.Root>,
      );

      const [first, focusableToggle, disabledToggle] = screen.getAllByRole('button');

      await user.keyboard('[Tab]');
      expect(first).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(focusableToggle).toHaveFocus();

      // A natively disabled toggle is skipped, so focus wraps to the start.
      await user.keyboard('[ArrowRight]');
      expect(disabledToggle).not.toHaveFocus();
      expect(first).toHaveFocus();
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
