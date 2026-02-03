import { expectType } from '#test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';

<Autocomplete.Item />;
<Autocomplete.Item nativeButton />;
<Autocomplete.Item nativeButton type="button" />;
<Autocomplete.Item
  nativeButton
  onClick={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;
<Autocomplete.Item
  nativeButton={false}
  onClick={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Autocomplete.Item type="button" />;
// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Autocomplete.Item nativeButton={false} type="button" />;
