import { Input } from '@base-ui/react/input';
import * as React from 'react';
import {
  act,
  createRenderer,
  fireEvent,
  reactMajor,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { describeConformance } from '../../test/describeConformance';

describe('<Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));

  describe('prop: valueChangeAction', () => {
    it.skipIf(reactMajor <= 18)(
      'updates the controlled value optimistically while valueChangeAction is pending',
      async () => {
        const resolvers: Array<() => void> = [];
        const handleValueChangeAction = vi.fn(async (_previousValue: string, nextValue: string) => {
          await new Promise<void>((resolve) => {
            resolvers.push(resolve);
          });
          return nextValue;
        });

        function App() {
          const [value, updateValue, isPending] = React.useActionState(handleValueChangeAction, '');

          return (
            <React.Fragment>
              <span data-testid="pending">{String(isPending)}</span>
              <Input value={value} valueChangeAction={updateValue} />
            </React.Fragment>
          );
        }

        await render(<App />);

        const input = screen.getByRole('textbox');

        fireEvent.change(input, { target: { value: 'a' } });

        await waitFor(() => {
          expect(screen.getByTestId('pending')).toHaveTextContent('true');
        });
        expect(input).toHaveValue('a');

        fireEvent.change(input, { target: { value: 'ab' } });

        await waitFor(() => {
          expect(input).toHaveValue('ab');
        });

        await act(async () => {
          resolvers.shift()?.();
          await Promise.resolve();
        });

        await waitFor(() => {
          expect(handleValueChangeAction).toHaveBeenCalledTimes(2);
        });

        await act(async () => {
          resolvers.shift()?.();
          await Promise.resolve();
        });

        await waitFor(() => {
          expect(screen.getByTestId('pending')).toHaveTextContent('false');
        });
        expect(input).toHaveValue('ab');
      },
    );

    it('does not call valueChangeAction when onValueChange cancels the change', async () => {
      const handleValueChangeAction = vi.fn();

      await render(
        <Input
          value="a"
          onValueChange={(_nextValue, eventDetails) => {
            eventDetails.cancel();
          }}
          valueChangeAction={handleValueChangeAction}
        />,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'b' } });

      expect(input).toHaveValue('a');
      expect(handleValueChangeAction).not.toHaveBeenCalled();
    });
  });
});
