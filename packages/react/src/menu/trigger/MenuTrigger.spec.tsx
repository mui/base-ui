import { Menu } from '@base-ui/react/menu';

<Menu.Trigger>Open</Menu.Trigger>;
<Menu.Trigger type="button">Open</Menu.Trigger>;
<Menu.Trigger nativeButton={false} render={<span />} />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.Trigger nativeButton={false} type="button">
  Open
</Menu.Trigger>;
