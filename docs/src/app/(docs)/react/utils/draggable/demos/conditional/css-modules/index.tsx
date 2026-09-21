'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DashboardControls } from '../../DashboardControls';
import { GripIcon } from '../../GripIcon';
import {
  INITIAL_WIDGETS,
  SLOTS,
  useDashboardWidgets,
  type SlotId,
  type WidgetData,
} from '../../dashboardWidgets';

import styles from '../../conditional.module.css';
import controlsStyles from '../../dashboardControls.module.css';

const widgetKind = Draggable.createKind<string>('draggable/conditional-widget');

const PINNED_WIDGETS: WidgetData[] = INITIAL_WIDGETS.map((widget) =>
  widget.id === 'conversion' ? { ...widget, detail: 'Pinned widget', locked: true } : widget,
);

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
      kind={widgetKind}
      payload={widget.id}
      // @highlight-start
      disabled={widget.locked}
      // @highlight-end
      className={styles.Widget}
      data-locked={widget.locked || undefined}
    >
      <div className={styles.WidgetHeader}>
        {widget.locked ? <Lock /> : <GripIcon className={styles.Icon} />}
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

function ConditionalDashboardContent() {
  const { widgets, moveWidget, announcement } = useDashboardWidgets(PINNED_WIDGETS);

  return (
    <div className={styles.Root}>
      <DashboardControls
        className={controlsStyles.Controls}
        widgets={widgets}
        onMoveWidget={moveWidget}
      />
      <div role="status" className={controlsStyles.Status}>
        {announcement}
      </div>
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

export default function ConditionalDashboard() {
  return (
    <Draggable.Provider>
      <ConditionalDashboardContent />
    </Draggable.Provider>
  );
}
