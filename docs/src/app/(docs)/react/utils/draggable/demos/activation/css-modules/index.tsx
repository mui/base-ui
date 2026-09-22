'use client';
import { Draggable, type DragActivationConfig } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../activation.module.css';

type Phase = 'ready' | 'waiting' | 'dragging' | 'dropped';

interface ActivationMode {
  id: string;
  label: string;
  activation: DragActivationConfig | readonly DragActivationConfig[];
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
      <div className={styles.Root}>
        <div className={styles.Actions}>
          {dropped && (
            <button type="button" className={styles.Reset} onClick={reset}>
              Reset
            </button>
          )}
        </div>

        <div className={styles.ActivationGroups}>
          {ACTIVATION_GROUPS.map((group) => (
            <fieldset key={group.label} className={styles.ActivationGroup}>
              <legend className={styles.GroupLabel}>{group.label}</legend>
              <p className={styles.GroupDescription}>{group.description}</p>
              <div className={styles.Modes}>
                {group.modes.map((item) => (
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
            </fieldset>
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
            <Draggable.Target
              className={styles.Target}
              accept={puckKind}
              onDraggableDrop={() => {
                setDropped(true);
                setPhase('dropped');
              }}
            >
              {dropped && <span className={styles.Puck} data-static="" aria-hidden="true" />}
            </Draggable.Target>
            <span className={styles.StationLabel}>Target</span>
          </div>
        </div>

        <div className={styles.Status} role="status">
          <span className={styles.StatusLabel}>Status</span>
          <span className={styles.StatusMessage}>{message}</span>
        </div>
      </div>
    </Draggable.Provider>
  );
}
