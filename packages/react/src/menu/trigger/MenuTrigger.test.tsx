import * as React from 'react';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '#test-utils';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';

describe('<Menu.Trigger />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describeConformance(<Menu.Trigger />, () => ({
    render: (node) => {
      return render(<Menu.Root open>{node}</Menu.Root>);
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
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = getByRole('button');
      await user.click(button);

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });
  });

  it('toggles the menu state when clicked', async () => {
    const { getByRole, findByRole } = await render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const button = getByRole('button', { name: 'Open' });
    await user.click(button);

    const menuPopup = await findByRole('menu', { hidden: false });
    expect(menuPopup).not.to.equal(null);
    expect(menuPopup).to.have.attribute('data-open', '');
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
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>,
          );

          const button = getByRole('button', { name: 'Open' });
          await act(async () => {
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

  describe('style hooks', () => {
    it('should have the data-popup-open and data-pressed attributes when open', async () => {
      await render(
        <Menu.Root>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      await act(async () => {
        trigger.click();
      });

      expect(trigger).to.have.attribute('data-popup-open');
      expect(trigger).to.have.attribute('data-pressed');
    });
  });

  describe('impatient clicks with `openOnHover=true`', () => {
    const { clock, render: renderFakeTimers } = createRenderer();

    clock.withFakeTimers();

    it('does not close the menu if the user clicks too quickly', async () => {
      await renderFakeTimers(
        <Menu.Root delay={0} openOnHover>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseMove(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD - 1);

      fireEvent.click(trigger);

      expect(trigger).to.have.attribute('data-popup-open');
    });

    it('closes the menu if the user clicks patiently', async () => {
      await renderFakeTimers(
        <Menu.Root delay={0} openOnHover>
          <Menu.Trigger />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);

      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    it('sticks if the user clicks impatiently', async () => {
      await renderFakeTimers(
        <Menu.Root delay={0} openOnHover>
          <Menu.Trigger />
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD - 1);

      fireEvent.click(trigger);
      fireEvent.mouseLeave(trigger);

      expect(trigger).to.have.attribute('data-popup-open');

      clock.tick(1);

      expect(trigger).to.have.attribute('data-popup-open');
    });

    it('does not stick if the user clicks patiently', async () => {
      await renderFakeTimers(
        <Menu.Root delay={0} openOnHover>
          <Menu.Trigger />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.click(trigger);
      fireEvent.mouseLeave(trigger);

      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    it('should keep the menu open when re-hovered and clicked within the patient threshold', async () => {
      await render(
        <Menu.Root openOnHover delay={100}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>Content</Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      clock.tick(100);
      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(PATIENT_CLICK_THRESHOLD);

      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);

      fireEvent.click(trigger);
      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('preventBaseUIHandler', () => {
    it('prevents opening the menu with a mouse when `preventBaseUIHandler` is called in onMouseDown', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger onMouseDown={(event) => event.preventBaseUIHandler()} />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = getByRole('button');
      await user.click(button);

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });

    it('prevents opening the menu with keyboard when `preventBaseUIHandler` is called in onClick', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger onClick={(event) => event.preventBaseUIHandler()} />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const button = getByRole('button');
      await act(async () => {
        button.focus();
      });

      await user.keyboard('[Enter]');

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });
  });
});
