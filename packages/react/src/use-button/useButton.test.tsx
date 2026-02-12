import * as React from 'react';
import { expect } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { createRenderer, isJSDOM } from '#test-utils';
import { useButton } from './useButton';
import { CompositeRoot } from '../composite/root/CompositeRoot';

describe('useButton', () => {
  const { render, renderToString } = createRenderer();
  const focusElement = async (element: HTMLElement) => {
    await act(async () => {
      element.focus();
    });
  };

  describe('non-native button', () => {
    describe('keyboard interactions', () => {
      ['Enter', 'Space'].forEach((key) => {
        it(`can be activated with ${key} key`, async () => {
          const clickSpy = vi.fn();

          function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
            const { getButtonProps } = useButton({
              native: false,
            });

            return <span {...getButtonProps(props)} />;
          }

          const { user } = await render(<Button onClick={clickSpy} />);

          const button = screen.getByRole('button');

          await user.keyboard('[Tab]');
          expect(button).toHaveFocus();

          await user.keyboard(`[${key}]`);
          expect(clickSpy).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('param: focusableWhenDisabled', () => {
    it('allows disabled buttons to be focused', async () => {
      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({
          disabled,
          focusableWhenDisabled: true,
        });

        return <button {...getButtonProps(otherProps)} />;
      }
      await render(<TestButton disabled />);
      const button = screen.getByRole('button');
      await focusElement(button);
      expect(button).toHaveFocus();
    });

    it('force overrides disabled attribute when put in a composite', async () => {
      function TestButton(props: { buttonKey?: React.Key }) {
        const { getButtonProps, buttonRef } = useButton({
          disabled: true,
          focusableWhenDisabled: true,
        });
        return (
          <button ref={buttonRef} key={props.buttonKey} {...getButtonProps({ disabled: true })} />
        );
      }

      const { rerender } = await render(
        <CompositeRoot>
          <TestButton />
        </CompositeRoot>,
      );

      async function verify() {
        const button = screen.getByRole('button');
        await focusElement(button);
        expect(button).toHaveFocus();
      }

      await verify();

      // Ensure it works after ref change
      await rerender(
        <CompositeRoot>
          <TestButton buttonKey="rerender" />
        </CompositeRoot>,
      );
      await verify();
    });

    it('prevents interactions except focus and blur', async () => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({
          disabled,
          focusableWhenDisabled: true,
          native: false,
        });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { user } = await render(
        <TestButton
          disabled
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />,
      );

      const button = screen.getByRole('button');
      expect(document.activeElement).not.to.equal(button);

      expect(handleFocus).toHaveBeenCalledTimes(0);
      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();
      expect(handleFocus).toHaveBeenCalledTimes(1);

      await user.keyboard('[Enter]');
      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      await user.keyboard('[Space]');
      expect(handleKeyUp).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      await user.click(button);
      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      expect(handleKeyUp).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      expect(handleBlur).toHaveBeenCalledTimes(0);
      await user.keyboard('[Tab]');
      expect(handleBlur).toHaveBeenCalledTimes(1);
      expect(document.activeElement).not.to.equal(button);
    });
  });

  describe('param: tabIndex', () => {
    it('returns tabIndex in getButtonProps when host component is BUTTON', async () => {
      function TestButton() {
        const { getButtonProps } = useButton();

        expect(getButtonProps().tabIndex).to.equal(0);

        return <button {...getButtonProps()} />;
      }

      await render(<TestButton />);
      expect(screen.getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps when host component is not BUTTON', async () => {
      function TestButton() {
        const ref = React.useRef(null);
        const { getButtonProps, buttonRef } = useButton({ native: false });
        useMergedRefs(ref, buttonRef);

        expect(getButtonProps().tabIndex).to.equal(0);

        return <span {...getButtonProps()} />;
      }

      await render(<TestButton />);
      expect(screen.getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps if it is explicitly provided', async () => {
      const customTabIndex = 3;
      function TestButton() {
        const { getButtonProps } = useButton({ tabIndex: customTabIndex });
        return <button {...getButtonProps()} />;
      }

      await render(<TestButton />);
      expect(screen.getByRole('button')).to.have.property('tabIndex', customTabIndex);
    });
  });

  describe('arbitrary props', () => {
    it('are passed to the host component', async () => {
      const buttonTestId = 'button-test-id';
      function TestButton() {
        const { getButtonProps } = useButton();
        return <button {...getButtonProps({ 'data-testid': buttonTestId })} />;
      }

      await render(<TestButton />);
      expect(screen.getByRole('button')).to.have.attribute('data-testid', buttonTestId);
    });
  });

  describe('event handlers', () => {
    it('key: Space fires keyup then click on non-composite buttons', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      await render(
        <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(0);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('key: Space fires keydown then click on composite buttons', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <span {...getButtonProps(props)} />;
      }

      await render(
        <TestButton
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
        />,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('key: Space fires keydown then click on composite links', async () => {
      const handleClick = vi.fn();

      function TestButton(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <a href="#test" {...getButtonProps(props)} />;
      }

      await render(<TestButton onClick={handleClick} />);

      const link = screen.getByRole('button');

      await focusElement(link);
      expect(link).toHaveFocus();

      fireEvent.keyDown(link, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(link, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not click composite links when Space is prevented for text navigation', async () => {
      const handleClick = vi.fn();

      function TestButton(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <a href="#test" {...getButtonProps({ role: 'menuitem', ...props })} />;
      }

      await render(
        <TestButton onKeyDown={(event) => event.preventDefault()} onClick={handleClick} />,
      );

      const link = screen.getByRole('menuitem');

      await focusElement(link);
      expect(link).toHaveFocus();

      fireEvent.keyDown(link, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it('key: Space fires keydown then click on native composite buttons', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ composite: true });

        return <button {...getButtonProps(props)} />;
      }

      await render(
        <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire duplicate clicks for Space on native composite buttons', async () => {
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ composite: true });

        return <button {...getButtonProps(props)} />;
      }

      const { user } = await render(<TestButton onClick={handleClick} />);

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      await user.keyboard('[Space]');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('key: Space fires keydown then click when in composite root context', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      await render(
        <CompositeRoot>
          <TestButton
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
          />
        </CompositeRoot>,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('key: Space fires keydown then click on native buttons in composite root context', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton();

        return <button {...getButtonProps(props)} />;
      }

      await render(
        <CompositeRoot>
          <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
        </CompositeRoot>,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('`composite=false` keeps keyup activation inside composite root context', async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false, composite: false });

        return <span {...getButtonProps(props)} />;
      }

      await render(
        <CompositeRoot>
          <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
        </CompositeRoot>,
      );

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: ' ' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(0);

      fireEvent.keyUp(button, { key: ' ' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
    // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
    it('key: Space fires a click event even if preventDefault was called on keyUp', async () => {
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      const { user } = await render(
        <TestButton
          onKeyUp={(event: React.KeyboardEvent<HTMLButtonElement>) => event.preventDefault()}
          onClick={handleClick}
        />,
      );

      const button = screen.getByRole('button');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.keyboard('[Space]');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('key: Enter fires keydown then click on non-native buttons', async () => {
      const handleKeyDown = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      await render(<TestButton onKeyDown={handleKeyDown} onClick={handleClick} />);

      const button = screen.getByRole('button');

      await focusElement(button);
      expect(button).toHaveFocus();

      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe.skipIf(isJSDOM)('server-side rendering', () => {
    it('should server-side render', async () => {
      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({ disabled, native: false });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { container } = await renderToString(<TestButton disabled />);

      expect(container.firstChild).to.have.property('role', 'button');
    });

    it('adds disabled attribute', async () => {
      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({ disabled });
        return <button {...getButtonProps(otherProps)} />;
      }

      renderToString(<TestButton disabled>Submit</TestButton>);
      expect(screen.getByRole('button')).to.have.property('disabled');
    });
  });

  describe('dev warnings', () => {
    it('errors if nativeButton=true but ref is not a button', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({ native: true });
        return <span {...getButtonProps()} ref={buttonRef} />;
      }
      await render(<TestButton />);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Base UI: A component that acts as a button expected a native <button> because ' +
            'the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, ' +
            'which can impact forms and accessibility. Use a real <button> in the `render` prop, or set ' +
            '`nativeButton` to `false`.',
        ),
      );
    });

    it('errors if nativeButton=false but ref is a button', async () => {
      const errorSpy = vi
        .spyOn(console, 'error')
        .mockName('console.error')
        .mockImplementation(() => {});
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({ native: false });
        return <button {...getButtonProps()} ref={buttonRef} />;
      }
      await render(<TestButton />);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Base UI: A component that acts as a button expected a non-<button> because ' +
            'the `nativeButton` prop is false. Rendering a <button> keeps native behavior while Base UI ' +
            'applies non-native attributes and handlers, which can add unintended extra attributes ' +
            '(such as `role` or `aria-disabled`). Use a non-<button> in the `render` prop, or set ' +
            '`nativeButton` to `true`.',
        ),
      );
    });
  });
});
