import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root>
          {node}
          <Select.Trigger />
          <Select.Portal>
            <Select.Positioner />
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  describe('prop: render', () => {
    it('labels the trigger with the id of the render element', async () => {
      await render(
        <Select.Root>
          <Select.Label render={<div id="custom" />}>Fruit</Select.Label>
          <Select.Trigger />
        </Select.Root>,
      );

      expect(screen.getByText('Fruit')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Select.Root>
          <Select.Label render={<div id={undefined} />}>Fruit</Select.Label>
          <Select.Trigger />
        </Select.Root>,
      );

      expect(screen.getByText('Fruit')).not.toHaveAttribute('id');
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-labelledby');
    });
  });
});
