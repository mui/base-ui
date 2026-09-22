'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

import styles from '../../badge.module.css';
import statusStyles from '../../dashboardStatus.module.css';

const widgetKind = Draggable.createKind<string>('draggable/preview-widget');

function Widget({
  widget,
  onKeyDown,
}: {
  widget: WidgetData;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, widgetId: string) => void;
}) {
  return (
    <Draggable.Root
      kind={widgetKind}
      payload={widget.id}
      className={styles.Widget}
      data-widget-id={widget.id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={(event) => onKeyDown(event, widget.id)}
    >
      <div className={styles.WidgetHeader}>
        <GripIcon className={styles.Grip} />
        <span>{widget.title}</span>
      </div>
      <div className={styles.WidgetBody}>
        <strong>{widget.value}</strong>
        <span>{widget.detail}</span>
      </div>
      {/* @highlight-start @focus @padding 1 */}
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
  onWidgetKeyDown,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
  onWidgetKeyDown: (event: React.KeyboardEvent<HTMLElement>, widgetId: string) => void;
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
      {widget ? (
        <Widget widget={widget} onKeyDown={onWidgetKeyDown} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
      )}
    </Draggable.Target>
  );
}

export default function CustomPreviewDashboard() {
  const { widgets, moveWidget, onWidgetKeyDown, announcement } = useDashboardWidgets();

  return (
    <Draggable.Provider>
      <div className={styles.Root}>
        <div role="status" className={statusStyles.Status}>
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
              onWidgetKeyDown={onWidgetKeyDown}
            />
          ))}
        </div>
      </div>
    </Draggable.Provider>
  );
}
