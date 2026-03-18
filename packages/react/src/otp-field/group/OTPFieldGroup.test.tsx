import { OTPField } from '@base-ui/react/otp-field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<OTPField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<OTPField.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<OTPField.Root length={1}>{node}</OTPField.Root>);
    },
  }));
});
