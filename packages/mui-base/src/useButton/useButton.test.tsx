import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { useButton } from '@base_ui/react/useButton';

describe('useButton', () => {
  const { render } = createRenderer();

  describe('tabIndex', () => {
    it('does not return tabIndex in getRootProps when host component is BUTTON', () => {
      function TestComponent() {
        const ref = React.useRef(null);
        const { getRootProps } = useButton({ rootRef: ref });

        expect(getRootProps().tabIndex).to.equal(undefined);

        return <button {...getRootProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getRootProps when host component is not BUTTON', () => {
      function TestComponent() {
        const ref = React.useRef(null);
        const { getRootProps } = useButton({ rootRef: ref });

        expect(getRootProps().tabIndex).to.equal(ref.current ? 0 : undefined);

        return <span {...getRootProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', 0);
    });

    it('returns tabIndex in getRootProps if it is explicitly provided', () => {
      const customTabIndex = 3;
      function TestComponent() {
        const ref = React.useRef(null);
        const { getRootProps } = useButton({ rootRef: ref, tabIndex: customTabIndex });
        return <button {...getRootProps()} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.property('tabIndex', customTabIndex);
    });
  });

  describe('arbitrary props', () => {
    it('are passed to the host component', () => {
      const buttonTestId = 'button-test-id';
      function TestComponent() {
        const { getRootProps } = useButton({});
        return <button {...getRootProps({ 'data-testid': buttonTestId })} />;
      }

      const { getByRole } = render(<TestComponent />);
      expect(getByRole('button')).to.have.attribute('data-testid', buttonTestId);
    });
  });
});
