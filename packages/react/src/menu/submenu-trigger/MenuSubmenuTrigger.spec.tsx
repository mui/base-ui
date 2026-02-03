import { Menu } from '@base-ui/react/menu';

<Menu.SubmenuTrigger />;
<Menu.SubmenuTrigger nativeButton />;
<Menu.SubmenuTrigger nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.SubmenuTrigger type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.SubmenuTrigger nativeButton={false} type="button" />;
