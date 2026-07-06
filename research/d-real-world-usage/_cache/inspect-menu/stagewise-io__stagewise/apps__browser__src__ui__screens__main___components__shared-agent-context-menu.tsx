import { Menu as MenuBase } from '@base-ui/react/menu';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@stagewise/stage-ui/lib/utils';
import { useKartonProcedure, useKartonState } from '@ui/hooks/use-karton';
import { IconTrash2Outline24 } from 'nucleo-core-outline-24';
import {
  IconCopyIdOutline18,
  IconFolderOpenOutline18,
  IconPen2Outline18,
  IconPinTackOutline18,
  IconPinTackSlashOutline18,
} from 'nucleo-ui-outline-18';
import { useFloatingIsolation } from './use-floating-isolation';

/**
 * Shared right-click context menu for agent cards and list rows.
 *
 * A SINGLE `<SharedAgentContextMenuHost>` is mounted per list (grid or
 * history). Rows attach a cheap `onContextMenu` handler via
 * `buildAgentContextMenuHandler(...)` that opens this one host at the
 * cursor position. This avoids allocating a base-ui `Menu.Root` per row
 * — critical for the history list which can contain hundreds of rows.
 */

export interface AgentContextMenuTarget {
  agentId: string;
  /** Viewport coords of the right-click — used as virtual menu anchor. */
  x: number;
  y: number;
  /** Shift-key state at trigger time — reveals dev-only actions. */
  showDev: boolean;
  /**
   * Enter inline rename mode. The row owns its own edit state, so it
   * supplies this closure at right-click time; the host just invokes it
   * when the user picks "Rename".
   */
  rename: () => void;
  isPinned?: boolean;
  togglePinned?: (id: string) => void;
  canDelete?: boolean;
}

export interface SharedAgentContextMenuState {
  open: (target: AgentContextMenuTarget) => void;
}

/**
 * Create a shared menu controller. Use in the list parent:
 *
 * ```tsx
 * const [state, target, setTarget] = useSharedAgentContextMenu();
 * // ... pass `state` to rows, mount <SharedAgentContextMenuHost target={target} onClose={() => setTarget(null)} ... />
 * ```
 */
export function useSharedAgentContextMenu(): [
  SharedAgentContextMenuState,
  AgentContextMenuTarget | null,
  (target: AgentContextMenuTarget | null) => void,
] {
  const [target, setTarget] = useState<AgentContextMenuTarget | null>(null);
  const state = useMemo<SharedAgentContextMenuState>(
    () => ({ open: setTarget }),
    [],
  );
  return [state, target, setTarget];
}

/**
 * Row-side helper. Attach as
 * `onContextMenu={buildAgentContextMenuHandler(state, id, startEditing)}`.
 */
export function buildAgentContextMenuHandler(
  state: SharedAgentContextMenuState,
  agentId: string,
  rename: () => void,
  isPinned?: boolean,
  togglePinned?: (id: string) => void,
  canDelete?: boolean,
): (e: React.MouseEvent) => void {
  return (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.open({
      agentId,
      x: e.clientX,
      y: e.clientY,
      showDev: e.shiftKey,
      rename,
      isPinned,
      togglePinned,
      canDelete,
    });
  };
}

export interface SharedAgentContextMenuHostProps {
  target: AgentContextMenuTarget | null;
  onClose: () => void;
  /** User picked "Permanently delete" — caller is expected to show a confirm dialog.
   * Cursor coordinates are forwarded so the confirm popover can anchor
   * right above the click position. */
  onDeleteRequest: (id: string, x: number, y: number) => void;
}

export const SharedAgentContextMenuHost = memo(
  function SharedAgentContextMenuHost({
    target,
    onClose,
    onDeleteRequest,
  }: SharedAgentContextMenuHostProps) {
    const revealWorkingDirectory = useKartonProcedure(
      (p) => p.agents.revealWorkingDirectory,
    );

    // Keep the menu clear of the macOS traffic-light overlay (hidden
    // titlebar). Matches the `h-8` (32px) titlebar placeholder plus a
    // small visual margin; same padding used by DeleteConfirmPopover.
    const isMacOs = useKartonState((s) => s.appInfo.platform === 'darwin');
    const isFullScreen = useKartonState((s) => s.appInfo.isFullScreen);
    const collisionPadding = useMemo(
      () => (isMacOs && !isFullScreen ? { top: 40 } : undefined),
      [isMacOs, isFullScreen],
    );

    const popupRef = useRef<HTMLDivElement>(null);
    const open = target !== null;
    useFloatingIsolation(popupRef, open);

    // Preserve the last target while base-ui runs its exit animation so
    // the popup content keeps rendering with stable props until the close
    // transition settles. Unmounting abruptly while `MenuBase.Root`'s
    // `open` flips to `false` causes its internal positioner store to
    // receive ref cleanup callbacks mid-teardown, producing a runaway
    // `forceStoreRerender` loop (see stack: forkRef.cleanup → _Store.set).
    const lastTargetRef = useRef<AgentContextMenuTarget | null>(null);
    if (target) lastTargetRef.current = target;
    const activeTarget = target ?? lastTargetRef.current;

    // Release the retained target shortly after the close animation
    // finishes so stale closures (e.g. `rename` from an archived row) do
    // not linger longer than necessary.
    useEffect(() => {
      if (open) return;
      const t = setTimeout(() => {
        lastTargetRef.current = null;
      }, 300);
      return () => clearTimeout(t);
    }, [open]);

    // Virtual anchor: base-ui only needs `getBoundingClientRect()`.
    // Keyed on the coords only — the anchor is stable for a given open
    // position, even across the exit animation frame where `target`
    // transiently becomes null.
    const anchorX = activeTarget?.x ?? 0;
    const anchorY = activeTarget?.y ?? 0;
    const anchor = useMemo(
      () => ({
        getBoundingClientRect: () =>
          DOMRect.fromRect({ x: anchorX, y: anchorY, width: 0, height: 0 }),
      }),
      [anchorX, anchorY],
    );

    const handleOpenChange = useCallback(
      (next: boolean) => {
        if (!next) onClose();
      },
      [onClose],
    );

    if (!activeTarget) return null;
    const { agentId, showDev, rename, isPinned, togglePinned, canDelete } =
      activeTarget;

    return (
      <MenuBase.Root open={open} onOpenChange={handleOpenChange}>
        <MenuBase.Portal>
          <MenuBase.Positioner
            anchor={anchor}
            align="start"
            side="bottom"
            sideOffset={4}
            collisionPadding={collisionPadding}
            className="z-50"
          >
            <MenuBase.Popup
              ref={popupRef}
              className={cn(
                'flex origin-(--transform-origin) flex-col items-stretch gap-0.5',
                'rounded-lg border border-border-subtle bg-background p-1',
                'text-xs shadow-lg',
                'transition-[transform,scale,opacity] duration-150 ease-out',
                'data-ending-style:scale-90 data-starting-style:scale-90',
                'data-ending-style:opacity-0 data-starting-style:opacity-0',
              )}
            >
              <AgentMenuItem
                onClick={() => {
                  onClose();
                  rename();
                }}
              >
                <IconPen2Outline18 className="size-3.5 shrink-0" />
                <span>Rename</span>
              </AgentMenuItem>
              {togglePinned && (
                <AgentMenuItem
                  onClick={() => {
                    togglePinned(agentId);
                    onClose();
                  }}
                >
                  {isPinned ? (
                    <IconPinTackSlashOutline18 className="size-3.5 shrink-0" />
                  ) : (
                    <IconPinTackOutline18 className="size-3.5 shrink-0" />
                  )}
                  <span>{isPinned ? 'Unpin' : 'Pin globally'}</span>
                </AgentMenuItem>
              )}
              {canDelete !== false && (
                <AgentMenuItem
                  onClick={() => {
                    onDeleteRequest(agentId, anchorX, anchorY);
                    onClose();
                  }}
                >
                  <IconTrash2Outline24 className="size-3.5 shrink-0" />
                  <span>Permanently delete</span>
                </AgentMenuItem>
              )}
              {showDev && (
                <>
                  <div className="my-0.5 h-px w-full bg-border-subtle" />
                  <AgentMenuItem
                    onClick={() => {
                      void navigator.clipboard.writeText(agentId);
                      onClose();
                    }}
                  >
                    <IconCopyIdOutline18 className="size-3.5 shrink-0" />
                    <span>Copy instance ID</span>
                  </AgentMenuItem>
                  <AgentMenuItem
                    onClick={() => {
                      void revealWorkingDirectory(agentId);
                      onClose();
                    }}
                  >
                    <IconFolderOpenOutline18 className="size-3.5 shrink-0" />
                    <span>Open data directory</span>
                  </AgentMenuItem>
                </>
              )}
            </MenuBase.Popup>
          </MenuBase.Positioner>
        </MenuBase.Portal>
      </MenuBase.Root>
    );
  },
);

/** Compact menu item — matches the styling of the file right-click menu. */
function AgentMenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <MenuBase.Item
      onClick={onClick}
      className={cn(
        'flex w-full cursor-default flex-row items-center justify-start gap-2',
        'rounded-md px-2 py-1 text-foreground text-xs outline-none',
        'transition-colors duration-150 ease-out',
        'hover:bg-surface-1 data-highlighted:bg-surface-1',
      )}
    >
      {children}
    </MenuBase.Item>
  );
}
