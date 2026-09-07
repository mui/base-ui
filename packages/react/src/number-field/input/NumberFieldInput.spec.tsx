import { expectType } from '#test-utils';
import { NumberField } from '@base-ui/react/number-field';

// `NumberField.Input` exposes the native `<input>` props in its `render` callback.
<NumberField.Input
  render={(props) => {
    expectType<boolean | undefined, typeof props.disabled>(props.disabled);
    expectType<boolean | undefined, typeof props.readOnly>(props.readOnly);
    return <input {...props} />;
  }}
/>;
