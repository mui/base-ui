import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext } from '@floating-ui/react';
import userEvent from '@testing-library/user-event';
import { act } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';
import { IndexableMap } from '../../utils/IndexableMap';

const testContext: MenuRootContext = {
  dispatch: () => {},
  state: {
    open: true,
    items: new IndexableMap(),
    highlightedValue: null,
    selectedValues: [],
    popupId: 'menu-popup',
    triggerElement: null,
    positionerElement: null,
    hasNestedMenuOpen: false,
    clickAndDragging: false,
    settings: {
      disabledItemsFocusable: true,
      disableListWrap: false,
      focusManagement: 'DOM',
      orientation: 'vertical',
      direction: 'ltr',
      pageSize: 1,
      selectionMode: 'none',
    },
  },
  parentContext: null,
  topmostContext: null,
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  isNested: false,
};

describe('<Menu.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Trigger />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      return render(
        <MenuRootContext.Provider value={testContext}>{node}</MenuRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLButtonElement,
    skip: ['reactTestRenderer'],
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
          <Menu.Popup />
        </Menu.Root>,
      );

      const button = getByRole('button');
      button.click();

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });
  });

  describe('prop: focusableWhenDisabled', () => {
    it('has the aria-disabled instead of disabled attribute when disabled', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger disabled focusableWhenDisabled />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-disabled');
      expect(button).not.to.have.attribute('disabled');
    });

    it('can receive focus when focusableWhenDisabled is set', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger disabled focusableWhenDisabled />
        </Menu.Root>,
      );

      const button = getByRole('button');
      act(() => {
        button.focus();
      });

      expect(document.activeElement).to.equal(button);
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
    await userEvent.click(button);

    await act(async () => {});

    const menuPopup = queryByRole('menu', { hidden: false });
    expect(menuPopup).not.to.equal(null);

    expect(menuPopup).to.have.attribute('data-state', 'open');
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
          const user = userEvent.setup();

          const { getByRole, queryByRole } = await render(
            <Menu.Root>
              {buttonComponent}
              <Menu.Positioner>
                <Menu.Popup />
              </Menu.Positioner>
            </Menu.Root>,
          );

          const button = getByRole('button', { name: 'Open' });
          await act(() => {
            button.focus();
          });

          await user.keyboard(`{${key}}`);

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

    it('has the aria-controls attribute', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup id="menu-popup" />
          </Menu.Positioner>
        </Menu.Root>,
      );

      const button = getByRole('button', { name: 'Open' });
      expect(button).to.have.attribute('aria-controls', 'menu-popup');
    });
  });
});
