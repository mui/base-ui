import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, screen, waitFor } from '@mui/internal-test-utils';
import { useId } from '@base-ui/utils/useId';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      useId: undefined,
    },
  };
});

interface TestComponentProps {
  id?: string;
  prefix?: string;
}

describe('useId with the React 17 id fallback', () => {
  const { render, renderToString } = createRenderer();

  let lastId: string | undefined;

  function TestComponent({ id: idProp, prefix }: TestComponentProps) {
    const id = useId(idProp, prefix);
    lastId = id;
    return <span data-testid="target" id={id} />;
  }

  beforeEach(() => {
    lastId = undefined;
  });

  it('returns the provided id', () => {
    render(<TestComponent id="some-id" />);

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');
  });

  it("generates an id if one isn't provided", () => {
    render(<TestComponent />);

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
  });

  it('generates an id with the provided prefix', () => {
    render(<TestComponent prefix="base-ui" />);

    expect(screen.getByTestId('target').id).toMatch(/^base-ui-\d+$/);
  });

  it('generates an id when the provided id is removed', async () => {
    const { setProps } = render(<TestComponent id="some-id" />);

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    await waitFor(() => {
      expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
    });
  });

  it('keeps the generated id when the provided id is added and removed again', async () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    expect(generatedId).toMatch(/^mui-\d+$/);

    setProps({ id: 'some-id' });

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    await waitFor(() => {
      expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
    });
  });

  it('does not regenerate the id on subsequent renders', () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    setProps({ prefix: undefined });

    expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
  });

  it('returns an empty string id override as-is', () => {
    render(<TestComponent id="" />);

    expect(lastId).toBe('');
  });

  it('returns undefined on the server', () => {
    renderToString(<TestComponent />);

    expect(lastId).toBe(undefined);
    expect(screen.getByTestId('target')).not.toHaveAttribute('id');
  });
});
