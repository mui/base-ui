import * as React from 'react';
import { expect } from 'chai';
import { FloatingRootContext } from '@floating-ui/react';
import userEvent from '@testing-library/user-event';
import { act, createRenderer } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance } from '../../../test';
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
  getPositionerProps: () => ({}),
  getTriggerProps: () => ({}),
  getItemProps: () => ({}),
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
    it('should render a disabled button', () => {
      const { getByRole } = render(
        <Menu.Root>
          <Menu.Trigger disabled />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.property('disabled', true);
    });

    it('should not open the menu when clicked', () => {
      const { getByRole, queryByRole } = render(
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
    it('has the aria-disabled instead of disabled attribute when disabled', () => {
      const { getByRole } = render(
        <Menu.Root>
          <Menu.Trigger disabled focusableWhenDisabled />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-disabled');
      expect(button).not.to.have.attribute('disabled');
    });

    it('can receive focus when focusableWhenDisabled is set', () => {
      const { getByRole } = render(
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

  it('toggles the menu state when clicked', () => {
    const { getByRole, queryByRole } = render(
      <Menu.Root>
        <Menu.Trigger />
        <Menu.Popup />
      </Menu.Root>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuPopup = queryByRole('menu', { hidden: false });
    expect(menuPopup).not.to.equal(null);

    expect(menuPopup).to.have.attribute('data-state', 'open');
  });

  describe('keyboard navigation', () => {
    [<Menu.Trigger />, <Menu.Trigger render={<span />} />].forEach((buttonComponent) => {
      const buttonType = buttonComponent.props.slots?.root ? 'non-native' : 'native';
      ['ArrowUp', 'ArrowDown'].forEach((key) =>
        it(`opens the menu when pressing "${key}" on a ${buttonType} button`, async () => {
          const user = userEvent.setup();

          const { getByRole, queryByRole } = render(
            <Menu.Root>
              {buttonComponent}
              <Menu.Popup />
            </Menu.Root>,
          );

          const button = getByRole('button');
          act(() => {
            button.focus();
          });

          await user.keyboard(`{${key}}`);

          const menuPopup = queryByRole('menu', { hidden: false });
          expect(menuPopup).not.to.equal(null);
        }),
      );

      ['Enter', ' '].forEach((key) =>
        it(`opens the menu when pressing "${key}" on a ${buttonType} button`, async () => {
          const user = userEvent.setup();

          const { getByRole, queryByRole } = render(
            <Menu.Root>
              {buttonComponent}
              <Menu.Popup />
            </Menu.Root>,
          );

          const button = getByRole('button');
          act(() => {
            button.focus();
          });

          await user.keyboard(`{${key}}`);

          const menuPopup = queryByRole('menu', { hidden: false });
          expect(menuPopup).not.to.equal(null);
        }),
      );
    });
  });

  describe('accessibility attributes', () => {
    it('has the aria-haspopup attribute', () => {
      const { getByRole } = render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-haspopup');
    });

    it('has the aria-expanded=false attribute when closed', () => {
      const { getByRole } = render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'false');
    });

    it('has the aria-expanded=true attribute when open', () => {
      const { getByRole } = render(
        <Menu.Root open>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'true');
    });

    it('has the aria-controls attribute', () => {
      const { getByRole } = render(
        <Menu.Root>
          <Menu.Trigger />
          <Menu.Popup id="menu-popup" />
        </Menu.Root>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-controls', 'menu-popup');
    });
  });
});
