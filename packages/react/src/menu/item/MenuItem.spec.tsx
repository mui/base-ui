import { expectType } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

<Menu.Item />;
<Menu.Item nativeButton />;
<Menu.Item nativeButton type="button" />;
<Menu.Item
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Menu.Item
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.Item type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.Item nativeButton={false} type="button" />;
