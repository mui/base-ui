import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { cancel, flushRaf, setupDragEngineTests, fireDrag } from '../../../test/dnd';

setupDragEngineTests();

const probeKind = Draggable.createKind<{ kind: 'probe' }>('probe');
const probePayload = { kind: 'probe' as const };
const otherKind = Draggable.createKind<{ n: number }>('other');

function SourceProbe(props: { id?: string }) {
  const source = Draggable.useActiveDrag(probeKind);
  return (
    <Draggable.Root
      kind={probeKind}
      payload={probePayload}
      data-testid={`source-${props.id ?? 'noid'}`}
      data-source-kind={source?.payload.kind ?? 'none'}
    />
  );
}

describe('Draggable.useActiveDrag', () => {
  const { renderDnd } = createDndRenderer();

  it('returns the active drag source between dragstart and drop, then null again', async () => {
    await renderDnd(<SourceProbe id="card-42" />);
    const node = screen.getByTestId('source-card-42');

    expect(node.dataset.sourceKind).toBe('none');

    fireDrag.dragStart(node);
    await flushRaf();

    expect(node.dataset.sourceKind).toBe('probe');

    fireDrag.drop(node);

    expect(node.dataset.sourceKind).toBe('none');
  });

  it('observes the drag from outside the draggable, and resets on cancel', async () => {
    // Any component can watch the active drag. The hook isn't tied to the element
    // that started it.
    function SiblingObserver() {
      const source = Draggable.useActiveDrag(probeKind);
      return <div data-testid="watcher" data-active={source ? 'yes' : 'no'} />;
    }

    await renderDnd(
      <React.Fragment>
        <SourceProbe id="card-7" />
        <SiblingObserver />
      </React.Fragment>,
    );
    const node = screen.getByTestId('source-card-7');
    const watcher = screen.getByTestId('watcher');
    expect(watcher.dataset.active).toBe('no');

    fireDrag.dragStart(node);
    await flushRaf();
    expect(watcher.dataset.active).toBe('yes');

    cancel();
    await flushRaf();
    expect(watcher.dataset.active).toBe('no');
  });

  it('does not re-render an observer whose accept rejects the drag', async () => {
    let commits = 0;
    function OtherKindObserver() {
      commits += 1;
      const other = Draggable.useActiveDrag(otherKind);
      return <div data-testid="other" data-other={other ? 'seen' : 'none'} />;
    }

    await renderDnd(
      <React.Fragment>
        <SourceProbe id="card-3" />
        <OtherKindObserver />
      </React.Fragment>,
    );
    const node = screen.getByTestId('source-card-3');
    const commitsBeforeDrag = commits;

    fireDrag.dragStart(node);
    await flushRaf();
    expect(screen.getByTestId('other').dataset.other).toBe('none');
    cancel();
    await flushRaf();

    // The store published at drag start and end, but this observer's selected
    // value stayed `null`. With many such observers in a list, an unrelated drag
    // re-renders none of them.
    expect(commits).toBe(commitsBeforeDrag);
  });

  it('filters by accept: only an observer of the dragged kind sees the source', async () => {
    function KindObservers() {
      const matching = Draggable.useActiveDrag(probeKind);
      const other = Draggable.useActiveDrag(otherKind);
      return (
        <div
          data-testid="observers"
          data-matching={matching?.payload.kind ?? 'none'}
          data-other={other ? 'seen' : 'none'}
        />
      );
    }

    await renderDnd(
      <React.Fragment>
        <SourceProbe id="card-9" />
        <KindObservers />
      </React.Fragment>,
    );
    const node = screen.getByTestId('source-card-9');
    const observers = screen.getByTestId('observers');

    fireDrag.dragStart(node);
    await flushRaf();

    expect(observers.dataset.matching).toBe('probe');
    expect(observers.dataset.other).toBe('none');

    cancel();
    await flushRaf();
    expect(observers.dataset.matching).toBe('none');
  });

  it('observes every drag when called without an argument', async () => {
    function AnyObserver() {
      const source = Draggable.useActiveDrag();
      return <div data-testid="any" data-source={source?.element.dataset.testid ?? 'none'} />;
    }

    await renderDnd(
      <React.Fragment>
        <SourceProbe id="probe" />
        <Draggable.Root kind={otherKind} payload={{ n: 1 }} data-testid="other" />
        <AnyObserver />
      </React.Fragment>,
    );
    const observer = screen.getByTestId('any');
    expect(observer.dataset.source).toBe('none');

    fireDrag.dragStart(screen.getByTestId('source-probe'));
    await flushRaf();
    expect(observer.dataset.source).toBe('source-probe');
    cancel();
    await flushRaf();
    expect(observer.dataset.source).toBe('none');

    fireDrag.dragStart(screen.getByTestId('other'));
    await flushRaf();
    expect(observer.dataset.source).toBe('other');
    cancel();
    await flushRaf();
    expect(observer.dataset.source).toBe('none');
  });

  it('does not loop when the observer renders the dragged root with an inline payload', async () => {
    const cardKind = Draggable.createKind<{ id: string }>('card');
    let commits = 0;
    function Board({ id }: { id: string }) {
      commits += 1;
      const source = Draggable.useActiveDrag(cardKind);
      // A new payload object on every render. Each one re-notifies the observers,
      // which re-render this component and pass yet another object.
      return (
        <Draggable.Root
          kind={cardKind}
          payload={{ id }}
          data-testid="card"
          data-active={source?.payload.id ?? 'none'}
        />
      );
    }

    const { rerender } = await renderDnd(<Board id="a" />);
    const card = screen.getByTestId('card');
    const commitsBeforeDrag = commits;

    fireDrag.dragStart(card);
    await flushRaf();
    expect(card.dataset.active).toBe('a');
    // Strict Mode renders twice. A feedback loop renders until React throws.
    expect(commits - commitsBeforeDrag).toBeLessThan(10);

    // A payload change in a later render still reaches the observers.
    await rerender(<Board id="b" />);
    expect(card.dataset.active).toBe('b');

    cancel();
    await flushRaf();
    expect(card.dataset.active).toBe('none');
  });
});
