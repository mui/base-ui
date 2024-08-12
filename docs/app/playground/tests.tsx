import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
export default function Test() {
  return (
    <Menu.Root open>
      <Menu.Positioner>
        <Menu.Popup>
          <Menu.Item>Aa</Menu.Item>
          <Menu.Item>Ba</Menu.Item>
          <Menu.Item />
          <Menu.Item>
            <div>Nested Content</div>
          </Menu.Item>
          <Menu.Item>{undefined}</Menu.Item>
          <Menu.Item>{null}</Menu.Item>
          <Menu.Item>Bc</Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>
  );
}
