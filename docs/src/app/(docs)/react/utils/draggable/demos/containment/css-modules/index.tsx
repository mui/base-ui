'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

import styles from '../../containment.module.css';
import statusStyles from '../../dashboardStatus.module.css';

const widgetKind = Draggable.createKind<string>('draggable/contained-widget');

function Widget({
  widget,
  frameRef,
  onKeyDown,
}: {
  widget: WidgetData;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, widgetId: string) => void;
}) {
  return (
    <Draggable.Root
      kind={widgetKind}
      payload={widget.id}
      data-widget-id={widget.id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={(event) => onKeyDown(event, widget.id)}
      className={styles.Widget}
      // @highlight-start @focus @padding 3
      modifiers={Draggable.restrictToElement(frameRef)}
      // @highlight-end
    >
      <div className={styles.WidgetHeader}>
        <GripIcon className={styles.Grip} />
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
  frameRef,
  onMoveWidget,
  onWidgetKeyDown,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  frameRef: React.RefObject<HTMLDivElement | null>;
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
        <Widget widget={widget} frameRef={frameRef} onKeyDown={onWidgetKeyDown} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
      )}
    </Draggable.Target>
  );
}

export default function ContainedDashboard() {
  const { dashboardRef, widgets, moveWidget, onWidgetKeyDown, announcement } =
    useDashboardWidgets();
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Draggable.Provider>
      <div ref={dashboardRef} className={styles.Root}>
        <div role="status" className={statusStyles.Status}>
          {announcement}
        </div>
        <div ref={frameRef} className={styles.Frame}>
          <div className={styles.Grid}>
            {SLOTS.map((slot) => (
              <DockSlot
                key={slot.id}
                id={slot.id}
                label={slot.label}
                widget={widgets.find((widget) => widget.slot === slot.id)}
                frameRef={frameRef}
                onMoveWidget={moveWidget}
                onWidgetKeyDown={onWidgetKeyDown}
              />
            ))}
          </div>
        </div>
        <Draggable.Target className={styles.OutsideSlot} accept={widgetKind}>
          <strong>Outside slot</strong>
          <span>The drag cannot reach this target.</span>
        </Draggable.Target>
      </div>
    </Draggable.Provider>
  );
}
