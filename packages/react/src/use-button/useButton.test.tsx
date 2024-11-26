import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { useButton } from '.';

describe('useButton', () => {
  const { render } = createRenderer();

  describe('tabIndex', () => {
    it('does not return tabIndex in getButtonProps when host component is BUTTON', () => {
      function TestComponent() {
        const buttonRef = React.useRef(null);
        const { getButtonProps } = useButton({ buttonRef });

        expect(getButtonProps().tabIndex).to.equal(undefined);

        return <button {...getButtonProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps when host component is not BUTTON', () => {
      function TestComponent() {
        const buttonRef = React.useRef(null);
        const { getButtonProps } = useButton({ buttonRef });

        expect(getButtonProps().tabIndex).to.equal(buttonRef.current ? 0 : undefined);

        return <span {...getButtonProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getButtonProps if it is explicitly provided', () => {
      const customTabIndex = 3;
      function TestComponent() {
        const buttonRef = React.useRef(null);
        const { getButtonProps } = useButton({ buttonRef, tabIndex: customTabIndex });
        return <button {...getButtonProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', customTabIndex);
    });
  });

  describe('arbitrary props', () => {
    it('are passed to the host component', () => {
      const buttonTestId = 'button-test-id';
      function TestComponent() {
        const { getButtonProps } = useButton({});
        return <button {...getButtonProps({ 'data-testid': buttonTestId })} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.attribute('data-testid', buttonTestId);
    });
  });
});
