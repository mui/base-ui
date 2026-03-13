import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Field.Error />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Error match />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Field.Root invalid>{node}</Field.Root>);
    },
  }));

  it('should set aria-describedby on the control automatically', async () => {
    await render(
      <Field.Root invalid>
        <Field.Control />
        <Field.Error match>Message</Field.Error>
      </Field.Root>,
    );

    expect(screen.getByRole('textbox')).to.have.attribute(
      'aria-describedby',
      screen.getByText('Message').id,
    );
  });

  it('should show error messages by default', async () => {
    await render(
      <Form>
        <Field.Root>
          <Field.Control required />
          <Field.Error>Message</Field.Error>
        </Field.Root>
        <button type="submit">submit</button>
      </Form>,
    );

    expect(screen.queryByText('Message')).to.equal(null);

    const input = screen.getByRole<HTMLInputElement>('textbox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(screen.queryByText('Message')).to.equal(null);

    fireEvent.click(screen.getByText('submit'));
    expect(screen.queryByText('Message')).not.to.equal(null);
  });

  describe('prop: match', () => {
    it('should only render when `match` matches constraint validation', async () => {
      await render(
        <Form>
          <Field.Root>
            <Field.Control required minLength={2} />
            <Field.Error match="valueMissing">Message</Field.Error>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      expect(screen.queryByText('Message')).to.equal(null);

      fireEvent.click(screen.getByText('submit'));
      expect(screen.queryByText('Message')).not.to.equal(null);

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.queryByText('Message')).to.equal(null);

      fireEvent.change(input, { target: { value: '' } });
      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('should show custom errors', async () => {
      await render(
        <Form>
          <Field.Root validate={() => 'error'}>
            <Field.Control />
            <Field.Error match="customError">Message</Field.Error>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const input = screen.getByRole<HTMLInputElement>('textbox');

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.blur(input);
      expect(screen.queryByText('Message')).to.equal(null);

      fireEvent.click(screen.getByText('submit'));
      expect(screen.queryByText('Message')).not.to.equal(null);
    });

    it('always renders the error message when `match` is true', async () => {
      await render(
        <Field.Root>
          <Field.Control required />
          <Field.Error match>Message</Field.Error>
        </Field.Root>,
      );

      expect(screen.queryByText('Message')).not.to.equal(null);
    });
  });

  describe.skipIf(isJSDOM)('animations', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('triggers enter animation via data-starting-style when mounting', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let transitionFinished = false;
      function notifyTransitionFinished() {
        transitionFinished = true;
      }

      const style = `
        .animation-test-error {
          transition: opacity 1ms;
        }

        .animation-test-error[data-starting-style],
        .animation-test-error[data-ending-style] {
          opacity: 0;
        }
      `;

      function Test() {
        const [showError, setShowError] = React.useState(false);

        function handleShowError() {
          setShowError(true);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleShowError}>Show</button>
            <Field.Root>
              <Field.Control required />
              <Field.Error
                className="animation-test-error"
                data-testid="error"
                match={showError}
                onTransitionEnd={notifyTransitionFinished}
              >
                Message
              </Field.Error>
            </Field.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('Show'));

      await waitFor(() => {
        expect(transitionFinished).to.equal(true);
      });

      expect(screen.getByTestId('error')).not.to.equal(null);
    });

    it('applies data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-error[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      function Test() {
        const [showError, setShowError] = React.useState(true);

        function handleHideError() {
          setShowError(false);
        }

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={handleHideError}>Hide</button>
            <Field.Root>
              <Field.Control required />
              <Field.Error className="animation-test-error" data-testid="error" match={showError}>
                Message
              </Field.Error>
            </Field.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);
      expect(screen.getByTestId('error')).not.to.equal(null);

      await user.click(screen.getByText('Hide'));

      await waitFor(() => {
        const error = screen.queryByTestId('error');
        expect(error).not.to.equal(null);
        expect(error).to.have.attribute('data-ending-style');
      });

      await waitFor(() => {
        expect(screen.queryByTestId('error')).to.equal(null);
      });
    });
  });
});
