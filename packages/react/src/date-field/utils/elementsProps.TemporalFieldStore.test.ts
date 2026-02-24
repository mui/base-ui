import { expect } from 'chai';
import { createTemporalRenderer } from '#test-utils';
import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStore } from './TemporalFieldStore';
import { dateFieldConfig } from '../root/dateFieldConfig';
import { timeFieldConfig } from '../../time-field/root/timeFieldConfig';
import { selectors } from './selectors';
import { createDefaultStoreParameters } from './TemporalFieldStore.test-utils';

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function localizeDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[parseInt(d, 10)]);
}

/**
 * Creates an adapter proxy whose `formatByString` replaces ASCII digits
 * with Arabic-Indic digits.  This causes `getLocalizedDigits` to detect
 * a non-ASCII numbering system and lets us verify that `aria-valuenow`
 * is correctly de-localized before numeric conversion.
 */
function createLocalizedAdapter(adapter: TemporalAdapter): TemporalAdapter {
  return new Proxy(adapter, {
    get(target, prop) {
      if (prop === 'formatByString') {
        return (value: any, format: string) => localizeDigits(target.formatByString(value, format));
      }
      return (target as any)[prop];
    },
  });
}

describe('TemporalFieldStore - Elements Props', () => {
  const { adapter } = createTemporalRenderer();
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;
  const time12Format = `${adapter.formats.hours12hPadded}:${adapter.formats.minutesPadded} ${adapter.formats.meridiem}`;

  const DEFAULT_PARAMETERS = createDefaultStoreParameters(adapter, numericDateFormat);

  function getSections(store: TemporalFieldStore<TemporalValue>) {
    return selectors.sections(store.state);
  }

  function getProps(store: TemporalFieldStore<TemporalValue>, sectionIndex: number) {
    const sections = getSections(store);
    return selectors.sectionProps(store.state, sections[sectionIndex]);
  }

  describe('date part sections', () => {
    describe('aria attributes', () => {
      it('should set role to spinbutton', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0); // month section
        expect(props.role).to.equal('spinbutton');
      });

      it('should set aria-label to Month for month sections', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props['aria-label']).to.equal('Month');
      });

      it('should set aria-label to Day for day sections', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 2); // day section (index 2, after separator)
        expect(props['aria-label']).to.equal('Day');
      });

      it('should set aria-label to Year for year sections', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 4); // year section
        expect(props['aria-label']).to.equal('Year');
      });

      it('should set aria-label to Hours for hours sections', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            format: time24Format,
            defaultValue: adapter.date('2024-03-15T14:30', 'default'),
          },
          timeFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props['aria-label']).to.equal('Hours');
      });

      it('should set aria-label to Minutes for minutes sections', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            format: time24Format,
            defaultValue: adapter.date('2024-03-15T14:30', 'default'),
          },
          timeFieldConfig,
        );

        const props = getProps(store, 2);
        expect(props['aria-label']).to.equal('Minutes');
      });

      it('should set aria-valuenow to numeric month value', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props['aria-valuenow']).to.equal(3);
      });

      it('should set aria-valuenow to undefined when section is empty', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const props = getProps(store, 0);
        expect(props['aria-valuenow']).to.equal(undefined);
      });

      describe('with localized digits (Arabic-Indic)', () => {
        const localizedAdapter = createLocalizedAdapter(adapter);

        it('should set aria-valuenow to numeric month value', () => {
          const store = new TemporalFieldStore(
            {
              ...DEFAULT_PARAMETERS,
              defaultValue: adapter.date('2024-03-15', 'default'),
              adapter: localizedAdapter,
            },
            dateFieldConfig,
          );

          const props = getProps(store, 0); // month
          expect(props['aria-valuenow']).to.equal(3);
        });

        it('should set aria-valuenow to numeric day value', () => {
          const store = new TemporalFieldStore(
            {
              ...DEFAULT_PARAMETERS,
              defaultValue: adapter.date('2024-03-15', 'default'),
              adapter: localizedAdapter,
            },
            dateFieldConfig,
          );

          const props = getProps(store, 2); // day
          expect(props['aria-valuenow']).to.equal(15);
        });

        it('should set aria-valuenow to numeric year value', () => {
          const store = new TemporalFieldStore(
            {
              ...DEFAULT_PARAMETERS,
              defaultValue: adapter.date('2024-03-15', 'default'),
              adapter: localizedAdapter,
            },
            dateFieldConfig,
          );

          const props = getProps(store, 4); // year
          expect(props['aria-valuenow']).to.equal(2024);
        });

        it('should set aria-valuenow to numeric hours value', () => {
          const store = new TemporalFieldStore(
            {
              ...DEFAULT_PARAMETERS,
              format: time24Format,
              defaultValue: adapter.date('2024-03-15T14:30', 'default'),
              adapter: localizedAdapter,
            },
            timeFieldConfig,
          );

          const props = getProps(store, 0); // hours
          expect(props['aria-valuenow']).to.equal(14);
        });

        it('should set aria-valuenow to numeric minutes value', () => {
          const store = new TemporalFieldStore(
            {
              ...DEFAULT_PARAMETERS,
              format: time24Format,
              defaultValue: adapter.date('2024-03-15T14:30', 'default'),
              adapter: localizedAdapter,
            },
            timeFieldConfig,
          );

          const props = getProps(store, 2); // minutes
          expect(props['aria-valuenow']).to.equal(30);
        });
      });

      it('should set aria-valuetext to Empty when section value is empty', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const props = getProps(store, 0);
        expect(props['aria-valuetext']).to.equal('Empty');
      });

      it('should set aria-valuemin and aria-valuemax from token boundaries', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            defaultValue: adapter.date('2024-03-15', 'default'),
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0); // month
        expect(props['aria-valuemin']).to.equal(1);
        expect(props['aria-valuemax']).to.equal(12);
      });
    });

    describe('interactivity attributes', () => {
      it('should set contentEditable to true when editable', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const props = getProps(store, 0);
        expect(props.contentEditable).to.equal(true);
      });

      it('should set tabIndex to 0 when editable', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const props = getProps(store, 0);
        expect(props.tabIndex).to.equal(0);
      });

      it('should set tabIndex to -1 when disabled', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            disabled: true,
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props.tabIndex).to.equal(-1);
      });

      it('should set aria-disabled to true when disabled', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            disabled: true,
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props['aria-disabled']).to.equal(true);
      });

      it('should set aria-readonly to true when readOnly', () => {
        const store = new TemporalFieldStore(
          {
            ...DEFAULT_PARAMETERS,
            readOnly: true,
          },
          dateFieldConfig,
        );

        const props = getProps(store, 0);
        expect(props['aria-readonly']).to.equal(true);
      });

      it('should set inputMode to numeric for digit sections', () => {
        const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

        const props = getProps(store, 0);
        expect(props.inputMode).to.equal('numeric');
      });
    });
  });

  describe('separator sections', () => {
    it('should set aria-hidden to true on separator sections', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const props = getProps(store, 1); // first separator "/"
      expect(props['aria-hidden']).to.equal(true);
    });

    it('should set children to separator value', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const props = getProps(store, 1);
      expect(props.children).to.equal('/');
    });

    it('should not set role on separator sections', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const props = getProps(store, 1);
      expect(props.role).to.equal(undefined);
    });

    it('should not set tabIndex on separator sections', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const props = getProps(store, 1);
      expect(props.tabIndex).to.equal(undefined);
    });
  });

  describe('meridiem section', () => {
    it('should set aria-label to Meridiem', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time12Format,
          defaultValue: adapter.date('2024-03-15T14:30', 'default'),
        },
        timeFieldConfig,
      );

      const props = getProps(store, 4); // meridiem section
      expect(props['aria-label']).to.equal('Meridiem');
    });

    it('should set inputMode to text for letter content type', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          format: time12Format,
          defaultValue: adapter.date('2024-03-15T14:30', 'default'),
        },
        timeFieldConfig,
      );

      const props = getProps(store, 4);
      expect(props.inputMode).to.equal('text');
    });
  });

  describe('children for date parts', () => {
    it('should set children to section value when section has value', () => {
      const store = new TemporalFieldStore(
        {
          ...DEFAULT_PARAMETERS,
          defaultValue: adapter.date('2024-03-15', 'default'),
        },
        dateFieldConfig,
      );

      const props = getProps(store, 0); // month
      expect(props.children).to.equal('03');
    });

    it('should set children to placeholder when section is empty', () => {
      const store = new TemporalFieldStore(DEFAULT_PARAMETERS, dateFieldConfig);

      const props = getProps(store, 0); // month (empty)
      // The placeholder is defined by the token
      expect(props.children).to.not.equal('');
      expect(props.children).to.not.equal(undefined);
    });
  });
});
