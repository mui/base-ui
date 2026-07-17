import { expectType } from '#test-utils';
import { OTPField } from '@base-ui/react/otp-field';

<OTPField.Input index={0} />;

// `OTPField.Input` exposes the native `<input>` props in its `render` callback.
<OTPField.Input
  render={(props) => {
    expectType<boolean | undefined, typeof props.disabled>(props.disabled);
    expectType<boolean | undefined, typeof props.readOnly>(props.readOnly);
    return <input {...props} />;
  }}
/>;
