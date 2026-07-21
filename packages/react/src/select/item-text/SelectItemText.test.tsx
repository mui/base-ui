import { expect, vi } from 'vitest';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.ItemText />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.ItemText />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Positioner>
            <Select.Item value="">{node}</Select.Item>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Select.Item>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Select.Root open>
            <Select.Positioner>
              <Select.ItemText />
            </Select.Positioner>
          </Select.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: SelectItemContext is missing. SelectItem parts must be placed within <Select.Item>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
