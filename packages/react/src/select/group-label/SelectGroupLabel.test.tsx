import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Group>{node}</Select.Group>
        </Select.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Select.Group>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Select.Root open>
            <Select.GroupLabel />
          </Select.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
