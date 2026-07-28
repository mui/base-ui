import { expect, vi } from 'vitest';
import { Switch } from '@base-ui/react/switch';
import { createRenderer, describeConformance } from '#test-utils';
import { SwitchRootContext } from '../root/SwitchRootContext';

const testContext: SwitchRootContext = {
  checked: false,
  disabled: false,
  readOnly: false,
  required: false,
  dirty: false,
  touched: false,
  filled: false,
  focused: false,
  valid: null,
};

describe('<Switch.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<Switch.Thumb />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render: (node) => {
      return render(
        <SwitchRootContext.Provider value={testContext}>{node}</SwitchRootContext.Provider>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Switch.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Switch.Thumb />)).rejects.toThrow(
        'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
