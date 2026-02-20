import * as React from 'react';
import { expect } from 'chai';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.DayGridHeaderCell />', () => {
  const { render, adapter } = createTemporalRenderer();

  const date = adapter.now('default');

  describeConformance(<Calendar.DayGridHeaderCell value={date} />, () => ({
    refInstanceof: window.HTMLTableCellElement,
    testRenderPropWith: 'th',
    wrappingAllowed: false,
    render(node) {
      return render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderRow>{node}</Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
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
              <Calendar.DayGridHeaderRow>
                <Calendar.DayGridHeaderCell value={adapter.date('2025-02-04', 'default')} />
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const cell = document.querySelector('th')!;
      expect(cell.textContent).to.equal('T');
    });

    it('should use the value returned by the provided formatter', () => {
      render(
        <Calendar.Root>
          <Calendar.DayGrid>
            <Calendar.DayGridHeader>
              <Calendar.DayGridHeaderRow>
                <Calendar.DayGridHeaderCell
                  value={adapter.date('2025-02-04', 'default')}
                  formatter={() => 'Test'}
                />
              </Calendar.DayGridHeaderRow>
            </Calendar.DayGridHeader>
          </Calendar.DayGrid>
        </Calendar.Root>,
      );

      const cell = document.querySelector('th')!;
      expect(cell.textContent).to.equal('Test');
    });
  });
});
