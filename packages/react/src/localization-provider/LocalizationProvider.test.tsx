import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { frFR } from '@base-ui/react/locale-frFR';
import { createRenderer } from '#test-utils';
import { useTranslations } from '../internals/localization-context/LocalizationContext';

describe('<LocalizationProvider />', () => {
  const { render } = createRenderer();

  function TranslationProbe() {
    const translations = useTranslations();
    return (
      <React.Fragment>
        <span data-testid="role">{translations.dragRoleDescription}</span>
        <span data-testid="handle">{translations.dragHandleLabel({ label: 'Card' })}</span>
      </React.Fragment>
    );
  }

  it('uses English translations by default', async () => {
    await render(<TranslationProbe />);

    expect(screen.getByTestId('role')).toHaveTextContent('draggable');
    expect(screen.getByTestId('handle')).toHaveTextContent('Drag Card');
  });

  it('uses a locale pack', async () => {
    await render(
      <LocalizationProvider translations={frFR}>
        <TranslationProbe />
      </LocalizationProvider>,
    );

    expect(screen.getByTestId('role')).toHaveTextContent('déplaçable');
    expect(screen.getByTestId('handle')).toHaveTextContent('Déplacer Card');
  });

  it('merges nested partial translations and ignores undefined entries', async () => {
    await render(
      <LocalizationProvider
        translations={{
          dragRoleDescription: 'outer role',
          dragHandleLabel: () => 'outer handle',
        }}
      >
        <LocalizationProvider
          translations={{
            dragRoleDescription: 'inner role',
            dragHandleLabel: undefined,
          }}
        >
          <TranslationProbe />
        </LocalizationProvider>
      </LocalizationProvider>,
    );

    expect(screen.getByTestId('role')).toHaveTextContent('inner role');
    expect(screen.getByTestId('handle')).toHaveTextContent('outer handle');
  });

  it('keeps the context stable for an equivalent inline translations object', async () => {
    let probeCommits = 0;
    const Probe = React.memo(function Probe() {
      useTranslations();
      probeCommits += 1;
      return null;
    });

    function App() {
      const [, forceRender] = React.useState(0);
      return (
        <React.Fragment>
          <button type="button" onClick={() => forceRender((value) => value + 1)}>
            Render
          </button>
          <LocalizationProvider translations={{ dragRoleDescription: 'custom' }}>
            <Probe />
          </LocalizationProvider>
        </React.Fragment>
      );
    }

    await render(<App />);
    const commitsAfterMount = probeCommits;
    fireEvent.click(screen.getByRole('button', { name: 'Render' }));

    expect(probeCommits).toBe(commitsAfterMount);
  });
});
