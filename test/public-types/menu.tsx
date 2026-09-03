import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

export type MenuRootProps = Menu.Root.Props;
export type MenuRootActions = Menu.Root.Actions;
export type MenuRootChangeEventReason = Menu.Root.ChangeEventReason;
export type MenuRootChangeEventDetails = Menu.Root.ChangeEventDetails;
export type MenuRootOrientation = Menu.Root.Orientation;

export interface SimpleMenuProps extends Omit<MenuRootProps, 'children'> {
  label?: string;
}

export function InternalSubmenuPropsStayHidden() {
  // @ts-expect-error virtual focus is internal to Menu.FilterRoot
  return <Menu.SubmenuRoot virtualFocus />;
}

const filterHandle = Menu.createHandle<{ id: number }>({ filterable: true });

export function TypedFilterRootTrigger() {
  return (
    <React.Fragment>
      <Menu.FilterRoot handle={filterHandle}>
        {({ payload }) => <span>{payload?.id}</span>}
      </Menu.FilterRoot>
      <Menu.Trigger handle={filterHandle} payload={{ id: 1 }}>
        Open
      </Menu.Trigger>
      {/* @ts-expect-error the payload must match the handle */}
      <Menu.Trigger handle={filterHandle} payload="wrong">
        Invalid
      </Menu.Trigger>
    </React.Fragment>
  );
}

export type MenuFilterFunction = Menu.FilterRoot.Props['filter'];
export type MenuFilterUtils = ReturnType<typeof Menu.useFilter>;
