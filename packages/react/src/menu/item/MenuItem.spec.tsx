import { Menu } from '@base-ui/react/menu';

<Menu.Item />;
<Menu.Item nativeButton />;
<Menu.Item nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.Item type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.Item nativeButton={false} type="button" />;
