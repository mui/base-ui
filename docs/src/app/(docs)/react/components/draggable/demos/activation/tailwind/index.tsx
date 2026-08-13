'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import type { DragActivation } from '@base-ui/react/draggable';

type Phase = 'ready' | 'waiting' | 'dragging' | 'dropped';

interface ActivationMode {
  id: string;
  label: string;
  activation: DragActivation;
  readyMessage: string;
  waitingMessage: string;
}

const puckKind = Draggable.createKind('activation-puck');

const ACTIVATION_MODES: ActivationMode[] = [
  {
    id: 'immediate',
    label: 'Immediate',
    activation: { type: 'immediate' },
    readyMessage: 'Activates as soon as you press.',
    waitingMessage: 'Activating immediately…',
  },
  {
    id: 'distance-5',
    label: '5 px',
    activation: { type: 'distance', distance: 5 },
    readyMessage: 'Move 5px while pressed to activate.',
    waitingMessage: 'Waiting for 5px of movement…',
  },
  {
    id: 'distance-24',
    label: '24 px',
    activation: { type: 'distance', distance: 24 },
    readyMessage: 'Move 24px while pressed to activate.',
    waitingMessage: 'Waiting for 24px of movement…',
  },
  {
    id: 'press-hold',
    label: 'Hold',
    activation: { type: 'press-hold', delay: 250 },
    readyMessage: 'Press and hold for 250ms to activate.',
    waitingMessage: 'Waiting for the 250ms hold…',
  },
];

const PUCK_CLASS =
  'size-14 rounded-full border-0 bg-neutral-950 transition-opacity data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 dark:bg-white dark:focus-visible:outline-white';

function Puck({
  mode,
  onPhaseChange,
}: {
  mode: ActivationMode;
  onPhaseChange: (phase: Phase) => void;
}) {
  return (
    <Draggable.Root
      className={`${PUCK_CLASS} cursor-grab`}
      kind={puckKind}
      label="Puck"
      pointerActivation={mode.activation}
      aria-label="Puck"
      role="button"
      onPointerDown={() => {
        if (mode.activation.type !== 'immediate') {
          onPhaseChange('waiting');
        }
      }}
      onPointerUp={() => onPhaseChange('ready')}
      onPointerCancel={() => onPhaseChange('ready')}
      onDragStart={() => onPhaseChange('dragging')}
      onDragEnd={(_, eventDetails) => {
        if (eventDetails.reason !== 'drop') {
          onPhaseChange('ready');
        }
      }}
    />
  );
}

export default function ActivationLab() {
  const [modeId, setModeId] = React.useState('distance-5');
  const [phase, setPhase] = React.useState<Phase>('ready');
  const [dropped, setDropped] = React.useState(false);
  const mode = ACTIVATION_MODES.find((item) => item.id === modeId)!;

  function selectMode(nextModeId: string) {
    setModeId(nextModeId);
    setPhase('ready');
    setDropped(false);
  }

  function reset() {
    setPhase('ready');
    setDropped(false);
  }

  const message = {
    ready: mode.readyMessage,
    waiting: mode.waitingMessage,
    dragging: 'Activated — drag the puck to the target.',
    dropped: 'Dropped. Reset to try again.',
  }[phase];

  return (
    <div className="flex w-full flex-col items-center select-none">
      <div className="flex min-h-5 w-full max-w-md justify-end">
        {dropped && (
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-sm leading-5 text-neutral-500 underline underline-offset-2 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white"
            onClick={reset}
          >
            Reset
          </button>
        )}
      </div>

      <div
        className="grid w-full max-w-md grid-cols-4 border border-neutral-200 dark:border-neutral-700"
        role="group"
        aria-label="Pointer activation"
      >
        {ACTIVATION_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="cursor-pointer border-0 border-r border-neutral-200 bg-transparent px-2 py-1.5 font-[inherit] text-sm leading-5 text-neutral-500 last:border-r-0 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:outline-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-950"
            aria-pressed={item.id === modeId}
            onClick={() => selectMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid w-full max-w-md grid-cols-[5rem_1fr_5rem] items-center px-2 py-7 sm:grid-cols-[6rem_1fr_6rem]">
        <div className="grid justify-items-center gap-2">
          <div className="grid size-20 place-items-center">
            {!dropped && <Puck mode={mode} onPhaseChange={setPhase} />}
          </div>
          <span className="text-xs font-medium leading-4 text-neutral-500 dark:text-neutral-400">
            Start
          </span>
        </div>

        <div
          className="border-t border-dashed border-neutral-300 dark:border-neutral-600"
          aria-hidden="true"
        />

        <div className="grid justify-items-center gap-2">
          <DropTarget.Root
            className="grid size-20 place-items-center rounded-full border border-dashed border-neutral-400 transition-[border-color,background-color] data-[accepting]:bg-neutral-100 data-[over]:border-solid data-[over]:border-neutral-950 data-[over]:bg-neutral-200 dark:border-neutral-500 dark:data-[accepting]:bg-neutral-800 dark:data-[over]:border-white dark:data-[over]:bg-neutral-700"
            accept={puckKind}
            label="Target"
            onDrop={() => {
              setDropped(true);
              setPhase('dropped');
            }}
          >
            {dropped && <span className={PUCK_CLASS} aria-hidden="true" />}
          </DropTarget.Root>
          <span className="text-xs font-medium leading-4 text-neutral-500 dark:text-neutral-400">
            Target
          </span>
        </div>
      </div>

      <div
        className="flex w-full max-w-md items-baseline gap-3 border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
        role="status"
      >
        <span className="shrink-0 font-medium text-neutral-950 dark:text-white">Status</span>
        <span className="min-w-0 truncate text-neutral-500 dark:text-neutral-400">{message}</span>
      </div>
    </div>
  );
}
