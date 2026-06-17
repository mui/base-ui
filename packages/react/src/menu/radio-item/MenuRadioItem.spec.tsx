import { expectType } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

<Menu.RadioItem value="one" />;
<Menu.RadioItem value="one" nativeButton />;
<Menu.RadioItem value="one" nativeButton type="button" />;
<Menu.RadioItem
  value="one"
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Menu.RadioItem
  value="one"
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.RadioItem value="one" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.RadioItem value="one" nativeButton={false} type="button" />;
