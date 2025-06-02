import * as React from 'react';
import { expect } from 'chai';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer, describeConformance } from '#test-utils';
import { flushMicrotasks, screen } from '@mui/internal-test-utils';

describe('<AlertDialog.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<AlertDialog.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<AlertDialog.Root open>{node}</AlertDialog.Root>);
    },
  }));

  it('has role="presentation"', async () => {
    const { getByTestId } = await render(
      <AlertDialog.Root open>
        <AlertDialog.Backdrop data-testid="backdrop" />
      </AlertDialog.Root>,
    );

    expect(getByTestId('backdrop')).to.have.attribute('role', 'presentation');
  });

  describe('prop: renderMode', () => {
    it('defaults to "root" renderMode when not specified', async () => {
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

    describe('root', () => {
      it('renders by default when not nested', async () => {
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

      it('does not render when nested', async () => {
        function App() {
          const [nestedOpen, setNestedOpen] = React.useState(true);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="root-backdrop" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Root dialog
                  <AlertDialog.Root open={nestedOpen} onOpenChange={setNestedOpen}>
                    <AlertDialog.Backdrop data-testid="nested-backdrop" renderMode="root" />
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

      it('renders only at the root level with multiple nesting levels', async () => {
        function App() {
          const [level2Open, setLevel2Open] = React.useState(true);
          const [level3Open, setLevel3Open] = React.useState(true);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="root" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="root" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>
                        Level 2 dialog
                        <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                          <AlertDialog.Backdrop data-testid="level-3-backdrop" renderMode="root" />
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
    });

    describe('leaf', () => {
      it('renders at root level when not nested', async () => {
        await render(
          <AlertDialog.Root open>
            <AlertDialog.Backdrop data-testid="backdrop" renderMode="leaf" />
            <AlertDialog.Portal>
              <AlertDialog.Popup>Content</AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>,
        );

        expect(screen.getByTestId('backdrop')).not.to.equal(null);
      });

      it('renders only at the leaf level when nested', async () => {
        function App() {
          const [level2Open, setLevel2Open] = React.useState(true);
          const [level3Open, setLevel3Open] = React.useState(true);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="leaf" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="leaf" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>
                        Level 2 dialog
                        <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                          <AlertDialog.Backdrop data-testid="level-3-backdrop" renderMode="leaf" />
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

        expect(screen.queryByTestId('level-1-backdrop')).to.equal(null);
        expect(screen.queryByTestId('level-2-backdrop')).to.equal(null);
        expect(screen.getByTestId('level-3-backdrop')).not.to.equal(null);
      });

      it('works with simple two-level nesting', async () => {
        function App() {
          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="leaf" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <AlertDialog.Root open>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="leaf" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>Level 2 dialog</AlertDialog.Popup>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          );
        }

        await render(<App />);

        // With leaf rendering, only the innermost (level 2) should render
        expect(screen.queryByTestId('level-1-backdrop')).to.equal(null);
        expect(screen.getByTestId('level-2-backdrop')).not.to.equal(null);
      });

      it('updates rendering when nested dialogs open/close', async () => {
        function App() {
          const [level2Open, setLevel2Open] = React.useState(false);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="leaf" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <button onClick={() => setLevel2Open(true)}>Open level 2</button>
                  <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="leaf" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>Level 2 dialog</AlertDialog.Popup>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          );
        }

        const { user } = await render(<App />);

        // Initially, level 1 should render as it's the leaf
        expect(screen.queryByTestId('level-1-backdrop')).not.to.equal(null);
        expect(screen.queryByTestId('level-2-backdrop')).to.have.property('hidden', true);

        // Open level 2 dialog
        const openButton = screen.getByRole('button', { name: 'Open level 2' });
        await user.click(openButton);
        await flushMicrotasks();

        // Now level 2 should render as it's the leaf, level 1 should not
        expect(screen.queryByTestId('level-1-backdrop')).to.equal(null);
        expect(screen.queryByTestId('level-2-backdrop')).not.to.have.property('hidden', true);
      });
    });

    describe('always', () => {
      it('always renders regardless of nesting', async () => {
        function App() {
          const [level2Open, setLevel2Open] = React.useState(true);
          const [level3Open, setLevel3Open] = React.useState(true);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="always" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="always" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>
                        Level 2 dialog
                        <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                          <AlertDialog.Backdrop
                            data-testid="level-3-backdrop"
                            renderMode="always"
                          />
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

    describe('mixed modes', () => {
      it('works with different render modes in nested dialogs', async () => {
        function App() {
          const [level2Open, setLevel2Open] = React.useState(true);
          const [level3Open, setLevel3Open] = React.useState(true);

          return (
            <AlertDialog.Root open>
              <AlertDialog.Backdrop data-testid="level-1-backdrop" renderMode="root" />
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  Level 1 dialog
                  <AlertDialog.Root open={level2Open} onOpenChange={setLevel2Open}>
                    <AlertDialog.Backdrop data-testid="level-2-backdrop" renderMode="always" />
                    <AlertDialog.Portal>
                      <AlertDialog.Popup>
                        Level 2 dialog
                        <AlertDialog.Root open={level3Open} onOpenChange={setLevel3Open}>
                          <AlertDialog.Backdrop data-testid="level-3-backdrop" renderMode="leaf" />
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

        // root mode: only renders at root level
        expect(screen.getByTestId('level-1-backdrop')).not.to.equal(null);
        // always mode: always renders
        expect(screen.getByTestId('level-2-backdrop')).not.to.equal(null);
        // leaf mode: only renders at leaf level
        expect(screen.getByTestId('level-3-backdrop')).not.to.equal(null);
      });
    });
  });
});
