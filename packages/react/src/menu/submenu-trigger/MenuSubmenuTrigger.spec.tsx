import { expectType } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

<Menu.SubmenuTrigger />;
<Menu.SubmenuTrigger nativeButton />;
<Menu.SubmenuTrigger nativeButton type="button" />;
<Menu.SubmenuTrigger
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Menu.SubmenuTrigger
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.SubmenuTrigger type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Menu.SubmenuTrigger nativeButton={false} type="button" />;
