import { Menu } from '@base-ui/react/menu';

<Menu.RadioItem value="one" />;
<Menu.RadioItem value="one" nativeButton />;
<Menu.RadioItem value="one" nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.RadioItem value="one" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.RadioItem value="one" nativeButton={false} type="button" />;
