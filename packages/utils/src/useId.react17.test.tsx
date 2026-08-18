import { expect, vi } from 'vitest';
import * as React from 'react';
import { createRenderer, screen } from '@mui/internal-test-utils';
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

  let renderedIds: (string | undefined)[] = [];

  function lastRenderedId() {
    return renderedIds[renderedIds.length - 1];
  }

  function TestComponent({ id: idProp, prefix }: TestComponentProps) {
    const id = useId(idProp, prefix);
    renderedIds.push(id);
    return <span data-testid="target" id={id} />;
  }

  beforeEach(() => {
    renderedIds = [];
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

  it('generates an id when the provided id is removed', () => {
    const { setProps } = render(<TestComponent id="some-id" />);

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);
  });

  // Every render is inspected rather than just the resulting DOM.
  // `act()` flushes a deferred fallback before the assertion runs, so a lazily generated id
  // is indistinguishable from the outside even though it leaves one commit with no id.
  it('never renders without an id once the provided id is removed', () => {
    const { setProps } = render(<TestComponent id="some-id" />);

    renderedIds = [];

    setProps({ id: undefined });

    expect(renderedIds).not.toContain(undefined);
  });

  // StrictMode renders twice, so a single mount pass is two entries.
  // Generating the fallback must not schedule a further pass when the caller supplies the id.
  it('does not rerender after mounting with a provided id', () => {
    render(<TestComponent id="some-id" />);

    expect(renderedIds).toEqual(['some-id', 'some-id']);
  });

  it('keeps the generated id when the provided id is added and removed again', () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    expect(generatedId).toMatch(/^mui-\d+$/);

    setProps({ id: 'some-id' });

    expect(screen.getByTestId('target')).toHaveProperty('id', 'some-id');

    setProps({ id: undefined });

    expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
  });

  it('does not regenerate the id on subsequent renders', () => {
    const { setProps } = render(<TestComponent />);

    const generatedId = screen.getByTestId('target').id;

    setProps({});

    expect(screen.getByTestId('target')).toHaveProperty('id', generatedId);
  });

  it('returns an empty string id override as-is', () => {
    const { setProps } = render(<TestComponent />);

    expect(screen.getByTestId('target').id).toMatch(/^mui-\d+$/);

    setProps({ id: '' });

    expect(lastRenderedId()).toBe('');
  });

  it('returns undefined on the server', () => {
    renderToString(<TestComponent />);

    expect(lastRenderedId()).toBe(undefined);
    expect(screen.getByTestId('target')).not.toHaveAttribute('id');
  });
});
