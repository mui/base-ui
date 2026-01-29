import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { DateField as DateFieldBase } from '@base-ui/react/date-field';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<DateField /> - Field Integration', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  function DateField(props: DateFieldBase.Root.Props) {
    return (
      <DateFieldBase.Root {...props} data-testid="input">
        {(section) => <DateFieldBase.Section key={section.index} section={section} />}
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

    it('Field context name takes precedence over local name prop', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="fieldname">
            <DateField format={numericDateFormat} name="localname" />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector('input[tabindex="-1"]') as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      // Field context name takes precedence (like NumberField and Checkbox)
      expect(hiddenInput.name).to.equal('fieldname');
    });

    it('works without Field context (standalone mode)', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          name="standaloneField"
          defaultValue={adapter.date('2024-03-20', 'default')}
        />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display the correct values
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3); // month, day, year
      expect(sections[0]).to.have.attribute('aria-valuenow', '3'); // month = 03
      expect(sections[1]).to.have.attribute('aria-valuenow', '20'); // day = 20
      expect(sections[2]).to.have.attribute('aria-valuenow', '2024'); // year = 2024

      // Assert the hidden input has the correct name and value
      const hiddenInput = document.querySelector(
        'input[name="standaloneField"]',
      ) as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('standaloneField');
      expect(hiddenInput.value).to.equal('2024-03-20');
    });
  });

  describe('Basic functionality', () => {
    it('renders with defaultValue', async () => {
      await render(
        <DateField
          format={numericDateFormat}
          defaultValue={adapter.date('2024-01-15', 'default')}
        />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display the correct values
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3); // month, day, year
      expect(sections[0]).to.have.attribute('aria-valuenow', '1'); // month = 01
      expect(sections[1]).to.have.attribute('aria-valuenow', '15'); // day = 15
      expect(sections[2]).to.have.attribute('aria-valuenow', '2024'); // year = 2024

      // Assert the hidden input has the correct ISO string value
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('2024-01-15');
    });

    it('renders with null value', async () => {
      await render(<DateField format={numericDateFormat} value={null} />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections are empty (no aria-valuenow when empty)
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3); // month, day, year
      expect(sections[0]).not.to.have.attribute('aria-valuenow');
      expect(sections[1]).not.to.have.attribute('aria-valuenow');
      expect(sections[2]).not.to.have.attribute('aria-valuenow');

      // Assert the hidden input is empty
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('');
    });

    it('renders disabled', async () => {
      await render(<DateField format={numericDateFormat} disabled />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are disabled
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('renders readOnly', async () => {
      await render(<DateField format={numericDateFormat} readOnly />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are readonly
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-readonly', 'true');
      });
    });

    it('forwards id prop to hidden input', async () => {
      await render(<DateField format={numericDateFormat} id="custom-id" />);

      const hiddenInput = document.querySelector('input[id="custom-id"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.id).to.equal('custom-id');
    });

    it('forwards inputRef to hidden input', async () => {
      const inputRef = { current: null as HTMLInputElement | null };

      await render(<DateField format={numericDateFormat} inputRef={inputRef} />);

      expect(inputRef.current).not.to.equal(null);
      expect(inputRef.current).to.be.instanceOf(HTMLInputElement);
    });
  });

  describe('Component rendering with various formats', () => {
    it('should render with MM/DD/YYYY format', async () => {
      await render(<DateField format={numericDateFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3);

      // Verify sections are editable (not disabled/readonly)
      sections.forEach((section) => {
        expect(section).not.to.have.attribute('aria-disabled', 'true');
        expect(section).not.to.have.attribute('aria-readonly', 'true');
      });

      // Verify format matches MM/DD/YYYY pattern
      expect(sections[0]).to.have.attribute('aria-label', 'Month');
      expect(sections[1]).to.have.attribute('aria-label', 'Day');
      expect(sections[2]).to.have.attribute('aria-label', 'Year');
    });

    it('should render with letter month format (MMM DD, YYYY)', async () => {
      const monthNameFormat = `${adapter.formats.month3Letters} ${adapter.formats.dayOfMonthPadded}, ${adapter.formats.yearPadded}`;
      await render(<DateField format={monthNameFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3);

      // Verify format matches MMM DD, YYYY pattern
      expect(sections[0]).to.have.attribute('aria-label', 'Month');
      expect(sections[1]).to.have.attribute('aria-label', 'Day');
      expect(sections[2]).to.have.attribute('aria-label', 'Year');
    });

    it('should render with DD/MM/YYYY format', async () => {
      const europeanDateFormat = `${adapter.formats.dayOfMonthPadded}/${adapter.formats.monthPadded}/${adapter.formats.yearPadded}`;
      await render(<DateField format={europeanDateFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3);

      // Verify format matches DD/MM/YYYY pattern
      expect(sections[0]).to.have.attribute('aria-label', 'Day');
      expect(sections[1]).to.have.attribute('aria-label', 'Month');
      expect(sections[2]).to.have.attribute('aria-label', 'Year');
    });

    it('should accept value through controlled prop', async () => {
      const testDate = adapter.date('2024-03-15', 'default');
      await render(<DateField format={numericDateFormat} value={testDate} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3);

      // Verify the value is displayed
      expect(sections[0]).to.have.attribute('aria-valuenow', '3'); // March
      expect(sections[1]).to.have.attribute('aria-valuenow', '15'); // Day
      expect(sections[2]).to.have.attribute('aria-valuenow', '2024'); // Year

      // Verify hidden input has the ISO value
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('2024-03-15');
    });
  });

  describe('Form submission', () => {
    it('submits the value in native date format (YYYY-MM-DD) via onFormSubmit', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="birthdate">
            <DateField
              format={numericDateFormat}
              defaultValue={adapter.date('2024-03-20', 'default')}
            />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(handleSubmit.firstCall.args[0].birthdate).to.equal('2024-03-20');
    });

    it('submits empty string when value is null', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="birthdate">
            <DateField format={numericDateFormat} defaultValue={null} />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(handleSubmit.firstCall.args[0].birthdate).to.equal('');
    });

    it('validates with rangeUnderflow when date is before minDate', async () => {
      const handleSubmit = spy();
      const minDate = adapter.date('2024-03-15', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="date">
            <DateField
              format={numericDateFormat}
              defaultValue={adapter.date('2024-03-10', 'default')}
              minDate={minDate}
            />
            <Field.Error match="rangeUnderflow" data-testid="error">
              Date is too early
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('Date is too early');
    });

    it('validates with rangeOverflow when date is after maxDate', async () => {
      const handleSubmit = spy();
      const maxDate = adapter.date('2024-03-15', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="date">
            <DateField
              format={numericDateFormat}
              defaultValue={adapter.date('2024-03-20', 'default')}
              maxDate={maxDate}
            />
            <Field.Error match="rangeOverflow" data-testid="error">
              Date is too late
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('Date is too late');
    });
  });

  describe('Controlled value updates', () => {
    it('should update displayed sections when value prop changes', async () => {
      const { setProps } = await render(
        <DateField format={numericDateFormat} value={adapter.date('2024-01-15', 'default')} />,
      );

      let sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-valuenow', '1');
      expect(sections[1]).to.have.attribute('aria-valuenow', '15');

      await setProps({ value: adapter.date('2024-06-20', 'default') });

      sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-valuenow', '6');
      expect(sections[1]).to.have.attribute('aria-valuenow', '20');
    });

    it('should update hidden input when value prop changes', async () => {
      const { setProps } = await render(
        <DateField format={numericDateFormat} value={adapter.date('2024-01-15', 'default')} />,
      );

      let hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.value).to.equal('2024-01-15');

      await setProps({ value: adapter.date('2024-06-20', 'default') });

      hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.value).to.equal('2024-06-20');
    });
  });

  describe('Form validation - required', () => {
    it('should show valueMissing error when required and empty', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="date">
            <DateField format={numericDateFormat} required />
            <Field.Error match="valueMissing" data-testid="error">
              Date is required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('Date is required');
    });

    it('should not show valueMissing error when required and filled', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="date">
            <DateField
              format={numericDateFormat}
              required
              defaultValue={adapter.date('2024-03-15', 'default')}
            />
            <Field.Error match="valueMissing" data-testid="error">
              Date is required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(screen.queryByTestId('error')).to.equal(null);
    });
  });

  describe('Hidden input attributes', () => {
    it('should set type="date" on hidden input', async () => {
      await render(<DateField format={numericDateFormat} />);

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.type).to.equal('date');
    });

    it('should set min attribute when minDate is provided', async () => {
      await render(
        <DateField format={numericDateFormat} minDate={adapter.date('2024-01-01', 'default')} />,
      );

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.min).to.equal('2024-01-01');
    });

    it('should set max attribute when maxDate is provided', async () => {
      await render(
        <DateField format={numericDateFormat} maxDate={adapter.date('2024-12-31', 'default')} />,
      );

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.max).to.equal('2024-12-31');
    });
  });
});
