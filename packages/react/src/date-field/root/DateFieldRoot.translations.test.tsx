import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { DateField as DateFieldBase } from '@base-ui/react/date-field';
import { TimeField as TimeFieldBase } from '@base-ui/react/time-field';
import { DateTimeField as DateTimeFieldBase } from '@base-ui/react/date-time-field';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { frFR } from '@base-ui/react/translations';
import { createRenderer, createTemporalRenderer } from '#test-utils';

describe('Temporal field translations', () => {
  const { render } = createRenderer();
  const { adapter } = createTemporalRenderer();

  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const dateTimeFormat = `${numericDateFormat} ${time24Format}`;

  function DateField(props: DateFieldBase.Root.Props) {
    return (
      <DateFieldBase.Root {...props} data-testid="input">
        {(section) => <DateFieldBase.Section key={section.index} section={section} />}
      </DateFieldBase.Root>
    );
  }

  function TimeField(props: TimeFieldBase.Root.Props) {
    return (
      <TimeFieldBase.Root {...props} data-testid="input">
        {(section) => <TimeFieldBase.Section key={section.index} section={section} />}
      </TimeFieldBase.Root>
    );
  }

  function DateTimeField(props: DateTimeFieldBase.Root.Props) {
    return (
      <DateTimeFieldBase.Root {...props} data-testid="input">
        {(section) => <DateTimeFieldBase.Section key={section.index} section={section} />}
      </DateTimeFieldBase.Root>
    );
  }

  describe('Default English translations', () => {
    it('should render DateField sections with English aria-labels', async () => {
      await render(<DateField format={numericDateFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Month');
      expect(sections[1]).to.have.attribute('aria-label', 'Day');
      expect(sections[2]).to.have.attribute('aria-label', 'Year');
    });

    it('should render TimeField sections with English aria-labels', async () => {
      await render(<TimeField format={time24Format} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Hours');
      expect(sections[1]).to.have.attribute('aria-label', 'Minutes');
    });

    it('should render DateTimeField sections with English aria-labels', async () => {
      await render(<DateTimeField format={dateTimeFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Month');
      expect(sections[1]).to.have.attribute('aria-label', 'Day');
      expect(sections[2]).to.have.attribute('aria-label', 'Year');
      expect(sections[3]).to.have.attribute('aria-label', 'Hours');
      expect(sections[4]).to.have.attribute('aria-label', 'Minutes');
    });

    it('should render empty sections with English aria-valuetext', async () => {
      await render(<DateField format={numericDateFormat} />);

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-valuetext', 'Empty');
    });
  });

  describe('French translations', () => {
    it('should render DateField sections with French aria-labels', async () => {
      await render(
        <LocalizationProvider translations={frFR}>
          <DateField format={numericDateFormat} />
        </LocalizationProvider>,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Mois');
      expect(sections[1]).to.have.attribute('aria-label', 'Jour');
      expect(sections[2]).to.have.attribute('aria-label', 'Année');
    });

    it('should render TimeField sections with French aria-labels', async () => {
      await render(
        <LocalizationProvider translations={frFR}>
          <TimeField format={time24Format} />
        </LocalizationProvider>,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Heures');
      expect(sections[1]).to.have.attribute('aria-label', 'Minutes');
    });

    it('should render DateTimeField sections with French aria-labels', async () => {
      await render(
        <LocalizationProvider translations={frFR}>
          <DateTimeField format={dateTimeFormat} />
        </LocalizationProvider>,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-label', 'Mois');
      expect(sections[1]).to.have.attribute('aria-label', 'Jour');
      expect(sections[2]).to.have.attribute('aria-label', 'Année');
      expect(sections[3]).to.have.attribute('aria-label', 'Heures');
      expect(sections[4]).to.have.attribute('aria-label', 'Minutes');
    });

    it('should render empty sections with French aria-valuetext', async () => {
      await render(
        <LocalizationProvider translations={frFR}>
          <DateField format={numericDateFormat} />
        </LocalizationProvider>,
      );

      const sections = screen.getAllByRole('spinbutton');
      expect(sections[0]).to.have.attribute('aria-valuetext', 'Vide');
    });
  });
});
