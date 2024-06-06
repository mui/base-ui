import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import { MenuRootContext, MenuRootContextValue, useMenuTrigger } from '@base_ui/react/Menu';

const testContext: MenuRootContextValue = {
  dispatch: () => {},
  popupId: 'menu-popup',
  registerPopup: () => {},
  registerTrigger: () => {},
  state: { open: true, changeReason: null },
  triggerElement: null,
};

describe('useMenuButton', () => {
  const { render } = createRenderer();

  describe('getRootProps', () => {
    it('returns props for root slot', () => {
      function TestMenuButton() {
        const { getRootProps } = useMenuTrigger();
        return <div {...getRootProps()} />;
      }

      function Test() {
        return (
          <MenuRootContext.Provider value={testContext}>
            <TestMenuButton />
          </MenuRootContext.Provider>
        );
      }

      const { getByRole } = render(<Test />);

      const button = getByRole('button');
      expect(button).not.to.equal(null);
    });

    it('forwards external props including event handlers', () => {
      const handleClick = spy();

      function TestMenuButton() {
        const { getRootProps } = useMenuTrigger();
        return (
          <div {...getRootProps({ 'data-testid': 'test-menu-button', onClick: handleClick })} />
        );
      }

      function Test() {
        return (
          <MenuRootContext.Provider value={testContext}>
            <TestMenuButton />
          </MenuRootContext.Provider>
        );
      }

      render(<Test />);

      const button = screen.getByTestId('test-menu-button');
      expect(button).not.to.equal(null);

      fireEvent.click(button);
      expect(handleClick.callCount).to.equal(1);
    });
  });
});
