// @vitest-environment jsdom
import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
// eslint-disable-next-line import/no-relative-packages
import { createDndRenderer } from '../../../../packages/react/test/dndEngine';
// eslint-disable-next-line import/no-relative-packages
import { flushRaf, setupDragEngineTests } from '../../../../packages/react/test/dnd';
import { ExperimentSettingsContext } from '../../app/(private)/experiments/_components/SettingsPanel';
import Calendar from '../../app/(private)/experiments/drag-engine/calendar';
import Kanban from '../../app/(private)/experiments/drag-engine/kanban-line-indicator';
import FakeBrowser from '../../app/(private)/experiments/drag-engine/fake-browser';
import Annotations from '../../app/(private)/experiments/drag-engine/line-chart-annotations';

setupDragEngineTests();
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function Settings({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Record<string, unknown>;
}) {
  const value = React.useMemo(() => ({ settings, setSettings: () => {} }), [settings]);
  return (
    <ExperimentSettingsContext.Provider value={value}>
      {children}
    </ExperimentSettingsContext.Provider>
  );
}

describe('drag experiment regressions', () => {
  const { renderDnd } = createDndRenderer();

  it('clears the calendar range preview after a canceled gesture', async () => {
    await renderDnd(
      <Settings settings={{ view: 'month', weekStartsOnMonday: true }}>
        <Calendar />
      </Settings>,
    );
    const [source, target] = document.querySelectorAll<HTMLElement>('[data-cal-day]');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    target.getBoundingClientRect = () => new DOMRect(100, 0, 100, 100);
    fireEvent.dragStart(source, { clientX: 20, clientY: 20 });
    fireEvent.dragOver(target, { clientX: 120, clientY: 20 });
    await flushRaf();
    expect(document.querySelector('[data-intent="create"]')).not.toBeNull();
    fireEvent.dragEnd(source);
    expect(document.querySelector('[data-intent="create"]')).toBeNull();
  });

  it('ignores the cloned Kanban card when calculating insertion slots', async () => {
    await renderDnd(<Kanban />);
    const bodies = Array.from(document.querySelectorAll<HTMLElement>('[data-column-body]'));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-drag-preview')) {
        return new DOMRect(0, 70, 180, 40);
      }
      const body = this.closest<HTMLElement>('[data-column-body]');
      if (body) {
        const index = Array.from(
          body.querySelectorAll('[data-card]:not([data-drag-preview])'),
        ).indexOf(this);
        return new DOMRect(bodies.indexOf(body) * 250, Math.max(index, 0) * 50, 180, 40);
      }
      const columnIndex = bodies.findIndex((entry) => entry.parentElement === this);
      return new DOMRect(Math.max(columnIndex, 0) * 250, 0, 200, 200);
    });
    const source = screen.getByText('Write spec');
    fireEvent.dragStart(source, { clientX: 20, clientY: 20 });
    fireEvent.dragOver(document.body, { clientX: 20, clientY: 110 });
    await flushRaf();
    expect(document.querySelector('[data-card][data-drag-preview]')).not.toBeNull();
    expect(bodies[0].lastElementChild).toHaveStyle({ top: '95px' });
    fireEvent.drop(document.body, { clientX: 20, clientY: 95 });
    expect(
      Array.from(
        bodies[0].querySelectorAll('[data-card]:not([data-drag-preview])'),
        (card) => card.textContent,
      ),
    ).toEqual(['Sketch UI', 'Write spec', 'Set up project']);
  });

  it('opens More when the last visible bookmark is dragged over it', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(
      this: HTMLElement,
    ) {
      return new DOMRect(0, 0, this.hasAttribute('data-measure-more') ? 10 : 30, 30);
    });
    await renderDnd(<FakeBrowser />);
    const source = screen.getByRole('menuitem', { name: 'Science' });
    const more = screen.getByRole('menuitem', { name: /More bookmarks/ });
    fireEvent.dragStart(source, { clientX: 10, clientY: 10 });
    fireEvent.dragOver(more, { clientX: 15, clientY: 15 });
    await flushRaf();
    expect(more).toHaveAttribute('aria-expanded', 'true');
    fireEvent.dragEnd(source);
    await flushRaf();
  });

  it('applies the release position even without a preceding movement frame', async () => {
    await renderDnd(
      <Settings settings={{ snapToDataPoints: false }}>
        <Annotations />
      </Settings>,
    );
    const source = screen.getByLabelText('Horizontal line at 84.0');
    source.getBoundingClientRect = () => new DOMRect(0, 0, 728, 10);
    fireEvent.dragStart(source, { clientX: 20, clientY: 20 });
    fireEvent.drop(document.body, { clientX: 20, clientY: 55.2 });
    expect(screen.getByLabelText('Horizontal line at 73.0')).toBeInTheDocument();
  });
});
