/**
 * Render helper for driving drag-and-drop through the React engine.
 *
 * `createDndRenderer()` wraps the usual `createRenderer()` and adds `renderDnd`,
 * which renders the tree inside a `Draggable.Provider`, captures the drag engine,
 * and returns it alongside everything `render` returns. Tests register their
 * fixtures, such as drag sources, drop targets, monitors, and auto-scrollers,
 * through the returned `engine` instead of the engine's internal functions.
 * Their cleanups are queued automatically and run by `setupDragEngineTests()`.
 */
import * as React from 'react';
import type { CreateRendererOptions, RenderOptions } from '@mui/internal-test-utils';
import { createRenderer } from './createRenderer';
import type { BaseUIRenderResult } from './createRenderer';
import { registerCleanup } from './dnd';
import { anyDragKind, createKind } from '../src/utils/drag-and-drop/dragKind';
import { DraggableProvider } from '../src/draggable/DraggableProvider';
import { useManager } from '../src/draggable/use-manager/useManager';
import type { DraggableAccept, DraggableKind } from '../src/draggable/DraggableProvider';
import type {
  DraggableManager,
  InternalDragEngine,
  RegisterSourceParameters,
  RegisterViewportParameters,
  RegisterMonitorParameters,
} from '../src/utils/drag-and-drop/registrationTypes';
import type { RegisterTargetParameters } from '../src/utils/drag-and-drop/dropTarget';

/**
 * The kind {@link DndTestEngine}'s `registerSource` defaults to, so a fixture only
 * declares one when the test is about kind matching. Exported for the targets and
 * monitors that have to accept it.
 */
export const testDragKind = createKind<any>('base-ui-test/item');

/**
 * {@link RegisterSourceParameters} loosened for fixtures. `kind` is optional and
 * defaults to {@link testDragKind}. `payload` still infers the payload type, which the
 * public type ties to the kind, because most fixtures declare only a payload.
 */
type TestDraggableParameters<TPayload, TDragData = unknown> = Omit<
  RegisterSourceParameters<TPayload, TDragData>,
  'kind' | 'payload'
> & {
  kind?: DraggableKind<TPayload, TDragData> | undefined;
  payload?: TPayload | undefined;
};

type TestTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData> = Omit<
  RegisterTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
  'kind'
> & { kind?: DraggableKind<TTargetPayload, TTargetDragData> };

/** A plain value or a getter for it. Test-only, {@link asGetter} turns it into a getter. */
type MaybeGetter<T> = T | (() => T);

/**
 * The drag engine as exposed to tests. It matches the public getter-only
 * {@link DraggableManager}, except each `register*` also accepts a plain
 * parameters object, which {@link asGetter} wraps in a getter. Production code
 * never sees this looser shape.
 */
interface DndTestEngine {
  registerSource: <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    parameters: MaybeGetter<TestDraggableParameters<TPayload, TDragData>>,
  ) => () => void;
  registerTarget: <
    TSourcePayload = unknown,
    TTargetPayload = undefined,
    TSourceDragData = unknown,
    TTargetDragData = unknown,
  >(
    element: HTMLElement,
    parameters: MaybeGetter<
      TestTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>
    >,
  ) => () => void;
  registerViewport: <TSourcePayload = unknown, TSourceDragData = unknown>(
    element: HTMLElement,
    parameters: MaybeGetter<RegisterViewportParameters<TSourcePayload, TSourceDragData>>,
  ) => () => void;
  registerMonitor: <TSourcePayload = unknown, TSourceDragData = unknown>(
    parameters: MaybeGetter<RegisterMonitorParameters<TSourcePayload, TSourceDragData>>,
  ) => () => void;
  cancelDrag: DraggableManager['cancelDrag'];
}

interface DndRenderResult extends BaseUIRenderResult {
  /** The drag engine, with cleanups auto-queued for teardown. */
  engine: DndTestEngine;
}

/**
 * Turn a value-or-getter parameter into a getter. The engine's registration methods
 * take only getters, which they read on every event, so a plain snapshot would keep
 * stale closures. The real hooks always build that getter. Tests pass plain objects
 * for brevity, and this wrapper adds the getter the hooks would build, without
 * loosening the public API.
 */
function asGetter<T>(parameters: MaybeGetter<T>): () => T {
  return typeof parameters === 'function' ? (parameters as () => T) : () => parameters;
}

/**
 * Wrap an engine so every registration's cleanup is queued with `registerCleanup`
 * and runs in the `afterEach` of `setupDragEngineTests()`. A cleanup only runs
 * once, so a test can still call the returned cleanup early to assert that the
 * registration is gone.
 */
function withAutoCleanup(engine: DraggableManager): DndTestEngine {
  return {
    registerSource: <TPayload = undefined, TDragData = unknown>(
      element: HTMLElement,
      parameters: MaybeGetter<TestDraggableParameters<TPayload, TDragData>>,
    ) => {
      // The public `registerSource` requires a `payload` when `TPayload` is
      // explicit. Fixtures often declare `TPayload` without a payload because they
      // test something else, so use the engine's internal signature, where the
      // payload is optional.
      const registerSourceInternal = engine.registerSource as InternalDragEngine['registerSource'];
      const getParameters = asGetter(parameters);
      // `kind` is required on a real draggable. Default it so only the fixtures that
      // test kind matching have to declare one.
      const cleanup = registerSourceInternal<TPayload, TDragData>(element, () => {
        const declared = getParameters();
        // `testDragKind` declares no drag data, so it can't satisfy an open
        // `TDragData`. Cast the parameter shape here.
        return {
          ...declared,
          kind: declared.kind ?? testDragKind,
        } as RegisterSourceParameters<TPayload, TDragData>;
      });
      registerCleanup(cleanup);
      return cleanup;
    },
    registerTarget: <
      TSourcePayload = unknown,
      TTargetPayload = undefined,
      TSourceDragData = unknown,
      TTargetDragData = unknown,
    >(
      element: HTMLElement,
      parameters: MaybeGetter<
        TestTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>
      >,
    ) => {
      // Same as `registerSource` above. The public signature requires a `payload`
      // once `TTargetPayload` is declared, but fixtures often declare the type
      // without a payload.
      const registerTargetInternal = engine.registerTarget as InternalDragEngine['registerTarget'];
      const getParameters = asGetter(parameters);
      const cleanup = registerTargetInternal<
        TSourcePayload,
        TTargetPayload,
        TSourceDragData,
        TTargetDragData
      >(element, () => {
        const declared = getParameters();
        // Fixtures omit `accept` for brevity, so default it to `anyDragKind` and
        // keep the missing-`accept` dev warning for consumer code. Skip this when
        // `kind` is declared, because the kind-without-accept warning has its own
        // test and must still fire.
        return declared.accept === undefined && declared.kind === undefined
          ? { ...declared, accept: anyDragKind as DraggableAccept<TSourcePayload, TSourceDragData> }
          : declared;
      });
      registerCleanup(cleanup);
      return cleanup;
    },
    registerViewport: <TSourcePayload = unknown, TSourceDragData = unknown>(
      element: HTMLElement,
      parameters: MaybeGetter<RegisterViewportParameters<TSourcePayload, TSourceDragData>>,
    ) => {
      // The public signature infers the payload from `accept`. Fixtures declare
      // it and pass their kinds, so register through the payload-typed signature.
      const registerViewportInternal = engine.registerViewport as (
        element: HTMLElement,
        getParameters: () => RegisterViewportParameters<TSourcePayload, TSourceDragData>,
      ) => () => void;
      const cleanup = registerViewportInternal(element, asGetter(parameters));
      registerCleanup(cleanup);
      return cleanup;
    },
    registerMonitor: <TSourcePayload = unknown, TSourceDragData = unknown>(
      parameters: MaybeGetter<RegisterMonitorParameters<TSourcePayload, TSourceDragData>>,
    ) => {
      // The public signature infers the observed payload from `accept`. Fixtures
      // declare it and pass their kinds, so register through the payload-typed signature.
      const registerMonitorInternal = engine.registerMonitor as (
        getParameters: () => RegisterMonitorParameters<TSourcePayload, TSourceDragData>,
      ) => () => void;
      const cleanup = registerMonitorInternal(asGetter(parameters));
      registerCleanup(cleanup);
      return cleanup;
    },
    // Nothing to queue, since it registers nothing.
    cancelDrag: engine.cancelDrag,
  };
}

/** Placeholder element for `renderDnd()` with no UI (engine-level tests). */
function NoUi(): null {
  return null;
}

interface DndTestRenderer extends ReturnType<typeof createRenderer> {
  /**
   * Render `ui` inside a `Draggable.Provider` and return the render result plus
   * the `engine`. Call it with no element to mount only the provider, for
   * engine-level tests. An `options.wrapper` wraps outside the `Draggable.Provider`.
   *
   * The provider is required for drag components and hooks. Tests asserting a
   * missing-provider error should render directly instead.
   */
  renderDnd: (ui?: React.ReactElement, options?: RenderOptions) => Promise<DndRenderResult>;
}

/**
 * Like `createRenderer()`, plus a `renderDnd` that mounts a `Draggable.Provider` and
 * exposes the drag engine. Call once per `describe`, in a file that calls
 * `setupDragEngineTests()`, which installs the drag test environment.
 */
export function createDndRenderer(globalOptions?: CreateRendererOptions): DndTestRenderer {
  const renderer = createRenderer(globalOptions);

  async function renderDnd(
    ui?: React.ReactElement,
    options?: RenderOptions,
  ): Promise<DndRenderResult> {
    let captured: DraggableManager | null = null;

    function Capture(): null {
      captured = useManager();
      return null;
    }

    const Outer = options?.wrapper ?? React.Fragment;

    function Wrapper({ children }: { children?: React.ReactNode }): React.ReactElement {
      return (
        <Outer>
          <DraggableProvider>
            <Capture />
            {children}
          </DraggableProvider>
        </Outer>
      );
    }

    const result = await renderer.render(ui ?? <NoUi />, { ...options, wrapper: Wrapper });

    if (!captured) {
      throw new Error('renderDnd: DraggableProvider did not mount; engine was not captured.');
    }

    return { ...result, engine: withAutoCleanup(captured) };
  }

  return { ...renderer, renderDnd };
}
