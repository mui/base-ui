'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../focus.module.css';

type SlotId = 'left' | 'center' | 'right';

interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
}

const widgetKind = Draggable.createKind<string>('draggable/focus-widget');

const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'left', label: 'Left dashboard slot' },
  { id: 'center', label: 'Center dashboard slot' },
  { id: 'right', label: 'Right dashboard slot' },
];

const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'visitors', title: 'Visitors', value: '2,420', detail: 'Last 7 days', slot: 'left' },
  { id: 'conversion', title: 'Conversion', value: '3.8%', detail: 'Up 0.4%', slot: 'center' },
];

function Grip() {
  return (
    <svg className={styles.Grip} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

function Widget({
  widget,
  noteRef,
}: {
  widget: WidgetData;
  noteRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <Draggable.Root
      label={`${widget.title} widget`}
      kind={widgetKind}
      payload={widget.id}
      finalFocus={({ dropTarget }) => (dropTarget ? noteRef.current : true)}
      role="button"
      className={styles.Widget}
    >
      <div className={styles.WidgetHeader}>
        <Grip />
        <span>{widget.title}</span>
      </div>
      <div className={styles.WidgetBody}>
        <strong>{widget.value}</strong>
        <span>{widget.detail}</span>
      </div>
    </Draggable.Root>
  );
}

function DockSlot({
  id,
  label,
  widget,
  noteRef,
  onMoveWidget,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  noteRef: React.RefObject<HTMLInputElement | null>;
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
}) {
  return (
    <DropTarget.Root
      className={styles.Slot}
      data-empty={widget ? undefined : ''}
      label={label}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} noteRef={noteRef} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
      )}
    </DropTarget.Root>
  );
}

export default function FocusDashboard() {
  const [widgets, setWidgets] = React.useState<WidgetData[]>(INITIAL_WIDGETS);
  const noteRef = React.useRef<HTMLInputElement | null>(null);

  function moveWidget(widgetId: string, slot: SlotId) {
    setWidgets((currentWidgets) =>
      currentWidgets.map((widget) => (widget.id === widgetId ? { ...widget, slot } : widget)),
    );
  }

  return (
    <div className={styles.Root}>
      <div className={styles.Grid}>
        {SLOTS.map((slot) => (
          <DockSlot
            key={slot.id}
            id={slot.id}
            label={slot.label}
            widget={widgets.find((widget) => widget.slot === slot.id)}
            noteRef={noteRef}
            onMoveWidget={moveWidget}
          />
        ))}
      </div>
      <label className={styles.Field}>
        <span className={styles.FieldLabel}>Note</span>
        <input ref={noteRef} className={styles.Note} placeholder="Add a note about the move…" />
      </label>
    </div>
  );
}
