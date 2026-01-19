import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { TimeField as TimeFieldBase } from '@base-ui/react/time-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<TimeField /> - Field Integration', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  function TimeField(props: TimeFieldBase.Root.Props) {
    return (
      <TimeFieldBase.Root {...props}>
        <TimeFieldBase.Input data-testid="input">
          {(section) => <TimeFieldBase.Section key={section.index} section={section} />}
        </TimeFieldBase.Input>
      </TimeFieldBase.Root>
    );
  }

  describe('Field context integration', () => {
    it('renders inside Field.Root without errors', async () => {
      await render(
        <Field.Root>
          <TimeField format={time24Format} />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('propagates name from Field context', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="appointmentTime">
            <TimeField format={time24Format} />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector(
        'input[name="appointmentTime"]',
      ) as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('appointmentTime');
    });

    it('local name prop takes precedence over Field context name', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="fieldname">
            <TimeField format={time24Format} name="localname" />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector('input[name="localname"]') as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('localname');
    });

    it('works without Field context (standalone mode)', async () => {
      await render(<TimeField format={time24Format} name="standaloneField" />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });
  });

  describe('Basic functionality', () => {
    it('renders with defaultValue', async () => {
      await render(
        <TimeField format={time24Format} defaultValue={adapter.date('2024-01-15T14:30', 'default')} />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('renders with null value', async () => {
      await render(<TimeField format={time24Format} value={null} />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('renders disabled', async () => {
      await render(<TimeField format={time24Format} disabled />);

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('data-disabled', '');
    });

    it('renders readOnly', async () => {
      await render(<TimeField format={time24Format} readOnly />);

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('data-readonly', '');
    });
  });
});
