'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

type Phase = 'ready' | 'waiting' | 'dragging' | 'dropped';

interface ActivationMode {
  id: string;
  label: string;
  activation: Draggable.Root.ActivationConfig | readonly Draggable.Root.ActivationConfig[];
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
    id: 'double-click',
    label: 'Double-click',
    activation: { type: 'double-click' },
    readyMessage:
      'Double-click to pick up, then click the target to drop. On touch, double-tap and hold, then release on the target. Escape cancels.',
    waitingMessage: 'Double-click or double-tap to pick up…',
  },
  {
    id: 'distance-or-hold',
    label: 'Move 5px or hold 250ms',
    activation: [
      { type: 'distance', distance: 5 },
      { type: 'press-hold', delay: 250 },
    ],
    readyMessage: 'Move 5px or hold for 250ms to activate.',
    waitingMessage: 'Waiting for movement or a hold…',
  },
  {
    id: 'distance-or-double-click',
    label: 'Move 5px or double-click',
    activation: [{ type: 'distance', distance: 5 }, { type: 'double-click' }],
    readyMessage:
      'Move 5px while pressed, or double-click to pick up. On touch, move or double-tap and hold.',
    waitingMessage: 'Waiting for movement or a double-click…',
  },
  {
    id: 'distance-5',
    label: 'Move 5px',
    activation: { type: 'distance', distance: 5 },
    readyMessage: 'Move 5px while pressed to activate.',
    waitingMessage: 'Waiting for 5px of movement…',
  },
  {
    id: 'press-hold',
    label: 'Hold 250ms',
    activation: { type: 'press-hold', delay: 250 },
    readyMessage: 'Press and hold for 250ms to activate.',
    waitingMessage: 'Waiting for the 250ms hold…',
  },
];

const ACTIVATION_GROUPS = [
  {
    label: 'Single criterion',
    description: 'One activation object.',
    modes: ACTIVATION_MODES.filter((mode) => !Array.isArray(mode.activation)),
  },
  {
    label: 'Multiple criteria',
    description: 'An array of alternatives. The first match starts the drag.',
    modes: ACTIVATION_MODES.filter((mode) => Array.isArray(mode.activation)),
  },
];

const PUCK_CLASS =
  'size-14 rounded-full border-0 bg-neutral-950 transition-opacity data-[dragging]:opacity-0 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 dark:bg-white dark:focus-visible:outline-white';

function hasDoubleClickActivation(activation: ActivationMode['activation']) {
  const criteria = Array.isArray(activation) ? activation : [activation];
  return criteria.some((criterion) => criterion.type === 'double-click');
}

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
      // @highlight-start @focus @padding 3
      activation={mode.activation}
      // @highlight-end
      role="img"
      aria-label="Puck"
      onPointerDown={(event) => {
        if (
          mode.id !== 'immediate' &&
          (!hasDoubleClickActivation(mode.activation) || event.pointerType === 'mouse')
        ) {
          onPhaseChange('waiting');
        }
      }}
      onPointerUp={() => onPhaseChange('ready')}
      onPointerCancel={() => onPhaseChange('ready')}
      onMoveStart={() => onPhaseChange('dragging')}
      onMoveEnd={(_, eventDetails) => {
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
    dragging: hasDoubleClickActivation(mode.activation)
      ? 'Move to the target and click or release to drop. Escape cancels.'
      : 'Activated — drag the puck to the target.',
    dropped: 'Dropped. Reset to try again.',
  }[phase];

  return (
    <Draggable.Provider>
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

        <div className="grid w-full max-w-md gap-5">
          {ACTIVATION_GROUPS.map((group) => (
            <fieldset key={group.label} className="m-0 min-w-0 border-0 p-0">
              <legend className="p-0 text-sm leading-5 font-medium text-neutral-950 dark:text-white">
                {group.label}
              </legend>
              <p className="mt-1 mb-2 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                {group.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.modes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="cursor-pointer border border-neutral-200 bg-transparent px-2 py-1.5 font-[inherit] text-sm leading-5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:outline-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-950"
                    aria-pressed={item.id === modeId}
                    onClick={() => selectMode(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
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
            <Draggable.Target
              className="grid size-20 place-items-center rounded-full border border-dashed border-neutral-400 transition-[border-color,background-color] data-[accepting]:bg-neutral-100 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-200 dark:border-neutral-500 dark:data-[accepting]:bg-neutral-800 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-700"
              accept={puckKind}
              onDraggableDrop={() => {
                setDropped(true);
                setPhase('dropped');
              }}
            >
              {dropped && <span className={PUCK_CLASS} aria-hidden="true" />}
            </Draggable.Target>
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
          <span className="min-w-0 text-neutral-500 dark:text-neutral-400">{message}</span>
        </div>
      </div>
    </Draggable.Provider>
  );
}
