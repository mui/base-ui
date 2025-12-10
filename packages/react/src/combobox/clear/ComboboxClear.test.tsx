import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Combobox.Clear />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(
        <Combobox.Root defaultValue="a">
          <Combobox.Input />
          {node}
        </Combobox.Root>,
      );
    },
  }));

  it('renders in single mode when a value is selected', async () => {
    await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Input />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId('clear')).not.to.equal(null);
  });

  it('click clears selected value and focuses input', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.click(screen.getByTestId('clear'));

    expect(screen.queryByTestId('clear')).to.equal(null);
    expect(document.activeElement).to.equal(input);
  });

  it('does not dismiss the popup on click (outsidePress is blocked)', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen defaultValue="a">
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByRole('listbox')).not.to.equal(null);

    await user.click(screen.getByTestId('clear'));

    expect(screen.getByRole('listbox')).not.to.equal(null);
  });

  it('is disabled when root disabled and does nothing on click', async () => {
    await render(
      <Combobox.Root defaultValue="a" disabled>
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    const clear = screen.getByTestId('clear');
    expect(clear).to.have.attribute('disabled');

    fireEvent.click(clear);
    expect(screen.getByTestId('clear')).not.to.equal(null);
  });

  it('is readOnly when root readOnly and does nothing on click', async () => {
    await render(
      <Combobox.Root defaultValue="a" readOnly>
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    const clear = screen.getByTestId('clear');
    expect(clear).to.have.attribute('aria-readonly', 'true');

    fireEvent.click(clear);
    expect(screen.getByTestId('clear')).not.to.equal(null);
  });

  describe.skipIf(isJSDOM)('animations', () => {
    it('triggers enter animation via data-starting-style when becoming visible', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      const style = `
        .animation-test-indicator {
          transition: opacity 1ms;
        }

        .animation-test-indicator[data-starting-style],
        .animation-test-indicator[data-ending-style] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Clear
              className="animation-test-indicator"
              data-testid="clear"
              onTransitionEnd={notifyAnimationFinished}
            />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>,
      );

      expect(screen.queryByTestId('clear')).to.equal(null);

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      await user.click(screen.getByRole('option', { name: 'a' }));

      await waitFor(() => {
        expect(animationFinished).to.equal(true);
      });
      expect(screen.getByTestId('clear')).not.to.equal(null);
    });

    it('triggers exit animation via data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      const style = `
        .animation-test-indicator {
          transition: opacity 1ms;
        }

        .animation-test-indicator[data-starting-style],
        .animation-test-indicator[data-ending-style] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root defaultValue="a">
            <Combobox.Input data-testid="input" />
            <Combobox.Clear
              className="animation-test-indicator"
              data-testid="clear"
              keepMounted
              onTransitionEnd={notifyAnimationFinished}
            />
          </Combobox.Root>
        </div>,
      );

      const clear = screen.getByTestId('clear');
      expect(clear).not.to.equal(null);

      await user.click(clear);

      await waitFor(() => {
        expect(animationFinished).to.equal(true);
      });
    });
  });
});
