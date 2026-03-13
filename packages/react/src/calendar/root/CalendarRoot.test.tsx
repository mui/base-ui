import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer, describeConformance } from '#test-utils';

describe('<Calendar.Root />', () => {
  const { render, adapter } = createTemporalRenderer();

  describeConformance(<Calendar.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('aria-label', () => {
    it('should have an aria-label with only the visible month and year when no aria-label prop is provided', () => {
      const visibleDate = adapter.date('2025-03-15', 'default');

      render(<Calendar.Root data-testid="calendar" visibleDate={visibleDate} />);

      const calendar = screen.getByTestId('calendar');
      expect(calendar).to.have.attribute('aria-label', 'March 2025');
    });

    it('should prepend custom aria-label to the visible month', () => {
      const visibleDate = adapter.date('2025-03-15', 'default');

      render(
        <Calendar.Root data-testid="calendar" visibleDate={visibleDate} aria-label="Choose date" />,
      );

      const calendar = screen.getByTestId('calendar');
      expect(calendar).to.have.attribute('aria-label', 'Choose date, March 2025');
    });

    it('should update aria-label when visible month changes', () => {
      const initialDate = adapter.date('2025-03-15', 'default');

      const { rerender } = render(
        <Calendar.Root data-testid="calendar" visibleDate={initialDate} />,
      );

      const calendar = screen.getByTestId('calendar');
      expect(calendar).to.have.attribute('aria-label', 'March 2025');

      const newDate = adapter.date('2025-06-20', 'default');
      rerender(<Calendar.Root data-testid="calendar" visibleDate={newDate} />);

      expect(calendar).to.have.attribute('aria-label', 'June 2025');
    });
  });
});
