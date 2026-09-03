import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

export type MenuRootProps = Menu.Root.Props;
export type MenuRootActions = Menu.Root.Actions;
export type MenuRootChangeEventReason = Menu.Root.ChangeEventReason;
export type MenuRootChangeEventDetails = Menu.Root.ChangeEventDetails;
export type MenuRootOrientation = Menu.Root.Orientation;
export type MenuRootHighlightEventReason = Menu.Root.HighlightEventReason;
export type MenuRootHighlightEventDetails = Menu.Root.HighlightEventDetails;

export function HighlightedItemLabel() {
  const [label, setLabel] = React.useState<string | undefined>();
  return (
    <Menu.Root
      onItemHighlighted={(item, details) => {
        setLabel(item ? details.label : undefined);
        // @ts-expect-error the reason set is closed
        return details.reason === 'focus';
      }}
    >
      {label}
    </Menu.Root>
  );
}

export interface SimpleMenuProps extends Omit<MenuRootProps, 'children'> {
  label?: string;
}

export function InternalSubmenuPropsStayHidden() {
  // @ts-expect-error virtual focus is internal to the filterable menu
  return <Menu.SubmenuRoot virtualFocus />;
}

const filterHandle = Menu.createHandle<{ id: number }>({ filterable: true });

export function TypedFilterableTrigger() {
  return (
    <React.Fragment>
      <Menu.FilterProvider>
        <Menu.Root handle={filterHandle}>{({ payload }) => <span>{payload?.id}</span>}</Menu.Root>
      </Menu.FilterProvider>
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

export type MenuFilterFunction = Menu.FilterProvider.Props['filter'];
export type MenuFilterUtils = ReturnType<typeof Menu.useFilter>;
