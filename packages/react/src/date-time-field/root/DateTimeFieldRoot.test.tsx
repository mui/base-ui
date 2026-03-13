import { expect } from 'chai';
import { spy } from 'sinon';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { DateTimeField as DateTimeFieldBase } from '@base-ui/react/date-time-field';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('<DateTimeField /> - Field Integration', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();
  const dateTimeFormat = `${adapter.formats.localizedNumericDate} ${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  function DateTimeField(props: DateTimeFieldBase.Root.Props) {
    return (
      <DateTimeFieldBase.Root {...props} data-testid="input">
        {(section) => <DateTimeFieldBase.Section key={section.index} section={section} />}
      </DateTimeFieldBase.Root>
    );
  }

  describe('Field context integration', () => {
    it('renders inside Field.Root without errors', async () => {
      await render(
        <Field.Root>
          <DateTimeField format={dateTimeFormat} />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);
    });

    it('propagates name from Field context', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="appointmentDateTime">
            <DateTimeField format={dateTimeFormat} />
          </Field.Root>
        </form>,
      );

      const form = screen.getByTestId<HTMLFormElement>('form');
      const hiddenInput = form.querySelector(
        'input[name="appointmentDateTime"]',
      ) as HTMLInputElement;

      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('appointmentDateTime');
    });

    it('Field context name takes precedence over local name prop', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="fieldname">
            <DateTimeField format={dateTimeFormat} name="localname" />
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
        <DateTimeField
          format={dateTimeFormat}
          name="standaloneField"
          defaultValue={adapter.date('2024-03-20T09:45', 'default')}
        />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display the correct values
      const sections = screen.getAllByRole('spinbutton');
      // Should have date sections (month, day, year) + time sections (hours, minutes)
      expect(sections.length).to.be.at.least(5);

      // Assert the hidden input has the correct name and value
      const hiddenInput = document.querySelector(
        'input[name="standaloneField"]',
      ) as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('standaloneField');
      expect(hiddenInput.value).to.equal('2024-03-20T09:45');
    });
  });

  describe('Basic functionality', () => {
    it('renders with defaultValue', async () => {
      await render(
        <DateTimeField
          format={dateTimeFormat}
          defaultValue={adapter.date('2024-01-15T14:30', 'default')}
        />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display values
      const sections = screen.getAllByRole('spinbutton');
      expect(sections.length).to.be.at.least(5); // date + time sections

      // Assert the hidden input has the correct datetime-local format
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('2024-01-15T14:30');
    });

    it('renders with null value', async () => {
      await render(<DateTimeField format={dateTimeFormat} value={null} />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections are empty (no aria-valuenow when empty)
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).not.to.have.attribute('aria-valuenow');
      });

      // Assert the hidden input is empty
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('');
    });

    it('renders disabled', async () => {
      await render(<DateTimeField format={dateTimeFormat} disabled />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are disabled
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('renders readOnly', async () => {
      await render(<DateTimeField format={dateTimeFormat} readOnly />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are readonly
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-readonly', 'true');
      });
    });

    it('forwards id prop to hidden input', async () => {
      await render(<DateTimeField format={dateTimeFormat} id="custom-id" />);

      const hiddenInput = document.querySelector('input[id="custom-id"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.id).to.equal('custom-id');
    });

    it('forwards inputRef to hidden input', async () => {
      const inputRef = { current: null as HTMLInputElement | null };

      await render(<DateTimeField format={dateTimeFormat} inputRef={inputRef} />);

      expect(inputRef.current).not.to.equal(null);
      expect(inputRef.current).to.be.instanceOf(HTMLInputElement);
    });
  });

  describe('Component rendering with various formats', () => {
    it('should render with 24-hour format', async () => {
      await render(<DateTimeField format={dateTimeFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      // Should have date sections (month, day, year) + time sections (hours, minutes)
      expect(sections.length).to.be.at.least(5);

      // Verify sections are editable (not disabled/readonly)
      sections.forEach((section) => {
        expect(section).not.to.have.attribute('aria-disabled', 'true');
        expect(section).not.to.have.attribute('aria-readonly', 'true');
      });
    });

    it('should render with 12-hour format with meridiem', async () => {
      const dateTime12Format = `${adapter.formats.localizedNumericDate} ${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;
      await render(<DateTimeField format={dateTime12Format} />);

      const sections = screen.getAllByRole('spinbutton');
      // Should include meridiem section
      const meridiemSection = sections.find((s) => s.getAttribute('aria-label') === 'Meridiem');
      expect(meridiemSection).not.to.equal(undefined);
    });
  });

  describe('Form submission', () => {
    it('submits the value in datetime-local format via onFormSubmit', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="appointmentDateTime">
            <DateTimeField
              format={dateTimeFormat}
              defaultValue={adapter.date('2024-03-20T09:30', 'default')}
            />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(handleSubmit.firstCall.args[0].appointmentDateTime).to.equal('2024-03-20T09:30');
    });

    it('submits empty string when value is null', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="appointmentDateTime">
            <DateTimeField format={dateTimeFormat} defaultValue={null} />
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(1);
      expect(handleSubmit.firstCall.args[0].appointmentDateTime).to.equal('');
    });

    it('validates with rangeUnderflow when date is before minDate', async () => {
      const handleSubmit = spy();
      const minDate = adapter.date('2024-03-20', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField
              format={dateTimeFormat}
              defaultValue={adapter.date('2024-03-15T10:00', 'default')}
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
      const maxDate = adapter.date('2024-03-20', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField
              format={dateTimeFormat}
              defaultValue={adapter.date('2024-03-25T10:00', 'default')}
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

    it('validates with rangeUnderflow when datetime is before minDate (same date, earlier time)', async () => {
      const handleSubmit = spy();
      const minDate = adapter.date('2024-03-20T09:00', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField
              format={dateTimeFormat}
              defaultValue={adapter.date('2024-03-20T08:30', 'default')}
              minDate={minDate}
            />
            <Field.Error match="rangeUnderflow" data-testid="error">
              DateTime is too early
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('DateTime is too early');
    });

    it('validates with rangeOverflow when datetime is after maxDate (same date, later time)', async () => {
      const handleSubmit = spy();
      const maxDate = adapter.date('2024-03-20T17:00', 'default');

      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField
              format={dateTimeFormat}
              defaultValue={adapter.date('2024-03-20T18:30', 'default')}
              maxDate={maxDate}
            />
            <Field.Error match="rangeOverflow" data-testid="error">
              DateTime is too late
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('DateTime is too late');
    });
  });

  describe('Controlled value updates', () => {
    it('should update displayed sections when value prop changes', async () => {
      const { setProps } = await render(
        <DateTimeField
          format={dateTimeFormat}
          value={adapter.date('2024-01-15T09:30', 'default')}
        />,
      );

      let sections = screen.getAllByRole('spinbutton');
      const hoursSection = sections.find((s) => s.getAttribute('aria-label') === 'Hours');
      const minutesSection = sections.find((s) => s.getAttribute('aria-label') === 'Minutes');
      expect(hoursSection).to.have.attribute('aria-valuenow', '9');
      expect(minutesSection).to.have.attribute('aria-valuenow', '30');

      await setProps({ value: adapter.date('2024-01-15T14:45', 'default') });

      sections = screen.getAllByRole('spinbutton');
      const newHoursSection = sections.find((s) => s.getAttribute('aria-label') === 'Hours');
      const newMinutesSection = sections.find((s) => s.getAttribute('aria-label') === 'Minutes');
      expect(newHoursSection).to.have.attribute('aria-valuenow', '14');
      expect(newMinutesSection).to.have.attribute('aria-valuenow', '45');
    });

    it('should update hidden input when value prop changes', async () => {
      const { setProps } = await render(
        <DateTimeField
          format={dateTimeFormat}
          value={adapter.date('2024-01-15T09:30', 'default')}
        />,
      );

      let hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.value).to.equal('2024-01-15T09:30');

      await setProps({ value: adapter.date('2024-01-15T14:45', 'default') });

      hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.value).to.equal('2024-01-15T14:45');
    });
  });

  describe('Form validation - required', () => {
    it('should show valueMissing error when required and empty', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField format={dateTimeFormat} required />
            <Field.Error match="valueMissing" data-testid="error">
              Date and time is required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      fireEvent.click(screen.getByText('Submit'));

      expect(handleSubmit.callCount).to.equal(0);
      expect(screen.getByTestId('error')).to.have.text('Date and time is required');
    });

    it('should not show valueMissing error when required and filled', async () => {
      const handleSubmit = spy();
      await render(
        <Form onFormSubmit={handleSubmit}>
          <Field.Root name="datetime">
            <DateTimeField
              format={dateTimeFormat}
              required
              defaultValue={adapter.date('2024-03-15T14:30', 'default')}
            />
            <Field.Error match="valueMissing" data-testid="error">
              Date and time is required
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
    it('should set type="datetime-local" on hidden input', async () => {
      await render(<DateTimeField format={dateTimeFormat} />);

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.type).to.equal('datetime-local');
    });

    it('should set min attribute when minDate is provided', async () => {
      await render(
        <DateTimeField
          format={dateTimeFormat}
          minDate={adapter.date('2024-01-01T09:00', 'default')}
        />,
      );

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.min).to.equal('2024-01-01T09:00:00');
    });

    it('should set max attribute when maxDate is provided', async () => {
      await render(
        <DateTimeField
          format={dateTimeFormat}
          maxDate={adapter.date('2024-12-31T17:00', 'default')}
        />,
      );

      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput.max).to.equal('2024-12-31T17:00:00');
    });
  });

  describe('12-hour format with meridiem', () => {
    const dateTime12Format = `${adapter.formats.localizedNumericDate} ${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

    it('should render with meridiem section', async () => {
      await render(
        <DateTimeField
          format={dateTime12Format}
          defaultValue={adapter.date('2024-01-15T14:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const meridiemSection = sections.find((s) => s.getAttribute('aria-label') === 'Meridiem');
      expect(meridiemSection).not.to.equal(undefined);
    });

    it('should display PM for afternoon times', async () => {
      await render(
        <DateTimeField
          format={dateTime12Format}
          defaultValue={adapter.date('2024-01-15T14:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const hoursSection = sections.find((s) => s.getAttribute('aria-label') === 'Hours');
      expect(hoursSection).to.have.attribute('aria-valuenow', '2'); // 2 PM
    });

    it('should display AM for morning times', async () => {
      await render(
        <DateTimeField
          format={dateTime12Format}
          defaultValue={adapter.date('2024-01-15T09:30', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const hoursSection = sections.find((s) => s.getAttribute('aria-label') === 'Hours');
      expect(hoursSection).to.have.attribute('aria-valuenow', '9');
    });
  });

  describe('Seconds format', () => {
    it('should render hours, minutes, and seconds when format includes seconds', async () => {
      const dateTimeWithSecondsFormat = `${adapter.formats.localizedNumericDate} ${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}:${adapter.formats.secondsPadded}`;
      await render(
        <DateTimeField
          format={dateTimeWithSecondsFormat}
          defaultValue={adapter.date('2024-01-15T14:30:45', 'default')}
        />,
      );

      const sections = screen.getAllByRole('spinbutton');
      const secondsSection = sections.find((s) => s.getAttribute('aria-label') === 'Seconds');
      expect(secondsSection).not.to.equal(undefined);
    });
  });
});
