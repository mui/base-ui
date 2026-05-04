import { expectType } from '#test-utils';
import { Combobox } from '@base-ui/react/combobox';

<Combobox.Item value="one" />;
<Combobox.Item value="one" nativeButton />;
<Combobox.Item value="one" nativeButton type="button" />;
<Combobox.Item
  value="one"
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Combobox.Item
  value="one"
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Item value="one" type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Combobox.Item value="one" nativeButton={false} type="button" />;
