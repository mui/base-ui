import { expect, describe, it } from 'vitest';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { NumberField } from '@base-ui/react/number-field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NumberField.Decrement />', () => {
  const { render } = createRenderer();

  describeConformance(<NumberField.Decrement />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testRenderPropWith: 'button',
    button: true,
    render(node) {
      return render(<NumberField.Root>{node}</NumberField.Root>);
    },
  }));

  describe('prop: snapOnStep', () => {
    it('should decrement by exact step without rounding when snapOnStep is false', async () => {
      await render(
        <NumberField.Root defaultValue={2.7} step={2} snapOnStep={false}>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).toHaveValue((0.7).toLocaleString());
    });

    it('should snap on decrement when snapOnStep is true', async () => {
      await render(
        <NumberField.Root defaultValue={1.3} snapOnStep>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).toHaveValue('1');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '1.9' } });
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).toHaveValue('1');

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '-0.2' } });
      fireEvent.click(button);

      expect(screen.getByRole('textbox')).toHaveValue('-1');
    });

    it('should decrement with respect to the min value', async () => {
      await render(
        <NumberField.Root defaultValue={8} min={1} step={2} snapOnStep>
          <NumberField.Decrement />
          <NumberField.Input />
        </NumberField.Root>,
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      fireEvent.click(button);
      expect(input).toHaveValue('7');

      fireEvent.click(button);
      expect(input).toHaveValue('5');

      fireEvent.change(input, { target: { value: '9.112' } });
      fireEvent.click(button);
      expect(input).toHaveValue('9');

      fireEvent.change(input, { target: { value: '1.112' } });
      fireEvent.click(button);
      expect(input).toHaveValue('1');
    });
  });
});
