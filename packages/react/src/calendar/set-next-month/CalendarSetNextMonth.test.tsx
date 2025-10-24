import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.SetNextMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.SetNextMonth />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<Calendar.Root>{node}</Calendar.Root>);
    },
  }));

  describe('visible date update', () => {
    it('should keep the day and time of the previous visible date when clicked', async () => {
      const onVisibleDateChange = spy();

      const { user } = render(
        <Calendar.Root
          onVisibleDateChange={onVisibleDateChange}
          visibleDate={adapter.date('2025-02-05T12:01:02.003Z', 'default')}
        >
          <Calendar.SetNextMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button')!;

      await user.click(button);
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[0]).toEqualDateTime('2025-03-05T12:01:02.003Z');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when props.disabled is true', () => {
      render(
        <Calendar.Root>
          <Calendar.SetNextMonth disabled />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the Calendar is disabled', () => {
      render(
        <Calendar.Root disabled>
          <Calendar.SetNextMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be disabled when the target month is after the maxDate month', () => {
      render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.SetNextMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should not be disabled when the target month is equal to the maxDate month', () => {
      render(
        <Calendar.Root
          maxDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2024-12-01', 'default')}
        >
          <Calendar.SetNextMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });
  });
});
