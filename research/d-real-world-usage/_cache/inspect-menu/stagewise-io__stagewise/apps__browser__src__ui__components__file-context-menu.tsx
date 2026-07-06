import type { ReactNode } from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu as MenuBase } from '@base-ui/react/menu';
import { cn } from '@stagewise/stage-ui/lib/utils';
import { nativeFileManagerLabel } from '@shared/ide-url';
import { IconArrowUpRightOutline18 } from 'nucleo-ui-outline-18';

const itemClassName = cn(
  'flex w-full cursor-default flex-row items-center justify-start gap-2',
  'rounded-md px-2 py-1 text-foreground text-xs outline-none',
  'transition-colors duration-150 ease-out',
  'hover:bg-surface-1 data-highlighted:bg-surface-1',
);

export function FileContextMenu({
  relativePath,
  resolvePath,
  onOpenFile,
  children,
}: {
  relativePath: string;
  resolvePath?: (path: string) => string | null;
  onOpenFile?: () => void;
  children: ReactNode;
}) {
  const openInFileManager = () => {
    if (!resolvePath) return;
    const abs = resolvePath(relativePath);
    if (!abs) return;
    window.open(`stagewise://reveal-file/${encodeURIComponent(abs)}`, '_blank');
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={<span />} className="contents">
        {children}
      </ContextMenu.Trigger>
      <MenuBase.Portal>
        <MenuBase.Positioner
          className="z-50"
          sideOffset={4}
          align="start"
          side="bottom"
        >
          <MenuBase.Popup
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'flex origin-(--transform-origin) flex-col items-stretch gap-0.5',
              'rounded-lg border border-border-subtle bg-background p-1',
              'text-xs shadow-lg',
              'transition-[transform,scale,opacity] duration-150 ease-out',
              'data-ending-style:scale-90 data-starting-style:scale-90',
              'data-ending-style:opacity-0 data-starting-style:opacity-0',
            )}
          >
            {onOpenFile && (
              <MenuBase.Item className={itemClassName} onClick={onOpenFile}>
                <IconArrowUpRightOutline18 className="size-3.5 shrink-0" />
                <span>Open in file view</span>
              </MenuBase.Item>
            )}
            {resolvePath && (
              <MenuBase.Item
                className={itemClassName}
                onClick={openInFileManager}
              >
                <IconArrowUpRightOutline18 className="size-3.5 shrink-0" />
                <span>Reveal in {nativeFileManagerLabel}</span>
              </MenuBase.Item>
            )}
          </MenuBase.Popup>
        </MenuBase.Positioner>
      </MenuBase.Portal>
    </ContextMenu.Root>
  );
}
