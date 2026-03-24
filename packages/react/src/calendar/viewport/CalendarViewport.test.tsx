import * as React from 'react';
import { expect } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Calendar } from '@base-ui/react/calendar';
import { createTemporalRenderer } from '#test-utils';

describe('<Calendar.Viewport />', () => {
  const { render, adapter } = createTemporalRenderer();

  function getMonthLabel(value: Parameters<typeof adapter.getMonth>[0]) {
    return `${adapter.getYear(value)}-${adapter.getMonth(value)}`;
  }

  it('should remount the current month content when the visible month changes', async () => {
    const { user } = await render(
      <Calendar.Root defaultVisibleDate={adapter.date('2025-01-15', 'default')}>
        {({ visibleDate }) => (
          <React.Fragment>
            <Calendar.IncrementMonth data-testid="increment" />
            <Calendar.Viewport>
              <span>{getMonthLabel(visibleDate)}</span>
            </Calendar.Viewport>
          </React.Fragment>
        )}
      </Calendar.Root>,
    );

    const firstMonth = screen.getByText(getMonthLabel(adapter.date('2025-01-15', 'default')));

    await user.click(screen.getByTestId('increment'));

    await waitFor(() => {
      const secondMonth = screen.getByText(getMonthLabel(adapter.date('2025-02-15', 'default')));

      expect(secondMonth).not.toBe(firstMonth);
    });
  });
});
