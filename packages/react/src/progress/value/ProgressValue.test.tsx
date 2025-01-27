import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Progress } from '@base-ui-components/react/progress';
import { createRenderer, describeConformance } from '#test-utils';
import { ProgressRootContext } from '../root/ProgressRootContext';

const contextValue: ProgressRootContext = {
  max: 100,
  min: 0,
  value: 30,
  formattedValue: '30',
  status: 'progressing',
  state: {
    max: 100,
    min: 0,
    status: 'progressing',
  },
};

describe('<Progress.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Value />, () => ({
    render: (node) => {
      return render(
        <ProgressRootContext.Provider value={contextValue}>{node}</ProgressRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
  }));

  describe('prop: children', () => {
    it('renders the value when children is not provided', async () => {
      const { getByTestId } = await render(
        <Progress.Root value={30}>
          <Progress.Value data-testid="value" />
        </Progress.Root>,
      );
      const value = getByTestId('value');
      expect(value).to.have.text('30%');
    });

    it('renders a formatted value when a format is provided', async () => {
      const format: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: 'USD',
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      const { getByTestId } = await render(
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
        </Progress.Root>,
      );
      const value = getByTestId('value');
      expect(value).to.have.text(formatValue(30));
    });

    describe('it accepts a render function', () => {
      it('numerical value', async () => {
        const renderSpy = spy();
        const format: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: 'USD',
        };
        function formatValue(v: number) {
          return new Intl.NumberFormat(undefined, format).format(v);
        }
        await render(
          <Progress.Root value={30} format={format}>
            <Progress.Value data-testid="value">{renderSpy}</Progress.Value>
          </Progress.Root>,
        );
        expect(renderSpy.lastCall.args[0]).to.deep.equal(formatValue(30));
        expect(renderSpy.lastCall.args[1]).to.deep.equal(30);
      });

      it('indeterminate value', async () => {
        const renderSpy = spy();
        const format: Intl.NumberFormatOptions = {
          style: 'currency',
          currency: 'USD',
        };
        await render(
          <Progress.Root value={null} format={format}>
            <Progress.Value data-testid="value">{renderSpy}</Progress.Value>
          </Progress.Root>,
        );
        expect(renderSpy.lastCall.args[0]).to.deep.equal('indeterminate');
        expect(renderSpy.lastCall.args[1]).to.deep.equal(null);
      });
    });
  });
});
