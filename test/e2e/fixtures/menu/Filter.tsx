import { Menu } from '@base-ui/react/menu';

export default function FilterMenu() {
  return (
    <Menu.FilterProvider>
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Input aria-label="Filter actions" />
              <Menu.List>
                <Menu.Item>New file</Menu.Item>
                <Menu.Item>Save</Menu.Item>
                <Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger>Move to folder</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Input aria-label="Filter folders" />
                          <Menu.List>
                            <Menu.Item>Desktop</Menu.Item>
                            <Menu.Item>Projects</Menu.Item>
                          </Menu.List>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.FilterProvider>
                <Menu.CheckboxItem>Keep available offline</Menu.CheckboxItem>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}
