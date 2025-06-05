import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.SetPreviousMonth />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.SetPreviousMonth />, () => ({
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
          <Calendar.SetPreviousMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button')!;

      await user.click(button);
      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(onVisibleDateChange.firstCall.args[0]).toEqualDateTime('2025-01-05T12:01:02.003Z');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when props.disabled is true', () => {
      render(
        <Calendar.Root>
          <Calendar.SetPreviousMonth disabled />
        </Calendar.Root>,
      );
    });

    it('should be disabled when the target month is before the minDate month', () => {
      render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-01-01', 'default')}
        >
          <Calendar.SetPreviousMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).to.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
    });

    it('should be not disabled when the target month is equal to the minDate month', () => {
      render(
        <Calendar.Root
          minDate={adapter.date('2025-01-10', 'default')}
          visibleDate={adapter.date('2025-02-01', 'default')}
        >
          <Calendar.SetPreviousMonth />
        </Calendar.Root>,
      );

      const button = document.querySelector('button');
      expect(button).not.to.have.attribute('disabled');
      expect(button).not.to.have.attribute('data-disabled');
    });
  });
});
