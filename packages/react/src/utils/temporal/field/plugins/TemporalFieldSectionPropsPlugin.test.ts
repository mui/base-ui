import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../../time-field/root/TimeFieldStore';
import { TemporalFieldSectionPropsPlugin } from './TemporalFieldSectionPropsPlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { isDatePart, isSeparator } from '../utils';

describe('TemporalFieldSectionPropsPlugin', () => {
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  function getSections(store: DateFieldStore | TimeFieldStore) {
    return TemporalFieldSectionPlugin.selectors.sections(store.state);
  }

  function getProps(store: DateFieldStore | TimeFieldStore, sectionIndex: number) {
    const sections = getSections(store);
    return TemporalFieldSectionPropsPlugin.selectors.sectionProps(store.state, sections[sectionIndex]);
  }

  describe('date part sections', () => {
    describe('aria attributes', () => {
      it('should set role to spinbutton', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0); // month section
        expect(props.role).to.equal('spinbutton');
      });

      it('should set aria-label to Month for month sections', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-label']).to.equal('Month');
      });

      it('should set aria-label to Day for day sections', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 2); // day section (index 2, after separator)
        expect(props['aria-label']).to.equal('Day');
      });

      it('should set aria-label to Year for year sections', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 4); // year section
        expect(props['aria-label']).to.equal('Year');
      });

      it('should set aria-label to Hours for hours sections', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          defaultValue: adapter.date('2024-03-15T14:30', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-label']).to.equal('Hours');
      });

      it('should set aria-label to Minutes for minutes sections', () => {
        const store = new TimeFieldStore({
          format: time24Format,
          defaultValue: adapter.date('2024-03-15T14:30', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 2);
        expect(props['aria-label']).to.equal('Minutes');
      });

      it('should set aria-valuenow to numeric month value', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-valuenow']).to.equal(3);
      });

      it('should set aria-valuenow to undefined when section is empty', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-valuenow']).to.equal(undefined);
      });

      it('should set aria-valuetext to Empty when section value is empty', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-valuetext']).to.equal('Empty');
      });

      it('should set aria-valuemin and aria-valuemax from token boundaries', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          defaultValue: adapter.date('2024-03-15', 'default'),
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0); // month
        expect(props['aria-valuemin']).to.equal(1);
        expect(props['aria-valuemax']).to.equal(12);
      });
    });

    describe('interactivity attributes', () => {
      it('should set contentEditable to true when editable', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props.contentEditable).to.equal(true);
      });

      it('should set tabIndex to 0 when editable', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props.tabIndex).to.equal(0);
      });

      it('should set tabIndex to -1 when disabled', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          disabled: true,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props.tabIndex).to.equal(-1);
      });

      it('should set aria-disabled to true when disabled', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          disabled: true,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-disabled']).to.equal(true);
      });

      it('should set aria-readonly to true when readOnly', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          readOnly: true,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props['aria-readonly']).to.equal(true);
      });

      it('should set inputMode to numeric for digit sections', () => {
        const store = new DateFieldStore({
          format: numericDateFormat,
          adapter,
          direction: 'ltr',
          validationProps: {},
        });

        const props = getProps(store, 0);
        expect(props.inputMode).to.equal('numeric');
      });
    });
  });

  describe('separator sections', () => {
    it('should set aria-hidden to true on separator sections', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 1); // first separator "/"
      expect(props['aria-hidden']).to.equal(true);
    });

    it('should set children to separator value', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 1);
      expect(props.children).to.equal('/');
    });

    it('should not set role on separator sections', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 1);
      expect(props.role).to.equal(undefined);
    });

    it('should not set tabIndex on separator sections', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 1);
      expect(props.tabIndex).to.equal(undefined);
    });
  });

  describe('meridiem section', () => {
    it('should set aria-label to Meridiem', () => {
      const store = new TimeFieldStore({
        format: time12Format,
        defaultValue: adapter.date('2024-03-15T14:30', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 4); // meridiem section
      expect(props['aria-label']).to.equal('Meridiem');
    });

    it('should set inputMode to text for letter content type', () => {
      const store = new TimeFieldStore({
        format: time12Format,
        defaultValue: adapter.date('2024-03-15T14:30', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 4);
      expect(props.inputMode).to.equal('text');
    });
  });

  describe('children for date parts', () => {
    it('should set children to section value when section has value', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        defaultValue: adapter.date('2024-03-15', 'default'),
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 0); // month
      expect(props.children).to.equal('03');
    });

    it('should set children to placeholder when section is empty', () => {
      const store = new DateFieldStore({
        format: numericDateFormat,
        adapter,
        direction: 'ltr',
        validationProps: {},
      });

      const props = getProps(store, 0); // month (empty)
      // The placeholder is defined by the token
      expect(props.children).to.not.equal('');
      expect(props.children).to.not.equal(undefined);
    });
  });
});
