import { Menu } from '@base-ui/react/menu';

<Menu.CheckboxItem />;
<Menu.CheckboxItem nativeButton />;
<Menu.CheckboxItem nativeButton type="button" />;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.CheckboxItem type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.CheckboxItem nativeButton={false} type="button" />;
