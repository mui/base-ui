import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { DateField as DateFieldBase } from '@base-ui/react/date-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<DateField /> - Field Integration', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  function DateField(props: DateFieldBase.Root.Props) {
    return (
      <DateFieldBase.Root {...props}>
        <DateFieldBase.Input data-testid="input">
          {(section) => <DateFieldBase.Section key={section.index} section={section} />}
        </DateFieldBase.Input>
      </DateFieldBase.Root>
    );
  }

  describe('Field context integration', () => {
    it('renders inside Field.Root without errors', async () => {
      await render(
        <Field.Root>
          <DateField format={numericDateFormat} />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('propagates name from Field context', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="birthdate">
            <DateField format={numericDateFormat} />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector('input[name="birthdate"]') as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('birthdate');
    });

    it('local name prop takes precedence over Field context name', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="fieldname">
            <DateField format={numericDateFormat} name="localname" />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector('input[name="localname"]') as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('localname');
    });

    it('works without Field context (standalone mode)', async () => {
      await render(<DateField format={numericDateFormat} name="standaloneField" />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });
  });

  describe('Basic functionality', () => {
    it('renders with defaultValue', async () => {
      await render(
        <DateField format={numericDateFormat} defaultValue={adapter.date('2024-01-15', 'default')} />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('renders with null value', async () => {
      await render(<DateField format={numericDateFormat} value={null} />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('renders disabled', async () => {
      await render(<DateField format={numericDateFormat} disabled />);

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('data-disabled', '');
    });

    it('renders readOnly', async () => {
      await render(<DateField format={numericDateFormat} readOnly />);

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('data-readonly', '');
    });
  });
});
