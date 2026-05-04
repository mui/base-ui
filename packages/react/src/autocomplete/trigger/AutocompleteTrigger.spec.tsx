import { expectType } from '#test-utils';
import { Autocomplete } from '@base-ui/react/autocomplete';

<Autocomplete.Trigger />;
<Autocomplete.Trigger type="button" />;
<Autocomplete.Trigger
  nativeButton={false}
  render={<span />}
  ref={(node) => {
    expectType<HTMLElement | null, typeof node>(node);
  }}
/>;

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Autocomplete.Trigger nativeButton={false} type="button" />;
