import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, screen, fireEvent } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { GenericHTMLProps } from '../../utils/types';

describe('useMenuItem', () => {
  const { render } = createRenderer();

  describe('getRootProps', () => {
    it('returns props for root slot', () => {
      function TestMenuItem() {
        const rootRef = React.createRef<HTMLElement>();
        const { dispatch } = useMenuRootContext();
        const { getRootProps } = useMenuItem({
          rootRef,
          id: 'test-menu-item-1',
          highlighted: false,
          dispatch,
          disabled: false,
        });

        return <div {...getRootProps()} />;
      }

      function Test() {
        return (
          <Menu.Root>
            <Menu.Popup>
              <TestMenuItem />
            </Menu.Popup>
          </Menu.Root>
        );
      }

      const { getByRole } = render(<Test />);

      const menuItem = getByRole('menuitem');
      expect(menuItem).not.to.equal(null);
    });

    it('forwards external props including event handlers', () => {
      const handleClick = spy();

      function TestMenuItem() {
        const rootRef = React.createRef<HTMLElement>();
        const { dispatch } = useMenuRootContext();
        const { getRootProps } = useMenuItem({
          rootRef,
          id: 'test-menu-item-1',
          highlighted: false,
          dispatch,
          disabled: false,
        });
        return (
          <div
            {...getRootProps({
              'data-testid': 'test-menu-item',
              onClick: handleClick,
            } as GenericHTMLProps)}
          />
        );
      }

      function Test() {
        return (
          <Menu.Root>
            <Menu.Popup>
              <TestMenuItem />
            </Menu.Popup>
          </Menu.Root>
        );
      }

      render(<Test />);

      const menuItem = screen.getByTestId('test-menu-item');
      expect(menuItem).not.to.equal(null);

      fireEvent.click(menuItem);
      expect(handleClick.callCount).to.equal(1);
    });
  });
});
