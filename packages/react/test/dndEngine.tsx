/**
 * Render helper for driving drag-and-drop through the React engine.
 *
 * `createDndRenderer()` wraps the usual `createRenderer()` and adds `renderDnd`,
 * which renders the tree inside a `Draggable.PreviewProvider`, captures the drag engine,
 * and returns it alongside everything `render` returns. Tests register
 * their fixtures (drag sources, drop targets, monitors, auto-scrollers) through
 * the returned `engine` rather than the engine's internal functions — the
 * cleanups are queued automatically and drained by `setupDragEngineTests()`.
 */
import * as React from 'react';
import type { CreateRendererOptions, RenderOptions } from '@mui/internal-test-utils';
import { createRenderer, type BaseUIRenderResult } from './createRenderer';
import { installDndTestEnv, registerCleanup } from './dnd';
import { anyDragKind, createKind } from '../src/utils/drag-and-drop/dragKind';
import { DraggablePreviewProvider } from '../src/draggable/preview-provider/DraggablePreviewProvider';
import { useDragEngine } from '../src/use-drag-engine';
import type { DragAccept, DragKind, DragStartContext } from '../src/types/drag';
import type {
  DragEngine,
  RegisterDraggableParameters,
  RegisterAutoScrollerParameters,
  RegisterMonitorParameters,
} from '../src/types/dragRegistration';
import type { RegisterDropTargetParameters } from '../src/utils/drag-and-drop/dropTarget';

/**
 * The kind {@link DndTestEngine}'s `registerDraggable` defaults to, so a fixture only
 * declares one when the test is about kind matching. Exported for the targets and
 * monitors that have to accept it.
 */
export const testDragKind = createKind<any>('base-ui-test/item');

/**
 * {@link RegisterDraggableParameters} loosened for fixtures: `kind` is optional and
 * defaults to {@link testDragKind}, and `payload` still infers the payload type — the
 * public type pins that to the kind, but most fixtures declare only a payload.
 */
type TestDraggableParameters<TData> = Omit<
  RegisterDraggableParameters<TData>,
  'kind' | 'payload' | 'getPayload'
> & {
  kind?: DragKind<TData> | undefined;
  payload?: TData | undefined;
  getPayload?: ((context: DragStartContext) => TData) | undefined;
};

/** A plain value or a getter for it — a test-only convenience (see {@link asGetter}). */
type MaybeGetter<T> = T | (() => T);

type InternalRegisterDraggable = <TData = undefined>(
  element: HTMLElement,
  getParameters: () => RegisterDraggableParameters<TData>,
) => () => void;

type InternalRegisterDropTarget = <TSourceData = unknown, TLocalData = unknown>(
  element: HTMLElement,
  getParameters: () => RegisterDropTargetParameters<TSourceData, TLocalData>,
) => () => void;

/**
 * The drag engine as exposed to tests: identical to the public
 * getter-only {@link DragEngine}, but each `register*` also accepts a plain
 * parameters object (wrapped into a getter by {@link asGetter}) so fixtures stay
 * terse. Production code never sees this loosened shape.
 */
export interface DndTestEngine {
  registerDraggable: <TData = undefined>(
    element: HTMLElement,
    parameters: MaybeGetter<TestDraggableParameters<TData>>,
  ) => ReturnType<DragEngine['registerDraggable']>;
  registerDropTarget: <TSourceData = unknown, TLocalData = unknown>(
    element: HTMLElement,
    parameters: MaybeGetter<RegisterDropTargetParameters<TSourceData, TLocalData>>,
  ) => ReturnType<DragEngine['registerDropTarget']>;
  registerAutoScroller: <TSourceData = unknown>(
    element: HTMLElement,
    parameters: MaybeGetter<RegisterAutoScrollerParameters<TSourceData>>,
  ) => ReturnType<DragEngine['registerAutoScroller']>;
  registerMonitor: <TSourceData = unknown>(
    parameters: MaybeGetter<RegisterMonitorParameters<TSourceData>>,
  ) => ReturnType<DragEngine['registerMonitor']>;
  cancelDrag: DragEngine['cancelDrag'];
  startKeyboardDrag: DragEngine['startKeyboardDrag'];
}

export interface DndRenderResult extends BaseUIRenderResult {
  /** The drag engine, with cleanups auto-queued for teardown. */
  engine: DndTestEngine;
}

/**
 * Normalize a value-or-getter parameter to a getter. The engine's registration methods are
 * getter-only (registration reads the getter on every event, so a plain snapshot
 * would freeze stale closures); the real hooks always build that getter. Tests
 * pass plain objects for brevity, so this wrapper adds them back the getter the
 * hooks would have, keeping the fixtures terse without loosening the public API.
 */
function asGetter<T>(parameters: MaybeGetter<T>): () => T {
  return typeof parameters === 'function' ? (parameters as () => T) : () => parameters;
}

/**
 * Wrap an engine so every registration's cleanup is queued via `registerCleanup`
 * and torn down in `setupDragEngineTests()`'s `afterEach`. Cleanups stay
 * idempotent (the engine latches on first run), so a test may still call the
 * returned cleanup early to assert deregistration.
 */
function withAutoCleanup(engine: DragEngine): DndTestEngine {
  return {
    registerDraggable: <TData = undefined,>(
      element: HTMLElement,
      parameters: MaybeGetter<TestDraggableParameters<TData>>,
    ) => {
      // The public `registerDraggable` is overloaded so an explicit `TData`
      // requires a `payload`. Fixtures declare `TData` and omit the payload all
      // the time (they assert on other things), so register through the engine's
      // internal, payload-optional signature instead.
      const registerDraggableInternal = engine.registerDraggable as InternalRegisterDraggable;
      const getParameters = asGetter(parameters);
      // `kind` is required on a real draggable; default it so only the fixtures that
      // exercise kind matching have to declare one.
      const cleanup = registerDraggableInternal<TData>(element, () => {
        const declared = getParameters();
        // The test-local payload union stays inference-friendly; the public alias
        // adds a callable-value guard an unresolved `TData` can't satisfy
        // structurally, so re-assert the parameter shape at the boundary.
        return {
          ...declared,
          kind: declared.kind ?? testDragKind,
        } as ReturnType<Parameters<typeof registerDraggableInternal<TData>>[1]>;
      });
      registerCleanup(cleanup);
      return cleanup;
    },
    registerDropTarget: <TSourceData = unknown, TLocalData = unknown>(
      element: HTMLElement,
      parameters: MaybeGetter<RegisterDropTargetParameters<TSourceData, TLocalData>>,
    ) => {
      // Same as `registerDraggable` above: the public signature is overloaded so
      // an explicit `TLocalData` requires a `payload`, but fixtures declare the
      // type and omit the payload all the time.
      const registerDropTargetInternal = engine.registerDropTarget as InternalRegisterDropTarget;
      const getParameters = asGetter(parameters);
      const cleanup = registerDropTargetInternal<TSourceData, TLocalData>(element, () => {
        const declared = getParameters();
        // Fixtures omit `accept` for brevity; opt them into take-everything
        // explicitly so the accept-less dev warning stays reserved for consumer
        // code. Left alone when `kind` is declared: the kind-without-accept
        // warning has its own test and must keep firing.
        return declared.accept === undefined && declared.kind === undefined
          ? { ...declared, accept: anyDragKind as DragAccept<TSourceData> }
          : declared;
      });
      registerCleanup(cleanup);
      return cleanup;
    },
    registerAutoScroller: <TSourceData = unknown,>(
      element: HTMLElement,
      parameters: MaybeGetter<RegisterAutoScrollerParameters<TSourceData>>,
    ) => {
      // The public signature infers the payload from `accept`; fixtures declare
      // it and pass their kinds, so register through the payload-keyed shape.
      const registerAutoScrollerInternal = engine.registerAutoScroller as (
        element: HTMLElement,
        getParameters: () => RegisterAutoScrollerParameters<TSourceData>,
      ) => ReturnType<DragEngine['registerAutoScroller']>;
      const cleanup = registerAutoScrollerInternal(element, asGetter(parameters));
      registerCleanup(cleanup);
      return cleanup;
    },
    registerMonitor: <TSourceData = unknown,>(
      parameters: MaybeGetter<RegisterMonitorParameters<TSourceData>>,
    ) => {
      // The public signature infers the observed payload from `accept`; fixtures
      // declare it and pass their kinds, so register through the payload-keyed shape.
      const registerMonitorInternal = engine.registerMonitor as (
        getParameters: () => RegisterMonitorParameters<TSourceData>,
      ) => ReturnType<DragEngine['registerMonitor']>;
      const cleanup = registerMonitorInternal(asGetter(parameters));
      registerCleanup(cleanup);
      return cleanup;
    },
    // Nothing to queue: they register nothing.
    cancelDrag: engine.cancelDrag,
    startKeyboardDrag: engine.startKeyboardDrag,
  };
}

/** Placeholder element for `renderDnd()` with no UI (engine-level tests). */
function NoUi(): null {
  return null;
}

export interface DndTestRenderer extends ReturnType<typeof createRenderer> {
  /**
   * Render `ui` inside a `Draggable.PreviewProvider` and return the render result
   * plus the `engine` itself. Call with no element to mount just
   * the provider (for engine-level tests that need nothing rendered). An
   * `options.wrapper`, if given, wraps *outside* the `Draggable.PreviewProvider` —
   * e.g. a `LocalizationProvider` so the drag engine reads its translations.
   *
   * The provider is required for any preview with content, so it is the default
   * here. A test that needs a draggable *without* one — to assert the throw, or
   * that a clone needs no provider — should render directly instead.
   */
  renderDnd: (ui?: React.ReactElement, options?: RenderOptions) => Promise<DndRenderResult>;
}

/**
 * Like `createRenderer()`, plus a `renderDnd` that mounts a `Draggable.PreviewProvider` and
 * exposes the engine's drag engine. Call once per `describe`.
 */
export function createDndRenderer(globalOptions?: CreateRendererOptions): DndTestRenderer {
  installDndTestEnv();
  const renderer = createRenderer(globalOptions);

  async function renderDnd(
    ui?: React.ReactElement,
    options?: RenderOptions,
  ): Promise<DndRenderResult> {
    let captured: DragEngine | null = null;

    function Capture(): null {
      captured = useDragEngine();
      return null;
    }

    const Outer = options?.wrapper ?? React.Fragment;

    function Wrapper({ children }: { children?: React.ReactNode }): React.ReactElement {
      return (
        <Outer>
          <DraggablePreviewProvider>
            <Capture />
            {children}
          </DraggablePreviewProvider>
        </Outer>
      );
    }

    const result = await renderer.render(ui ?? <NoUi />, { ...options, wrapper: Wrapper });

    if (!captured) {
      throw new Error(
        'renderDnd: DraggablePreviewProvider did not mount; engine was not captured.',
      );
    }

    return { ...result, engine: withAutoCleanup(captured) };
  }

  return { ...renderer, renderDnd };
}
