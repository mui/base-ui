import { expect, vi } from 'vitest';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

describe('<Button />', () => {
  const { render } = createRenderer();

  describeConformance(<Button />, () => ({
    render,
    refInstanceof: window.HTMLButtonElement,
    button: true,
  }));

  describe('prop: nativeButton', () => {
    it('custom element: applies button semantics and dispatches real clicks from keyboard activation', async () => {
      const handleClick = vi.fn();
      const handleRenderClick = vi.fn();
      const handleCaptureClick = vi.fn();
      const handleAncestorClick = vi.fn();

      const { user } = await render(
        <div onClick={handleAncestorClick}>
          <Button
            nativeButton={false}
            render={<span onClick={handleRenderClick} onClickCapture={handleCaptureClick} />}
            onClick={handleClick}
          >
            Save
          </Button>
        </div>,
      );

      const button = screen.getByRole('button', { name: 'Save' });

      expect(button.tagName).toBe('SPAN');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('tabindex', '0');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.keyboard('[Enter]');
      await user.keyboard('[Space]');

      expect(handleCaptureClick).toHaveBeenCalledTimes(2);
      expect(handleRenderClick).toHaveBeenCalledTimes(2);
      expect(handleClick).toHaveBeenCalledTimes(2);
      expect(handleAncestorClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('prop: disabled', () => {
    it('native button: uses the disabled attribute and is not focusable', async () => {
      const handleClick = vi.fn();
      const handleMouseDown = vi.fn();
      const handlePointerDown = vi.fn();
      const handleKeyDown = vi.fn();

      const { user } = await render(
        <Button
          disabled
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).not.toHaveAttribute('aria-disabled');

      await user.keyboard('[Tab]');
      expect(button).not.toHaveFocus();

      await user.click(button);
      await user.keyboard('[Space]');
      await user.keyboard('[Enter]');

      expect(handleClick.mock.calls.length).toBe(0);
      expect(handleMouseDown.mock.calls.length).toBe(0);
      expect(handlePointerDown.mock.calls.length).toBe(0);
      expect(handleKeyDown.mock.calls.length).toBe(0);
    });

    it('custom element: applies aria-disabled and is not focusable', async () => {
      const handleClick = vi.fn();
      const handleMouseDown = vi.fn();
      const handlePointerDown = vi.fn();
      const handleKeyDown = vi.fn();

      const { user } = await render(
        <Button
          disabled
          nativeButton={false}
          render={<span />}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabindex', '-1');

      await user.keyboard('[Tab]');
      expect(button).not.toHaveFocus();

      await user.click(button);
      await user.keyboard('[Space]');
      await user.keyboard('[Enter]');

      expect(handleClick.mock.calls.length).toBe(0);
      expect(handleMouseDown.mock.calls.length).toBe(0);
      expect(handlePointerDown.mock.calls.length).toBe(0);
      expect(handleKeyDown.mock.calls.length).toBe(0);
    });
  });

  describe('form behavior', () => {
    it('does not submit forms by default', async () => {
      const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
      });

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Button>Save</Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).toHaveBeenCalledTimes(0);
    });

    it('submits forms when type="submit" is specified', async () => {
      const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
      });

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Save</Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('state', () => {
    it('passes disabled state to className, style, and render callbacks', async () => {
      const renderCalls: Button.State[] = [];
      const renderFn = (props: React.HTMLAttributes<HTMLElement>, state: Button.State) => {
        renderCalls.push(state);

        return <span {...props} data-render-disabled={String(state.disabled)} />;
      };

      await render(
        <Button
          disabled
          nativeButton={false}
          className={(state) => (state.disabled ? 'is-disabled' : 'is-enabled')}
          style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
          render={renderFn}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).toHaveClass('is-disabled');
      expect(button).toHaveStyle({ opacity: '0.5' });
      expect(button).toHaveAttribute('data-render-disabled', 'true');
      expect(renderCalls[0]).toEqual({ disabled: true });
    });
  });

  describe('prop: focusableWhenDisabled', () => {
    it('native button: prevents interactions but remains focusable', async () => {
      const handleClick = vi.fn();
      const handleMouseDown = vi.fn();
      const handlePointerDown = vi.fn();
      const handleKeyDown = vi.fn();

      const { user } = await render(
        <Button
          disabled
          focusableWhenDisabled
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabindex', '0');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.click(button);
      await user.keyboard('[Space]');
      await user.keyboard('[Enter]');

      expect(handleClick.mock.calls.length).toBe(0);
      expect(handleMouseDown.mock.calls.length).toBe(0);
      expect(handlePointerDown.mock.calls.length).toBe(0);
      expect(handleKeyDown.mock.calls.length).toBe(0);
    });

    it.skipIf(isJSDOM)(
      'native button: allows hover handlers while blocking activation',
      async () => {
        const handleClick = vi.fn();
        const handleMouseMove = vi.fn();

        const { user } = await render(
          <Button
            disabled
            focusableWhenDisabled
            onClick={handleClick}
            onMouseMove={handleMouseMove}
          />,
        );

        const button = screen.getByRole('button');

        expect(button).not.toHaveAttribute('disabled');
        expect(button).toHaveAttribute('data-disabled');
        expect(button).toHaveAttribute('aria-disabled', 'true');

        await user.hover(button);

        expect(handleMouseMove).toHaveBeenCalled();

        await user.click(button);

        expect(handleClick).toHaveBeenCalledTimes(0);
      },
    );

    it('keeps focus and suppresses interactions after becoming disabled', async () => {
      const handleClick = vi.fn();

      function TestButton() {
        const [disabled, setDisabled] = React.useState(false);

        return (
          <Button
            disabled={disabled}
            focusableWhenDisabled
            onClick={(event) => {
              handleClick(event);
              setDisabled(true);
            }}
          >
            Save
          </Button>
        );
      }

      const { user } = await render(<TestButton />);

      const button = screen.getByRole('button', { name: 'Save' });

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await user.click(button);
      await user.keyboard('[Enter]');
      await user.keyboard('[Space]');

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(button).toHaveFocus();
    });

    it('custom element: prevents interactions but remains focusable', async () => {
      const handleClick = vi.fn();
      const handleMouseDown = vi.fn();
      const handlePointerDown = vi.fn();
      const handleKeyDown = vi.fn();

      const { user } = await render(
        <Button
          disabled
          focusableWhenDisabled
          nativeButton={false}
          render={<span />}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />,
      );

      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabindex', '0');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.click(button);
      await user.keyboard('[Space]');
      await user.keyboard('[Enter]');

      expect(handleClick.mock.calls.length).toBe(0);
      expect(handleMouseDown.mock.calls.length).toBe(0);
      expect(handlePointerDown.mock.calls.length).toBe(0);
      expect(handleKeyDown.mock.calls.length).toBe(0);
    });
  });
});
