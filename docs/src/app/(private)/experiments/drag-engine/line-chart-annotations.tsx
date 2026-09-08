'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  Draggable,
  type DragKeyboardActivation,
  type DragLocationHistory,
  type DragModifier,
  type DragModifiers,
} from '@base-ui/react/draggable';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import theme from './theme.module.css';
import styles from './line-chart-annotations.module.css';

// Moves the rendered annotations directly instead of drawing a drag preview.
// State is updated during `onDrag`, so cancellation restores the pickup snapshot.
// Modifiers still constrain the reported input, and fixed-step keyboard movement
// is required because the plot has no drop targets. Angle snapping operates in
// screen pixels: a modifier handles endpoint drags, while annotation creation
// applies the same helper outside a drag session.

interface LineChartAnnotationsSettings {
  snapToDataPoints: boolean;
}

export const settingsMetadata: SettingsMetadata<LineChartAnnotationsSettings> = {
  snapToDataPoints: {
    type: 'boolean',
    label: 'Snap to data points',
    default: false,
  },
};

// ---------------------------------------------------------------------------
// The chart
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SERIES = [32, 41, 38, 55, 78, 71, 84, 79, 96, 88, 104, 121];

const CHART_WIDTH = 880;
const CHART_HEIGHT = 420;
const PLOT_LEFT = 56;
const PLOT_TOP = 28;
// The right margin is reserved: a horizontal line prints its value out there.
const PLOT_WIDTH = CHART_WIDTH - PLOT_LEFT - 96;
const PLOT_HEIGHT = CHART_HEIGHT - PLOT_TOP - 40;

const X_MIN = 0;
const X_MAX = SERIES.length - 1;
const Y_MIN = 20;
const Y_MAX = 130;
const Y_TICKS = [20, 40, 60, 80, 100, 120];

/** Domain units per pixel, for turning a pointer delta into a data delta. */
const X_PER_PX = (X_MAX - X_MIN) / PLOT_WIDTH;
const Y_PER_PX = (Y_MAX - Y_MIN) / PLOT_HEIGHT;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function xScale(value: number): number {
  return PLOT_LEFT + ((value - X_MIN) / (X_MAX - X_MIN)) * PLOT_WIDTH;
}

function yScale(value: number): number {
  return PLOT_TOP + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
}

function xInvert(px: number): number {
  return X_MIN + ((px - PLOT_LEFT) / PLOT_WIDTH) * (X_MAX - X_MIN);
}

function yInvert(py: number): number {
  return Y_MAX - ((py - PLOT_TOP) / PLOT_HEIGHT) * (Y_MAX - Y_MIN);
}

/** The series, its gridlines and its axes. Decorative: it never handles a drag. */
function Chart() {
  const points = SERIES.map((value, index) => `${xScale(index)},${yScale(value)}`).join(' ');
  return (
    <svg
      className={styles.chart}
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      role="img"
      aria-label="Monthly revenue, January to December"
    >
      {Y_TICKS.map((tick) => (
        <line
          key={tick}
          className={styles.gridLine}
          x1={PLOT_LEFT}
          x2={PLOT_LEFT + PLOT_WIDTH}
          y1={yScale(tick)}
          y2={yScale(tick)}
        />
      ))}
      {Y_TICKS.map((tick) => (
        <text
          key={tick}
          className={styles.axisLabel}
          x={PLOT_LEFT - 12}
          y={yScale(tick)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {tick}
        </text>
      ))}
      {MONTHS.map((month, index) => (
        <text
          key={month}
          className={styles.axisLabel}
          x={xScale(index)}
          y={PLOT_TOP + PLOT_HEIGHT + 20}
          textAnchor="middle"
        >
          {month}
        </text>
      ))}
      <polyline className={styles.series} points={points} />
      {SERIES.map((value, index) => (
        <circle
          key={MONTHS[index]}
          className={styles.seriesDot}
          cx={xScale(index)}
          cy={yScale(value)}
          r={3}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The annotation model
// ---------------------------------------------------------------------------

type AnnotationType =
  'horizontal-line' | 'vertical-line' | 'line' | 'arrow' | 'parallel-channel' | 'comment';

/** A point in chart values: `x` is a month index, `y` a series value. */
interface DataPoint {
  x: number;
  y: number;
}

interface PxPoint {
  x: number;
  y: number;
}

interface AnnotationBase {
  id: string;
}

/** Everything drawn as a rule, and therefore stylable as solid or dashed. */
interface LineAnnotationBase extends AnnotationBase {
  dashed: boolean;
}

/** A line pinned to one axis value, spanning the plot on the other axis. */
interface ValueLineAnnotation extends LineAnnotationBase {
  type: 'horizontal-line' | 'vertical-line';
  value: number;
}

interface SegmentAnnotation extends LineAnnotationBase {
  type: 'line' | 'arrow';
  start: DataPoint;
  end: DataPoint;
}

interface ChannelAnnotation extends LineAnnotationBase {
  type: 'parallel-channel';
  start: DataPoint;
  end: DataPoint;
  /** Signed distance, in series values, from the drawn line to its parallel. */
  height: number;
}

interface CommentAnnotation extends AnnotationBase {
  type: 'comment';
  /** The point on the chart the callout refers to. */
  anchor: DataPoint;
  /** Where the box itself sits — its top-left corner. */
  position: DataPoint;
  text: string;
}

type LineAnnotation = ValueLineAnnotation | SegmentAnnotation | ChannelAnnotation;

type Annotation = LineAnnotation | CommentAnnotation;

/** Which part of an annotation a drag grabbed. `body` moves the whole thing. */
type AnnotationHandle = 'body' | 'start' | 'end' | 'height' | 'anchor';

interface AnnotationDragData {
  id: string;
  handle: AnnotationHandle;
  /** The annotation as it was at pickup, so Escape can put it back. */
  snapshot: Annotation;
}

const annotationKind = Draggable.createKind<AnnotationDragData>('lineChartAnnotations:annotation');

const COMMENT_WIDTH = 168;
/** Keeps a comment box from hanging off the right edge of the chart. */
const COMMENT_MAX_X = xInvert(CHART_WIDTH - COMMENT_WIDTH - 8);
/** How far one arrow press moves an annotation, in pixels. Shift travels further. */
const KEYBOARD_STEP = 4;

const INITIAL_ANNOTATIONS: Annotation[] = [
  { id: 'annotation-1', type: 'horizontal-line', value: 84, dashed: true },
  {
    id: 'annotation-2',
    type: 'line',
    start: { x: 0, y: 34 },
    end: { x: 11, y: 118 },
    dashed: false,
  },
  {
    id: 'annotation-3',
    type: 'comment',
    anchor: { x: 4, y: 78 },
    position: { x: 1.6, y: 122 },
    text: 'Spring campaign lifted May well past plan.',
  },
];

// ---------------------------------------------------------------------------
// Moving an annotation
// ---------------------------------------------------------------------------

function clampX(x: number): number {
  return clamp(x, X_MIN, X_MAX);
}

function clampY(y: number): number {
  return clamp(y, Y_MIN, Y_MAX);
}

function snapX(x: number, snap: boolean): number {
  return snap ? Math.round(x) : x;
}

function movePoint(point: DataPoint, dx: number, dy: number, snap: boolean): DataPoint {
  return { x: snapX(clampX(point.x + dx), snap), y: clampY(point.y + dy) };
}

/** The eight rays a held Shift pulls a line onto. */
const ANGLE_STEP = Math.PI / 4;

/** An axis-aligned box, in whichever pixel space the caller is working in. */
interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * How far along `unit` from `pivot` the ray can travel before it leaves `bounds`.
 * The usual slab test: each axis contributes a limit only when the ray moves along it.
 */
function distanceToBounds(pivot: PxPoint, unit: PxPoint, bounds: Bounds): number {
  let limit = Infinity;
  if (unit.x > 0) {
    limit = Math.min(limit, (bounds.right - pivot.x) / unit.x);
  } else if (unit.x < 0) {
    limit = Math.min(limit, (bounds.left - pivot.x) / unit.x);
  }
  if (unit.y > 0) {
    limit = Math.min(limit, (bounds.bottom - pivot.y) / unit.y);
  } else if (unit.y < 0) {
    limit = Math.min(limit, (bounds.top - pivot.y) / unit.y);
  }
  return Math.max(limit, 0);
}

/**
 * `point` pulled onto the nearest ray at a multiple of 45° from `pivot`, and kept
 * inside `bounds`.
 *
 * Works in pixels rather than chart values, because the angle being snapped is the one
 * on screen: the two axes here cover 11 months against 110 units, so a "45°" measured
 * in domain units would come out as something else entirely once drawn.
 *
 * The point is *projected* onto the ray, not rotated onto it, so the line follows the
 * pointer's reach along that direction instead of holding the length it had when the
 * snap engaged. The nearest ray is never more than 22.5° away, so the projection is
 * always forward and the line never flips.
 *
 * Running out of room shortens the line *along the ray* rather than clamping each axis
 * on its own, which would slide the endpoint off the ray and quietly break the angle
 * the user is holding Shift to get: clamped per-axis, a −45° drag into the top edge
 * comes out at −36.87°.
 */
function snapToAngle(point: PxPoint, pivot: PxPoint, bounds: Bounds): PxPoint {
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  if (dx === 0 && dy === 0) {
    return point;
  }
  const angle = Math.round(Math.atan2(dy, dx) / ANGLE_STEP) * ANGLE_STEP;
  const unit = { x: Math.cos(angle), y: Math.sin(angle) };
  const distance = Math.min(dx * unit.x + dy * unit.y, distanceToBounds(pivot, unit, bounds));
  return { x: pivot.x + unit.x * distance, y: pivot.y + unit.y * distance };
}

/**
 * The data-space range an endpoint of `annotation` may occupy. A channel's parallel
 * travels with the endpoint, so its range is whatever keeps both lines inside the plot.
 */
function endpointRange(annotation: SegmentAnnotation | ChannelAnnotation): Bounds {
  if (annotation.type !== 'parallel-channel') {
    return { left: X_MIN, right: X_MAX, top: Y_MAX, bottom: Y_MIN };
  }
  const { height } = annotation;
  return {
    left: X_MIN,
    right: X_MAX,
    top: Math.min(Y_MAX, Y_MAX - height),
    bottom: Math.max(Y_MIN, Y_MIN - height),
  };
}

/** An endpoint, clamped so the shape it belongs to stays inside the plot. */
function clampEndpoint(
  annotation: SegmentAnnotation | ChannelAnnotation,
  point: DataPoint,
  snap: boolean,
): DataPoint {
  const range = endpointRange(annotation);
  return {
    x: snapX(clamp(point.x, range.left, range.right), snap),
    y: clamp(point.y, range.bottom, range.top),
  };
}

function withEndpoint(
  annotation: SegmentAnnotation | ChannelAnnotation,
  handle: 'start' | 'end',
  point: DataPoint,
  snap: boolean,
): Annotation {
  const moved = clampEndpoint(annotation, point, snap);
  return handle === 'start' ? { ...annotation, start: moved } : { ...annotation, end: moved };
}

function hasEndpoints(annotation: Annotation): annotation is SegmentAnnotation | ChannelAnnotation {
  return (
    annotation.type === 'line' ||
    annotation.type === 'arrow' ||
    annotation.type === 'parallel-channel'
  );
}

function offsetPoint(point: DataPoint, delta: DataPoint): DataPoint {
  return { x: point.x + delta.x, y: point.y + delta.y };
}

/**
 * The delta to move a whole shape by, clamped so the shape slides along the edge of
 * the plot instead of deforming — which is what clamping each of its points on its
 * own would do.
 */
function shiftDelta(points: DataPoint[], dx: number, dy: number, snap: boolean): DataPoint {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    x: clamp(snapX(dx, snap), X_MIN - Math.min(...xs), X_MAX - Math.max(...xs)),
    y: clamp(dy, Y_MIN - Math.min(...ys), Y_MAX - Math.max(...ys)),
  };
}

function moveAnnotation(
  annotation: Annotation,
  handle: AnnotationHandle,
  dx: number,
  dy: number,
  snap: boolean,
): Annotation {
  switch (annotation.type) {
    case 'horizontal-line':
      return { ...annotation, value: clampY(annotation.value + dy) };
    case 'vertical-line':
      return { ...annotation, value: snapX(clampX(annotation.value + dx), snap) };
    case 'line':
    case 'arrow': {
      if (handle === 'start' || handle === 'end') {
        const base = handle === 'start' ? annotation.start : annotation.end;
        return withEndpoint(annotation, handle, { x: base.x + dx, y: base.y + dy }, snap);
      }
      const shift = shiftDelta([annotation.start, annotation.end], dx, dy, snap);
      return {
        ...annotation,
        start: offsetPoint(annotation.start, shift),
        end: offsetPoint(annotation.end, shift),
      };
    }
    case 'parallel-channel': {
      const { start, end, height } = annotation;
      if (handle === 'height') {
        return {
          ...annotation,
          height: clamp(
            height + dy,
            Y_MIN - Math.min(start.y, end.y),
            Y_MAX - Math.max(start.y, end.y),
          ),
        };
      }
      if (handle === 'start' || handle === 'end') {
        const base = handle === 'start' ? start : end;
        return withEndpoint(annotation, handle, { x: base.x + dx, y: base.y + dy }, snap);
      }
      const shift = shiftDelta(
        [start, end, { x: start.x, y: start.y + height }, { x: end.x, y: end.y + height }],
        dx,
        dy,
        snap,
      );
      return {
        ...annotation,
        start: offsetPoint(start, shift),
        end: offsetPoint(end, shift),
      };
    }
    default: {
      // comment
      if (handle === 'anchor') {
        return { ...annotation, anchor: movePoint(annotation.anchor, dx, dy, snap) };
      }
      // The box is free-floating furniture, not a data position, so it never snaps
      // — and its own width, not the plot edge, is what bounds it on the right.
      return {
        ...annotation,
        position: {
          x: clamp(annotation.position.x + dx, X_MIN, COMMENT_MAX_X),
          y: clampY(annotation.position.y + dy),
        },
      };
    }
  }
}

/** The drag so far, as a data-space move of the annotation that was picked up. */
function dragAnnotation(
  payload: AnnotationDragData,
  location: DragLocationHistory,
  snap: boolean,
  plotRect: DOMRect | null,
): Annotation {
  const { snapshot, handle } = payload;
  const input = location.current.input;

  // An endpoint follows the reported input *absolutely* rather than by a delta from the
  // pickup. That is what makes the 45° `modifiers` snap exact: the engine constrains the
  // input, the input is the endpoint, and there is no grab offset left in between to
  // push the result back off the ray. It also matches how a handle should behave — it
  // sits under the cursor — at the cost of a few pixels' jump when one is grabbed
  // off-center. Everything else still moves by a delta, which is what keeps a whole
  // shape rigid while its body is dragged.
  if (plotRect !== null && (handle === 'start' || handle === 'end') && hasEndpoints(snapshot)) {
    return withEndpoint(
      snapshot,
      handle,
      {
        x: xInvert(input.clientX - plotRect.left),
        y: yInvert(input.clientY - plotRect.top),
      },
      // A held Shift owns the position outright: rounding x to a month afterwards would
      // walk the endpoint straight back off the ray it was just snapped to.
      snap && !input.shiftKey,
    );
  }

  const dx = (input.clientX - location.initial.input.clientX) * X_PER_PX;
  // Client y grows downward and series values grow upward.
  const dy = -(input.clientY - location.initial.input.clientY) * Y_PER_PX;
  return moveAnnotation(snapshot, handle, dx, dy, snap);
}

// ---------------------------------------------------------------------------
// Describing an annotation
// ---------------------------------------------------------------------------

function formatValue(value: number): string {
  return value.toFixed(1);
}

function formatMonth(x: number): string {
  return MONTHS[clamp(Math.round(x), 0, MONTHS.length - 1)];
}

function formatPoint(point: DataPoint): string {
  return `${formatMonth(point.x)} ${formatValue(point.y)}`;
}

function describeAnnotation(annotation: Annotation): string {
  switch (annotation.type) {
    case 'horizontal-line':
      return `Horizontal line at ${formatValue(annotation.value)}`;
    case 'vertical-line':
      return `Vertical line at ${formatMonth(annotation.value)}`;
    case 'line':
      return `Trend line from ${formatPoint(annotation.start)} to ${formatPoint(annotation.end)}`;
    case 'arrow':
      return `Arrow from ${formatPoint(annotation.start)} to ${formatPoint(annotation.end)}`;
    case 'parallel-channel':
      return `Channel from ${formatPoint(annotation.start)} to ${formatPoint(annotation.end)}`;
    default: // comment
      return `Comment at ${formatPoint(annotation.anchor)}: ${annotation.text}`;
  }
}

function describeEnds(
  annotation: SegmentAnnotation | ChannelAnnotation,
  handle: AnnotationHandle,
): string {
  if (handle === 'start') {
    return `Start at ${formatPoint(annotation.start)}`;
  }
  if (handle === 'end') {
    return `End at ${formatPoint(annotation.end)}`;
  }
  return `${formatPoint(annotation.start)} to ${formatPoint(annotation.end)}`;
}

/**
 * Where the part being dragged has got to, for the keyboard's "moved"
 * announcement. It reports the handle rather than the annotation, because they
 * do not always move together: a comment's box and its anchor are separate
 * positions, and `describeAnnotation` names only the anchor.
 */
function describeMovement(annotation: Annotation, handle: AnnotationHandle): string {
  switch (annotation.type) {
    case 'horizontal-line':
      return `At ${formatValue(annotation.value)}`;
    case 'vertical-line':
      return `At ${formatMonth(annotation.value)}`;
    case 'line':
    case 'arrow':
      return describeEnds(annotation, handle);
    case 'parallel-channel':
      return handle === 'height'
        ? `${formatValue(Math.abs(annotation.height))} wide`
        : describeEnds(annotation, handle);
    default: // comment
      return handle === 'anchor'
        ? `Anchor at ${formatPoint(annotation.anchor)}`
        : `Box at ${formatPoint(annotation.position)}`;
  }
}

// ---------------------------------------------------------------------------
// Shared drag wiring
// ---------------------------------------------------------------------------

interface AnnotationsContextValue {
  snap: boolean;
  plotRef: React.RefObject<HTMLDivElement | null>;
  select: (id: string) => void;
  change: (annotation: Annotation) => void;
  edit: (id: string | null) => void;
}

const AnnotationsContext = React.createContext<AnnotationsContextValue | null>(null);

function useAnnotationsContext(): AnnotationsContextValue {
  const context = React.useContext(AnnotationsContext);
  if (context === null) {
    throw new Error('An annotation part was rendered outside of the chart.');
  }
  return context;
}

/**
 * AG Charts' Shift gesture as a `modifiers` entry: the drag point is pulled onto the
 * nearest 45° ray from the annotation's *other* end.
 *
 * A modifier is the right home for it because it constrains what the engine reports as
 * the input — so the pointer, the keyboard's virtual cursor, and anything that later
 * hit-tests against that point all agree, instead of each re-deriving the snap. `shiftKey`
 * comes off the context, and the engine re-applies on the key itself, so the snap engages
 * with the pointer standing still.
 */
function angleSnapModifier(
  getGeometry: () => { pivot: PxPoint; bounds: Bounds } | null,
): DragModifier {
  return ({ point, mode, shiftKey }) => {
    // Pointer only. During a keyboard drag Shift already means "travel four times as
    // far" (`fixedStepKeyboardMovement`), and AG Charts splits the two the same way:
    // Shift+drag snaps to 45°, Shift+arrow moves by 10px instead of 1.
    if (mode !== 'pointer' || !shiftKey) {
      return point;
    }
    const geometry = getGeometry();
    return geometry === null ? point : snapToAngle(point, geometry.pivot, geometry.bounds);
  };
}

/**
 * One grabbable part of one annotation. Every handle in this experiment — a line,
 * an endpoint, a comment box — goes through here, so the whole drag contract lives
 * in a single place.
 */
function AnnotationDraggable(props: {
  annotation: Annotation;
  handle: AnnotationHandle;
  label: string;
  className: string;
  style: React.CSSProperties;
  modifiers?: DragModifiers | undefined;
  disabled?: boolean | undefined;
  keyboardActivation?: DragKeyboardActivation | undefined;
  onDoubleClick?: (() => void) | undefined;
  children?: React.ReactNode | undefined;
}) {
  const {
    annotation,
    handle,
    label,
    className,
    style,
    modifiers,
    disabled,
    keyboardActivation,
    onDoubleClick,
    children,
  } = props;
  const { snap, plotRef, select, change } = useAnnotationsContext();

  return (
    <Draggable.Root
      kind={annotationKind}
      label={label}
      aria-label={label}
      // Read at pickup, which is exactly when the annotation has to be remembered:
      // from here on the state moves under the pointer and the original is gone.
      getPayload={() => ({ id: annotation.id, handle, snapshot: annotation })}
      // A press also has to be able to mean "select" — and on a comment, "start
      // editing" — so the drag waits for real movement rather than the mouse
      // default of `immediate`.
      pointerActivation={{ mouse: { type: 'distance', distance: 3 } }}
      // Nothing in the plot is a drop target, so the default "snap to the nearest
      // accepting target in this direction" has nothing to aim at: nudge instead.
      keyboardMovement={Draggable.fixedStepKeyboardMovement(KEYBOARD_STEP)}
      // `annotation` is the live one, already moved by the presses so far, so these
      // report where the drag has got to rather than where it began. The default
      // `dropped` names the drop target it landed on, and ends with "No drop
      // target" for every drag here, where landing on nothing is the whole design.
      keyboardAnnouncements={{
        moved: () => describeMovement(annotation, handle),
        dropped: () => `Placed. ${describeMovement(annotation, handle)}`,
      }}
      modifiers={modifiers}
      disabled={disabled}
      keyboardActivation={keyboardActivation}
      onDrag={({ source, location }) => {
        change(
          dragAnnotation(
            source.payload,
            location,
            snap,
            plotRef.current?.getBoundingClientRect() ?? null,
          ),
        );
      }}
      onDragEnd={({ source, canceled }) => {
        // A normal release has nothing to commit — the annotation has been moving
        // all along. Escape is the case that needs the snapshot.
        if (canceled) {
          change(source.payload.snapshot);
        }
      }}
      className={className}
      style={style}
      onDoubleClick={onDoubleClick}
      // Selection follows focus, which is what puts the endpoint handles within reach of
      // the keyboard: they are rendered only for the selected annotation, so with
      // selection on press alone, tabbing to a line showed no handles and the only
      // keyboard gesture left was moving the whole thing. Now Tab lands on the line,
      // its handles appear as the next tab stops, and Space on one of them starts a
      // drag that moves that end alone — which is how a line's angle is changed.
      onFocus={() => select(annotation.id)}
      onPointerDown={(event) => {
        select(annotation.id);
        // Keep focus on the part that was pressed so Delete targets this
        // annotation — except while a comment is being edited, where taking focus
        // would blur the textarea the press was aimed at.
        if (!disabled) {
          event.currentTarget.focus();
        }
      }}
    >
      {children}
      {/* No preview. The annotation itself moves, because a line has to redraw as
          its endpoint travels — a copy of the endpoint sliding around would leave
          the line behind. */}
      <Draggable.ClonedPreview disabled />
    </Draggable.Root>
  );
}

const HIT_BAND = 14;

/** Places a hairline rule from `from` to `to`, pivoting on `from`. */
function ruleStyle(from: PxPoint, to: PxPoint): React.CSSProperties {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    left: from.x,
    top: from.y,
    width: Math.hypot(dx, dy),
    transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
  };
}

/**
 * The same line as a `HIT_BAND`-tall strip, wide enough to grab. The strip is
 * centered on the line, which `transform-origin: 0 50%` cancels out so the pivot
 * is still `from`.
 */
function segmentStyle(from: PxPoint, to: PxPoint): React.CSSProperties {
  return { ...ruleStyle(from, to), top: from.y - HIT_BAND / 2 };
}

/** A draggable line: the visible rule plus the strip that catches the pointer. */
function AnnotationSegment(props: {
  annotation: LineAnnotation;
  handle: AnnotationHandle;
  label: string;
  from: PxPoint;
  to: PxPoint;
  selected: boolean;
  arrow?: boolean | undefined;
  modifiers?: DragModifiers | undefined;
}) {
  const { annotation, handle, label, from, to, selected, arrow, modifiers } = props;
  return (
    <AnnotationDraggable
      annotation={annotation}
      handle={handle}
      label={label}
      modifiers={modifiers}
      className={clsx(styles.segment, selected && styles.segmentSelected)}
      style={segmentStyle(from, to)}
    >
      <span className={clsx(styles.segmentLine, annotation.dashed && styles.segmentLineDashed)} />
      {arrow && <span className={styles.arrowHead} />}
    </AnnotationDraggable>
  );
}

function AnnotationHandlePoint(props: {
  annotation: Annotation;
  handle: AnnotationHandle;
  label: string;
  point: PxPoint;
  modifiers?: DragModifiers | undefined;
}) {
  const { annotation, handle, label, point, modifiers } = props;
  return (
    <AnnotationDraggable
      annotation={annotation}
      handle={handle}
      label={label}
      modifiers={modifiers}
      className={styles.handle}
      style={{ left: point.x - 6, top: point.y - 6 }}
    />
  );
}

// ---------------------------------------------------------------------------
// The annotation views
// ---------------------------------------------------------------------------

function toPx(point: DataPoint): PxPoint {
  return { x: xScale(point.x), y: yScale(point.y) };
}

/** The whole data area, in plot pixels. */
const PLOT_BOUNDS: Bounds = {
  left: xScale(X_MIN),
  right: xScale(X_MAX),
  top: yScale(Y_MAX),
  bottom: yScale(Y_MIN),
};

/**
 * The 45° snap for one endpoint handle, pivoting on the annotation's other end.
 *
 * The pivot is read from the annotation this closure was built with, which is the one
 * the drag started on — correct by construction, since the end being pivoted around is
 * the end this drag is not moving. Only the plot's position has to be looked up per
 * move, because the modifier works in client pixels and the page can scroll.
 */
function useEndpointAngleSnap(
  annotation: SegmentAnnotation | ChannelAnnotation,
  handle: 'start' | 'end',
): DragModifier {
  const { plotRef } = useAnnotationsContext();
  const pivot = toPx(handle === 'start' ? annotation.end : annotation.start);
  const range = endpointRange(annotation);
  return angleSnapModifier(() => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    return {
      pivot: { x: rect.left + pivot.x, y: rect.top + pivot.y },
      // The endpoint's own range, in the client pixels the modifier works in. `top`
      // holds the range's *largest* value, which is the smallest y once scaled.
      bounds: {
        left: rect.left + xScale(range.left),
        right: rect.left + xScale(range.right),
        top: rect.top + yScale(range.top),
        bottom: rect.top + yScale(range.bottom),
      },
    };
  });
}

function ValueLineView({
  annotation,
  selected,
}: {
  annotation: ValueLineAnnotation;
  selected: boolean;
}) {
  const horizontal = annotation.type === 'horizontal-line';
  const from = horizontal
    ? { x: PLOT_LEFT, y: yScale(annotation.value) }
    : { x: xScale(annotation.value), y: PLOT_TOP };
  const to = horizontal
    ? { x: PLOT_LEFT + PLOT_WIDTH, y: yScale(annotation.value) }
    : { x: xScale(annotation.value), y: PLOT_TOP + PLOT_HEIGHT };

  return (
    <React.Fragment>
      <AnnotationSegment
        annotation={annotation}
        handle="body"
        label={describeAnnotation(annotation)}
        from={from}
        to={to}
        selected={selected}
        // The whole behavior of a value line: it only travels along the axis it
        // reads from. The lock applies to arrow presses too.
        modifiers={
          horizontal ? Draggable.restrictToVerticalAxis : Draggable.restrictToHorizontalAxis
        }
      />
      <div
        className={styles.valueLabel}
        style={
          horizontal
            ? { left: PLOT_LEFT + PLOT_WIDTH + 10, top: yScale(annotation.value) - 8 }
            : { left: xScale(annotation.value) + 8, top: PLOT_TOP + 2 }
        }
      >
        {horizontal ? formatValue(annotation.value) : formatMonth(annotation.value)}
      </div>
    </React.Fragment>
  );
}

function SegmentView({
  annotation,
  selected,
}: {
  annotation: SegmentAnnotation;
  selected: boolean;
}) {
  const start = toPx(annotation.start);
  const end = toPx(annotation.end);
  const label = describeAnnotation(annotation);
  const snapStart = useEndpointAngleSnap(annotation, 'start');
  const snapEnd = useEndpointAngleSnap(annotation, 'end');

  return (
    <React.Fragment>
      <AnnotationSegment
        annotation={annotation}
        handle="body"
        label={label}
        from={start}
        to={end}
        selected={selected}
        arrow={annotation.type === 'arrow'}
      />
      {selected && (
        <React.Fragment>
          <AnnotationHandlePoint
            annotation={annotation}
            handle="start"
            label={`${label}, start point`}
            point={start}
            modifiers={snapStart}
          />
          <AnnotationHandlePoint
            annotation={annotation}
            handle="end"
            label={`${label}, end point`}
            point={end}
            modifiers={snapEnd}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

function ChannelView({
  annotation,
  selected,
}: {
  annotation: ChannelAnnotation;
  selected: boolean;
}) {
  const start = toPx(annotation.start);
  const end = toPx(annotation.end);
  const parallelStart = toPx({ x: annotation.start.x, y: annotation.start.y + annotation.height });
  const parallelEnd = toPx({ x: annotation.end.x, y: annotation.end.y + annotation.height });
  const label = describeAnnotation(annotation);
  const corners = [start, end, parallelEnd, parallelStart];
  const snapStart = useEndpointAngleSnap(annotation, 'start');
  const snapEnd = useEndpointAngleSnap(annotation, 'end');

  return (
    <React.Fragment>
      {/* The band between the two lines, grabbable over its exact shape: a
          full-plot box clipped to the parallelogram takes pointer events only
          where it paints. A pointer convenience only — an outline on a clipped
          element is clipped away too, so the keyboard route to the same `body`
          handle is the two lines. */}
      <AnnotationDraggable
        annotation={annotation}
        handle="body"
        label={label}
        keyboardActivation="off"
        className={clsx(styles.channelFill, selected && styles.channelFillSelected)}
        style={{
          clipPath: `polygon(${corners.map((point) => `${point.x}px ${point.y}px`).join(', ')})`,
        }}
      />
      <AnnotationSegment
        annotation={annotation}
        handle="body"
        label={label}
        from={start}
        to={end}
        selected={selected}
      />
      <AnnotationSegment
        annotation={annotation}
        handle="body"
        label={`${label}, parallel`}
        from={parallelStart}
        to={parallelEnd}
        selected={selected}
      />
      {selected && (
        <React.Fragment>
          <AnnotationHandlePoint
            annotation={annotation}
            handle="start"
            label={`${label}, start point`}
            point={start}
            modifiers={snapStart}
          />
          <AnnotationHandlePoint
            annotation={annotation}
            handle="end"
            label={`${label}, end point`}
            point={end}
            modifiers={snapEnd}
          />
          <AnnotationHandlePoint
            annotation={annotation}
            handle="height"
            label={`${label}, width of the channel`}
            point={{
              x: (parallelStart.x + parallelEnd.x) / 2,
              y: (parallelStart.y + parallelEnd.y) / 2,
            }}
            modifiers={Draggable.restrictToVerticalAxis}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

function CommentView({
  annotation,
  selected,
  editing,
}: {
  annotation: CommentAnnotation;
  selected: boolean;
  editing: boolean;
}) {
  const { change, edit } = useAnnotationsContext();
  const anchor = toPx(annotation.anchor);
  const position = toPx(annotation.position);
  const label = describeAnnotation(annotation);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  useIsoLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!editing || !textarea) {
      return;
    }
    textarea.focus();
    textarea.select();
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editing, annotation.text]);

  return (
    <React.Fragment>
      {/* The tail. Decorative — the box and the anchor are what you grab. */}
      <div className={styles.stem} style={ruleStyle(position, anchor)} />
      <AnnotationDraggable
        annotation={annotation}
        handle="body"
        label={label}
        disabled={editing}
        className={clsx(
          styles.commentBox,
          selected && styles.commentBoxSelected,
          editing && styles.commentBoxEditing,
        )}
        style={{ left: position.x, top: position.y, width: COMMENT_WIDTH }}
        onDoubleClick={() => edit(annotation.id)}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className={styles.commentTextarea}
            value={annotation.text}
            placeholder="Type…"
            rows={1}
            onChange={(event) => change({ ...annotation, text: event.target.value })}
            onBlur={() => edit(null)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' || (event.key === 'Enter' && event.metaKey)) {
                event.currentTarget.blur();
              }
              // Delete and Backspace belong to the text while it is being typed.
              event.stopPropagation();
            }}
          />
        ) : (
          <span className={styles.commentText}>{annotation.text || 'Empty note'}</span>
        )}
      </AnnotationDraggable>
      {selected && (
        <AnnotationHandlePoint
          annotation={annotation}
          handle="anchor"
          label={`${label}, anchor point`}
          point={anchor}
        />
      )}
    </React.Fragment>
  );
}

function AnnotationView({
  annotation,
  selected,
  editing,
}: {
  annotation: Annotation;
  selected: boolean;
  editing: boolean;
}) {
  switch (annotation.type) {
    case 'horizontal-line':
    case 'vertical-line':
      return <ValueLineView annotation={annotation} selected={selected} />;
    case 'line':
    case 'arrow':
      return <SegmentView annotation={annotation} selected={selected} />;
    case 'parallel-channel':
      return <ChannelView annotation={annotation} selected={selected} />;
    default: // comment
      return <CommentView annotation={annotation} selected={selected} editing={editing} />;
  }
}

// ---------------------------------------------------------------------------
// Creating annotations
// ---------------------------------------------------------------------------

const TOOLS: { type: AnnotationType; label: string }[] = [
  { type: 'horizontal-line', label: 'Horizontal line' },
  { type: 'vertical-line', label: 'Vertical line' },
  { type: 'line', label: 'Trend line' },
  { type: 'arrow', label: 'Arrow' },
  { type: 'parallel-channel', label: 'Channel' },
  { type: 'comment', label: 'Comment' },
];

/** Types drawn with two clicks: one for each end. The rest are placed with one. */
function isTwoPointTool(type: AnnotationType): boolean {
  return type === 'line' || type === 'arrow' || type === 'parallel-channel';
}

/** The gap a new channel opens between its two lines, in series values. */
const NEW_CHANNEL_HEIGHT = -18;

interface PendingCreation {
  type: AnnotationType;
  start: DataPoint;
  /** Where the pointer is now, for the rubber band. */
  cursor: DataPoint;
}

function creationHint(pending: PendingCreation | null, toolLabel: string | null): string {
  if (pending !== null) {
    return 'Click again to finish the annotation · hold Shift to snap to 45° · Escape to cancel';
  }
  if (toolLabel !== null) {
    return `Click on the chart to place the ${toolLabel.toLowerCase()} · Escape to cancel`;
  }
  return (
    'Click an annotation to select it · drag it or its handles · Shift while dragging an ' +
    'endpoint snaps to 45° · Space picks it up for the arrow keys, where Shift means bigger ' +
    'steps instead · Delete to remove · double-click a comment to edit'
  );
}

function createAnnotation(
  id: string,
  type: AnnotationType,
  start: DataPoint,
  end: DataPoint,
): Annotation {
  switch (type) {
    case 'horizontal-line':
      return { id, type, value: start.y, dashed: false };
    case 'vertical-line':
      return { id, type, value: start.x, dashed: false };
    case 'line':
    case 'arrow':
      return { id, type, start, end, dashed: false };
    case 'parallel-channel': {
      // The gap is fixed at first and adjusted from the channel's own handle,
      // rather than asking for a third click before anything is visible.
      const room = Math.min(start.y, end.y) - Y_MIN;
      return {
        id,
        type,
        start,
        end,
        height: Math.max(NEW_CHANNEL_HEIGHT, -room),
        dashed: false,
      };
    }
    default: // comment
      return {
        id,
        type: 'comment',
        anchor: start,
        position: { x: clamp(start.x + 0.5, X_MIN, COMMENT_MAX_X), y: clampY(start.y + 22) },
        text: 'Note',
      };
  }
}

// ---------------------------------------------------------------------------
// The experiment
// ---------------------------------------------------------------------------

/**
 * Whether Shift is down, as a ref for the pointer handlers that run outside React's tree
 * and a state for the hint that reports it.
 *
 * Only the *creation* gesture needs this: placing the second point is two clicks with no
 * drag session between them, so there is no engine event to read the key from. A real
 * drag has no such problem — `shiftKey` is on the modifier context and on
 * `location.current.input`.
 */
function useShiftKey(elementRef: React.RefObject<HTMLElement | null>): {
  shiftRef: React.RefObject<boolean>;
  shiftHeld: boolean;
} {
  const [shiftHeld, setShiftHeld] = React.useState(false);
  const shiftRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    const doc = ownerDocument(elementRef.current);
    const sync = (held: boolean) => {
      shiftRef.current = held;
      setShiftHeld(held);
    };
    const handleKey = (event: KeyboardEvent) => sync(event.shiftKey);
    // A window blur while Shift is down never delivers the keyup, which would otherwise
    // leave the snap stuck on until the key is pressed and released again.
    const handleBlur = () => sync(false);
    doc.addEventListener('keydown', handleKey);
    doc.addEventListener('keyup', handleKey);
    doc.defaultView?.addEventListener('blur', handleBlur);
    return () => {
      doc.removeEventListener('keydown', handleKey);
      doc.removeEventListener('keyup', handleKey);
      doc.defaultView?.removeEventListener('blur', handleBlur);
    };
  }, [elementRef]);

  return { shiftRef, shiftHeld };
}

export default function LineChartAnnotations() {
  const { settings } = useExperimentSettings<LineChartAnnotationsSettings>();
  const snap = settings.snapToDataPoints === true;

  const [annotations, setAnnotations] = React.useState<Annotation[]>(INITIAL_ANNOTATIONS);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tool, setTool] = React.useState<AnnotationType | null>(null);
  const [pending, setPending] = React.useState<PendingCreation | null>(null);

  const plotRef = React.useRef<HTMLDivElement | null>(null);
  const idCounterRef = React.useRef(INITIAL_ANNOTATIONS.length);
  const { shiftRef, shiftHeld } = useShiftKey(plotRef);

  const selected = annotations.find((annotation) => annotation.id === selectedId) ?? null;

  const change = useStableCallback((next: Annotation) => {
    setAnnotations((prev) =>
      prev.map((annotation) => (annotation.id === next.id ? next : annotation)),
    );
  });

  const select = useStableCallback((id: string) => {
    setSelectedId(id);
    setEditingId((prev) => (prev === id ? prev : null));
  });

  const edit = useStableCallback((id: string | null) => {
    setEditingId(id);
  });

  const remove = useStableCallback((id: string) => {
    setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    setEditingId((prev) => (prev === id ? null : prev));
  });

  // Delete acts on the selection wherever focus happens to be: the annotation that
  // held it is the one about to be removed, and after a creation nothing holds it
  // at all. Whatever is being typed into keeps its own Backspace.
  useIsoLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot || selectedId === null || editingId !== null) {
      return undefined;
    }
    const doc = ownerDocument(plot);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      if (doc.activeElement?.closest('input, textarea, [contenteditable]')) {
        return;
      }
      event.preventDefault();
      remove(selectedId);
    };
    doc.addEventListener('keydown', handleKeyDown);
    return () => doc.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, remove]);

  const contextValue = React.useMemo(
    () => ({ snap, plotRef, select, change, edit }),
    [snap, select, change, edit],
  );

  const clearCreation = useStableCallback(() => {
    setPending(null);
    setTool(null);
  });

  // Escape backs out of a half-drawn annotation, then out of the armed tool.
  // Keyed on whether a creation is in flight, not on `pending` itself, which
  // changes on every pointer move.
  const creating = tool !== null || pending !== null;
  useIsoLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot || !creating) {
      return undefined;
    }
    const doc = ownerDocument(plot);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearCreation();
      }
    };
    doc.addEventListener('keydown', handleKeyDown);
    return () => doc.removeEventListener('keydown', handleKeyDown);
  }, [creating, clearCreation]);

  const pointFromEvent = useStableCallback((event: React.MouseEvent): DataPoint | null => {
    const plot = plotRef.current;
    if (!plot) {
      return null;
    }
    // The plot is drawn at its natural size with no transformed ancestor, so a
    // client pixel is a plot pixel and the rect alone converts the pointer.
    const rect = plot.getBoundingClientRect();
    return {
      x: clampX(xInvert(event.clientX - rect.left)),
      y: clampY(yInvert(event.clientY - rect.top)),
    };
  });

  const commit = useStableCallback((type: AnnotationType, start: DataPoint, end: DataPoint) => {
    idCounterRef.current += 1;
    const annotation = createAnnotation(`annotation-${idCounterRef.current}`, type, start, end);
    setAnnotations((prev) => [...prev, annotation]);
    setSelectedId(annotation.id);
    setPending(null);
    setTool(null);
  });

  /**
   * The second point of a two-point creation, snapped to 45° from the first while Shift
   * is held. The same gesture as the endpoint modifier, applied by hand because placing
   * a point is not a drag: no engine session exists yet to run a modifier in.
   */
  const snapToPendingAngle = useStableCallback((point: DataPoint, from: DataPoint): DataPoint => {
    if (!shiftRef.current) {
      return point;
    }
    const snapped = snapToAngle(toPx(point), toPx(from), PLOT_BOUNDS);
    return { x: clampX(xInvert(snapped.x)), y: clampY(yInvert(snapped.y)) };
  });

  const handleCreationPress = useStableCallback((event: React.MouseEvent) => {
    const point = pointFromEvent(event);
    if (point === null || tool === null) {
      return;
    }
    if (!isTwoPointTool(tool)) {
      commit(tool, point, point);
    } else if (pending === null) {
      setPending({ type: tool, start: point, cursor: point });
    } else {
      commit(pending.type, pending.start, snapToPendingAngle(point, pending.start));
    }
  });

  const handleCreationMove = useStableCallback((event: React.MouseEvent) => {
    const point = pointFromEvent(event);
    if (point !== null) {
      setPending((prev) =>
        prev === null ? prev : { ...prev, cursor: snapToPendingAngle(point, prev.start) },
      );
    }
  });

  const activeTool = TOOLS.find((entry) => entry.type === tool) ?? null;

  return (
    <div className={clsx(theme.tokens, styles.root)}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Line chart annotations</h1>

        <div className={styles.tools} role="group" aria-label="Annotation tools">
          {TOOLS.map((entry) => (
            <button
              key={entry.type}
              type="button"
              className={styles.button}
              aria-pressed={tool === entry.type}
              onClick={() => {
                setPending(null);
                setTool((prev) => (prev === entry.type ? null : entry.type));
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.button}
          disabled={annotations.length === 0}
          onClick={() => {
            setAnnotations([]);
            setSelectedId(null);
            setEditingId(null);
          }}
        >
          Clear all
        </button>
      </div>

      <p className={styles.hint}>
        {creationHint(pending, activeTool?.label ?? null)}
        {/* States the condition rather than claiming the snap is running: Shift is also
            held during keyboard drags, where it means a bigger step. */}
        {shiftHeld && <span className={styles.hintActive}>Shift · 45° on pointer drags</span>}
      </p>

      <div className={styles.canvas}>
        <div
          className={styles.plot}
          ref={plotRef}
          style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
        >
          {/* The chart sits under the annotation overlay, which lets pointer events
              through everywhere it has nothing to grab — so a press that reaches
              the chart is a press on empty space. */}
          <div
            className={styles.chartLayer}
            onPointerDown={() => {
              setSelectedId(null);
              setEditingId(null);
            }}
          >
            <Chart />
          </div>

          <AnnotationsContext.Provider value={contextValue}>
            <div className={styles.overlay}>
              {annotations.map((annotation) => (
                <AnnotationView
                  key={annotation.id}
                  annotation={annotation}
                  selected={annotation.id === selectedId}
                  editing={annotation.id === editingId}
                />
              ))}

              {selected !== null && editingId === null && (
                <FloatingToolbar
                  annotation={selected}
                  onChange={change}
                  onEdit={edit}
                  onRemove={remove}
                />
              )}
            </div>
          </AnnotationsContext.Provider>

          {pending !== null && (
            <div
              className={styles.ghost}
              style={ruleStyle(toPx(pending.start), toPx(pending.cursor))}
            />
          )}

          {tool !== null && (
            <div
              className={styles.creationLayer}
              onPointerDown={handleCreationPress}
              onPointerMove={handleCreationMove}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Half the floating toolbar's width, used to keep it inside the chart. */
const TOOLBAR_HALF_WIDTH = 90;

function toolbarAnchor(annotation: Annotation): PxPoint {
  switch (annotation.type) {
    case 'horizontal-line':
      return { x: PLOT_LEFT + PLOT_WIDTH / 2, y: yScale(annotation.value) };
    case 'vertical-line':
      return { x: xScale(annotation.value), y: PLOT_TOP };
    case 'comment':
      return {
        x: xScale(annotation.position.x) + COMMENT_WIDTH / 2,
        y: yScale(annotation.position.y),
      };
    default:
      return {
        x: (xScale(annotation.start.x) + xScale(annotation.end.x)) / 2,
        y: Math.min(yScale(annotation.start.y), yScale(annotation.end.y)),
      };
  }
}

/** The per-annotation options bar AG Charts floats above the current selection. */
function FloatingToolbar({
  annotation,
  onChange,
  onEdit,
  onRemove,
}: {
  annotation: Annotation;
  onChange: (annotation: Annotation) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const anchor = toolbarAnchor(annotation);
  return (
    <div
      className={styles.floatingToolbar}
      style={{
        left: clamp(anchor.x, TOOLBAR_HALF_WIDTH, CHART_WIDTH - TOOLBAR_HALF_WIDTH),
        // Sits above the annotation, and never above the chart.
        top: Math.max(anchor.y - 10, 32),
      }}
    >
      {annotation.type === 'comment' ? (
        <button
          type="button"
          className={styles.floatingButton}
          onClick={() => onEdit(annotation.id)}
        >
          Edit
        </button>
      ) : (
        <button
          type="button"
          className={styles.floatingButton}
          onClick={() => onChange({ ...annotation, dashed: !annotation.dashed })}
        >
          {annotation.dashed ? 'Solid' : 'Dashed'}
        </button>
      )}
      <button
        type="button"
        className={styles.floatingButton}
        onClick={() => onRemove(annotation.id)}
      >
        Delete
      </button>
    </div>
  );
}
