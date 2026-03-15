import { createRenderer, screen, waitFor } from '@mui/internal-test-utils';
import { Fieldset } from '@base-ui/react/fieldset';
import { expect } from 'chai';
import { describeConformance, isJSDOM } from '#test-utils';

describe('<Fieldset.Legend />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<Fieldset.Legend />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Fieldset.Root>{node}</Fieldset.Root>);
    },
  }));

  it('should set aria-labelledby on the fieldset automatically', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).to.have.attribute(
      'aria-labelledby',
      screen.getByTestId('legend').id,
    );
  });

  it('should set aria-labelledby on the fieldset with custom id', () => {
    render(
      <Fieldset.Root>
        <Fieldset.Legend id="legend-id" />
      </Fieldset.Root>,
    );

    expect(screen.getByRole('group')).to.have.attribute('aria-labelledby', 'legend-id');
  });

  it.skipIf(isJSDOM)('does not set `aria-labelledby` during SSR when legend is absent', () => {
    renderToString(<Fieldset.Root data-testid="fieldset" />);

    expect(screen.getByTestId('fieldset')).to.not.have.attribute('aria-labelledby');
  });

  it.skipIf(isJSDOM)(
    'sets `aria-labelledby` after hydration without a custom legend id',
    async () => {
      const { hydrate } = renderToString(
        <Fieldset.Root data-testid="fieldset">
          <Fieldset.Legend data-testid="legend">Legend</Fieldset.Legend>
        </Fieldset.Root>,
      );

      const fieldset = screen.getByTestId('fieldset');
      const legend = screen.getByTestId('legend');

      expect(legend.id).to.not.equal('');
      expect(fieldset).to.not.have.attribute('aria-labelledby');

      hydrate();

      await waitFor(() => {
        expect(screen.getByTestId('fieldset')).to.have.attribute('aria-labelledby', legend.id);
      });
    },
  );
});
