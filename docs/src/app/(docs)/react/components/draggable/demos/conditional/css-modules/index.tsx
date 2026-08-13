'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../conditional.module.css';

type SlotId = 'left' | 'center' | 'right';

interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
  locked?: boolean;
}

const widgetKind = Draggable.createKind<string>('draggable/conditional-widget');

const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'left', label: 'Left dashboard slot' },
  { id: 'center', label: 'Center dashboard slot' },
  { id: 'right', label: 'Right dashboard slot' },
];

const INITIAL_WIDGETS: WidgetData[] = [
  {
    id: 'visitors',
    title: 'Visitors',
    value: '2,420',
    detail: 'Last 7 days',
    slot: 'left',
  },
  {
    id: 'conversion',
    title: 'Conversion',
    value: '3.8%',
    detail: 'Pinned widget',
    slot: 'center',
    locked: true,
  },
];

function Grip() {
  return (
    <svg className={styles.Icon} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
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

function Lock() {
  return (
    <svg
      className={styles.Icon}
      width="11"
      height="14"
      viewBox="0 0 11 14"
      role="img"
      aria-label="Locked"
    >
      <path d="M3 6V4.25a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="6" width="8" height="6.5" rx="1.3" fill="currentColor" />
    </svg>
  );
}

function Widget({ widget }: { widget: WidgetData }) {
  return (
    <Draggable.Root
      label={`${widget.title} widget`}
      kind={widgetKind}
      payload={widget.id}
      disabled={widget.locked}
      role={widget.locked ? undefined : 'button'}
      className={styles.Widget}
      data-locked={widget.locked || undefined}
    >
      <div className={styles.WidgetHeader}>
        {widget.locked ? <Lock /> : <Grip />}
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
  onMoveWidget,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
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
      {widget ? <Widget widget={widget} /> : <span className={styles.Empty}>Drop widget</span>}
    </DropTarget.Root>
  );
}

export default function ConditionalDashboard() {
  const [widgets, setWidgets] = React.useState<WidgetData[]>(INITIAL_WIDGETS);

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
            onMoveWidget={moveWidget}
          />
        ))}
      </div>
    </div>
  );
}
