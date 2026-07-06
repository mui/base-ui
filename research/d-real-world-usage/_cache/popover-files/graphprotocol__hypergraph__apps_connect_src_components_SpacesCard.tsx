import { Checkbox } from '@base-ui-components/react/checkbox';
import { Popover } from '@base-ui-components/react/popover';
import { CheckIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Fragment, useState } from 'react';
import { Loading } from '@/components/ui/Loading';
import type { PrivateSpaceData } from '@/hooks/use-private-spaces';
import type { PublicSpaceData } from '@/hooks/use-public-spaces';
import { cn } from '@/lib/utils';

interface SpacesCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  spaces: (PublicSpaceData | PrivateSpaceData)[];
  status?: 'loading' | { error: boolean | string } | undefined;
  selected?: Set<string> | undefined;
  onSelectedChange?: ((spaceId: string, selected: boolean) => void) | undefined;
  currentAppId?: string | undefined;
}

export function SpacesCard({
  spaces,
  status,
  selected,
  onSelectedChange,
  currentAppId,
  className,
  ...props
}: SpacesCardProps) {
  const error =
    typeof status === 'object' && 'error' in status
      ? typeof status.error === 'boolean'
        ? status.error
        : status.error || true
      : false;
  return (
    <div
      className={cn(
        `group/card c-card scroll-y scrollbar-none has-data-error:bg-error-dark
        has-data-error:text-error-light
        isolate flex flex-col`,
        className,
      )}
      {...props}
    >
      <h2
        className={`
          c-card-title group-has-data-error/card:text-error-light sticky top-(--offset) z-10 shrink-0
          bg-[color-mix(in_oklab,var(--color-foreground)_calc(var(--progress)*0.25),transparent)]
          text-[color-mix(in_oklab,var(--color-background)_var(--progress),var(--color-foreground-muted))]
          backdrop-blur-sm
          [--progress:min(var(--scroll-y)/50*100%,100%)]
        `}
      >
        Spaces
      </h2>
      <div className="grid shrink-0 grow items-start">
        {(() => {
          if (status === 'loading') {
            return <Loading className="place-self-center" />;
          }
          if (error) {
            return (
              <p data-error className="place-self-center font-semibold">
                An error has occurred loading spaces{typeof error === 'string' ? `: ${error}` : ''}
              </p>
            );
          }
          if (spaces.length === 0) {
            return (
              <p data-empty className="text-foreground-muted place-self-center">
                No spaces found
              </p>
            );
          }
          return (
            <ul className="grid-cols-auto-fill-36 grid gap-4">
              {spaces.map((space) => {
                const isPublicSpace = !('apps' in space);
                const wasAlreadySelected = !isPublicSpace && space.apps.some((app) => app.id === currentAppId);
                const isSelected = isPublicSpace ? true : wasAlreadySelected || (selected?.has(space.id) ?? false);
                const isDisabled = isPublicSpace ? true : wasAlreadySelected;

                return (
                  <SpaceTile
                    key={space.id}
                    visibility={isPublicSpace ? 'public' : 'private'}
                    space={space}
                    selected={isSelected}
                    onSelectedChange={
                      onSelectedChange ? (newSelected) => onSelectedChange(space.id, newSelected) : undefined
                    }
                    disabled={isDisabled}
                  />
                );
              })}
            </ul>
          );
        })()}
      </div>
    </div>
  );
}

interface SpaceTileProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'children'> {
  visibility: 'public' | 'private';
  space: PublicSpaceData | PrivateSpaceData;
  selected?: boolean | undefined;
  onSelectedChange?: ((selected: boolean) => void) | undefined;
  disabled?: boolean | undefined;
}

function SpaceTile({
  visibility,
  space,
  selected = false,
  onSelectedChange,
  disabled = false,
  className,
  ...props
}: SpaceTileProps) {
  const mode = onSelectedChange !== undefined ? 'selection' : 'view';
  const Root = mode === 'selection' ? Fragment : Popover.Root;
  const Trigger = mode === 'selection' ? Checkbox.Root : Popover.Trigger;
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <li
      data-mode={mode}
      data-visibility={visibility}
      data-selected={selected || undefined}
      data-disabled={(mode === 'selection' && disabled) || undefined}
      className={cn('group/space', className)}
      {...props}
    >
      <Root
        {...(mode === 'view'
          ? {
              open: popoverOpen,
              onOpenChange: setPopoverOpen,
            }
          : {})}
      >
        <Trigger
          {...(mode === 'selection'
            ? {
                disabled,
                checked: selected,
                onCheckedChange: (checked) => onSelectedChange?.(checked),
              }
            : {})}
          className={`
            group-nth-[5n]/space:bg-gradient-violet
            group-nth-[5n+1]/space:bg-gradient-lavender
            group-nth-[5n+2]/space:bg-gradient-aqua
            group-nth-[5n+4]/space:bg-gradient-clearmint
            group-nth-[5n+3]/space:bg-gradient-peach
            relative flex aspect-video w-full cursor-pointer items-end rounded-lg px-3 py-2
            group-data-disabled/space:cursor-not-allowed
          `}
        >
          <span className="truncate text-sm leading-tight font-semibold whitespace-normal">
            {space.name || space.id}
          </span>
          {mode === 'selection' ? (
            <span
              className={`
                group-data-selected/space:bg-primary
                text-primary-foreground
                absolute top-1 right-1 flex size-5 items-center justify-center rounded-md bg-white/50 opacity-0 transition group-hover/space:opacity-100
                group-data-selected/space:opacity-100
                group-data-selected/space:group-data-disabled/space:bg-gray-800/50
              `}
            >
              <span className="sr-only group-not-data-selected/space:hidden">Selected</span>
              <CheckIcon className="size-3 opacity-0 transition group-data-selected/space:opacity-100" />
            </span>
          ) : null}
          {visibility === 'private' ? (
            <span className="bg-background/50 text-foreground absolute top-1 left-1 flex h-4 items-center gap-1 rounded-md px-1 text-xs leading-none font-semibold">
              <EyeSlashIcon className="size-3" />
              Private
            </span>
          ) : null}
        </Trigger>
        {mode === 'view' ? (
          <Popover.Portal>
            <Popover.Positioner side="bottom" sideOffset={12}>
              <Popover.Popup className="c-popover">
                <Popover.Arrow className="c-popover-arrow">
                  <ArrowSvg />
                </Popover.Arrow>
                {visibility === 'public' ? (
                  <Popover.Title className="font-semibold">Public space</Popover.Title>
                ) : (space as PrivateSpaceData).apps.length === 0 ? (
                  <Popover.Title className="font-semibold">No app has access to this private space</Popover.Title>
                ) : (
                  <>
                    <Popover.Title className="font-semibold">Apps with access to this private space</Popover.Title>
                    <Popover.Description>
                      <ul className="list-disc">
                        {(space as PrivateSpaceData).apps.map((app) => (
                          <li key={app.id}>{app.name || app.id}</li>
                        ))}
                      </ul>
                    </Popover.Description>
                  </>
                )}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        ) : null}
      </Root>
    </li>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" role="presentation" {...props}>
      <path d="M0 0L20 0L10 10Z" fill="currentColor" />
    </svg>
  );
}
