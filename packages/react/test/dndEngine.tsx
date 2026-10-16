/**
 * Render helper for drag-and-drop tests. Register sources, targets, viewports, and
 * monitors through the `engine` that `renderDnd` returns, not the engine's internal
 * functions, so their cleanups are queued for `setupDragEngineTests()`.
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
import type { DropTargetParameters } from '../src/utils/drag-and-drop/dropTarget';

/**
 * The kind {@link DndTestEngine}'s `registerSource` defaults to, so a fixture only
 * declares one when the test is about kind matching. Exported for targets and
 * monitors that must accept it.
 */
export const testDragKind = createKind<any>('base-ui-test/item');

/**
 * {@link RegisterSourceParameters} loosened for fixtures. `kind` is optional and
 * defaults to {@link testDragKind}. `payload` infers `TPayload` on its own, since most
 * fixtures declare only a payload.
 */
type TestDraggableParameters<TPayload, TDragData = unknown> = Omit<
  RegisterSourceParameters<TPayload, TDragData>,
  'kind' | 'payload'
> & {
  kind?: DraggableKind<TPayload, TDragData> | undefined;
  payload?: TPayload | undefined;
};

type TestTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData> = Omit<
  DropTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
  'kind'
> & { kind?: DraggableKind<TTargetPayload, TTargetDragData> };

/** A plain value or a getter for it. {@link asGetter} normalizes it. */
type MaybeGetter<T> = T | (() => T);

/**
 * {@link DraggableManager} as exposed to tests: each `register*` also accepts a plain
 * parameters object instead of a getter.
 */
export interface DndTestEngine {
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
  refresh: DraggableManager['refresh'];
}

interface DndRenderResult extends BaseUIRenderResult {
  /** The drag engine, with cleanups auto-queued for teardown. */
  engine: DndTestEngine;
}

/**
 * The engine's `register*` methods take only getters, read on every event so callbacks
 * never go stale. Tests pass plain objects for brevity without loosening the public API.
 */
function asGetter<T>(parameters: MaybeGetter<T>): () => T {
  return typeof parameters === 'function' ? (parameters as () => T) : () => parameters;
}

/**
 * Queue every registration's cleanup for the `afterEach` of `setupDragEngineTests()`.
 * A cleanup only runs once, so a test can still call it early to assert that the
 * registration is gone.
 */
function withAutoCleanup(engine: DraggableManager): DndTestEngine {
  return {
    registerSource: <TPayload = undefined, TDragData = unknown>(
      element: HTMLElement,
      parameters: MaybeGetter<TestDraggableParameters<TPayload, TDragData>>,
    ) => {
      // The public signature requires a `payload` once `TPayload` is explicit, but
      // fixtures often declare the type without one. The internal signature doesn't.
      const registerSourceInternal = engine.registerSource as InternalDragEngine['registerSource'];
      const getParameters = asGetter(parameters);
      return registerCleanup(
        registerSourceInternal<TPayload, TDragData>(element, () => {
          const declared = getParameters();
          // `testDragKind` declares no drag data, so it can't satisfy an open `TDragData`.
          return {
            ...declared,
            kind: declared.kind ?? testDragKind,
          } as RegisterSourceParameters<TPayload, TDragData>;
        }),
      );
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
      // Internal signature for the same reason as `registerSource`.
      const registerTargetInternal = engine.registerTarget as InternalDragEngine['registerTarget'];
      const getParameters = asGetter(parameters);
      return registerCleanup(
        registerTargetInternal<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>(
          element,
          () => {
            const declared = getParameters();
            // Default `accept` so fixtures don't trip the missing-`accept` warning. Not
            // when `kind` is declared: the kind-without-accept warning has its own test.
            return declared.accept === undefined && declared.kind === undefined
              ? {
                  ...declared,
                  accept: anyDragKind as DraggableAccept<TSourcePayload, TSourceDragData>,
                }
              : declared;
          },
        ),
      );
    },
    registerViewport: <TSourcePayload = unknown, TSourceDragData = unknown>(
      element: HTMLElement,
      parameters: MaybeGetter<RegisterViewportParameters<TSourcePayload, TSourceDragData>>,
    ) => {
      // The public signature infers the payload from `accept`. Fixtures declare it
      // explicitly, so register through the payload-typed signature.
      const registerViewportInternal = engine.registerViewport as (
        element: HTMLElement,
        getParameters: () => RegisterViewportParameters<TSourcePayload, TSourceDragData>,
      ) => () => void;
      return registerCleanup(registerViewportInternal(element, asGetter(parameters)));
    },
    registerMonitor: <TSourcePayload = unknown, TSourceDragData = unknown>(
      parameters: MaybeGetter<RegisterMonitorParameters<TSourcePayload, TSourceDragData>>,
    ) => {
      // Same reason as `registerViewport`.
      const registerMonitorInternal = engine.registerMonitor as (
        getParameters: () => RegisterMonitorParameters<TSourcePayload, TSourceDragData>,
      ) => () => void;
      return registerCleanup(registerMonitorInternal(asGetter(parameters)));
    },
    // Nothing to queue, since they register nothing.
    cancelDrag: engine.cancelDrag,
    refresh: engine.refresh,
  };
}

function NoUi(): null {
  return null;
}

export interface DndTestRenderer extends ReturnType<typeof createRenderer> {
  /**
   * Render `ui` inside a `Draggable.Provider` and return the render result plus the
   * `engine`. Omit `ui` for engine-level tests. `options.wrapper` goes outside the
   * provider. To test the missing-provider error, use `render` instead.
   */
  renderDnd: (ui?: React.ReactElement, options?: RenderOptions) => Promise<DndRenderResult>;
}

/**
 * Like `createRenderer()`, plus `renderDnd`. Call once per `describe`, in a file that
 * calls `setupDragEngineTests()`.
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
