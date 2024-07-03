import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { act, createRenderer } from '@mui/internal-test-utils';
import { MenuButton, menuButtonClasses } from '@base_ui/react/legacy/MenuButton';
import {
  DropdownContext,
  DropdownContextValue,
  DropdownActionTypes,
} from '@base_ui/react/legacy/useDropdown';
import { describeConformanceUnstyled } from '../../../test/describeConformanceUnstyled';

const testContext: DropdownContextValue = {
  dispatch: () => {},
  popupId: 'menu-popup',
  registerPopup: () => {},
  registerTrigger: () => {},
  state: { open: true, changeReason: null },
  triggerElement: null,
};

describe('<MenuButton />', () => {
  const { render } = createRenderer();

  describeConformanceUnstyled(<MenuButton />, () => ({
    inheritComponent: 'button',
    render: (node) => {
      return render(
        <DropdownContext.Provider value={testContext}>{node}</DropdownContext.Provider>,
      );
    },
    refInstanceof: window.HTMLButtonElement,
    slots: {
      root: {
        expectedClassName: menuButtonClasses.root,
        testWithElement: null,
      },
    },
    skip: ['componentProp', 'reactTestRenderer'],
  }));

  describe('prop: disabled', () => {
    it('should render a disabled button', () => {
      const { getByRole } = render(
        <DropdownContext.Provider value={testContext}>
          <MenuButton disabled />
        </DropdownContext.Provider>,
      );

      const button = getByRole('button');
      expect(button).to.have.property('disabled', true);
    });

    it('should not open the menu when clicked', () => {
      const dispatchSpy = spy();
      const context = {
        ...testContext,
        state: { open: false, changeReason: null },
        dispatch: dispatchSpy,
      };

      const { getByRole } = render(
        <DropdownContext.Provider value={context}>
          <MenuButton disabled />
        </DropdownContext.Provider>,
      );

      const button = getByRole('button');
      button.click();

      expect(dispatchSpy.called).to.equal(false);
    });
  });

  describe('prop: focusableWhenDisabled', () => {
    it('has the aria-disabled instead of disabled attribute when disabled', () => {
      const { getByRole } = render(
        <DropdownContext.Provider value={testContext}>
          <MenuButton disabled focusableWhenDisabled />
        </DropdownContext.Provider>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-disabled');
      expect(button).not.to.have.attribute('disabled');
    });

    it('can receive focus when focusableWhenDisabled is set', () => {
      const { getByRole } = render(
        <DropdownContext.Provider value={testContext}>
          <MenuButton disabled focusableWhenDisabled />
        </DropdownContext.Provider>,
      );

      const button = getByRole('button');
      act(() => {
        button.focus();
      });

      expect(document.activeElement).to.equal(button);
    });
  });

  it('toggles the menu state when clicked', () => {
    const dispatchSpy = spy();
    const context = {
      ...testContext,
      state: { open: false, changeReason: null },
      dispatch: dispatchSpy,
    };

    const { getByRole } = render(
      <DropdownContext.Provider value={context}>
        <MenuButton />
      </DropdownContext.Provider>,
    );

    const button = getByRole('button');
    button.click();

    expect(dispatchSpy.calledOnce).to.equal(true);
    expect(dispatchSpy.args[0][0]).to.contain({ type: DropdownActionTypes.toggle });
  });

  describe('keyboard navigation', () => {
    [<MenuButton />, <MenuButton slots={{ root: 'span' }} />].forEach((buttonComponent) => {
      const buttonType = buttonComponent.props.slots?.root ? 'non-native' : 'native';
      ['ArrowUp', 'ArrowDown'].forEach((key) =>
        it(`opens the menu when pressing "${key}" on a ${buttonType} button`, async () => {
          const dispatchSpy = spy();
          const context = {
            ...testContext,
            state: { open: false, changeReason: null },
            dispatch: dispatchSpy,
          };

          const user = userEvent.setup();

          const { getByRole } = render(
            <DropdownContext.Provider value={context}>{buttonComponent}</DropdownContext.Provider>,
          );

          const button = getByRole('button');
          act(() => {
            button.focus();
          });

          await user.keyboard(`{${key}}`);

          expect(dispatchSpy.calledOnce).to.equal(true);
          expect(dispatchSpy.args[0][0]).to.contain({ type: DropdownActionTypes.open });
        }),
      );

      ['Enter', ' '].forEach((key) =>
        it(`opens the menu when pressing "${key}" on a ${buttonType} button`, async () => {
          const dispatchSpy = spy();
          const context = {
            ...testContext,
            state: { open: false, changeReason: null },
            dispatch: dispatchSpy,
          };

          const user = userEvent.setup();

          const { getByRole } = render(
            <DropdownContext.Provider value={context}>{buttonComponent}</DropdownContext.Provider>,
          );

          const button = getByRole('button');
          act(() => {
            button.focus();
          });

          await user.keyboard(`{${key}}`);

          expect(dispatchSpy.calledOnce).to.equal(true);
          expect(dispatchSpy.args[0][0]).to.contain({ type: DropdownActionTypes.toggle });
        }),
      );
    });
  });

  describe('accessibility attributes', () => {
    it('has the aria-haspopup attribute', () => {
      const { getByRole } = render(
        <DropdownContext.Provider value={testContext}>
          <MenuButton />
        </DropdownContext.Provider>,
      );

      const button = getByRole('button');
      expect(button).to.have.attribute('aria-haspopup');
    });

    it('has the aria-expanded=false attribute when closed', () => {
      const context = {
        ...testContext,
        state: { open: false, changeReason: null },
      };

      const { getByRole } = render(
        <DropdownContext.Provider value={context}>
          <MenuButton />
        </DropdownContext.Provider>,
      );
      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'false');
    });

    it('has the aria-expanded=true attribute when open', () => {
      const context = {
        ...testContext,
        state: { open: true, changeReason: null },
      };

      const { getByRole } = render(
        <DropdownContext.Provider value={context}>
          <MenuButton />
        </DropdownContext.Provider>,
      );
      const button = getByRole('button');
      expect(button).to.have.attribute('aria-expanded', 'true');
    });

    it('has the aria-controls attribute', () => {
      const { getByRole } = render(
        <DropdownContext.Provider value={testContext}>
          <MenuButton />
        </DropdownContext.Provider>,
      );
      const button = getByRole('button');
      expect(button).to.have.attribute('aria-controls', 'menu-popup');
    });
  });
});
