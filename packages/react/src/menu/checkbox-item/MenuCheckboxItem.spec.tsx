import { expectType } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

<Menu.CheckboxItem />;
<Menu.CheckboxItem nativeButton />;
<Menu.CheckboxItem nativeButton type="button" />;
<Menu.CheckboxItem
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Menu.CheckboxItem
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.CheckboxItem type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.CheckboxItem nativeButton={false} type="button" />;
