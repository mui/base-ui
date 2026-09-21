'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DashboardControls } from '../../DashboardControls';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

import styles from '../../containment.module.css';
import controlsStyles from '../../dashboardControls.module.css';

const widgetKind = Draggable.createKind<string>('draggable/contained-widget');

function Widget({
  widget,
  frameRef,
}: {
  widget: WidgetData;
  frameRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Draggable.Root
      kind={widgetKind}
      payload={widget.id}
      className={styles.Widget}
      // @highlight-start
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
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  frameRef: React.RefObject<HTMLDivElement | null>;
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
      {widget ? (
        <Widget widget={widget} frameRef={frameRef} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
      )}
    </Draggable.Target>
  );
}

function ContainedDashboardContent() {
  const { widgets, moveWidget, announcement } = useDashboardWidgets();
  const frameRef = React.useRef<HTMLDivElement | null>(null);

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
            />
          ))}
        </div>
      </div>
      <Draggable.Target className={styles.OutsideSlot} accept={widgetKind}>
        <strong>Outside slot</strong>
        <span>The drag cannot reach this target.</span>
      </Draggable.Target>
    </div>
  );
}

export default function ContainedDashboard() {
  return (
    <Draggable.Provider>
      <ContainedDashboardContent />
    </Draggable.Provider>
  );
}
