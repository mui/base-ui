'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DashboardControls } from '../../DashboardControls';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

import styles from '../../badge.module.css';

const widgetKind = Draggable.createKind<string>('draggable/preview-widget');

function Widget({ widget }: { widget: WidgetData }) {
  return (
    <Draggable.Root kind={widgetKind} payload={widget.id} className={styles.Widget}>
      <div className={styles.WidgetHeader}>
        <GripIcon className={styles.Grip} />
        <span>{widget.title}</span>
      </div>
      <div className={styles.WidgetBody}>
        <strong>{widget.value}</strong>
        <span>{widget.detail}</span>
      </div>
      {/* @highlight-start */}
      <Draggable.Preview className={styles.Badge} offset="pointer">
        <span className={styles.BadgeValue}>{widget.value}</span>
        {widget.title}
      </Draggable.Preview>
      {/* @highlight-end */}
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
    <Draggable.Target
      role="group"
      aria-label={label}
      className={styles.Slot}
      data-empty={widget ? undefined : ''}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDraggableDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? <Widget widget={widget} /> : <span className={styles.Empty}>Drop widget</span>}
    </Draggable.Target>
  );
}

export default function CustomPreviewDashboard() {
  const { widgets, moveWidget, announcement } = useDashboardWidgets();

  return (
    <Draggable.Provider>
      <div className={styles.Root}>
        <DashboardControls
          className={styles.Controls}
          widgets={widgets}
          onMoveWidget={moveWidget}
        />
        <div role="status">{announcement}</div>
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
    </Draggable.Provider>
  );
}
