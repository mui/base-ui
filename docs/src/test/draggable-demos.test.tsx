// @vitest-environment jsdom

import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@mui/internal-test-utils';
// eslint-disable-next-line import/no-relative-packages
import { createDndRenderer } from '../../../packages/react/test/dndEngine';
// eslint-disable-next-line import/no-relative-packages
import { firePointer } from '../../../packages/react/test/pointer';
// eslint-disable-next-line import/no-relative-packages
import { fireDrag, flushRaf, setupDragEngineTests } from '../../../packages/react/test/dnd';
import ActivationCss from '../app/(docs)/react/utils/draggable/demos/activation/css-modules';
import ActivationTailwind from '../app/(docs)/react/utils/draggable/demos/activation/tailwind';
import FileExplorerExperiment from '../app/(private)/experiments/drag-engine/file-explorer';

import SortableOnDropCss from '../app/(docs)/react/utils/draggable/demos/sortable-on-drop/css-modules';
import SortableOnDropTailwind from '../app/(docs)/react/utils/draggable/demos/sortable-on-drop/tailwind';
import ScrollingCss from '../app/(docs)/react/utils/draggable/demos/scrolling-hero/css-modules';
import ScrollingTailwind from '../app/(docs)/react/utils/draggable/demos/scrolling-hero/tailwind';

import SortableLiveCss from '../app/(docs)/react/utils/draggable/demos/sortable-live/css-modules';
import SortableLiveTailwind from '../app/(docs)/react/utils/draggable/demos/sortable-live/tailwind';

import KanbanBoardExperiment from '../app/(private)/experiments/drag-engine/kanban-placeholder-card';
import { findClosestSlot } from '../app/(private)/experiments/drag-engine/kanban-placeholder-card-slots';

import { ControlledAddCloseExample } from '../app/(private)/experiments/drag-engine/draggable-tabs';

import HandleCss from '../app/(docs)/react/utils/draggable/demos/handle/css-modules';
import HandleTailwind from '../app/(docs)/react/utils/draggable/demos/handle/tailwind';
import NestingCss from '../app/(docs)/react/utils/draggable/demos/nesting/css-modules';
import NestingTailwind from '../app/(docs)/react/utils/draggable/demos/nesting/tailwind';

import HeroCss from '../app/(docs)/react/utils/draggable/demos/hero/css-modules';
import HeroTailwind from '../app/(docs)/react/utils/draggable/demos/hero/tailwind';
import CanvasCss from '../app/(docs)/react/utils/draggable/demos/scrolling-canvas/css-modules';
import CanvasTailwind from '../app/(docs)/react/utils/draggable/demos/scrolling-canvas/tailwind';
import AxisCss from '../app/(docs)/react/utils/draggable/demos/scrolling-axis/css-modules';
import AxisTailwind from '../app/(docs)/react/utils/draggable/demos/scrolling-axis/tailwind';

setupDragEngineTests();
afterEach(() => vi.unstubAllGlobals());

describe('draggable demos', () => {
  const { renderDnd } = createDndRenderer();

  describe.each([HeroCss, HeroTailwind])('hero keyboard shortcut', (Demo) => {
    it('moves the focused card, clamps to the surface, and retains focus', async () => {
      const { user } = await renderDnd(<Demo />);
      const card = screen.getByText('Drag me');
      const surface = card.parentElement!;
      Object.defineProperties(surface, {
        clientWidth: { value: 300 },
        clientHeight: { value: 192 },
      });
      Object.defineProperties(card, { offsetWidth: { value: 128 }, offsetHeight: { value: 40 } });
      card.focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(card).toHaveStyle({ left: '44px', top: '24px' });
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(card).toHaveStyle({ left: '64px' });
      expect(card).toHaveFocus();
      await user.keyboard('{Alt>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Alt}');
      expect(card).toHaveStyle({ left: '0px' });
      expect(screen.getByRole('status')).toHaveTextContent('Card position: 0, 24');
      await user.keyboard('{Alt>}{ArrowUp}{ArrowUp}{/Alt}');
      expect(card).toHaveStyle({ top: '0px' });
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect(card).toHaveStyle({ top: '20px' });
      expect(card).toHaveFocus();
    });
  });

  describe.each([NestingCss, NestingTailwind])('nested target keyboard shortcut', (Demo) => {
    it('moves the focused layer, excludes the frame for notes, and restores focus', async () => {
      const { user } = await renderDnd(<Demo />);
      screen.getByText('Chart', { exact: true }).focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(screen.getByRole('status')).toHaveTextContent('Chart: canvas. Note: palette.');
      expect(screen.getByText('Chart', { exact: true })).toHaveFocus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(screen.getByRole('status')).toHaveTextContent('Chart: frame. Note: palette.');
      expect(screen.getByText('Chart', { exact: true })).toHaveFocus();
      expect(
        screen.getByText('Chart', { exact: true }).parentElement?.parentElement,
      ).toHaveTextContent('Frame');
      screen.getByText('Note', { exact: true }).focus();
      await user.keyboard('{Alt>}{ArrowRight}{ArrowRight}{/Alt}');
      expect(screen.getByRole('status')).toHaveTextContent('Chart: frame. Note: canvas.');
      expect(screen.getByText('Note', { exact: true })).toHaveFocus();
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
      expect(screen.getByRole('status')).toHaveTextContent('Chart: frame. Note: palette.');
    });
  });

  describe.each([CanvasCss, CanvasTailwind])('canvas movement', (Demo) => {
    it('lands at the release position after activation and a change to the canvas bounds', async () => {
      await renderDnd(<Demo />);
      const pin = screen.getByText('Kickoff', { selector: 'div' });
      const content = pin.parentElement!;
      let contentLeft = 100;
      let contentTop = 100;
      content.getBoundingClientRect = () => new DOMRect(contentLeft, contentTop, 600, 260);
      content.parentElement!.getBoundingClientRect = () => new DOMRect(100, 100, 600, 260);
      pin.getBoundingClientRect = () => new DOMRect(140, 140, 80, 30);
      fireDrag.dragStart(pin, { clientX: 160, clientY: 152 });
      contentLeft = 60;
      contentTop = 50;
      firePointer.up(pin, {
        pointerType: 'mouse',
        pointerId: 1,
        button: 0,
        buttons: 0,
        clientX: 200,
        clientY: 172,
        timeStamp: 300,
      });
      expect(pin).toHaveStyle({ left: '120px', top: '110px' });
    });

    it('moves and archives focused pins, then focuses the canvas after the final pin', async () => {
      const { user } = await renderDnd(<Demo />);
      const kickoff = screen.getByText('Kickoff', { selector: 'div' });
      const content = kickoff.parentElement!;
      kickoff.focus();
      await user.keyboard('{Alt>}{ArrowRight}{ArrowRight}{/Alt}');
      expect(kickoff).toHaveStyle({ left: '80px', top: '40px' });
      expect(kickoff).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('Moved kickoff to 80, 40.');
      const research = screen.getByText('Research', { selector: 'div' });
      research.focus();
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect(research).toHaveStyle({ top: '130px' });
      await user.keyboard('{Delete}');
      expect(screen.queryByText('Research', { selector: 'div' })).toBeNull();
      expect(kickoff).toHaveFocus();
      await user.keyboard('{Delete}');
      expect(screen.queryByText('Kickoff', { selector: 'div' })).toBeNull();
      expect(screen.getByRole('region', { name: 'Panning canvas' })).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('Archived kickoff.');
      await user.keyboard('{Home}');
      expect(content).toHaveStyle({ transform: 'translate(0px, 0px)' });
      await user.keyboard('{End}');
      expect(content).toHaveStyle({ transform: 'translate(-20px, -480px)' });
    });
  });

  describe.each([ScrollingCss, ScrollingTailwind])('scrolling board keyboard shortcuts', (Demo) => {
    it('adds the tray card, reorders it, and moves it between lists without losing focus', async () => {
      const scrollIntoView = vi.fn();
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: scrollIntoView,
      });
      try {
        const { user } = await renderDnd(<Demo />);
        screen.getByText('Renew passport', { exact: true }).focus();
        await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
        const list = screen.getByText('maxSpeed={150}', { selector: 'span' }).nextElementSibling!;
        expect(list.querySelector('[data-card]')).toHaveTextContent('Renew passport');
        expect(screen.getByText('Renew passport', { exact: true })).toHaveFocus();
        await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(
          Array.from(list.querySelectorAll('[data-card]'), (card) => card.textContent).slice(0, 3),
        ).toEqual(['Pay the rent', 'Renew passport', 'Update resume']);
        expect(screen.getByRole('status')).toHaveTextContent(
          'Renew passport moved to maxSpeed={150} at position 2.',
        );
        await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        const plain = screen.getByText('Default', { selector: 'span' }).nextElementSibling!;
        expect(plain.querySelectorAll('[data-card]')[1]).toHaveTextContent('Renew passport');
        expect(list).not.toHaveTextContent('Renew passport');
        expect(screen.getByText('Renew passport', { exact: true })).toHaveFocus();
        expect(screen.getByText('Cancel the trial', { exact: true })).toBeVisible();
        expect(scrollIntoView).toHaveBeenCalled();
      } finally {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
      }
    });
  });

  describe.each([AxisCss, AxisTailwind])('axis lane keyboard shortcut', (Demo) => {
    it('moves the focused stop, announces it, and keeps it focused', async () => {
      const { user } = await renderDnd(<Demo />);
      const coffee = screen.getByRole('button', { name: 'Coffee' });
      coffee.focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      const labels = within(coffee.parentElement!)
        .getAllByRole('button')
        .map((button) => button.textContent);
      expect(labels.slice(0, 3)).toEqual(['Wake up', 'Standup', 'Coffee']);
      expect(coffee).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('Coffee moved to position 3 of 12.');
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}{Alt>}{ArrowLeft}{/Alt}{Alt>}{ArrowLeft}{/Alt}');
      expect(within(coffee.parentElement!).getAllByRole('button')[0]).toBe(coffee);
      expect(screen.getByRole('status')).toHaveTextContent('Coffee moved to position 1 of 12.');
    });
  });

  describe('closing tabs', () => {
    it('focuses the next tab after deleting the focused middle tab', async () => {
      const { user } = await renderDnd(<ControlledAddCloseExample />);
      await user.click(screen.getByRole('tab', { name: 'Activity' }));
      await user.keyboard('{Delete}');
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Reports' })).toHaveFocus());
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Notes' })).toHaveFocus();
    });

    it('focuses the previous tab at the end and Add tab after the last removal', async () => {
      const { user } = await renderDnd(<ControlledAddCloseExample />);
      await user.click(screen.getByRole('tab', { name: 'Notes' }));
      await user.keyboard('{Delete}');
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Reports' })).toHaveFocus());
      await user.keyboard('{Delete}');
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus());
      await user.keyboard('{Delete}');
      await waitFor(() => expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus());
      await user.keyboard('{Delete}');
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add tab' })).toHaveFocus());
    });
  });

  it('keeps the Kanban slot stable when its placeholder displaces cards', () => {
    const column = document.createElement('div');
    const body = document.createElement('div');
    body.dataset.columnBody = '';
    body.style.rowGap = '8px';
    column.appendChild(body);
    const cards = [document.createElement('div'), document.createElement('div')];
    cards.forEach((card, index) => {
      card.dataset.card = '';
      card.getBoundingClientRect = () => new DOMRect(0, index * 46, 180, 38);
      body.appendChild(card);
    });
    expect(findClosestSlot(column, 28)).toBe(1);
    const placeholder = document.createElement('div');
    placeholder.dataset.placeholder = '';
    placeholder.getBoundingClientRect = () => new DOMRect(0, 46, 180, 38);
    body.insertBefore(placeholder, cards[1]);
    cards[1].getBoundingClientRect = () => new DOMRect(0, 92, 180, 38);
    expect(findClosestSlot(column, 28)).toBe(1);
  });

  describe.each([
    ['CSS Modules', HandleCss],
    ['Tailwind', HandleTailwind],
  ] as const)('dashboard keyboard shortcut with %s', (_name, Demo) => {
    it('moves the focused widget to the next empty slot and keeps it focused', async () => {
      const { user } = await renderDnd(<Demo />);
      const widget = screen.getByRole('group', { name: 'Center dashboard slot' })
        .firstElementChild as HTMLElement;
      widget.focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      const rightSlot = screen.getByRole('group', { name: 'Right dashboard slot' });
      expect(rightSlot).toHaveTextContent('Conversion');
      expect(screen.getByRole('group', { name: 'Center dashboard slot' })).toHaveTextContent(
        'Drop widget',
      );
      await waitFor(() => expect(rightSlot.firstElementChild).toHaveFocus());
      expect(screen.getByRole('status')).toHaveTextContent(
        'Conversion moved to Right dashboard slot.',
      );
    });

    it('keeps focus in the current dashboard when another dashboard is mounted', async () => {
      const { user } = await renderDnd(
        <React.Fragment>
          <Demo />
          <section data-testid="second-dashboard">
            <Demo />
          </section>
        </React.Fragment>,
      );
      const dashboard = within(screen.getByTestId('second-dashboard'));
      const widget = dashboard.getByRole('group', { name: 'Left dashboard slot' })
        .firstElementChild as HTMLElement;
      widget.focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      const rightSlot = dashboard.getByRole('group', { name: 'Right dashboard slot' });
      await waitFor(() => expect(rightSlot.firstElementChild).toHaveFocus());
    });

    it('skips an occupied slot to reach the next empty one', async () => {
      const { user } = await renderDnd(<Demo />);
      const widget = screen.getByRole('group', { name: 'Left dashboard slot' })
        .firstElementChild as HTMLElement;
      widget.focus();
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      expect(screen.getByRole('group', { name: 'Right dashboard slot' })).toHaveTextContent(
        'Visitors',
      );
      expect(screen.getByRole('group', { name: 'Center dashboard slot' })).toHaveTextContent(
        'Conversion',
      );
    });

    it('does nothing when no empty slot exists in that direction', async () => {
      const { user } = await renderDnd(<Demo />);
      const widget = screen.getByRole('group', { name: 'Center dashboard slot' })
        .firstElementChild as HTMLElement;
      widget.focus();
      await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
      expect(screen.getByRole('group', { name: 'Center dashboard slot' })).toHaveTextContent(
        'Conversion',
      );
      expect(widget).toHaveFocus();
    });
  });

  describe.each([
    ['CSS Modules', NestingCss],
    ['Tailwind', NestingTailwind],
  ] as const)('nested drop targets with %s', (_name, Demo) => {
    it('lets the canvas accept a layer the frame skips', async () => {
      await renderDnd(<Demo />);
      const frame = screen.getByText('Frame (charts only)').parentElement!;
      const note = screen.getByText('Note');
      fireDrag.dragStart(note, { clientX: 10, clientY: 10 });
      fireDrag.drop(frame, { clientX: 20, clientY: 20 });
      const moved = screen.getByText('Note', { selector: ':not([data-drag-preview])' });
      expect(moved.parentElement).toBe(
        screen.getByText('Canvas', { selector: 'span' }).nextElementSibling,
      );
      expect(frame).toHaveTextContent('Drop the chart into the frame');
      fireDrag.dragEnd();
    });
  });

  describe('Kanban controls', () => {
    const Demo = KanbanBoardExperiment;
    it('moves a card without dragging and retains control focus', async () => {
      const { user } = await renderDnd(<Demo />);
      await user.selectOptions(screen.getByLabelText('Move to'), 'done');
      const button = screen.getByRole('button', { name: 'Move card' });
      button.focus();
      await user.keyboard('{Enter}');
      const card = Array.from(document.querySelectorAll('[data-card]')).find(
        (node) => node.textContent === 'Write the spec',
      )!;
      expect(card.parentElement?.parentElement).toHaveTextContent('Done');
      expect(button).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('Write the spec moved to Done.');
    });
  });

  describe.each([
    ['CSS Modules', ActivationCss],
    ['Tailwind', ActivationTailwind],
  ] as const)('activation with %s', (_name, Demo) => {
    it.each([
      ['Double-click', 'touch'],
      ['Double-click', 'pen'],
      ['Move 5px or double-click', 'touch'],
      ['Move 5px or double-click', 'pen'],
    ])('keeps the dragging status for %s on a %s double-tap', async (mode, pointerType) => {
      await renderDnd(<Demo />);
      fireEvent.click(screen.getByRole('button', { name: mode }));
      const source = screen.getByLabelText('Puck');
      source.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
      const pointer = { pointerType, pointerId: 1, button: 0, clientX: 20, clientY: 20 };
      firePointer.down(source, { ...pointer, buttons: 1, timeStamp: 100 });
      firePointer.up(source, { ...pointer, buttons: 0, timeStamp: 150 });
      firePointer.down(source, { ...pointer, buttons: 1, timeStamp: 200 });
      expect(screen.getByRole('status')).toHaveTextContent('Move to the target');
      firePointer.up(source, { ...pointer, buttons: 0, timeStamp: 250 });
    });
  });

  describe('file explorer', () => {
    const Demo = FileExplorerExperiment;
    it('moves a file with the keyboard and retains focus', async () => {
      const { user } = await renderDnd(<Demo />);
      const button = screen.getByRole('button', { name: 'Move item' });
      button.focus();
      await user.keyboard('{Enter}');
      expect(button).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('budget.xlsx moved to Archive.');
      expect(screen.queryByText('budget.xlsx', { selector: 'span' })).toBeNull();
      await user.click(screen.getByRole('button', { name: 'Archive' }));
      expect(screen.getByText('budget.xlsx', { selector: 'span' })).toBeVisible();
    });

    it.each(['{Enter}', ' '])('opens a folder with %s after tabbing to it', async (key) => {
      const { user } = await renderDnd(<Demo />);
      const folder = screen.getByRole('button', { name: 'Archive' });
      expect(folder).toHaveAttribute('tabindex', '0');
      // Tab through the move controls and Home breadcrumb to the first folder.
      await user.keyboard('{Tab}{Tab}{Tab}{Tab}{Tab}');
      expect(folder).toHaveFocus();
      await user.keyboard(key);
      expect(screen.getByText('backup-2024.zip', { selector: 'span' })).toBeVisible();
      expect(screen.queryByText('budget.xlsx', { selector: 'span' })).toBeNull();
    });
  });
  describe.each([
    ['on-drop CSS Modules', SortableOnDropCss],
    ['on-drop Tailwind', SortableOnDropTailwind],
    ['live CSS Modules', SortableLiveCss],
    ['live Tailwind', SortableLiveTailwind],
  ] as const)('sorting announcements with %s', (_name, Demo) => {
    it('announces accepted keyboard moves once and retains focus', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: true })),
      );
      const { user } = await renderDnd(<Demo />);
      const source = screen.getByRole('button', { name: 'Write the spec' });
      const status = screen.getByRole('status');
      expect(status.textContent).toBe('');
      source.focus();
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(status.textContent).toBe('');
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
      expect(source).toHaveFocus();
      expect(status.textContent).toBe('Write the spec moved to position 2 of 4.');
      expect(screen.getAllByRole('status')).toHaveLength(1);
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(status.textContent).toBe('Write the spec moved to position 1 of 4.');
      await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
      expect(status.textContent).toBe('Write the spec moved to position 1 of 4.');
    });
  });

  describe.each([
    ['CSS Modules', SortableOnDropCss],
    ['Tailwind', SortableOnDropTailwind],
  ] as const)('reorder on drop with %s', (_name, Demo) => {
    it('keeps an indicator over row padding and the original source', async () => {
      await renderDnd(<Demo />);
      const group = screen.getByRole('group', { name: 'Tasks reordered on drop' });
      const items = Array.from(group.querySelectorAll('button'));
      items.forEach((item, index) => {
        item.getBoundingClientRect = () => new DOMRect(9, index * 48 + 4, 302, 40);
        item.parentElement!.getBoundingClientRect = () => new DOMRect(0, index * 48, 320, 48);
      });
      const [source, target] = items;
      fireDrag.dragStart(source, { clientX: 100, clientY: 20 });
      fireDrag.dragOver(source, { clientX: 100, clientY: 20 });
      await flushRaf();
      expect(source).toHaveAttribute('data-self-drop');

      // The pointer is in the gap above the second card, where the line is drawn.
      fireDrag.dragOver(target.parentElement!, { clientX: 100, clientY: 49 });
      await flushRaf();
      expect(target).toHaveAttribute('data-drop-position', 'before');
      expect(source).not.toHaveAttribute('data-self-drop');

      fireDrag.dragOver(source, { clientX: 100, clientY: 20 });
      await flushRaf();
      expect(source).toHaveAttribute('data-self-drop');
      expect(target).not.toHaveAttribute('data-drop-position', 'before');

      fireDrag.dragOver(document.body, { clientX: 500, clientY: 500 });
      await flushRaf();
      expect(source).not.toHaveAttribute('data-self-drop');
      fireDrag.dragEnd();
    });

    it('commits the position when dropping in row padding', async () => {
      await renderDnd(<Demo />);
      const group = screen.getByRole('group', { name: 'Tasks reordered on drop' });
      const items = Array.from(group.querySelectorAll('button'));
      items.forEach((item, index) => {
        item.getBoundingClientRect = () => new DOMRect(9, index * 48 + 4, 302, 40);
        item.parentElement!.getBoundingClientRect = () => new DOMRect(0, index * 48, 320, 48);
      });
      const [source, , target] = items;
      fireDrag.dragStart(source, { clientX: 100, clientY: 20 });
      fireDrag.drop(target.parentElement!, { clientX: 100, clientY: 97 });
      expect(
        Array.from(group.querySelectorAll('button:not([data-drag-preview])')).map(
          (item) => item.textContent,
        ),
      ).toEqual(['Sketch the UI', 'Write the spec', 'Set up the repo', 'Wire the API']);
    });
  });

  describe.each([
    ['CSS Modules', ScrollingCss],
    ['Tailwind', ScrollingTailwind],
  ] as const)('scrolling with %s', (_name, Demo) => {
    it('settles the preview on the inserted card instead of the next tray card', async () => {
      vi.stubGlobal('BASE_UI_ANIMATIONS_DISABLED', false);
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: vi.fn(),
      });
      try {
        await renderDnd(<Demo />);
        const source = screen.getByText('Renew passport');
        const target = screen.getByText('Default', { selector: 'span' }).parentElement!;
        source.getBoundingClientRect = () => new DOMRect(0, 0, 120, 30);
        target.getBoundingClientRect = () => new DOMRect(0, 100, 300, 200);
        fireDrag.dragStart(source, { clientX: 20, clientY: 10 });
        fireDrag.drop(target, { clientX: 20, clientY: 120 });
        const destination = screen.getByText('Renew passport', {
          selector: ':not([data-drag-preview])',
        });
        expect(source.isConnected).toBe(false);
        expect(destination).toHaveAttribute('data-settling');
        expect(destination).toHaveAttribute('data-disabled');
        expect(screen.getByText('Cancel the trial')).not.toHaveAttribute('data-settling');
        await flushRaf();
      } finally {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
      }
    });
  });
  describe.each([
    ['CSS Modules', SortableLiveCss],
    ['Tailwind', SortableLiveTailwind],
  ] as const)('live sorting with %s', (_name, Demo) => {
    it.each([false, true])(
      'animates from the current position after the list shifts unless reduced motion is enabled (%s)',
      async (reducedMotion) => {
        let listTop = 0;
        let animationOffset = 0;
        const getRect = vi
          .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
          .mockImplementation(function getRect(this: HTMLElement) {
            const row = this.closest('[data-sortable-row]');
            const index = row ? Array.from(row.parentElement!.children).indexOf(row) : 0;
            const offset = this.hasAttribute('data-sortable-item')
              ? animationOffset *
                (this.textContent === 'Write the spec'
                  ? -1
                  : Number(this.textContent === 'Sketch the UI'))
              : 0;
            return new DOMRect(0, listTop + index * 48 + offset, 320, 40);
          });
        vi.stubGlobal(
          'matchMedia',
          vi.fn((query: string) => ({
            matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
          })),
        );
        try {
          const { user, unmount } = await renderDnd(<Demo />);
          const source = screen.getByRole('button', { name: 'Write the spec' });
          const neighbor = screen.getByRole('button', { name: 'Sketch the UI' });
          const cancel = vi.fn();
          const sourceAnimate = vi.fn(() => ({ cancel }));
          const neighborAnimate = vi.fn(() => ({ cancel }));
          Object.defineProperty(source, 'animate', { value: sourceAnimate });
          Object.defineProperty(neighbor, 'animate', { value: neighborAnimate });
          await user.tab();
          expect(source).toHaveFocus();
          listTop = 160;
          await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
          const group = screen.getByRole('group', { name: 'Tasks reordered while dragging' });
          expect(group.querySelector('button')).toBe(neighbor);
          expect(sourceAnimate.mock.calls).toEqual(
            reducedMotion
              ? []
              : [
                  [
                    [{ transform: 'translateY(-48px)' }, { transform: 'translateY(0)' }],
                    { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
                  ],
                ],
          );
          expect(neighborAnimate.mock.calls).toEqual(
            reducedMotion
              ? []
              : [
                  [
                    [{ transform: 'translateY(48px)' }, { transform: 'translateY(0)' }],
                    { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
                  ],
                ],
          );
          // Reverse the reorder while both cards are still in motion.
          sourceAnimate.mockClear();
          neighborAnimate.mockClear();
          animationOffset = reducedMotion ? 0 : 20;
          await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
          const timing = { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' };
          expect(sourceAnimate.mock.calls).toEqual(
            reducedMotion
              ? []
              : [[[{ transform: 'translateY(28px)' }, { transform: 'translateY(0)' }], timing]],
          );
          expect(neighborAnimate.mock.calls).toEqual(
            reducedMotion
              ? []
              : [[[{ transform: 'translateY(-28px)' }, { transform: 'translateY(0)' }], timing]],
          );
          unmount();
          expect(cancel).toHaveBeenCalledTimes(reducedMotion ? 0 : 4);
        } finally {
          getRect.mockRestore();
        }
      },
    );
  });
});
