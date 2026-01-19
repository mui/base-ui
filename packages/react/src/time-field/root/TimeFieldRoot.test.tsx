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

    it('Field context name takes precedence over local name prop', async () => {
      await render(
        <form data-testid="form">
          <Field.Root name="fieldname">
            <TimeField format={time24Format} name="localname" />
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
        <TimeField
          format={time24Format}
          name="standaloneField"
          defaultValue={adapter.date('2024-03-20T09:45', 'default')}
        />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display the correct values
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(2); // hours, minutes
      expect(sections[0]).to.have.attribute('aria-valuenow', '9'); // hours = 09
      expect(sections[1]).to.have.attribute('aria-valuenow', '45'); // minutes = 45

      // Assert the hidden input has the correct name and value
      const hiddenInput = document.querySelector('input[name="standaloneField"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.name).to.equal('standaloneField');
      expect(hiddenInput.value).to.equal('2024-03-20T09:45:00.000Z');
    });
  });

  describe('Basic functionality', () => {
    it('renders with defaultValue', async () => {
      await render(
        <TimeField format={time24Format} defaultValue={adapter.date('2024-01-15T14:30', 'default')} />,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections display the correct values
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(2); // hours, minutes
      expect(sections[0]).to.have.attribute('aria-valuenow', '14'); // hours = 14
      expect(sections[1]).to.have.attribute('aria-valuenow', '30'); // minutes = 30

      // Assert the hidden input has the correct ISO string value
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('2024-01-15T14:30:00.000Z');
    });

    it('renders with null value', async () => {
      await render(<TimeField format={time24Format} value={null} />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert the sections are empty (no aria-valuenow when empty)
      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(2); // hours, minutes
      expect(sections[0]).not.to.have.attribute('aria-valuenow');
      expect(sections[1]).not.to.have.attribute('aria-valuenow');

      // Assert the hidden input is empty
      const hiddenInput = document.querySelector('input[tabindex="-1"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.value).to.equal('');
    });

    it('renders disabled', async () => {
      await render(<TimeField format={time24Format} disabled />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are disabled
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('renders readOnly', async () => {
      await render(<TimeField format={time24Format} readOnly />);

      const input = screen.getByTestId('input');
      expect(input).not.to.equal(null);

      // Assert all sections are readonly
      const sections = screen.getAllByRole('spinbutton');
      sections.forEach((section) => {
        expect(section).to.have.attribute('aria-readonly', 'true');
      });
    });

    it('forwards id prop to hidden input', async () => {
      await render(<TimeField format={time24Format} id="custom-id" />);

      const hiddenInput = document.querySelector('input[id="custom-id"]') as HTMLInputElement;
      expect(hiddenInput).not.to.equal(null);
      expect(hiddenInput.id).to.equal('custom-id');
    });

    it('forwards inputRef to hidden input', async () => {
      const inputRef = { current: null as HTMLInputElement | null };

      await render(<TimeField format={time24Format} inputRef={inputRef} />);

      expect(inputRef.current).not.to.equal(null);
      expect(inputRef.current).to.be.instanceOf(HTMLInputElement);
    });
  });

  describe('Component rendering with various formats', () => {
    it('should render with 24-hour format (HH:mm)', async () => {
      await render(<TimeField format={time24Format} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(2);

      // Verify sections are editable (not disabled/readonly)
      sections.forEach((section) => {
        expect(section).not.to.have.attribute('aria-disabled', 'true');
        expect(section).not.to.have.attribute('aria-readonly', 'true');
      });

      // Verify format matches HH:mm pattern
      expect(sections[0]).to.have.attribute('aria-label', 'Hours');
      expect(sections[1]).to.have.attribute('aria-label', 'Minutes');
    });

    it('should render with 12-hour format with meridiem (hh:mm aa)', async () => {
      const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;
      await render(<TimeField format={time12Format} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections).to.have.length(3);

      // Verify format matches hh:mm aa pattern
      expect(sections[0]).to.have.attribute('aria-label', 'Hours');
      expect(sections[1]).to.have.attribute('aria-label', 'Minutes');
      expect(sections[2]).to.have.attribute('aria-label', 'Meridiem');
    });
  });
});
