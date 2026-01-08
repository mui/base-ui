import { expect } from 'chai';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Radio.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Root value="" />, () => ({
    refInstanceof: window.HTMLSpanElement,
    testComponentPropWith: 'span',
    button: true,
    render,
  }));

  it('does not forward `value` prop', async () => {
    await render(
      <RadioGroup>
        <Radio.Root value="test" data-testid="radio-root" />
      </RadioGroup>,
    );

    expect(screen.getByTestId('radio-root')).not.to.have.attribute('value');
  });

  it('allows `null` value', async () => {
    await render(
      <RadioGroup>
        <Radio.Root value={null} data-testid="radio-null" />
        <Radio.Root value="a" data-testid="radio-a" />
      </RadioGroup>,
    );

    const radioNull = screen.getByTestId('radio-null');
    const radioA = screen.getByTestId('radio-a');
    fireEvent.click(radioNull);
    expect(radioNull).to.have.attribute('aria-checked', 'true');
    fireEvent.click(radioA);
    expect(radioNull).to.have.attribute('aria-checked', 'false');
  });

  it('associates `id` with the native button when `nativeButton=true`', async () => {
    await render(
      <div>
        <label data-testid="label" htmlFor="myRadio">
          A
        </label>

        <RadioGroup defaultValue="b">
          <Radio.Root value="a" id="myRadio" nativeButton render={<button />} data-testid="a" />
          <Radio.Root value="b" data-testid="b" />
        </RadioGroup>
      </div>,
    );

    const radioA = screen.getByTestId('a');
    expect(radioA).to.have.attribute('id', 'myRadio');

    const hiddenInput = radioA.nextElementSibling as HTMLInputElement | null;
    expect(hiddenInput?.tagName).to.equal('INPUT');
    expect(hiddenInput).not.to.have.attribute('id', 'myRadio');

    expect(radioA).to.have.attribute('aria-checked', 'false');
    fireEvent.click(screen.getByTestId('label'));
    expect(radioA).to.have.attribute('aria-checked', 'true');
  });

  describe('prop: disabled', () => {
    it('uses aria-disabled instead of HTML disabled', async () => {
      await render(
        <RadioGroup>
          <Radio.Root value="a" disabled data-testid="radio" />
        </RadioGroup>,
      );

      const radio = screen.getByTestId('radio');
      expect(radio).to.not.have.attribute('disabled');
      expect(radio).to.have.attribute('aria-disabled', 'true');
    });
  });
});
