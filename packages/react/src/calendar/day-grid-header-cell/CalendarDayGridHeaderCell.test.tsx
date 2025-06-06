import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { Calendar } from '@base-ui-components/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeaderCell />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');

  describeConformance(<Calendar.DayGridHeaderCell value={date} />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>{node}</Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );
    },
  }));

  describe('formatter prop', () => {
    it('should use the first letter of the week day format by default', () => {
      render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderCell value={adapter.date('2025-02-04', 'default')} />
            </Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const cell = screen.getByRole('columnheader')!;
      expect(cell.textContent).to.equal('T');
    });

    it('should use the value returned by the provided formatter', () => {
      render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderCell
                value={adapter.date('2025-02-04', 'default')}
                formatter={() => 'Test'}
              />
            </Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const cell = screen.getByRole('columnheader')!;
      expect(cell.textContent).to.equal('Test');
    });
  });

  describe('accessibility attributes', () => {
    it('should have the full weekday as aria-label', () => {
      render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderCell value={adapter.date('2025-02-04', 'default')} />
            </Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const cell = screen.getByRole('columnheader')!;
      expect(cell).toHaveAccessibleName('Tuesday');
    });
  });
});
