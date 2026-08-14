import { expectType } from '#test-utils';
import { OTPField } from '@base-ui/react/otp-field';

// @ts-expect-error - slot order is inferred from render order
const noExplicitIndexSupport = <OTPField.Input index={0} />;
void noExplicitIndexSupport;

// `OTPField.Input` exposes the native `<input>` props in its `render` callback.
<OTPField.Input
  render={(props) => {
    expectType<boolean | undefined, typeof props.disabled>(props.disabled);
    expectType<boolean | undefined, typeof props.readOnly>(props.readOnly);
    return <input {...props} />;
  }}
/>;
