import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { useNavigate } from '@tanstack/react-router'
import { eq, useLiveQuery } from '@tanstack/react-db'
import {
  Copy,
  ExternalLink,
  GitFork,
  LayoutPanelLeft,
  PanelLeft,
  Pin,
  PinOff,
  Search,
  Settings,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { StatusDot } from './StatusDot'
import { Icon } from '../ui'
import { useSearchPalette } from '../hooks/useSearchPalette'
import { useElectricAgents } from '../lib/ElectricAgentsProvider'
import { usePinnedEntities } from '../hooks/usePinnedEntities'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { listTiles, useWorkspace } from '../hooks/useWorkspace'
import { usePaneFindCommands } from '../hooks/usePaneFind'
import {
  useEntityPermissions,
  type EntityPermission,
} from '../hooks/useEntityPermission'
import { getEntityDisplayTitle } from '../lib/entityDisplay'
import { encodeLayout } from '../lib/workspace/layoutCodec'
import { listViews } from '../lib/workspace/viewRegistry'
import styles from './SearchPalette.module.css'
import type { ElectricEntity } from '../lib/ElectricAgentsProvider'

type PaletteEntity = Pick<
  ElectricEntity,
  `url` | `type` | `status` | `tags` | `spawn_args` | `parent`
>

type PaletteItem =
  | {
      kind: `action`
      id: string
      title: string
      subtitle?: string
      keywords?: Array<string>
      shortcut?: string
      disabled?: boolean
      icon: LucideIcon
      run: () => boolean | void | Promise<void>
    }
  | {
      kind: `session`
      id: string
      title: string
      subtitle: string
      entity: PaletteEntity
      run: () => void
    }

type ResultGroup = { label: string; items: Array<PaletteItem> }

const MAX_SESSION_RESULTS = 30
const PALETTE_ENTITY_PERMISSIONS: ReadonlyArray<EntityPermission> = [
  `fork`,
  `signal`,
]

function matchesPaletteItem(item: PaletteItem, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  const haystack = [
    item.title,
    item.subtitle,
    item.kind,
    ...(item.kind === `action` ? (item.keywords ?? []) : [item.entity.url]),
  ]
    .filter(Boolean)
    .join(` `)
    .toLowerCase()

  return needle
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => haystack.includes(part))
}

function copyWorkspaceLayout(
  workspace: ReturnType<typeof useWorkspace>[`workspace`]
): void {
  const encoded = encodeLayout(workspace)
  const url = new URL(window.location.href)
  const hash = url.hash.replace(/^#/, ``)
  const [path, query = ``] = hash.split(`?`)
  const params = new URLSearchParams(query)
  if (encoded) params.set(`layout`, encoded)
  else params.delete(`layout`)
  const newQuery = params.toString()
  url.hash = `#` + path + (newQuery ? `?` + newQuery : ``)
  void navigator.clipboard.writeText(url.toString())
}

/**
 * ⌘K command palette.
 *
 * Command-palette-style overlay anchored 12vh from the top of the
 * viewport. Searches both sessions and runnable actions, with actions
 * gated by the current workspace / active tile context.
 *
 * Keyboard:
 *   ↑ / ↓   move highlight (wraps)
 *   ↵       open the highlighted session and close
 *   esc     close (Base UI's Dialog handles this on the popup)
 */
export function SearchPalette(): React.ReactElement | null {
  const { isOpen, close } = useSearchPalette()
  const { entitiesCollection, forkEntity, killEntity } = useElectricAgents()
  const { pinnedUrls, togglePin } = usePinnedEntities()
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed()
  const { workspace, helpers } = useWorkspace()
  const { openFindForTile } = usePaneFindCommands()
  const navigate = useNavigate()

  const [query, setQuery] = useState(``)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: entities = [] } = useLiveQuery(
    (q) => {
      if (!entitiesCollection) return undefined
      return q
        .from({ e: entitiesCollection })
        .orderBy(({ e }) => e.updated_at, `desc`)
        .select(({ e }) => ({
          url: e.url,
          type: e.type,
          status: e.status,
          tags: e.tags,
          spawn_args: e.spawn_args,
          parent: e.parent,
        }))
    },
    [entitiesCollection]
  )

  const tiles = useMemo(() => listTiles(workspace.root), [workspace.root])
  const activeTile = helpers.activeTile
  const { data: activeEntityMatches = [] } = useLiveQuery(
    (q) => {
      if (!entitiesCollection || !activeTile?.entityUrl) return undefined
      return q
        .from({ e: entitiesCollection })
        .where(({ e }) => eq(e.url, activeTile.entityUrl))
    },
    [entitiesCollection, activeTile?.entityUrl]
  )
  const activeEntity = activeEntityMatches.at(0) ?? undefined
  const activeEntityPermissions = useEntityPermissions(
    activeEntity,
    PALETTE_ENTITY_PERMISSIONS
  )
  const activeEntityCanFork = activeEntityPermissions.fork
  const activeEntityCanSignal = activeEntityPermissions.signal
  const activeEntityTitle = activeEntity
    ? getEntityDisplayTitle(activeEntity).title
    : undefined

  const actions = useMemo<Array<PaletteItem>>(() => {
    const out: Array<PaletteItem> = [
      {
        kind: `action`,
        id: `new-session`,
        title: `New session`,
        subtitle: `Open a fresh agent session tile`,
        keywords: [`new chat`, `start`, `agent`],
        shortcut: `⌘N`,
        icon: ExternalLink,
        run: () => navigate({ to: `/` }),
      },
      {
        kind: `action`,
        id: `toggle-sidebar`,
        title: collapsed ? `Show sidebar` : `Hide sidebar`,
        subtitle: `Toggle the session sidebar`,
        keywords: [`sidebar`, `panel`, `navigator`],
        shortcut: `⌘B`,
        icon: PanelLeft,
        run: toggleSidebar,
      },
      {
        kind: `action`,
        id: `open-settings`,
        title: `Open settings`,
        subtitle: `Show application settings`,
        keywords: [`preferences`, `config`],
        icon: Settings,
        run: () =>
          navigate({
            to: `/settings/$category`,
            params: { category: `general` },
          }),
      },
    ]

    if (activeTile) {
      out.push(
        {
          kind: `action`,
          id: `find-current-pane`,
          title: `Find in current pane`,
          subtitle: `Search within the active tile`,
          keywords: [`search`, `current`, `tile`, `pane`],
          shortcut: `⌘F`,
          icon: Search,
          run: () => openFindForTile(activeTile.id),
        },
        {
          kind: `action`,
          id: `split-right`,
          title: `Split right`,
          subtitle: `Duplicate the active tile to the right`,
          keywords: [`layout`, `pane`, `tile`],
          shortcut: `⌘D`,
          icon: SplitSquareHorizontal,
          run: () => helpers.splitTile(activeTile.id, `right`),
        },
        {
          kind: `action`,
          id: `split-down`,
          title: `Split down`,
          subtitle: `Duplicate the active tile below`,
          keywords: [`layout`, `pane`, `tile`],
          shortcut: `⇧⌘D`,
          icon: SplitSquareVertical,
          run: () => helpers.splitTile(activeTile.id, `down`),
        }
      )

      if (tiles.length > 1) {
        out.push(
          {
            kind: `action`,
            id: `close-tile`,
            title: `Close tile`,
            subtitle: `Close the active tile`,
            keywords: [`pane`, `tab`, `window`],
            shortcut: `⌘W`,
            icon: Trash2,
            run: () => helpers.closeTile(activeTile.id),
          },
          {
            kind: `action`,
            id: `cycle-tile`,
            title: `Cycle to next tile`,
            subtitle: `Focus the next tile in the workspace`,
            keywords: [`next`, `focus`, `pane`],
            shortcut: `⌘\\`,
            icon: LayoutPanelLeft,
            run: () => {
              const currentIdx = tiles.findIndex((t) => t.id === activeTile.id)
              const next = tiles[(currentIdx + 1) % tiles.length]
              if (next) helpers.setActiveTile(next.id)
            },
          }
        )
      }
    }

    if (workspace.root) {
      out.push({
        kind: `action`,
        id: `copy-layout-link`,
        title: `Copy layout link`,
        subtitle: `Copy a URL for the current workspace layout`,
        keywords: [`share`, `url`, `workspace`],
        icon: Copy,
        run: () => copyWorkspaceLayout(workspace),
      })
    }

    if (activeTile && activeEntity && activeTile.entityUrl) {
      const isPinned = pinnedUrls.includes(activeTile.entityUrl)
      out.push(
        {
          kind: `action`,
          id: `copy-current-entity-url`,
          title: `Copy current entity URL`,
          subtitle: activeEntityTitle,
          keywords: [`copy`, `session`, `url`],
          icon: Copy,
          run: () => {
            if (activeTile.entityUrl) {
              void navigator.clipboard.writeText(activeTile.entityUrl)
            }
          },
        },
        {
          kind: `action`,
          id: `toggle-pin-current-entity`,
          title: isPinned ? `Unpin current entity` : `Pin current entity`,
          subtitle: activeEntityTitle,
          keywords: [`pin`, `sidebar`, `session`],
          icon: isPinned ? PinOff : Pin,
          run: () => {
            if (activeTile.entityUrl) togglePin(activeTile.entityUrl)
          },
        }
      )

      listViews(activeEntity).forEach((view) => {
        if (view.id === activeTile.viewId) return
        out.push({
          kind: `action`,
          id: `show-view-${view.id}`,
          title: `Show ${view.label}`,
          subtitle: `Switch the active tile view`,
          keywords: [`view`, `switch`, view.id],
          icon: view.icon,
          run: () => helpers.setTileView(activeTile.id, view.id),
        })
      })

      if (
        forkEntity &&
        !activeEntity.parent &&
        activeEntity.status !== `stopped` &&
        activeEntity.status !== `killed`
      ) {
        out.push({
          kind: `action`,
          id: `fork-current-subtree`,
          title: `Fork current subtree`,
          subtitle: activeEntityTitle,
          keywords: [`fork`, `session`, `agent`],
          disabled: !activeEntityCanFork,
          icon: GitFork,
          run: () => {
            if (!activeEntityCanFork) return false
            if (!activeTile.entityUrl) return
            void forkEntity(activeTile.entityUrl)
              .then((root) =>
                navigate({
                  to: `/entity/$`,
                  params: { _splat: root.url.replace(/^\//, ``) },
                })
              )
              .catch(() => {})
          },
        })
      }

      if (
        killEntity &&
        activeEntity.status !== `stopped` &&
        activeEntity.status !== `killed`
      ) {
        out.push({
          kind: `action`,
          id: `kill-current-entity`,
          title: `Kill current entity`,
          subtitle: activeEntityTitle,
          keywords: [`stop`, `terminate`, `agent`, `session`],
          disabled: !activeEntityCanSignal,
          icon: Trash2,
          run: () => {
            if (!activeEntityCanSignal) return false
            if (!activeTile.entityUrl) return false
            if (
              !window.confirm(
                `Kill ${activeEntityTitle ?? activeTile.entityUrl}?`
              )
            ) {
              return false
            }
            const tx = killEntity(activeTile.entityUrl)
            tx.isPersisted.promise.catch(() => {})
          },
        })
      }
    }

    return out
  }, [
    activeEntity,
    activeEntityCanFork,
    activeEntityCanSignal,
    activeEntityTitle,
    activeTile,
    collapsed,
    forkEntity,
    helpers,
    killEntity,
    navigate,
    openFindForTile,
    pinnedUrls,
    tiles,
    togglePin,
    toggleSidebar,
    workspace,
  ])

  const groups: Array<ResultGroup> = useMemo(() => {
    const pinnedSet = new Set(pinnedUrls)
    const actionItems = actions.filter((item) =>
      matchesPaletteItem(item, query)
    )
    const sessionItems = entities
      .map<PaletteItem>((entity) => {
        const { title } = getEntityDisplayTitle(entity)
        return {
          kind: `session`,
          id: entity.url,
          title,
          subtitle: entity.type,
          entity,
          run: () =>
            navigate({
              to: `/entity/$`,
              params: { _splat: entity.url.replace(/^\//, ``) },
            }),
        }
      })
      .filter((item) => matchesPaletteItem(item, query))
    const pinned = sessionItems.filter(
      (item): item is Extract<PaletteItem, { kind: `session` }> =>
        item.kind === `session` && pinnedSet.has(item.entity.url)
    )
    const sessions = sessionItems.filter(
      (item): item is Extract<PaletteItem, { kind: `session` }> =>
        item.kind === `session` && !pinnedSet.has(item.entity.url)
    )
    const out: Array<ResultGroup> = []
    if (actionItems.length > 0)
      out.push({ label: `Actions`, items: actionItems })
    if (pinned.length > 0) {
      out.push({ label: `Pinned`, items: pinned.slice(0, MAX_SESSION_RESULTS) })
    }
    if (sessions.length > 0) {
      out.push({
        label: `Sessions`,
        items: sessions.slice(0, MAX_SESSION_RESULTS),
      })
    }
    return out
  }, [actions, entities, navigate, pinnedUrls, query])

  const flatResults = useMemo<Array<PaletteItem>>(
    () => groups.flatMap((g) => g.items),
    [groups]
  )

  // Reset selection when query or open state changes.
  useEffect(() => {
    setHighlight(0)
  }, [query, isOpen])

  // Reset query each time the palette closes so the next open starts
  // fresh; defer to next tick so the close animation can finish.
  useEffect(() => {
    if (!isOpen) {
      const t = window.setTimeout(() => setQuery(``), 200)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [isOpen])

  // Auto-focus the input each time the palette opens. Base UI's dialog
  // restores focus to the trigger on close, but doesn't reliably focus
  // a child input on open if it's not the first focusable element.
  useEffect(() => {
    if (!isOpen) return
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [isOpen])

  const runItem = useCallback(
    (item: PaletteItem) => {
      if (item.kind === `action` && item.disabled) return
      const shouldClose = item.run()
      if (shouldClose === false) return
      // Defer close to the next frame so React commits the navigation
      // before the dialog dismount; closing in the same render seems to
      // get coalesced and the dialog stays mounted.
      window.requestAnimationFrame(close)
    },
    [close]
  )

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (flatResults.length === 0) return
      if (e.key === `ArrowDown`) {
        e.preventDefault()
        setHighlight((h) => (h + 1) % flatResults.length)
      } else if (e.key === `ArrowUp`) {
        e.preventDefault()
        setHighlight((h) => (h - 1 + flatResults.length) % flatResults.length)
      } else if (e.key === `Enter`) {
        e.preventDefault()
        const target = flatResults[highlight]
        if (target) runItem(target)
      }
    },
    [flatResults, highlight, runItem]
  )

  let cursor = 0
  return (
    <BaseDialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={styles.popup}>
          <div className={styles.searchRow}>
            <Icon icon={Search} size={3} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="search"
              className={styles.searchInput}
              placeholder="Search sessions and actions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className={styles.results} role="listbox">
            {flatResults.length === 0 && (
              <div className={styles.empty}>
                {query ? `No matches` : `No sessions or actions`}
              </div>
            )}
            {groups.map((group) => (
              <div key={group.label}>
                <span className={styles.groupLabel}>{group.label}</span>
                {group.items.map((item) => {
                  const idx = cursor++
                  const active = idx === highlight
                  const disabled = item.kind === `action` && item.disabled
                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={active}
                      aria-disabled={disabled || undefined}
                      data-active={active}
                      data-disabled={disabled || undefined}
                      className={styles.row}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => runItem(item)}
                    >
                      <span className={styles.rowIconSlot}>
                        {item.kind === `session` ? (
                          <StatusDot status={item.entity.status} />
                        ) : (
                          <Icon
                            icon={item.icon}
                            size={2}
                            className={styles.rowIcon}
                          />
                        )}
                      </span>
                      <span className={styles.rowTitle} title={item.title}>
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span
                          className={
                            item.kind === `session`
                              ? styles.rowType
                              : styles.rowSubtitle
                          }
                        >
                          {item.subtitle}
                        </span>
                      )}
                      {item.kind === `action` && item.shortcut && (
                        <span className={styles.rowShortcut}>
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
