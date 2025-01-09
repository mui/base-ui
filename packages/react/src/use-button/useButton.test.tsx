import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { useButton } from './useButton';

describe('useButton', () => {
  const { render, renderToString } = createRenderer();

  describe('param: focusableWhenDisabled', () => {
    it('allows disabled buttons to be focused', async () => {
      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({ disabled, focusableWhenDisabled: true });

        return <button {...getButtonProps(otherProps)} />;
      }
      const { getByRole } = await render(<TestButton disabled />);
      const button = getByRole('button');
      act(() => button.focus());
      expect(button).toHaveFocus();
    });

    it('prevents interactions with the button', async () => {
      const handleKeyDown = spy();
      const handleClick = spy();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({ disabled, focusableWhenDisabled: true });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { getByRole } = await render(
        <TestButton disabled onKeyDown={handleKeyDown} onClick={handleClick} />,
      );
      const button = getByRole('button');

      act(() => button.focus());
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.keyDown(button, { key: 'Space' });
      expect(handleKeyDown.callCount).to.equal(2);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.click(button);
      expect(handleKeyDown.callCount).to.equal(2);
      expect(handleClick.callCount).to.equal(0);
    });
  });

  describe('param: tabIndex', () => {
    it('does not return tabIndex in getButtonProps when host component is BUTTON', async () => {
      function TestButton() {
        const { getButtonProps } = useButton();

        expect(getButtonProps().tabIndex).to.equal(undefined);

        return <button {...getButtonProps()} />;
      }

      const { getByRole } = await render(<TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps when host component is not BUTTON', async () => {
      function TestButton() {
        const buttonRef = React.useRef(null);
        const { getButtonProps } = useButton({ buttonRef });

        expect(getButtonProps().tabIndex).to.equal(buttonRef.current ? 0 : undefined);

        return <span {...getButtonProps()} />;
      }

      const { getByRole } = await render(<TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps if it is explicitly provided', async () => {
      const customTabIndex = 3;
      function TestButton() {
        const { getButtonProps } = useButton({ tabIndex: customTabIndex });
        return <button {...getButtonProps()} />;
      }

      const { getByRole } = await render(<TestButton />);
      expect(getByRole('button')).to.have.property('tabIndex', customTabIndex);
    });
  });

  describe('arbitrary props', () => {
    it('are passed to the host component', async () => {
      const buttonTestId = 'button-test-id';
      function TestButton() {
        const { getButtonProps } = useButton();
        return <button {...getButtonProps({ 'data-testid': buttonTestId })} />;
      }

      const { getByRole } = await render(<TestButton />);
      expect(getByRole('button')).to.have.attribute('data-testid', buttonTestId);
    });
  });

  describe('event handlers', () => {
    // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
    // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
    it('key: Space fires a click event even if preventDefault was called on keyUp', async () => {
      const handleClick = spy();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton();

        return <span {...getButtonProps(props)} />;
      }

      const { getByRole, user } = await render(
        <TestButton
          onKeyUp={(event: React.KeyboardEvent<HTMLButtonElement>) => event.preventDefault()}
          onClick={handleClick}
        />,
      );

      const button = getByRole('button');

      await user.keyboard('[Tab]');
      expect(button).toHaveFocus();

      await user.keyboard('[Space]');
      expect(handleClick.callCount).to.equal(1);
    });

    it('key: Enter fires keydown then click on non-native buttons', async () => {
      const handleKeyDown = spy();
      const handleClick = spy();

      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { getButtonProps } = useButton();

        return <span {...getButtonProps(props)} />;
      }

      const { getByRole } = await render(
        <TestButton onKeyDown={handleKeyDown} onClick={handleClick} />,
      );

      const button = getByRole('button');

      act(() => button.focus());
      expect(button).toHaveFocus();

      expect(handleKeyDown.callCount).to.equal(0);
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(1);
      expect(handleClick.callCount).to.equal(1);
    });
  });

  describe.skipIf(isJSDOM)('server-side rendering', () => {
    it('should server-side render', async () => {
      function TestButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
        const { disabled, type, ...otherProps } = props;
        const { getButtonProps } = useButton({ disabled, type });

        return <span {...getButtonProps(otherProps)} />;
      }

      const { container } = await renderToString(
        <TestButton disabled type="submit">
          Submit
        </TestButton>,
      );

      expect(container.firstChild).to.have.text('Submit');
    });
  });
});
