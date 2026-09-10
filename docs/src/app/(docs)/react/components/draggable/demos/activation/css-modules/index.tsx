'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import type { DragActivation } from '@base-ui/react/draggable';
import styles from '../../activation.module.css';

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
      label="Puck"
      // @highlight-start
      pointerActivation={mode.activation}
      // @highlight-end
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
    <div className={styles.Root}>
      <div className={styles.Actions}>
        {dropped && (
          <button type="button" className={styles.Reset} onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <div className={styles.Modes} role="group" aria-label="Pointer activation">
        {ACTIVATION_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.Mode}
            aria-pressed={item.id === modeId}
            onClick={() => selectMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.Stage}>
        <div className={styles.Station}>
          <div className={styles.Start}>
            {!dropped && <Puck mode={mode} onPhaseChange={setPhase} />}
          </div>
          <span className={styles.StationLabel}>Start</span>
        </div>

        <div className={styles.Track} aria-hidden="true" />

        <div className={styles.Station}>
          <DropTarget.Root
            className={styles.Target}
            accept={puckKind}
            label="Target"
            onDrop={() => {
              setDropped(true);
              setPhase('dropped');
            }}
          >
            {dropped && <span className={styles.Puck} data-static="" aria-hidden="true" />}
          </DropTarget.Root>
          <span className={styles.StationLabel}>Target</span>
        </div>
      </div>

      <div className={styles.Status} role="status">
        <span className={styles.StatusLabel}>Status</span>
        <span className={styles.StatusMessage}>{message}</span>
      </div>
    </div>
  );
}
