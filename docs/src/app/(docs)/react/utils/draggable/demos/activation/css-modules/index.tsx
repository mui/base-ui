'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../activation.module.css';

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
];

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
      className={styles.Puck}
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
      onMoveEnd={(eventDetails) => {
        if (eventDetails.reason !== 'drop') {
          onPhaseChange('ready');
        }
      }}
    />
  );
}

export default function ActivationLab() {
  const name = React.useId();
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
      : 'Activated. Drag the puck to the target.',
    dropped: 'Dropped. Reset to try again.',
  }[phase];

  return (
    <Draggable.Provider>
      <div className={styles.Root}>
        <fieldset className={styles.Modes}>
          <legend className={styles.Legend}>Activation</legend>
          {ACTIVATION_MODES.map((item) => (
            <label key={item.id} className={styles.Mode}>
              <input
                type="radio"
                className={styles.Radio}
                name={name}
                checked={item.id === modeId}
                onChange={() => selectMode(item.id)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>

        <div className={styles.Stage}>
          <div className={styles.Start}>
            {!dropped && <Puck mode={mode} onPhaseChange={setPhase} />}
          </div>
          <Draggable.Target
            className={styles.Target}
            accept={puckKind}
            onDraggableDrop={() => {
              setDropped(true);
              setPhase('dropped');
            }}
          >
            {dropped ? (
              <span className={styles.Puck} data-static="" aria-hidden="true" />
            ) : (
              'Target'
            )}
          </Draggable.Target>
        </div>

        <p role="status" className={styles.Status}>
          {message}
        </p>
        {dropped && (
          <button type="button" className={styles.Button} onClick={reset}>
            Reset
          </button>
        )}
      </div>
    </Draggable.Provider>
  );
}
