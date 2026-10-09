import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Textarea } from '@base-ui/react/textarea';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Textarea.CharacterCount />', () => {
  const { render } = createRenderer();

  describeConformance(<Textarea.CharacterCount />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render,
  }));

  it('renders a span element', async () => {
    await render(<Textarea.CharacterCount data-testid="count" />);
    expect(screen.getByTestId('count').tagName).toBe('SPAN');
  });

  it('displays "0" when no value or maxLength', async () => {
    await render(<Textarea.CharacterCount data-testid="count" />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('displays "0/100" with maxLength', async () => {
    await render(<Textarea.CharacterCount maxLength={100} data-testid="count" />);
    expect(screen.getByTestId('count')).toHaveTextContent('0/100');
  });

  it('displays count from value', async () => {
    await render(
      <Textarea.CharacterCount value="hello" maxLength={100} data-testid="count" />,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('5/100');
  });

  it('updates when value prop changes', async () => {
    const { rerender } = await render(
      <Textarea.CharacterCount value="hi" maxLength={100} data-testid="count" />,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('2/100');

    await rerender(
      <Textarea.CharacterCount value="hello world" maxLength={100} data-testid="count" />,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('11/100');
  });

  it('sets data-approaching when above 80% of maxLength', async () => {
    await render(
      <Textarea.CharacterCount value={'a'.repeat(85)} maxLength={100} data-testid="count" />,
    );
    expect(screen.getByTestId('count')).toHaveAttribute('data-approaching', '');
  });

  it('does not set data-approaching below 80% of maxLength', async () => {
    await render(
      <Textarea.CharacterCount value={'a'.repeat(50)} maxLength={100} data-testid="count" />,
    );
    expect(screen.getByTestId('count')).not.toHaveAttribute('data-approaching');
  });

  it('supports children render function', async () => {
    await render(
      <Textarea.CharacterCount value="hello" maxLength={100} data-testid="count">
        {({ count, maxLength: max }) => `${count} of ${max} chars`}
      </Textarea.CharacterCount>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('5 of 100 chars');
  });

  it('displays count without maxLength', async () => {
    await render(
      <Textarea.CharacterCount value="hello world" data-testid="count" />,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('11');
  });
});
