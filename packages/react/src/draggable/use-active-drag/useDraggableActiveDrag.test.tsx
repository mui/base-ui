import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { createDndRenderer } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { cancel, flushRaf, setupDragEngineTests } from '../../../test/dnd';

setupDragEngineTests();

const probeKind = Draggable.createKind<{ kind: 'probe' }>('probe');
const otherKind = Draggable.createKind<{ n: number }>('other');

function SourceProbe(props: { id?: string }) {
  const source = Draggable.useActiveDrag(probeKind);
  return (
    <Draggable.Root
      kind={probeKind}
      getPayload={() => ({ kind: 'probe' as const })}
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

    fireEvent.dragStart(node);
    await flushRaf();

    expect(node.dataset.sourceKind).toBe('probe');

    fireEvent.drop(node);

    expect(node.dataset.sourceKind).toBe('none');
  });

  it('observes the drag from outside the draggable, and resets on cancel', async () => {
    // Any component can watch the active drag; nothing ties the hook to the
    // element that started it.
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

    fireEvent.dragStart(node);
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

    fireEvent.dragStart(node);
    await flushRaf();
    expect(screen.getByTestId('other').dataset.other).toBe('none');
    cancel();
    await flushRaf();

    // The store published at drag start and end, but this observer's selected
    // value stayed `null` throughout — so, with many such observers in a list,
    // an unrelated drag costs none of them a render.
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

    fireEvent.dragStart(node);
    await flushRaf();

    expect(observers.dataset.matching).toBe('probe');
    expect(observers.dataset.other).toBe('none');

    cancel();
    await flushRaf();
    expect(observers.dataset.matching).toBe('none');
  });
});
