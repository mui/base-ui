import * as React from 'react';
import { createRenderer, fireEvent, act } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Textarea } from '@mui/base/Textarea';
import { FormControl } from '@mui/base/FormControl';

describe('<Textarea />', () => {
  const { render } = createRenderer();

  it('renders a textarea element', () => {
    const { getByTestId } = render(<Textarea data-testid="textarea" />);

    const component = getByTestId('textarea');

    expect(component).to.have.tagName('textarea');
  });

  it('can attach a ref', () => {
    const textareaRef = React.createRef<HTMLTextAreaElement>();
    const { getByTestId } = render(<Textarea ref={textareaRef} data-testid="textarea" />);

    expect(textareaRef.current).to.deep.equal(getByTestId('textarea'));
  });

  describe('prop: className', () => {
    it('should apply the className when passed as a string', () => {
      const { container } = render(<Textarea className="test-class" />);
      expect(container.firstElementChild?.className).to.contain('test-class');
    });

    it('should apply className when passed as a function', () => {
      const classNameCallback = spy((args) => {
        expect(args).to.deep.equal({
          focused: false,
          disabled: true,
          error: false,
          required: false,
          readOnly: false,
          formControlContext: false,
        });
        return `my-custom-class${args.disabled && ' my-disabled-class'}`;
      });

      render(<Textarea disabled className={classNameCallback} />);

      expect(classNameCallback.returned('my-custom-class my-disabled-class')).to.equal(true);
    });
  });

  describe('extra props', () => {
    it('should spread extra props', () => {
      const { container } = render(<Textarea data-extra="Hello world" />);
      expect(container.firstElementChild as HTMLElement).to.have.attribute(
        'data-extra',
        'Hello world',
      );
    });
  });

  describe('prop: render', () => {
    const Wrapper = React.forwardRef<HTMLTextAreaElement, { children?: React.ReactNode }>(
      function Wrapper(props, forwardedRef) {
        const { minRows, maxRows, ...otherProps } = props;
        return (
          <div data-testid="wrapper">
            <textarea ref={forwardedRef} {...otherProps} />
          </div>
        );
      },
    );

    it('should render the custom component', () => {
      const { container, getByTestId } = render(
        <Textarea render={(props) => <Wrapper {...props} />} data-testid="wrapped" />,
      );

      expect(container.firstElementChild).to.equal(getByTestId('wrapper'));
    });

    it('should pass the ref to the custom component', () => {
      let instanceFromRef = null;

      function Test() {
        return (
          <Textarea
            ref={(el) => {
              instanceFromRef = el;
            }}
            render={(props) => <Wrapper {...props} />}
            data-testid="wrapped"
          />
        );
      }

      render(<Test />);
      expect(instanceFromRef!.tagName).to.equal('TEXTAREA');
      expect(instanceFromRef!).to.have.attribute('data-testid', 'wrapped');
    });
  });

  describe('event handlers', () => {
    it('should call event handlers passed to component', () => {
      const handleChange = spy();
      const handleFocus = spy();
      const handleBlur = spy();
      const handleKeyDown = spy();
      const handleKeyUp = spy();
      const { getByTestId } = render(
        <Textarea
          data-testid="textarea"
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyUp={handleKeyUp}
          onKeyDown={handleKeyDown}
        />,
      );

      const textarea = getByTestId('textarea');

      // simulating user input: gain focus, key input (keydown, (input), change, keyup), blur
      act(() => {
        textarea.focus();
      });
      expect(handleFocus.callCount).to.equal(1);

      fireEvent.keyDown(textarea, { key: 'a' });
      expect(handleKeyDown.callCount).to.equal(1);

      fireEvent.change(textarea, { target: { value: 'a' } });
      expect(handleChange.callCount).to.equal(1);

      fireEvent.keyUp(textarea, { key: 'a' });
      expect(handleKeyUp.callCount).to.equal(1);

      act(() => {
        textarea.blur();
      });
      expect(handleBlur.callCount).to.equal(1);
    });
  });

  describe('prop: rows/minRows/maxRows', () => {
    it('should pass the rows prop to the underlying textarea', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" rows={5} />);
      expect(getByTestId('textarea')).to.have.attribute('rows', '5');
    });

    it('should not pass the minRows or maxRows props to the textarea in the dom', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" minRows={5} maxRows={10} />);
      expect(getByTestId('textarea')).not.to.have.attribute('minRows');
      expect(getByTestId('textarea')).not.to.have.attribute('maxRows');
    });

    it('should preserve state when changing rows', () => {
      const { getByTestId, setProps } = render(
        <Textarea data-testid="textarea" defaultValue="Welcome" />,
      );
      const textarea = getByTestId('textarea');
      act(() => {
        textarea.focus();
      });

      setProps({ rows: 4 });

      expect(textarea).toHaveFocus();
    });
  });

  describe('prop: disabled', () => {
    it('should render a disabled <textarea />', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" disabled />);
      const textarea = getByTestId('textarea');
      expect(textarea).to.have.attribute('disabled');
    });

    it('should reset the focused state if the component becomes disabled', () => {
      const handleBlur = spy();
      const handleFocus = spy();

      const { getByTestId, setProps } = render(
        <Textarea data-testid="textarea" onBlur={handleBlur} onFocus={handleFocus} />,
      );

      act(() => {
        getByTestId('textarea').focus();
      });
      expect(handleFocus.callCount).to.equal(1);

      setProps({ disabled: true });

      expect(handleBlur.callCount).to.equal(1);
      // check if focus not initiated again
      expect(handleFocus.callCount).to.equal(1);
    });
  });

  describe('prop: readonly', () => {
    it('should render a readonly <textarea />', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" readOnly />);
      const textarea = getByTestId('textarea');
      expect(textarea).to.have.attribute('readOnly');
      expect(textarea).to.have.property('readOnly');
    });
  });

  describe('controlled', () => {
    it('should forward the value to the textarea', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" maxRows={4} value="Hello" />);

      const textarea = getByTestId('textarea');
      expect(textarea).to.have.value('Hello');
    });
  });

  describe('style hooks', () => {
    it('should set style hooks', () => {
      const { getByTestId } = render(
        <FormControl defaultValue="multiline field" disabled error required>
          <Textarea data-testid="textarea" readOnly />
        </FormControl>,
      );

      const textarea = getByTestId('textarea');

      expect(textarea.getAttribute('data-disabled')).to.equal('true');
      expect(textarea.getAttribute('data-error')).to.equal('true');
      expect(textarea.getAttribute('data-required')).to.equal('true');
      expect(textarea.getAttribute('data-readonly')).to.equal('true');
      expect(textarea.getAttribute('data-focused')).to.equal(null);
    });

    it('should set data-focused when focused', () => {
      const { getByTestId } = render(<Textarea data-testid="textarea" />);

      const textarea = getByTestId('textarea');

      act(() => {
        textarea.focus();
      });

      expect(textarea.getAttribute('data-focused')).to.equal('true');
    });
  });

  describe('form submission', () => {
    it('includes the Textarea value in the form data when `name` is provided', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        // FormData is not available in JSDOM
        this.skip();
      }
      const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        expect(formData.get('textarea-one')).to.equal('Mozilla Firefox');

        const formDataAsObject = Object.fromEntries(formData);
        expect(Object.keys(formDataAsObject).length).to.equal(1);
      };

      const { getByText } = render(
        <form onSubmit={handleSubmit}>
          <Textarea name="textarea-one" defaultValue="Mozilla Firefox" />
          <Textarea defaultValue="Google Chrome" />
          <button type="submit">Submit</button>
        </form>,
      );

      const button = getByText('Submit');
      act(() => {
        button.click();
      });
    });
  });
});
