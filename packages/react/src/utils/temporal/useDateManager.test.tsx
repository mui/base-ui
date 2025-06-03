import * as React from 'react';
import { expect } from 'chai';
import { TemporalAdapterLuxon } from '@base-ui-components/react/temporal-adapter-luxon';
import { useApplyDefaultValuesToDateValidationProps, validateDate } from './useDateManager';
import { createTemporalRenderer } from '#test-utils';

const adapter = new TemporalAdapterLuxon();

// TODO: Run this test on all the adapters
describe.only('useDateManager()', () => {
  describe('validateDate utility', () => {
    it('should return null when no min date and not max date are provided', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03', 'default'),
          validationProps: { minDate: null, maxDate: null },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is between the min date and the max date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-01', 'default'),
            maxDate: adapter.date('2025-06-05', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is on the same day as the min date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03T15:30', 'default'),
          validationProps: {
            minDate: adapter.date('2025-06-03T20:30', 'default'),
            maxDate: null,
          },
        }),
      ).to.equal(null);
    });

    it('should return null when the provided value is on the same day as the max date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('2025-06-03T20:30', 'default'),
          validationProps: {
            minDate: null,
            maxDate: adapter.date('2025-06-03T15:30', 'default'),
          },
        }),
      ).to.equal(null);
    });

    it('should return "invalid" when receiving an invalid date', () => {
      expect(
        validateDate({
          adapter,
          value: adapter.date('Invalid date', 'default'),
          validationProps: { minDate: null, maxDate: null },
        }),
      ).to.equal('invalid');
    });
  });

  describe('useApplyDefaultValuesToDateValidationProps utility', () => {
    const { render } = createTemporalRenderer();

    interface TestComponentProps {
      before: useApplyDefaultValuesToDateValidationProps.Parameters;
      children: (validationProps: useApplyDefaultValuesToDateValidationProps.ReturnValue) => void;
    }

    function TestComponent(props: TestComponentProps) {
      const validationProps = useApplyDefaultValuesToDateValidationProps(props.before);

      props.children(validationProps);

      return null;
    }

    it('should use props.minDate and props.maxDate when provided', () => {
      const before: useApplyDefaultValuesToDateValidationProps.Parameters = {
        minDate: adapter.date('2020-01-01', 'default'),
        maxDate: adapter.date('2020-12-31', 'default'),
      };
      let after: useApplyDefaultValuesToDateValidationProps.ReturnValue;
      render(
        <TestComponent before={before}>
          {(validationProps) => {
            after = validationProps;
          }}
        </TestComponent>,
      );

      expect(after!.minDate).to.equal(before.minDate);
      expect(after!.maxDate).to.equal(before.maxDate);
    });
  });
});
