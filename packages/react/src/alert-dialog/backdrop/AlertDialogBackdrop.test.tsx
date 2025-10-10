import * as React from 'react';
import { expect } from 'chai';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<AlertDialog.Root open>{node}</AlertDialog.Root>);
    },
  }));

  it('has role="presentation"', async () => {
    await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop data-testid="backdrop" />
      </AlertDialog.Root>,
    );

    expect(screen.getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });

  describe('prop: forceRender', () => {
    it('renders only the root backdrop by default', async () => {
      function App() {
        const [nestedOpen, setNestedOpen] = React.useState(true);

        return (
          <AlertDialog.Root open>
            <AlertDialog.Backdrop data-testid="root-backdrop" />
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                Root dialog
                <AlertDialog.Root open={nestedOpen} onOpenChange={setNestedOpen}>
                  <AlertDialog.Backdrop data-testid="nested-backdrop" />
                  <AlertDialog.Portal>
                    <AlertDialog.Popup>Nested dialog</AlertDialog.Popup>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('root-backdrop')).not.to.equal(null);
      expect(screen.queryByTestId('nested-backdrop')).to.equal(null);
    });

    it('renders when not nested by default', async () => {
      await render(
        <AlertDialog.Root open>
          <AlertDialog.Backdrop data-testid="backdrop" />
          <AlertDialog.Portal>
            <AlertDialog.Popup>Content</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      expect(screen.getByTestId('backdrop')).not.to.equal(null);
    });

    it('renders only the root backdrop with multiple nesting levels', async () => {
      function App() {
        const [level2Open, setLevel2Open] = React.useState(true);
        const [level3Open, setLevel3Open] = React.useState(true);

        return (
          <AlertDialog.Root open>
            <AlertDialog.Backdrop data-testid="level-1-backdrop" />
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                Level 1 dialog
                <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                  <AlertDialog.Backdrop data-testid="level-2-backdrop" />
                  <AlertDialog.Portal>
                    <AlertDialog.Popup>
                      Level 2 dialog
                      <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                        <AlertDialog.Backdrop data-testid="level-3-backdrop" />
                        <AlertDialog.Portal>
                          <AlertDialog.Popup>Level 3 dialog</AlertDialog.Popup>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </AlertDialog.Popup>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('level-1-backdrop')).not.to.equal(null);
      expect(screen.queryByTestId('level-2-backdrop')).to.equal(null);
      expect(screen.queryByTestId('level-3-backdrop')).to.equal(null);
    });

    it('always renders when true', async () => {
      function App() {
        const [level2Open, setLevel2Open] = React.useState(true);
        const [level3Open, setLevel3Open] = React.useState(true);

        return (
          <AlertDialog.Root open>
            <AlertDialog.Backdrop data-testid="level-1-backdrop" forceRender />
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                Level 1 dialog
                <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                  <AlertDialog.Backdrop data-testid="level-2-backdrop" forceRender />
                  <AlertDialog.Portal>
                    <AlertDialog.Popup>
                      Level 2 dialog
                      <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                        <AlertDialog.Backdrop data-testid="level-3-backdrop" forceRender />
                        <AlertDialog.Portal>
                          <AlertDialog.Popup>Level 3 dialog</AlertDialog.Popup>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </AlertDialog.Popup>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      await render(<App />);

      expect(screen.getByTestId('level-1-backdrop')).not.to.equal(null);
      expect(screen.getByTestId('level-2-backdrop')).not.to.equal(null);
      expect(screen.getByTestId('level-3-backdrop')).not.to.equal(null);
    });
  });
});
