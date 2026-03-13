import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { List, Button } from '../utils/test-utils';

describe('<Toast.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Toast.Provider>{node}</Toast.Provider>);
    },
  }));

  it('gets focused when F6 is pressed', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');

    expect(screen.getByTestId('viewport')).toHaveFocus();
  });

  it('focuses first toast upon tab after viewport is focused', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');

    expect(screen.getByTestId('root')).toHaveFocus();
  });

  it('returns focus to previous element when pressing shift+Tab on first toast', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');
    await user.tab();
    await user.tab({ shift: true });

    expect(button).toHaveFocus();
  });

  it('returns focus to previous element when pressing shift+Tab on last toast', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.click(button);

    await user.keyboard('{F6}');
    await user.tab(); // first toast
    await user.tab(); // first toast close button
    await user.tab(); // first toast action button
    await user.tab(); // last toast
    await user.tab(); // last toast close button
    await user.tab(); // last toast action button
    await user.tab();

    expect(button).toHaveFocus();
  });

  it('removes expanded on mouseleave when focus-visible not inside', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    fireEvent.mouseEnter(root);
    expect(viewport).to.have.attribute('data-expanded');

    fireEvent.mouseLeave(root);
    expect(viewport).to.not.have.attribute('data-expanded');
  });

  it('keeps expanded on mouseleave when focus-visible is inside', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);
    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    await user.keyboard('{F6}');
    await user.tab();

    fireEvent.mouseEnter(root);
    expect(viewport).to.have.attribute('data-expanded');
    fireEvent.mouseLeave(root);
    expect(viewport).to.have.attribute('data-expanded');
  });

  describe('timers', () => {
    const { render: renderFakeTimers, clock } = createRenderer();

    clock.withFakeTimers();

    it('pauses timers when hovering', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      clock.tick(5001);

      expect(screen.queryByTestId('root')).not.to.equal(null);
    });

    it('resumes timers when not hovering', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      clock.tick(5000);

      fireEvent.mouseLeave(screen.getByTestId('root'));

      clock.tick(4999);

      expect(screen.queryByTestId('root')).not.to.equal(null);

      clock.tick(2);

      expect(screen.queryByTestId('root')).to.equal(null);
    });

    it('pauses timers when the viewport is focused', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });

      clock.tick(5001);

      expect(screen.queryByTestId('root')).not.to.equal(null);
    });

    it.skipIf(!isJSDOM)('resumes timers when the viewport is blurred', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });

      clock.tick(5001);

      await act(async () => button.focus());

      clock.tick(5001);

      expect(screen.queryByTestId('root')).to.equal(null);
    });
  });
});
