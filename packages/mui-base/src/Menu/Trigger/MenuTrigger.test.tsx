import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import userEvent from '@testing-library/user-event';
import { act } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: null,
  nested: false,
  triggerElement: null,
  setTriggerElement: () => {},
  setPositionerElement: () => {},
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: () => {},
  clickAndDragEnabled: false,
  setClickAndDragEnabled: () => {},
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
};

describe('<Menu.Trigger />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describeConformance(<Menu.Trigger />, () => ({
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>{node}</MenuRootContext.Provider>
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLButtonElement,
  }));

  describe('prop: disabled', () => {
    it('should render a disabled button', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger disabled />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.property('disabled', true);
    });

    it('should not open the menu when clicked', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger disabled />
          <Menu.Positioner>
            <Menu.Popup />
          </Menu.Positioner>
        </Menu.Root>,
      );

      const button = getByRole('button');
      await user.click(button);

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });
  });

  it('toggles the menu state when clicked', async () => {
    const { getByRole, queryByRole } = await render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Popup />
        </Menu.Positioner>
      </Menu.Root>,
    );

    const button = getByRole('button', { name: 'Open' });
    await user.click(button);

    const menuPopup = queryByRole('menu', { hidden: false });
    expect(menuPopup).not.to.equal(null);

    expect(menuPopup).to.have.attribute('data-menu', 'open');
  });

  describe('keyboard navigation', () => {
    [
      <Menu.Trigger>Open</Menu.Trigger>,
      <Menu.Trigger render={<span />}>Open</Menu.Trigger>,
    ].forEach((buttonComponent) => {
      const buttonType = buttonComponent.props.slots?.root ? 'non-native' : 'native';
      ['ArrowUp', 'ArrowDown', 'Enter', ' '].forEach((key) => {
        if (buttonType === 'native' && (key === ' ' || key === 'Enter')) {
          return;
        }

        it(`opens the menu when pressing "${key}" on a ${buttonType} button`, async () => {
          const { getByRole, queryByRole } = await render(
            <Menu.Root>
              {buttonComponent}
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Root>,
          );

          const button = getByRole('button', { name: 'Open' });
          await act(() => {
            button.focus();
          });

          await user.keyboard(`[${key}]`);

          const menuPopup = queryByRole('menu', { hidden: false });
          expect(menuPopup).not.to.equal(null);
        });
      });
    });
  });

  describe('accessibility attributes', () => {
    it('has the aria-haspopup attribute', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-haspopup');
    });

    it('has the aria-expanded=false attribute when closed', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'false');
    });

    it('has the aria-expanded=true attribute when open', async () => {
      const { getByRole } = await render(
        <Menu.Root open>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'true');
    });
  });
});
