import { expectType } from '#test-utils';
import { OTPField } from '@base-ui/react/otp-field';
import { REASONS } from '../../utils/reasons';

type OTPFieldChangeHandler = NonNullable<OTPField.Root.Props['onValueChange']>;
type OTPFieldChangeDetails = Parameters<OTPFieldChangeHandler>[1];
type OTPFieldCompleteHandler = NonNullable<OTPField.Root.Props['onValueComplete']>;
type OTPFieldCompleteDetails = Parameters<OTPFieldCompleteHandler>[1];

function assertOTPFieldChange(details: OTPFieldChangeDetails) {
  if (details.reason === REASONS.inputPaste) {
    const event: ClipboardEvent = details.event;
    void event;
  }

  if (details.reason === REASONS.keyboard) {
    const event: KeyboardEvent = details.event;
    void event;
  }

  if (details.reason === REASONS.inputChange) {
    const event: InputEvent | Event = details.event;
    void event;
  }
}

const handleOTPFieldChange: OTPFieldChangeHandler = (value, details) => {
  expectType<string, typeof value>(value);
  assertOTPFieldChange(details);
};

function assertOTPFieldComplete(details: OTPFieldCompleteDetails) {
  if (details.reason === REASONS.inputPaste) {
    const event: ClipboardEvent = details.event;
    void event;
  }

  if (details.reason === REASONS.keyboard) {
    const event: KeyboardEvent = details.event;
    void event;
  }

  if (details.reason === REASONS.inputChange) {
    const event: InputEvent | Event = details.event;
    void event;
  }
}

const handleOTPFieldComplete: OTPFieldCompleteHandler = (value, details) => {
  expectType<string, typeof value>(value);
  assertOTPFieldComplete(details);
};

const otpFieldEventNarrowing = (
  <OTPField.Root
    length={6}
    form="verification-form"
    mask
    validationType="alphanumeric"
    sanitizeValue={(value) => value.toUpperCase()}
    onValueChange={handleOTPFieldChange}
    onValueComplete={handleOTPFieldComplete}
  />
);
void otpFieldEventNarrowing;

// @ts-expect-error - length is required
const requiresLength = <OTPField.Root />;
void requiresLength;

// @ts-expect-error - input mode is fixed internally
const noInputModeOverride = <OTPField.Root length={6} inputMode="tel" />;
void noInputModeOverride;
