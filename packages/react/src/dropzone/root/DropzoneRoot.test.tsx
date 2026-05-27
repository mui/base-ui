import * as React from 'react';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { isJSDOM } from '#test-utils';
import * as Dropzone from '../index.parts';

const createDataTransfer = (files: File[]) => {
  if (typeof DataTransfer === 'undefined') {
    return { files, types: files.length > 0 ? ['Files'] : [] } as unknown as DataTransfer;
  }

  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }

  Object.defineProperty(dataTransfer, 'files', {
    value: files,
    configurable: true,
  });

  // JSDOM does not populate types automatically when items are added.
  Object.defineProperty(dataTransfer, 'types', {
    value: files.length > 0 ? ['Files'] : [],
    configurable: true,
  });

  return dataTransfer;
};

// Simulates a dataTransfer in dragenter/dragover events, where files are
// not accessible but types includes 'Files' to signal a file drag.
const createFileDragTransfer = () =>
  ({ types: ['Files'], dropEffect: 'none' }) as unknown as DataTransfer;

describe('Dropzone.Root', () => {
  it('throws when HiddenInput is used outside Dropzone', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<Dropzone.HiddenInput />);
    }).toThrow(
      'Base UI: DropzoneRootContext is missing. Dropzone parts must be placed within <Dropzone.Root>.',
    );

    consoleSpy.mockRestore();
  });

  it('renders as a button-like div', () => {
    render(<Dropzone.Root>Drop files</Dropzone.Root>);

    const dropzone = screen.getByRole('button', { name: 'Drop files' });
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('supports an explicit aria-label', () => {
    render(<Dropzone.Root aria-label="Upload proof of address">Upload</Dropzone.Root>);

    expect(screen.getByRole('button', { name: 'Upload proof of address' })).toBeInTheDocument();
  });

  it('supports aria-labelledby', () => {
    render(
      <React.Fragment>
        <span id="dropzone-label">Upload receipts</span>
        <Dropzone.Root aria-labelledby="dropzone-label">
          <svg aria-hidden="true" />
        </Dropzone.Root>
      </React.Fragment>,
    );

    expect(screen.getByRole('button', { name: 'Upload receipts' })).toBeInTheDocument();
  });

  it('opens via click and keyboard', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(<Dropzone.Root onOpen={onOpen}>Drop files</Dropzone.Root>);

    const dropzone = screen.getByRole('button');

    await user.click(dropzone);
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    fireEvent.keyDown(dropzone, { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(3);
  });

  it('opens the registered input via click and keyboard', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');

    try {
      render(
        <Dropzone.Root>
          <Dropzone.HiddenInput />
          Drop files
        </Dropzone.Root>,
      );

      const dropzone = screen.getByRole('button');

      await user.click(dropzone);
      fireEvent.keyDown(dropzone, { key: 'Enter' });
      fireEvent.keyDown(dropzone, { key: ' ' });

      expect(inputClick).toHaveBeenCalledTimes(3);
    } finally {
      inputClick.mockRestore();
    }
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <Dropzone.Root disabled onOpen={onOpen}>
        Drop files
      </Dropzone.Root>,
    );

    const dropzone = screen.getByRole('button');

    await user.click(dropzone);
    fireEvent.keyDown(dropzone, { key: 'Enter' });

    expect(onOpen).not.toHaveBeenCalled();
    expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    expect(dropzone).toHaveAttribute('tabindex', '-1');
    expect(dropzone).toHaveAttribute('data-disabled', '');
  });

  it('does not open when nested interactive element is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <Dropzone.Root onOpen={onOpen}>
        <button type="button">Nested</button>
      </Dropzone.Root>,
    );

    await user.click(screen.getByText('Nested'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not open when a focusable element with tabindex is clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <Dropzone.Root onOpen={onOpen}>
        <div role="menuitem" tabIndex={0}>
          Focusable
        </div>
      </Dropzone.Root>,
    );

    await user.click(screen.getByText('Focusable'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('does not open when a nested interactive element has keyboard focus', () => {
    const onOpen = vi.fn();

    render(
      <Dropzone.Root onOpen={onOpen}>
        <button type="button">Nested</button>
      </Dropzone.Root>,
    );

    const nestedButton = screen.getByText('Nested');

    fireEvent.keyDown(nestedButton, { key: 'Enter', bubbles: true });
    fireEvent.keyDown(nestedButton, { key: ' ', bubbles: true });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('calls onDraggingChange only once when dragenter fires repeatedly', () => {
    const onDraggingChange = vi.fn();

    render(
      <Dropzone.Root data-testid="dropzone" onDraggingChange={onDraggingChange}>
        <span data-testid="child">Drop files</span>
      </Dropzone.Root>,
    );

    const dropzone = screen.getByTestId('dropzone');
    const dt = createFileDragTransfer();

    fireEvent.dragEnter(dropzone, { dataTransfer: dt });
    fireEvent.dragEnter(dropzone, { dataTransfer: dt });
    fireEvent.dragEnter(dropzone, { dataTransfer: dt });

    expect(onDraggingChange).toHaveBeenCalledTimes(1);
    expect(onDraggingChange).toHaveBeenCalledWith(true);
  });

  it('tracks dragging state and supports render prop', () => {
    render(
      <Dropzone.Root data-testid="dropzone">
        {({ isDragging }) => <span>{isDragging ? 'dragging' : 'idle'}</span>}
      </Dropzone.Root>,
    );

    const dropzone = screen.getByTestId('dropzone');

    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(dropzone).not.toHaveAttribute('data-dragging');

    fireEvent.dragEnter(dropzone, { dataTransfer: createFileDragTransfer() });
    expect(screen.getByText('dragging')).toBeInTheDocument();
    expect(dropzone).toHaveAttribute('data-dragging', '');

    fireEvent.dragLeave(dropzone);
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('ignores non-file drags (text, elements)', () => {
    const onDraggingChange = vi.fn();

    render(
      <Dropzone.Root data-testid="dropzone" onDraggingChange={onDraggingChange}>
        {({ isDragging }) => <span>{isDragging ? 'dragging' : 'idle'}</span>}
      </Dropzone.Root>,
    );

    const dropzone = screen.getByTestId('dropzone');
    const textDragTransfer = { types: ['text/plain'] } as unknown as DataTransfer;

    fireEvent.dragEnter(dropzone, { dataTransfer: textDragTransfer });

    expect(onDraggingChange).not.toHaveBeenCalled();
    expect(dropzone).not.toHaveAttribute('data-dragging');
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('calls onDraggingChange when dragging state changes', () => {
    const onDraggingChange = vi.fn();

    render(
      <Dropzone.Root data-testid="dropzone" onDraggingChange={onDraggingChange}>
        {({ isDragging }) => <span>{isDragging ? 'dragging' : 'idle'}</span>}
      </Dropzone.Root>,
    );

    const dropzone = screen.getByTestId('dropzone');

    fireEvent.dragEnter(dropzone, { dataTransfer: createFileDragTransfer() });
    expect(onDraggingChange).toHaveBeenCalledWith(true);
    expect(dropzone).toHaveAttribute('data-dragging', '');
    expect(screen.getByText('dragging')).toBeInTheDocument();

    fireEvent.dragLeave(dropzone);
    expect(onDraggingChange).toHaveBeenCalledWith(false);
    expect(dropzone).not.toHaveAttribute('data-dragging');
    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('keeps dragging state when drag leaves to a descendant', () => {
    render(
      <Dropzone.Root data-testid="dropzone">
        <span data-testid="child">Drop files</span>
      </Dropzone.Root>,
    );

    const dropzone = screen.getByTestId('dropzone');
    const child = screen.getByTestId('child');

    fireEvent.dragEnter(dropzone, { dataTransfer: createFileDragTransfer() });
    expect(dropzone).toHaveAttribute('data-dragging', '');

    const dragLeaveEvent = createEvent.dragLeave(dropzone);
    Object.defineProperty(dragLeaveEvent, 'relatedTarget', {
      value: child,
      configurable: true,
    });

    fireEvent(dropzone, dragLeaveEvent);
    expect(dropzone).toHaveAttribute('data-dragging', '');
  });

  it.skipIf(!isJSDOM)('sets copy dropEffect on drag over', () => {
    render(<Dropzone.Root data-testid="dropzone">Drop files</Dropzone.Root>);

    const dropzone = screen.getByTestId('dropzone');
    const dataTransfer = createFileDragTransfer();

    fireEvent.dragOver(dropzone, { dataTransfer });

    expect(dataTransfer.dropEffect).toBe('copy');
  });

  it('emits dropped files', () => {
    const onFilesDrop = vi.fn();

    render(
      <Dropzone.Root data-testid="dropzone" onFilesDrop={onFilesDrop}>
        Drop files
      </Dropzone.Root>,
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: createDataTransfer([file]),
    });

    expect(onFilesDrop).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'test.txt' })]),
      expect.anything(),
    );
  });

  it('does not emit dropped files when disabled', () => {
    const onFilesDrop = vi.fn();

    render(
      <Dropzone.Root data-testid="dropzone" disabled onFilesDrop={onFilesDrop}>
        Drop files
      </Dropzone.Root>,
    );

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: createDataTransfer([file]),
    });

    expect(onFilesDrop).not.toHaveBeenCalled();
  });

  it('forwards ref to the root div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Dropzone.Root ref={ref}>Drop files</Dropzone.Root>);

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Drop files' }));
  });

  it('forwards ref to the input part', () => {
    const ref = React.createRef<HTMLInputElement>();

    render(
      <Dropzone.Root>
        <Dropzone.HiddenInput ref={ref} />
        Drop files
      </Dropzone.Root>,
    );

    expect(ref.current).toHaveAttribute('type', 'file');
  });

  it('applies disabled state to the hidden input', () => {
    render(
      <Dropzone.Root disabled>
        <Dropzone.HiddenInput data-testid="input" />
        Drop files
      </Dropzone.Root>,
    );

    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('forwards form ownership attributes to the hidden input', () => {
    render(
      <React.Fragment>
        <form id="external-form" />
        <Dropzone.Root>
          <Dropzone.HiddenInput data-testid="input" name="files" form="external-form" />
          Drop files
        </Dropzone.Root>
      </React.Fragment>,
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('name', 'files');
    expect(input).toHaveAttribute('form', 'external-form');
  });

  describe('Accessibility', () => {
    it('announces drag state transitions to screen readers', async () => {
      render(<Dropzone.Root data-testid="dropzone">Drop files</Dropzone.Root>);

      const dropzone = screen.getByTestId('dropzone');

      // Initial status region should exist as a sibling outside the button element
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-atomic', 'true');

      // Drag enter - announces ready state
      fireEvent.dragEnter(dropzone, { dataTransfer: createFileDragTransfer() });
      expect(screen.getByRole('status').textContent).toContain('Ready to drop files');

      // Drag leave - announces drag ended
      const dragLeaveEvent = createEvent.dragLeave(dropzone);
      Object.defineProperty(dragLeaveEvent, 'relatedTarget', {
        value: null,
        configurable: true,
      });
      fireEvent(dropzone, dragLeaveEvent);
      expect(screen.getByRole('status').textContent).toContain('Drag ended');
    });

    it('announces successfully dropped files', () => {
      render(<Dropzone.Root data-testid="dropzone">Drop files</Dropzone.Root>);

      const dropzone = screen.getByTestId('dropzone');

      const file1 = new File(['content'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content'], 'test2.txt', { type: 'text/plain' });

      fireEvent.drop(dropzone, {
        dataTransfer: createDataTransfer([file1, file2]),
      });

      expect(screen.getByRole('status').textContent).toContain('Dropped 2 files');
    });

    it('announces when a file drop yields no files', () => {
      render(<Dropzone.Root data-testid="dropzone">Drop files</Dropzone.Root>);

      const dropzone = screen.getByTestId('dropzone');

      // Simulate a dataTransfer that signals files (types includes 'Files')
      // but the files list ends up empty (edge case).
      const emptyFilesDrop = {
        types: ['Files'],
        files: { length: 0, item: () => null },
      } as unknown as DataTransfer;

      fireEvent.drop(dropzone, { dataTransfer: emptyFilesDrop });

      expect(screen.getByRole('status').textContent).toContain('No files dropped');
    });

    it('does not announce for non-file drops', () => {
      render(<Dropzone.Root data-testid="dropzone">Drop files</Dropzone.Root>);

      const dropzone = screen.getByTestId('dropzone');
      const statusRegion = screen.getByRole('status');

      fireEvent.drop(dropzone, {
        dataTransfer: { types: ['text/plain'] } as unknown as DataTransfer,
      });

      expect(statusRegion.textContent).toBe('');
    });
  });
});
