import * as React from 'react';
import { expect } from 'chai';
import {
  act,
  createRenderer,
  flushMicrotasks,
  MuiRenderResult,
  RenderOptions,
} from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext, MenuPopupProvider, useMenuPopup } from '@base_ui/react/Menu';
import { Unstable_Popup as Popup } from '@base_ui/react/legacy/Unstable_Popup';

describe('<Dropdown />', () => {
  const { render: internalRender } = createRenderer();

  async function render(
    element: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    options?: RenderOptions,
  ): Promise<MuiRenderResult> {
    const rendered = internalRender(element, options);
    await flushMicrotasks();
    return rendered;
  }

  it('registers a popup id correctly', async () => {
    function TestComponent() {
      const { registerPopup, popupId } = React.useContext(MenuRootContext)!;
      expect(context).not.to.equal(null);

      React.useEffect(() => {
        registerPopup('test-popup');
      }, [registerPopup]);

      return <p>{popupId}</p>;
    }

    const { container } = await render(
      <Menu.Root>
        <TestComponent />
      </Menu.Root>,
    );

    expect(container.innerHTML).to.equal('<p>test-popup</p>');
  });

  it('registers a trigger element correctly', async () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('data-testid', 'test-button');

    function TestComponent() {
      const { registerTrigger, triggerElement } = React.useContext(MenuRootContext)!;
      expect(context).not.to.equal(null);

      React.useEffect(() => {
        registerTrigger(trigger);
      }, [registerTrigger]);

      return <p>{triggerElement?.getAttribute('data-testid')}</p>;
    }

    const { container } = await render(
      <Menu.Root>
        <TestComponent />
      </Menu.Root>,
    );

    expect(container.innerHTML).to.equal('<p>test-button</p>');
  });

  it('focuses the first item after the menu is opened', async () => {
    const { getByRole, getAllByRole } = await render(
      <div>
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Popup>
            <Menu.Item>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
            <Menu.Item>Three</Menu.Item>
          </Menu.Popup>
        </Menu.Root>
      </div>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuItems = getAllByRole('menuitem');

    await flushMicrotasks();

    expect(menuItems[0]).toHaveFocus();
  });

  it('should focus on second item when 1st item is disabled and disabledItemsFocusable set to false', async () => {
    const CustomMenu = React.forwardRef(function CustomMenu(
      props: React.ComponentPropsWithoutRef<'ul'>,
      ref: React.Ref<HTMLUListElement>,
    ) {
      const { children, ...other } = props;

      const { open, triggerElement, contextValue, getListboxProps } = useMenuPopup({
        listboxRef: ref,
        disabledItemsFocusable: false,
      });

      return (
        <Popup open={open} anchor={triggerElement}>
          <ul className="menu-root" {...other} {...getListboxProps()}>
            <MenuPopupProvider value={contextValue}>{children}</MenuPopupProvider>
          </ul>
        </Popup>
      );
    });

    const { getByRole, getAllByRole } = await render(
      <div>
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <CustomMenu>
            <Menu.Item disabled>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
            <Menu.Item>Three</Menu.Item>
          </CustomMenu>
        </Menu.Root>
      </div>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuItems = getAllByRole('menuitem');

    await flushMicrotasks();

    expect(menuItems[1]).toHaveFocus();
  });

  it('focuses the trigger after the menu is closed', async () => {
    const { getByRole } = await render(
      <div>
        <input type="text" />
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Popup>
            <Menu.Item>Close</Menu.Item>
          </Menu.Popup>
        </Menu.Root>
        <input type="text" />
      </div>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuItem = getByRole('menuitem');

    await flushMicrotasks();

    act(() => {
      menuItem.click();
    });

    expect(button).toHaveFocus();
  });
});
