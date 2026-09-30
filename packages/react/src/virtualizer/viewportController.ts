import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import type { RowWindow, RowsGeometry } from './geometry';
import { getLaidOutRowElements } from './getLaidOutRowElements';
import { getLayoutScale, toScrollOffset } from './scrollport';
import type { RowsInset } from './scrollport';
import { getMaxScrollOffset } from '../utils/scrollEdges';
import type { VirtualizerRow } from '../internals/virtualization/types';
import type { VirtualizerScrollAlignment, VirtualizerScrollToIndexOptions } from './types';
import type { ScrollInputEvidence } from './useScrollGesture';

/**
 * Nearby rows do not accumulate enough estimate error to justify delaying scroll completion.
 */
const ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE = 10;

/**
 * How a write hands its position to the engine: always, only once the scrollport accepted it, or
 * not at all, for a list that is not windowing and so has no window to recompute.
 */
type ViewportSync = 'always' | 'if-accepted' | 'never';

/** A frame callback that can be requested again, which replaces the one requested before. */
export interface ViewportFrame {
  request: (callback: () => void) => void;
  cancel: () => void;
}

/**
 * What the controller reads and does outside itself, at the moment it acts rather than as of a
 * render. Every member is stable for the controller's lifetime.
 */
export interface ViewportEnvironment {
  getScrollElement: () => HTMLElement | null;
  /**
   * The element whose children — or grandchildren, one group wrapper deep — are the laid-out
   * rows, in whichever layout the rows are currently in.
   */
  getRowsParent: () => HTMLElement | null;
  /**
   * The engine's latest row geometry. The engine publishes it before React commits the matching
   * row positions, so it can be ahead of the geometry the rows were rendered with.
   */
  readRowsGeometry: () => RowsGeometry;
  /**
   * Whether the window the rows are held in stands where they belong, rather than held at the
   * scrollport's edge after a scroll outran it, until the engine places the next window.
   */
  isWindowInPlace: () => boolean;
  /** Whether a row's height has been measured, as opposed to estimated. */
  isRowMeasured: (rowId: React.Key) => boolean;
  /** Whether the user is dragging the scrollbar, which dictates the position meanwhile. */
  isScrollbarDrag: () => boolean;
  /**
   * Measures the laid-out rows that have not been measured yet and commits their heights to the
   * engine's geometry at once, rather than when their ResizeObserver reports a frame later.
   */
  measureNewRows: () => void;
  /** Commits the engine's pending geometry, recomputing every row position. */
  settleEngineGeometry: () => void;
  /**
   * Hands the position just written to the engine, which the browser tells only a task later, and
   * would otherwise read a correction as the user scrolling in whichever direction it went.
   */
  syncEngine: () => void;
  /** Re-applies a position the scrollport rejected, once it can accept it. */
  viewportFrame: ViewportFrame;
  /** Retries a request once ResizeObserver has had a chance to measure its destination. */
  measurementFrame: ViewportFrame;
}

/**
 * The running average of measured item heights, as far as a scroll request needs to know it: a
 * distant request waits for it, since the rows between the window and the destination are
 * estimated from it.
 */
export interface ViewportEstimate {
  enabled: boolean;
  /** Whether an average has been worked out at all. */
  hasEstimate: () => boolean;
  /** Whether no better average is on its way: one exists, or the rows at hand cannot give one. */
  isSettled: () => boolean;
}

/** What the controller knows of the render the current commit is for. */
export interface ViewportInputs<RowModel> {
  enabled: boolean;
  rows: VirtualizerRow<RowModel>[];
  /** The engine's row geometry the rows were rendered with. */
  rowsMeta: RowsGeometry;
  /** The window the rows were rendered for. */
  window: RowWindow;
  /** The scrollable content before the first row and after the last one. */
  rowsInset: RowsInset;
  trailingHeight: number;
  /**
   * The current row index of a row, by id, for a list whose row indexes can move while the rows
   * themselves stay — group headers inserted above a requested item. A request follows its row
   * through such a move rather than being abandoned. `undefined` for a flat list, where a row at
   * a changed index is a different row.
   */
  resolveRowIndex: ((rowId: React.Key) => number | undefined) | undefined;
  /**
   * How many items come before a row, which a list whose rows include group headers tells apart
   * from the row's index. Distances between a request and the window are judged in items: the
   * estimate a distant request waits for is an average of items, and headers between two items
   * make them no further apart in that sense.
   */
  itemsBeforeRow: (rowIndex: number) => number;
  /** The row the list's activation asks to be brought into view, and how. */
  activation: ViewportActivation;
  estimate: ViewportEstimate;
}

export interface ViewportActivation {
  rowIndex: number | undefined;
  alignment: VirtualizerScrollAlignment;
  /**
   * Inset at the start edge the activation asks its row to rest clear of, or `undefined` to read
   * the scrollport's own `scroll-padding-top`.
   */
  paddingStart: number | undefined;
  /**
   * Inset at the end edge the activation asks its row to rest clear of, or `undefined` to read
   * the scrollport's own `scroll-padding-bottom`.
   */
  paddingEnd: number | undefined;
}

/**
 * Where the content was, the last time the viewport and the geometry agreed.
 */
interface ScrollAnchorSnapshot<RowModel> {
  /** The topmost row element intersecting the scrollport when the snapshot was taken. */
  element: HTMLElement;
  rowIndex: number;
  /** The anchor's position relative to the scroller's top edge. */
  relativeTop: number;
  maxScrollTop: number;
  scrollTop: number;
  /** The anchor's position in the engine's coordinates, used when its element is recycled. */
  virtualOffset: number | null;
  rowsMeta: RowsGeometry;
  rows: VirtualizerRow<RowModel>[];
  /** The first row laid out when the snapshot was taken, standing for the rendered window. */
  firstLaidOutRowIndex: number | null;
}

/**
 * Insets a caller asks a row to rest clear of, in place of the scrollport's own `scroll-padding`.
 * An absent edge falls back to the computed style, so a caller overriding one edge keeps the CSS
 * on the other.
 */
interface ScrollPaddingOverride {
  end: number | undefined;
  start: number | undefined;
}

const EMPTY_SCROLL_PADDING_OVERRIDE: ScrollPaddingOverride = { end: undefined, start: undefined };

/** What an activation was applied for; a commit with the same one asks for nothing new. */
interface ActivationKey {
  enabled: boolean;
  estimateEnabled: boolean;
  rowId: React.Key | null;
  rowIndex: number | undefined;
}

/** What a destination's place depends on; a commit that changes none of it cannot move it. */
interface RetryKey {
  firstRowIndex: number;
  lastRowIndex: number;
  rows: unknown;
  rowsInset: RowsInset;
  rowsMeta: RowsGeometry;
}

/**
 * Owns the scroll position the virtualizer keeps on the user's behalf: the destination of a
 * scroll-to-row request, and the content the user is looking at while the geometry under it
 * changes. Both write positions, and every write goes through here, so a scroll event can be told
 * apart from the echo of a write, and the engine learns of each write in the same place.
 *
 * A request is rarely satisfied by a single write: the destination may still be carrying an
 * estimate, the rows above it may move once they are measured, and a newly opened scrollport may
 * have no scrollable overflow to accept the write at all. It is therefore retained and re-applied
 * on each geometry update until the row is fully inside the scrollport, and abandoned the moment
 * the user scrolls, because retrying then would yank the list away from where they scrolled.
 *
 * While no request stands, anchoring keeps the content the user is looking at where it is.
 * Measurements replacing estimates, mounts realizing real heights, and estimate refreshes can all
 * move the rendered rows relative to the scrollport while the browser keeps `scrollTop`
 * unchanged, so the content would jump. Anchoring tracks the on-screen position of the topmost
 * visible row element and compensates by scrolling by however much it actually moved beyond the
 * user's own scrolling. Comparing real DOM positions rather than virtual position deltas matters:
 * a row measured after the window has already scrolled past it changes its virtual position
 * without moving anything on screen, and "correcting" for that would push the viewport around for
 * no visual reason. When the viewport was at the previous maximum scroll position, the bottom is
 * pinned instead: preserving the top row in that case would leave newly measured content below
 * the viewport.
 *
 * The owner publishes each render's inputs before any layout effect of its commit, then runs
 * `commit()` and, after anything else that rewrites the geometry in that commit, `retry()`.
 *
 * Anchoring is a candidate for the engine itself: beside `hydrateRowsMeta` it could correct its
 * own scroll position, instead of this writing one and handing it over through
 * `syncScrollPosition`, which would skip the window computed for the stale position. What it
 * should anchor on is not settled, though — it holds the topmost visible row, and once the
 * adaptive estimate has settled that lets a selection lower in the viewport drift under a
 * geometry rewrite (see the alignment test kept on `Virtualizer.combobox.test.tsx`). Resolve that
 * before proposing it upstream.
 */
export class ViewportController<RowModel> {
  private inputs: ViewportInputs<RowModel> | null = null;

  /**
   * The last `scrollTop` written here, so user-driven scrolling can be told apart from the scroll
   * events of the corrective writes.
   */
  private lastWrittenScrollTop: number | null = null;

  // The outstanding scroll-to-row request, if any.
  private requestRowIndex: number | null = null;
  private requestRowId: React.Key | null = null;
  private requestAlignment: VirtualizerScrollAlignment = 'auto';
  /**
   * The insets the standing request keeps its row clear of, which stand in for the scrollport's
   * own `scroll-padding` while it lasts. They belong to the request, so retries reuse them
   * rather than reading a style that has since changed.
   */
  private requestPadding: ScrollPaddingOverride = EMPTY_SCROLL_PADDING_OVERRIDE;
  private requiresMeasurement = false;
  private requiresAdaptiveEstimate = false;
  /**
   * Position the scrollport should be at while the browser still refuses to scroll there. A scroll
   * container gains its scrollable overflow only on the frame after the one that mounts it, so the
   * write that opens a popup at a distant row is clamped back to zero. It is written again on the
   * frame after, once the scrollport can accept it.
   */
  private rejectedScrollTop: number | null = null;

  private lastActivation: ActivationKey | null = null;
  private lastRetry: RetryKey | null = null;

  private snapshot: ScrollAnchorSnapshot<RowModel> | null = null;

  constructor(private readonly environment: ViewportEnvironment) {}

  /**
   * Forgets which activation and which geometry the last commit applied, so the next commit
   * applies them again. For effects torn down and set up again — Strict Mode does it on mount, and
   * a revealed Activity does too — which cancel the frames a request was waiting on.
   */
  disconnect() {
    this.lastActivation = null;
    this.lastRetry = null;
  }

  /** Publishes the render the next commit is for. */
  update(inputs: ViewportInputs<RowModel>) {
    this.inputs = inputs;
  }

  /**
   * Applies what this commit asks of the viewport: a new activation's destination, or else an
   * anchoring correction for whatever the commit moved.
   */
  commit() {
    if (this.inputs == null) {
      return;
    }
    this.applyActivation();
    this.anchor();
  }

  /**
   * Re-applies an outstanding request when the commit changed anything its destination's place
   * depends on, until the destination is where it was asked to be. Run after everything else in
   * the commit that rewrites the geometry, so a request waiting on a settled estimate sees the
   * refreshed one in the same commit.
   */
  retry() {
    if (this.inputs == null) {
      return;
    }
    const { rows, rowsInset, rowsMeta, window } = this.inputs;
    const previous = this.lastRetry;

    if (
      previous != null &&
      previous.firstRowIndex === window.firstRowIndex &&
      previous.lastRowIndex === window.lastRowIndex &&
      previous.rows === rows &&
      previous.rowsInset === rowsInset &&
      previous.rowsMeta === rowsMeta
    ) {
      return;
    }

    this.lastRetry = {
      firstRowIndex: window.firstRowIndex,
      lastRowIndex: window.lastRowIndex,
      rows,
      rowsInset,
      rowsMeta,
    };
    this.reapply();
  }

  /** Requests that a row be brought into view, retrying until the geometry settles on it. */
  scrollToIndex(rowIndex: number, options?: VirtualizerScrollToIndexOptions) {
    if (this.inputs == null) {
      return;
    }
    const { enabled, rows } = this.inputs;
    const row = rows[rowIndex];

    if (!Number.isInteger(rowIndex) || rowIndex < 0 || !row) {
      return;
    }

    const align = options?.align ?? 'auto';
    const padding = toScrollPaddingOverride(options?.paddingStart, options?.paddingEnd);

    if (!enabled) {
      this.cancel();
      this.scrollRowElementIntoView(rowIndex, align, padding);
      return;
    }

    this.requestRowIndex = rowIndex;
    this.requestRowId = row.id;
    this.requestAlignment = align;
    this.requestPadding = padding;
    this.requiresMeasurement = false;
    this.requiresAdaptiveEstimate = false;

    if (this.scrollRowIntoView(rowIndex, false, align)) {
      this.settle();
    }
  }

  /** Scrolls back to the start. */
  reset() {
    const scrollElement = this.environment.getScrollElement();
    if (scrollElement != null) {
      this.write(scrollElement, 0, 'always');
    }
  }

  /** Whether a request is still outstanding. Anchoring stands aside while one is. */
  isPending() {
    return this.requestRowIndex != null;
  }

  /** Forgets the request without treating it as fulfilled, as user scrolling does. */
  cancel() {
    this.requestRowIndex = null;
    this.requestRowId = null;
    this.requestPadding = EMPTY_SCROLL_PADDING_OVERRIDE;
    this.requiresAdaptiveEstimate = false;
    this.rejectedScrollTop = null;
    this.environment.viewportFrame.cancel();
    this.environment.measurementFrame.cancel();
  }

  /** Whether a scroll event is the echo of a position written here rather than the user's. */
  isEcho(scrollTop: number, evidence: ScrollInputEvidence) {
    return (
      (this.lastWrittenScrollTop != null && Math.abs(scrollTop - this.lastWrittenScrollTop) <= 1) ||
      // Expanding a collection can queue several corrective native scroll events while its
      // adaptive estimate settles. None of those are user takeovers unless direct input occurred.
      (this.requiresAdaptiveEstimate && !evidence.hasDirectInput && !evidence.isPointerDown)
    );
  }

  /**
   * Commits a geometry rewrite this component starts itself, such as an estimate refresh, with the
   * content the user is looking at held in place, in a single window.
   *
   * Compensating after the commit is too late for such a rewrite: the engine recomputes its window
   * inside the rewrite, from the scroll position it last observed, and a rewrite that moves the
   * content far enough commits a window around the wrong rows. The rows around the viewport then
   * unmount and mount again once the correction reaches the engine, which loses their focus and
   * any state inside them, even though nothing is painted in between. So the rewrite is committed
   * outside React's commit instead, the scroll position is corrected from the fresh geometry before
   * React renders, and handed to the engine at once, so the only window committed is the corrected
   * one.
   */
  settleGeometry() {
    const scrollElement = this.environment.getScrollElement();
    const previous = this.snapshot;

    // Checked again when the rewrite runs: a commit may have moved the content or the user may
    // have scrolled since it was queued. The next commit then compensates, as for any rewrite.
    if (!this.canAnchorRewrite() || scrollElement == null || previous?.virtualOffset == null) {
      this.environment.settleEngineGeometry();
      return;
    }

    const { rowsInset, trailingHeight } = this.getInputs();
    const scrollTop = scrollElement.scrollTop;
    // The engine recomputes its window from the scroll position it last observed while this
    // runs. Outside React's commit, that window is only stored: React renders it later in this
    // task, by which time the corrected one below has replaced it.
    this.environment.settleEngineGeometry();
    const latestRowsMeta = this.environment.readRowsGeometry();
    const virtualOffset = latestRowsMeta.positions[previous.rowIndex];

    if (latestRowsMeta === previous.rowsMeta || virtualOffset == null) {
      return;
    }

    const maxScrollTop = getMaxScrollOffset(
      latestRowsMeta.currentPageTotalHeight + rowsInset.start + rowsInset.end + trailingHeight,
      scrollElement.clientHeight,
    );
    const pinnedToBottom =
      previous.maxScrollTop > 0 && Math.abs(previous.scrollTop - previous.maxScrollTop) < 1;
    let nextScrollTop = scrollTop;
    if (pinnedToBottom) {
      nextScrollTop = maxScrollTop;
    } else if (scrollTop > 0) {
      // When pinned to the very top, stay there, mirroring native scroll anchoring.
      nextScrollTop = clamp(scrollTop + virtualOffset - previous.virtualOffset, 0, maxScrollTop);
    }

    // The content has not been resized yet, so a position past its current end would be clamped.
    // The next commit makes that correction once it has grown the content.
    if (nextScrollTop - (scrollElement.scrollHeight - scrollElement.clientHeight) >= 1) {
      return;
    }

    // Record the write, so the commit that follows compares the rows against the position they
    // were placed for rather than correcting for the write a second time. The geometry stays the
    // one the rows were measured against: the commit still checks where they actually landed.
    this.snapshot = {
      ...previous,
      maxScrollTop,
      scrollTop: nextScrollTop,
      virtualOffset,
    };

    if (Math.abs(nextScrollTop - scrollTop) >= getSmallestCorrection(scrollElement)) {
      this.write(scrollElement, nextScrollTop, 'always');
    }
  }

  /**
   * The published inputs. Read only on paths the public methods reach once inputs exist: nothing
   * can ask the viewport anything before the first commit has published them.
   */
  private getInputs() {
    return this.inputs!;
  }

  /**
   * Writes a scroll position and reports whether the scrollport accepted it. A scrollport without
   * the overflow to scroll there clamps the write, as a popup does on the frame it opens.
   */
  private write(scrollElement: HTMLElement, scrollTop: number, sync: ViewportSync): boolean {
    this.lastWrittenScrollTop = scrollTop;
    scrollElement.scrollTo({ behavior: 'instant' as ScrollBehavior, top: scrollTop });
    const accepted = Math.abs(scrollElement.scrollTop - scrollTop) <= 1;

    if (sync === 'always' || (sync === 'if-accepted' && accepted)) {
      this.environment.syncEngine();
    }

    return accepted;
  }

  /** Retires a request whose destination is now where it was asked to be. */
  private settle() {
    this.environment.measurementFrame.cancel();
    this.requestRowIndex = null;
    this.requestRowId = null;
    this.requestPadding = EMPTY_SCROLL_PADDING_OVERRIDE;
    this.requiresAdaptiveEstimate = false;
  }

  /**
   * Starts positioning the row the activation asks for, when the activation changed since the
   * last commit. Alignment and insets belong to the activation that requested the scroll, so they
   * are read at that moment rather than compared: changing only how a row is aligned describes no
   * new activation and must not move the viewport on its own.
   */
  private applyActivation() {
    const { activation, enabled, estimate, rows, window, itemsBeforeRow } = this.getInputs();
    const rowIndex = activation.rowIndex;
    const rowId = rowIndex == null ? null : (rows[rowIndex]?.id ?? null);
    const previous = this.lastActivation;

    if (
      previous != null &&
      previous.enabled === enabled &&
      previous.estimateEnabled === estimate.enabled &&
      previous.rowId === rowId &&
      previous.rowIndex === rowIndex
    ) {
      return;
    }

    this.lastActivation = { enabled, estimateEnabled: estimate.enabled, rowId, rowIndex };

    if (rowIndex == null || rowIndex < 0 || rowId == null) {
      this.cancel();
      return;
    }

    const padding = toScrollPaddingOverride(activation.paddingStart, activation.paddingEnd);

    if (!enabled) {
      // Nothing to retain: the row is on the page already.
      this.cancel();
      this.scrollRowElementIntoView(rowIndex, activation.alignment, padding);
      return;
    }

    this.requestRowIndex = rowIndex;
    this.requestRowId = rowId;
    this.requestAlignment = activation.alignment;
    this.requestPadding = padding;
    this.requiresMeasurement = false;
    this.requiresAdaptiveEstimate =
      this.requiresAdaptiveEstimate ||
      (estimate.enabled &&
        !estimate.hasEstimate() &&
        isRowFarFromWindow(rowIndex, window, itemsBeforeRow));

    // Try immediately with estimated metadata. If the destination is still unmeasured, the retry
    // corrects the position once ResizeObserver updates it.
    if (this.scrollRowIntoView(rowIndex, false, activation.alignment)) {
      this.settle();
    }
  }

  /** Re-applies the outstanding request, whatever changed. */
  private reapply = () => {
    const { rows, resolveRowIndex } = this.getInputs();
    let rowIndex = this.requestRowIndex;

    // Array identity may change without the logical destination changing. Only invalidate a
    // pending correction when a different row now occupies the requested collection index.
    if (rowIndex != null && rows[rowIndex]?.id !== this.requestRowId) {
      const movedRowIndex =
        this.requestRowId == null ? undefined : resolveRowIndex?.(this.requestRowId);

      if (movedRowIndex == null) {
        this.cancel();
        return;
      }

      // The row is still there, at another index. Start its positioning over: the position
      // written so far was for the old index, and requiring the row to be measured before
      // scrolling would wait on a row that is not mounted at the new one yet.
      rowIndex = movedRowIndex;
      this.requestRowIndex = movedRowIndex;
      this.requiresMeasurement = false;
      this.rejectedScrollTop = null;
      this.environment.viewportFrame.cancel();
    }

    if (
      rowIndex != null &&
      this.scrollRowIntoView(rowIndex, this.requiresMeasurement, this.requestAlignment)
    ) {
      this.settle();
    }
  };

  /**
   * Re-applies a position the scrollport rejected, on the frame where its scrollable overflow
   * exists. A single attempt is enough to schedule: the request retries the write on each of its
   * own measurement passes, so a scrollport that stays unscrollable never spins a frame loop for as
   * long as the request stands.
   */
  private applyRejectedScroll = () => {
    const scrollElement = this.environment.getScrollElement();
    const rejectedScrollTop = this.rejectedScrollTop;

    if (rejectedScrollTop == null) {
      return;
    }

    if (scrollElement == null || this.requestRowIndex == null) {
      this.rejectedScrollTop = null;
      return;
    }

    if (this.write(scrollElement, rejectedScrollTop, 'if-accepted')) {
      this.rejectedScrollTop = null;
    }
  };

  private findLaidOutRow(rowIndex: number) {
    const rowsParent = this.environment.getRowsParent();
    return rowsParent == null
      ? undefined
      : getLaidOutRowElements(rowsParent).find(
          (element) => Number(element.dataset.rowIndex) === rowIndex,
        );
  }

  private waitForMeasurement() {
    // A first measurement matching the estimate only changes the engine's measured flag;
    // it does not publish new geometry. Retry after ResizeObserver has had a chance to
    // deliver it, or the request can wait forever for a geometry update that never comes.
    this.environment.measurementFrame.request(this.reapply);
  }

  private scrollRowIntoView(
    rowIndex: number,
    requireMeasurement: boolean,
    align: VirtualizerScrollAlignment,
  ) {
    const { estimate, rows, rowsInset, trailingHeight } = this.getInputs();
    const { environment } = this;
    const scrollElement = environment.getScrollElement();
    const row = rows[rowIndex];

    if (!scrollElement || !row) {
      return false;
    }

    const measured = environment.isRowMeasured(row.id);

    // The first pass may scroll using estimates so the destination mounts. The retry waits for
    // the real row measurement; treating an estimated position as final can leave only the
    // zero-sized focus proxy mounted after row heights expand. Rows measured above the
    // destination can move it out of the window before it is measured itself, and nothing
    // would measure it there, so a destination that is no longer laid out is scrolled to
    // again from the current geometry.
    if (requireMeasurement && !measured && this.findLaidOutRow(rowIndex) != null) {
      this.waitForMeasurement();
      return false;
    }

    const currentRowsMeta = environment.readRowsGeometry();
    const rowStart = currentRowsMeta.positions[rowIndex];
    const rowEnd =
      currentRowsMeta.positions[rowIndex + 1] ?? currentRowsMeta.currentPageTotalHeight;

    if (rowStart == null || rowEnd == null) {
      return false;
    }

    // Scroll offsets are measured from the scrollport's padding edge, so the row's virtual
    // position moves down by whatever the rows are laid out after.
    const start = rowStart + rowsInset.start;
    const end = rowEnd + rowsInset.start;

    const { resolvedAlignment, scrollTop: nextScrollTop } = resolveAlignedScrollTop(
      scrollElement,
      start,
      end,
      align,
      this.requestPadding,
    );

    if (align === 'auto' && resolvedAlignment !== 'auto' && this.requestRowIndex === rowIndex) {
      // Measurements can move the requested row across the opposite viewport edge. Keep the
      // edge chosen by the initial estimated pass so corrective retries do not visibly move a
      // selected row from the bottom of the popup to the top (or vice versa).
      this.requestAlignment = resolvedAlignment;
    }

    if (nextScrollTop != null) {
      const maxScrollTop = getMaxScrollOffset(
        currentRowsMeta.currentPageTotalHeight + rowsInset.start + rowsInset.end + trailingHeight,
        scrollElement.clientHeight,
      );
      const clampedScrollTop = clamp(nextScrollTop, 0, maxScrollTop);
      // The engine adopts an accepted position and renders the window it calls for in the
      // commit that follows, before the browser paints that position.
      if (this.write(scrollElement, clampedScrollTop, 'if-accepted')) {
        this.rejectedScrollTop = null;
        environment.viewportFrame.cancel();
        this.requiresMeasurement = true;
      } else {
        // A newly opened popup runs this before its scrollable overflow exists, and the browser
        // clamps the write back to the top. The destination is still known, so hold it and
        // write it again on the frame after, once the scrollport can accept it.
        this.rejectedScrollTop = clampedScrollTop;
        this.requiresMeasurement = false;
        environment.viewportFrame.request(this.applyRejectedScroll);
        return false;
      }
    } else {
      this.requiresMeasurement = true;
    }

    if (!measured) {
      if (this.findLaidOutRow(rowIndex) != null) {
        this.waitForMeasurement();
      }
      return false;
    }

    // A distant row measured while the collection was filtered can make the estimate-based first
    // pass look complete even though the expanded collection retained it only as an offscreen
    // focus proxy. Keep that request pending until the static estimate settles, so the alignment
    // is re-applied across the refresh that rewrites every unmeasured row.
    // A window that cannot supply the samples the average needs — a group's one item between two
    // tall headers — would keep the request pending for good, and anchoring suspended with it.
    // Once the refinement is known to be exhausted, the measured destination is final enough:
    // whatever average arrives later is absorbed by anchoring.
    if (this.requiresAdaptiveEstimate && !estimate.isSettled()) {
      return false;
    }

    // Measuring the destination alone does not settle the request either: the rows above it can
    // still be carrying estimates, and measuring those later moves the destination by however
    // much they were off. An estimate below the real height pushes it down, so a row that was
    // scrolled to exactly can end up entirely below the scrollport with nothing to correct it.
    //
    // The request is settled once the destination is fully inside the scrollport, which merely
    // intersecting it does not establish: a row still hanging over an edge is one geometry
    // update away from leaving again. Until then the request stays pending and every retry
    // re-runs this alignment. Requiring the rendered row also covers a distant row that the
    // collection retained only as an offscreen focus proxy, which is positioned absolutely and
    // never counts as on screen. A row taller than the scrollport can never fit, so for those
    // covering the scrollport is what counts as arrived.
    const renderedRow = this.findLaidOutRow(rowIndex);
    // A window held at the scrollport's edge, after the write outran it, holds the row where it
    // does not belong: where the row is now says nothing about where it will be once the window
    // the engine computed for the written position commits.
    if (!environment.isWindowInPlace()) {
      return false;
    }

    const renderedRowRect = renderedRow?.getBoundingClientRect();
    const scrollElementRect = scrollElement.getBoundingClientRect();
    if (renderedRowRect == null) {
      return false;
    }

    return renderedRowRect.height <= scrollElementRect.height + 1
      ? renderedRowRect.top >= scrollElementRect.top - 1 &&
          renderedRowRect.bottom <= scrollElementRect.bottom + 1
      : renderedRowRect.top <= scrollElementRect.top + 1 &&
          renderedRowRect.bottom >= scrollElementRect.bottom - 1;
  }

  /**
   * Brings a row into view while the list is not windowing. Every row is laid out natively then,
   * so the destination is read from the DOM rather than from the engine's geometry, nothing about
   * it is an estimate, and one write is final: no request is retained and nothing retries. So a
   * request made while the scrollport is hidden is served against empty rects and not again once
   * it shows, unlike a windowed request, which stands until the geometry satisfies it.
   */
  private scrollRowElementIntoView(
    rowIndex: number,
    align: VirtualizerScrollAlignment,
    padding: ScrollPaddingOverride,
  ) {
    const scrollElement = this.environment.getScrollElement();
    const rowElement = this.findLaidOutRow(rowIndex);

    if (scrollElement == null || rowElement == null) {
      return;
    }

    // In scroll coordinates: from the scrollport's padding edge, at its current position.
    // Rects are in the viewport's space, which an ancestor transform scales (a popup mid
    // entrance animation); scroll offsets are in layout space.
    const rowRect = rowElement.getBoundingClientRect();
    const scrollElementRect = scrollElement.getBoundingClientRect();
    const scale = getLayoutScale(scrollElement, scrollElementRect);
    const start = toScrollOffset(rowRect.top, scrollElement, scrollElementRect, scale);
    const end = start + rowRect.height / scale;
    const { scrollTop: nextScrollTop } = resolveAlignedScrollTop(
      scrollElement,
      start,
      end,
      align,
      padding,
    );

    if (nextScrollTop == null) {
      return;
    }

    const clampedScrollTop = clamp(
      nextScrollTop,
      0,
      getMaxScrollOffset(scrollElement.scrollHeight, scrollElement.clientHeight),
    );
    // Not windowing, the engine has no window to recompute for the position.
    this.write(scrollElement, clampedScrollTop, 'never');
  }

  /**
   * Whether the snapshot still describes what the user is looking at, so a rewrite can be
   * anchored on it rather than compensated for after the commit.
   */
  private canAnchorRewrite() {
    if (this.inputs == null) {
      return false;
    }
    const { enabled, rows } = this.inputs;
    const scrollElement = this.environment.getScrollElement();
    const previous = this.snapshot;

    return (
      enabled &&
      scrollElement != null &&
      previous != null &&
      previous.rows === rows &&
      previous.virtualOffset != null &&
      // The snapshot was taken against the geometry being replaced, at the position still held.
      previous.rowsMeta === this.environment.readRowsGeometry() &&
      Math.abs(scrollElement.scrollTop - previous.scrollTop) < 1 &&
      // A pending request repositions from the fresh geometry, and waits to see it in the same
      // commit; a scrollbar drag dictates the position.
      !this.isPending() &&
      !this.environment.isScrollbarDrag()
    );
  }

  /**
   * Compensates for however much the commit moved the content under the viewport, and snapshots
   * where the content is now for the next commit to compare against.
   */
  private anchor() {
    const { enabled, rows, rowsMeta, rowsInset, trailingHeight } = this.getInputs();
    const { environment } = this;
    const scrollElement = environment.getScrollElement();
    const rowsParent = environment.getRowsParent();

    if (!enabled || scrollElement == null || rowsParent == null) {
      this.snapshot = null;
      return;
    }

    // A pending request repositions absolutely from the fresh geometry instead, so no correction
    // is made while one stands. The snapshot is still taken: the engine can leave the rows above
    // the destination unmounted until its own settle pass, and their measurements then land in
    // the commit right after the request settles, which would have nothing to compare against
    // otherwise.
    const isRequestPending = this.isPending();

    // The engine can change the rendered window while nothing scrolls, most often when it
    // rebalances its buffers once a scroll settles. Rows it mounts above the viewport have not
    // been measured: the window places them by their estimates, but they lay out at their real
    // heights and move everything below them, before their ResizeObserver reports anything.
    // Measuring them now makes that a geometry change like any other, corrected below from the
    // geometry, which keeps the scroll position consistent with where the engine places rows.
    // Only a window that grew upward needs it, since rows mounted below move nothing on screen.
    // It holds when a rewrite is on its way too: a correction written here moves the window,
    // and can mount another unmeasured row above the one it just placed, in the same commit as
    // the rewrite it corrected for.
    const firstLaidOutRowIndex = getFirstLaidOutRowIndex(rowsParent);
    const snapshotBeforeMeasuring = this.snapshot;
    if (
      snapshotBeforeMeasuring !== null &&
      !isRequestPending &&
      !environment.isScrollbarDrag() &&
      firstLaidOutRowIndex !== null &&
      snapshotBeforeMeasuring.firstLaidOutRowIndex !== null &&
      firstLaidOutRowIndex < snapshotBeforeMeasuring.firstLaidOutRowIndex &&
      Math.abs(scrollElement.scrollTop - snapshotBeforeMeasuring.scrollTop) < 1
    ) {
      environment.measureNewRows();
    }

    const latestRowsMeta = environment.readRowsGeometry();
    // MUI publishes the store update before React commits the matching row positions. We can still
    // compensate from the logical row offsets, but must not snapshot the stale DOM in that commit.
    const hasPendingRowsMeta = rowsMeta !== latestRowsMeta;
    const previous = this.snapshot;
    const geometryChanged = previous?.rowsMeta !== latestRowsMeta;
    const scrollerRect = scrollElement.getBoundingClientRect();
    const scrollerTop = scrollerRect.top;
    let scrollTop = scrollElement.scrollTop;
    const maxScrollTop = getMaxScrollOffset(
      latestRowsMeta.currentPageTotalHeight + rowsInset.start + rowsInset.end + trailingHeight,
      scrollElement.clientHeight,
    );
    const shouldPinToBottom =
      previous !== null &&
      previous.maxScrollTop > 0 &&
      Math.abs(previous.scrollTop - previous.maxScrollTop) < 1 &&
      (Math.abs(scrollTop - previous.scrollTop) < 1 || Math.abs(scrollTop - maxScrollTop) < 1);

    if (
      !isRequestPending &&
      previous !== null &&
      previous.rows === rows &&
      geometryChanged &&
      // During a scrollbar drag the user dictates the absolute position and corrections would
      // fight the pointer; the snapshot below simply absorbs whatever shifted.
      !environment.isScrollbarDrag() &&
      // When pinned to the very top, stay there, mirroring native scroll anchoring.
      scrollTop > 0
    ) {
      let shift = 0;

      // A group header retained hidden after it left the window is still connected and still
      // names its row, but its rectangle describes nothing on screen.
      const elementStillRepresentsRow =
        previous.element.isConnected &&
        !previous.element.hidden &&
        // A row retained as the offscreen focus proxy is positioned out of the layout.
        previous.element.style.position !== 'absolute' &&
        Number(previous.element.dataset.rowIndex) === previous.rowIndex;

      // A window held at the scrollport's edge holds its rows where they do not belong, whether a
      // scroll outran it or the geometry moved it from under a resting viewport, which is the very
      // shift to correct here. The rows' positions on screen say nothing then, and the shift is
      // taken from the geometry instead.
      if (!hasPendingRowsMeta && elementStillRepresentsRow && environment.isWindowInPlace()) {
        const anchorTop = previous.element.getBoundingClientRect().top - scrollerTop;
        // How far the anchor actually moved on screen beyond what user scrolling accounts for.
        shift = anchorTop - previous.relativeTop + (scrollTop - previous.scrollTop);
      } else if (
        previous.virtualOffset != null &&
        // A geometry refresh can replace the entire render window before this runs. In that case
        // the DOM anchor is gone, but the old row's virtual offset still tells us by how much the
        // content above it moved. Use this fallback when the user did not scroll in between; a
        // position at the new maximum is the browser's own clamp after the content shrank under
        // the current scroll position, not user scrolling.
        (Math.abs(scrollTop - previous.scrollTop) < 1 || Math.abs(scrollTop - maxScrollTop) < 1)
      ) {
        const currentVirtualOffset = latestRowsMeta.positions[previous.rowIndex];
        if (currentVirtualOffset != null) {
          // Apply the geometry shift to the position the user last held; a browser clamp has
          // already absorbed part of that shift into `scrollTop`.
          shift = currentVirtualOffset - previous.virtualOffset - (scrollTop - previous.scrollTop);
        }
      }

      const smallestCorrection = getSmallestCorrection(scrollElement);
      if (shouldPinToBottom || Math.abs(shift) >= smallestCorrection) {
        const nextScrollTop = shouldPinToBottom
          ? maxScrollTop
          : clamp(scrollTop + shift, 0, maxScrollTop);

        if (Math.abs(nextScrollTop - scrollTop) >= smallestCorrection) {
          scrollTop = nextScrollTop;
          // The engine adopts the written position and renders the window it calls for in the
          // commit that follows, before the browser paints.
          this.write(scrollElement, nextScrollTop, 'always');
        }
      }
    }

    if (hasPendingRowsMeta) {
      if (previous != null) {
        const virtualOffset = latestRowsMeta.positions[previous.rowIndex];
        if (virtualOffset != null) {
          this.snapshot = {
            ...previous,
            maxScrollTop,
            // The element position was measured at the snapshot's scroll position. Keep the pair
            // consistent while carrying the snapshot forward, or the next on-screen comparison
            // double-counts the scrolling that happened in between as a geometry shift.
            relativeTop: previous.relativeTop - (scrollTop - previous.scrollTop),
            scrollTop,
            virtualOffset,
            rowsMeta: latestRowsMeta,
            firstLaidOutRowIndex,
          };
        }
      }
      return;
    }

    const userScrollDelta = previous == null ? 0 : scrollTop - previous.scrollTop;
    if (
      previous != null &&
      previous.rows === rows &&
      !previous.element.isConnected &&
      !environment.isScrollbarDrag() &&
      Math.abs(userScrollDelta) >= 1 &&
      Math.abs(userScrollDelta) <= scrollElement.clientHeight
    ) {
      const virtualOffset = rowsMeta.positions[previous.rowIndex];
      if (virtualOffset != null) {
        // A small scroll can replace the whole virtual window before its newly mounted rows are
        // measured. Keep the prior logical anchor for one measurement cycle so growth between the
        // old and new windows is not lost merely because its DOM node was recycled.
        this.snapshot = {
          ...previous,
          maxScrollTop,
          relativeTop: previous.relativeTop - userScrollDelta,
          scrollTop,
          virtualOffset,
          rowsMeta,
          firstLaidOutRowIndex,
        };
        return;
      }
    }

    // A held window's rows are not where the content is: nothing to snapshot off them, so the
    // snapshot taken while they were stands until the engine places the next window.
    if (!environment.isWindowInPlace()) {
      return;
    }

    const anchor = findAnchorRowElement(rowsParent, scrollerTop, scrollerRect.bottom);
    this.snapshot =
      anchor === null
        ? null
        : {
            element: anchor.element,
            rowIndex: anchor.rowIndex,
            relativeTop: anchor.relativeTop,
            maxScrollTop,
            scrollTop,
            virtualOffset: rowsMeta.positions[anchor.rowIndex] ?? null,
            rowsMeta,
            rows,
            firstLaidOutRowIndex,
          };
  }
}

/**
 * Whether a destination lies far enough outside the window that the rows between it and the
 * window could accumulate enough estimate error to justify waiting for the refined average.
 *
 * Judged in items: the average describes items, and group headers between two items make them no
 * further apart in that sense.
 */
export function isRowFarFromWindow(
  rowIndex: number,
  window: RowWindow,
  itemsBeforeRow: (rowIndex: number) => number,
) {
  const itemIndex = itemsBeforeRow(rowIndex);
  return (
    itemIndex < itemsBeforeRow(window.firstRowIndex) - ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE ||
    itemIndex > itemsBeforeRow(window.lastRowIndex) + ADAPTIVE_SCROLL_TARGET_MIN_DISTANCE
  );
}

/**
 * A caller's inset as pixels, or `undefined` when there is none to apply. A negative or
 * non-finite value describes no inset rather than an inset the other way, as CSS `scroll-padding`
 * itself does not accept one.
 */
function resolvePaddingOverride(value: number | undefined) {
  return value != null && Number.isFinite(value) ? Math.max(0, value) : undefined;
}

/**
 * The insets a request carries, or the shared empty one when it carries none, so an unpadded
 * request allocates nothing per call.
 */
function toScrollPaddingOverride(
  start: number | undefined,
  end: number | undefined,
): ScrollPaddingOverride {
  const resolvedStart = resolvePaddingOverride(start);
  const resolvedEnd = resolvePaddingOverride(end);
  return resolvedStart == null && resolvedEnd == null
    ? EMPTY_SCROLL_PADDING_OVERRIDE
    : { end: resolvedEnd, start: resolvedStart };
}

/**
 * Where the scrollport should scroll so a row spanning `start` to `end`, in scroll coordinates,
 * lands as `align` asks, or `null` when `auto` finds it in view already. `auto` reports the edge it
 * chose, so a retry can keep to it.
 *
 * The row is kept clear of the insets the request carries, and of the scrollport's own
 * `scroll-padding` at whichever edge the request leaves to CSS.
 */
function resolveAlignedScrollTop(
  scrollElement: HTMLElement,
  start: number,
  end: number,
  align: VirtualizerScrollAlignment,
  padding: ScrollPaddingOverride,
): { resolvedAlignment: VirtualizerScrollAlignment; scrollTop: number | null } {
  // Read only for the edges the caller left to CSS: a request that supplies both is served
  // without a style lookup at all.
  const styles =
    padding.start == null || padding.end == null
      ? ownerWindow(scrollElement).getComputedStyle(scrollElement)
      : null;
  const scrollPaddingStart =
    padding.start ?? resolveScrollPadding(scrollElement, styles!.scrollPaddingTop);
  const scrollPaddingEnd =
    padding.end ?? resolveScrollPadding(scrollElement, styles!.scrollPaddingBottom);
  const viewportStart = scrollElement.scrollTop + scrollPaddingStart;
  const viewportEnd = scrollElement.scrollTop + scrollElement.clientHeight - scrollPaddingEnd;
  const viewportSize = Math.max(
    0,
    scrollElement.clientHeight - scrollPaddingStart - scrollPaddingEnd,
  );
  const rowSize = end - start;
  let scrollTop: number | null = null;
  let resolvedAlignment = align;

  if (align === 'start') {
    scrollTop = start - scrollPaddingStart;
  } else if (align === 'center') {
    scrollTop = start - scrollPaddingStart - (viewportSize - rowSize) / 2;
  } else if (align === 'end') {
    scrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
  } else if (rowSize > viewportSize || start < viewportStart) {
    resolvedAlignment = 'start';
    scrollTop = start - scrollPaddingStart;
  } else if (end > viewportEnd) {
    resolvedAlignment = 'end';
    scrollTop = end - scrollElement.clientHeight + scrollPaddingEnd;
  }

  return { resolvedAlignment, scrollTop };
}

function resolveScrollPadding(scrollElement: HTMLElement, value: string) {
  if (!value || value === 'auto') {
    return 0;
  }

  if (value.endsWith('px')) {
    const pixels = Number.parseFloat(value);
    return Number.isFinite(pixels) ? Math.max(0, pixels) : 0;
  }

  // Computed scroll-padding preserves percentages and calculations. Resolve them through layout
  // against the scrollport's corresponding dimension, as required by CSS Scroll Snap.
  const probe = ownerDocument(scrollElement).createElement('div');
  Object.assign(probe.style, {
    boxSizing: 'border-box',
    height: value,
    pointerEvents: 'none',
    position: 'absolute',
    visibility: 'hidden',
    width: '0px',
  });
  scrollElement.append(probe);
  const pixels = probe.getBoundingClientRect().height;
  probe.remove();

  return Number.isFinite(pixels) ? Math.max(0, pixels) : 0;
}

/**
 * The smallest shift worth correcting. The browser places the scroll position on device pixels,
 * so a correction of at least half of one lands the content on the device pixel nearest to where
 * it was, and anything smaller cannot be corrected at all. A whole CSS pixel would let a shift of
 * two device pixels through on a high-density display, and on screen that is a visible jump.
 */
function getSmallestCorrection(scrollElement: HTMLElement) {
  return 0.5 / (ownerWindow(scrollElement).devicePixelRatio || 1);
}

function getFirstLaidOutRowIndex(rowsParent: HTMLElement) {
  const [first] = getLaidOutRowElements(rowsParent);
  return first == null ? null : Number(first.dataset.rowIndex);
}

/**
 * Returns the topmost row element intersecting the scrollport, with its position relative to the
 * scroller's top edge. The retained focus-proxy row is absolutely positioned out of layout and is
 * never a valid anchor.
 */
function findAnchorRowElement(
  rowsParent: HTMLElement,
  scrollerTop: number,
  scrollerBottom: number,
) {
  for (const child of getLaidOutRowElements(rowsParent)) {
    const rect = child.getBoundingClientRect();
    if (rect.height > 0 && rect.bottom > scrollerTop && rect.top < scrollerBottom) {
      return {
        element: child,
        rowIndex: Number(child.dataset.rowIndex),
        relativeTop: rect.top - scrollerTop,
      };
    }
  }

  return null;
}
