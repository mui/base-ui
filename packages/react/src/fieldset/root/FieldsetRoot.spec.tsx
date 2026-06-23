import { expectType } from '#test-utils';
import { Fieldset } from '@base-ui/react/fieldset';

// `Fieldset.Root` exposes the native `<fieldset>` props in its `render` callback.
<Fieldset.Root
  render={(props) => {
    expectType<boolean | undefined, typeof props.disabled>(props.disabled);
    return <fieldset {...props} />;
  }}
/>;
