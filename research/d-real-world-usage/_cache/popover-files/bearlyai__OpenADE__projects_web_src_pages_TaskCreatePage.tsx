import { Popover } from "@base-ui-components/react/popover"
import cx from "classnames"
import { exhaustive } from "exhaustive"
import {
    Archive,
    AlertCircle,
    AlertTriangle,
    ChevronDown,
    Code,
    FileText,
    GitBranch,
    ImagePlus,
    Loader2,
    MessageCircle,
    RotateCcw,
    Settings,
    Star,
    X,
    Zap,
} from "lucide-react"
import { observer } from "mobx-react"
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { HarnessPicker } from "../components/HarnessPicker"
import { ImageDropOverlay } from "../components/ImageDropOverlay"
import { ModelPicker } from "../components/ModelPicker"
import { FastModeToggle } from "../components/FastModeToggle"
import { ThinkingPicker } from "../components/ThinkingPicker"
import { SmartEditor, type SmartEditorRef } from "../components/SmartEditor"
import { StrategyPicker } from "../components/hyperplan/StrategyPicker"
import { TaskMcpSelector } from "../components/mcp/TaskMcpSelector"
import { Select, ShortcutBadge, Switch } from "../components/ui"
import { onFocusInputShortcut } from "../electronAPI/app"
import type { BranchInfo, GitSummaryResponse } from "../electronAPI/git"
import { useImageDropZone } from "../hooks/useImageDropZone"
import { resetMetaKeyPressed } from "../hooks/useMetaKeyPressed"
import { usePortalContainer } from "../hooks/usePortalContainer"
import { useShortcutHintsVisible } from "../hooks/useShortcutHintsVisible"
import { useCodeNavigate } from "../routing"
import { useCodeStore } from "../store/context"
import type { StashedDraft } from "../store/managers/SmartEditorManager"
import type { TaskCreation } from "../store/managers/TaskCreationManager"
import { SdkCapabilitiesManager } from "../store/managers/SdkCapabilitiesManager"
import type { Repo } from "../types"
import { processImageBlob } from "../utils/imageAttachment"
import { getTaskCreationPhaseLabel } from "./taskCreationPhaseLabel"
import {
    getMetaDigitShortcutIndex,
    isMetaOnlyShortcut,
    isMetaShortcut,
    onKeyboardNavigationSettled,
    shouldSuppressEditorAutoFocusForKeyboardNavigation,
} from "../utils/keyboardShortcuts"

interface TaskCreatePageProps {
    workspaceId: string
    repo: Repo
}

type CreateMode = "plan" | "do" | "ask" | "hyperplan"

const CREATE_MODE_SHORTCUTS: Record<CreateMode, number> = {
    do: 1,
    plan: 2,
    ask: 3,
    hyperplan: 4,
}

const CREATE_MORE_SHORTCUT_LABEL = "⌥M"
const WORKTREE_SHORTCUT_LABEL = "⌥W"

const getLastBranchKey = (workspaceId: string) => `code:lastBranch:${workspaceId}`
const getCreateMoreKey = (workspaceId: string) => `code:createMore:${workspaceId}`

function PendingTaskItem({
    creation,
    onClick,
    onRetry,
    onDismiss,
}: { creation: TaskCreation; onClick: () => void; onRetry: () => void; onDismiss: () => void }) {
    const hasError = creation.error !== null
    const sourceBranch = exhaustive.tag(creation.isolationStrategy, "type", {
        worktree: (s) => s.sourceBranch,
        head: () => null,
    })

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onClick()
                }
            }}
            className={cx("p-3 border-b border-border cursor-pointer transition-colors", hasError ? "bg-error/5 hover:bg-error/10" : "hover:bg-base-200")}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {hasError ? <AlertCircle size="1rem" className="text-error" /> : <Loader2 size="1rem" className="animate-spin text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cx("text-sm truncate", hasError ? "text-error" : "text-base-content")}>
                        {creation.description.length > 60 ? `${creation.description.slice(0, 60)}...` : creation.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cx("text-xs", hasError ? "text-error/70" : "text-muted")}>
                            {hasError ? "Failed" : getTaskCreationPhaseLabel(creation.phase, creation.isolationStrategy)}
                        </span>
                        {sourceBranch && (
                            <span className="text-xs text-muted flex items-center gap-1">
                                <GitBranch size="0.75rem" />
                                {sourceBranch}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {hasError && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRetry()
                            }}
                            className="btn p-1.5 text-muted hover:text-base-content hover:bg-base-300 transition-colors"
                            title="Retry"
                        >
                            <RotateCcw size="0.875rem" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDismiss()
                        }}
                        className="btn p-1.5 text-muted hover:text-base-content hover:bg-base-300 transition-colors"
                        title="Dismiss"
                    >
                        <X size="0.875rem" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function truncateMiddle(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str
    const ellipsis = "…"
    const charsToShow = maxLen - ellipsis.length
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return str.slice(0, frontChars) + ellipsis + str.slice(-backChars)
}

function formatDraftPreview(draft: StashedDraft): string {
    const imageCount = draft.snapshot.pendingImages.length
    const normalized = draft.snapshot.value.replace(/\s+/g, " ").trim()
    if (normalized.length > 0) {
        return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized
    }
    if (imageCount > 0) {
        return `Draft with ${imageCount} image${imageCount === 1 ? "" : "s"}`
    }
    return "Empty draft"
}

function formatDraftTime(createdAt: string): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(createdAt))
}

function StashedDraftItem({ draft, onPop, onDelete }: { draft: StashedDraft; onPop: () => void; onDelete: () => void }) {
    const imageCount = draft.snapshot.pendingImages.length
    const preview = formatDraftPreview(draft)

    return (
        <div className="border border-border bg-base-100 p-3">
            <div className="flex items-start gap-2">
                <FileText size={14} className="mt-0.5 flex-shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-base-content break-words" title={preview}>
                        {preview}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>{formatDraftTime(draft.createdAt)}</span>
                        {imageCount > 0 && (
                            <span>
                                {imageCount} image{imageCount === 1 ? "" : "s"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPop}
                    className="btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-base-200 text-base-content hover:bg-base-300 transition-colors"
                >
                    <RotateCcw size={12} />
                    Pop
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-base-content hover:bg-base-200 transition-colors"
                >
                    <X size={12} />
                    Delete
                </button>
            </div>
        </div>
    )
}

export const TaskCreateDraftsMenu = observer(({ workspaceId }: { workspaceId: string }) => {
    const codeStore = useCodeStore()
    const portalContainer = usePortalContainer()
    const editorManager = codeStore.smartEditors.getManager("task-create", workspaceId)

    const handleStash = () => {
        editorManager.stashCurrentDraft()
    }

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleStash}
                disabled={!editorManager.hasDraftableContent}
                className={cx(
                    "btn flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                    editorManager.hasDraftableContent
                        ? "bg-base-200 text-base-content hover:bg-base-300 cursor-pointer"
                        : "bg-base-200/40 text-base-content/50 cursor-not-allowed"
                )}
            >
                <Archive size={14} />
                <span>Stash</span>
            </button>

            <Popover.Root>
                <Popover.Trigger className="btn flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted hover:text-base-content hover:bg-base-200 transition-colors">
                    <Archive size={14} />
                    <span>Drafts</span>
                    {editorManager.stashedDrafts.length > 0 && (
                        <span className="min-w-5 px-1.5 py-0.5 text-xs bg-base-200 text-base-content">{editorManager.stashedDrafts.length}</span>
                    )}
                    <ChevronDown size={12} />
                </Popover.Trigger>
                <Popover.Portal container={portalContainer}>
                    <Popover.Positioner sideOffset={8} side="bottom" align="end">
                        <Popover.Popup className="z-50 w-80 bg-base-100 border border-border shadow-lg outline-none">
                            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                                <div className="flex items-center gap-2 text-sm text-base-content">
                                    <Archive size={14} className="text-muted" />
                                    <span>Drafts</span>
                                </div>
                                <span className="text-xs text-muted">{editorManager.stashedDrafts.length}</span>
                            </div>
                            <div className="flex flex-col gap-3 p-3">
                                <button
                                    type="button"
                                    onClick={handleStash}
                                    disabled={!editorManager.hasDraftableContent}
                                    className={cx(
                                        "btn flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all",
                                        editorManager.hasDraftableContent
                                            ? "bg-base-200 text-base-content hover:bg-base-300 cursor-pointer"
                                            : "bg-base-200/40 text-base-content/50 cursor-not-allowed"
                                    )}
                                >
                                    <Archive size={14} />
                                    Stash current draft
                                </button>
                                {editorManager.stashedDrafts.length > 0 ? (
                                    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
                                        {editorManager.stashedDrafts.map((draft) => (
                                            <StashedDraftItem
                                                key={draft.id}
                                                draft={draft}
                                                onPop={() => editorManager.popStash(draft.id)}
                                                onDelete={() => editorManager.deleteStash(draft.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-border p-4 text-sm text-muted">
                                        Stashed drafts show up here so you can swap them back into the editor.
                                    </div>
                                )}
                            </div>
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
        </div>
    )
})

export const TaskCreatePage = observer(({ workspaceId, repo }: TaskCreatePageProps) => {
    const codeStore = useCodeStore()
    const navigate = useCodeNavigate()
    const portalContainer = usePortalContainer()
    const [branches, setBranches] = useState<BranchInfo[]>([])
    const [selectedBranch, setSelectedBranch] = useState<string>("")
    const [defaultBranch, setDefaultBranch] = useState<string>("")
    const [lastUsedBranch, setLastUsedBranch] = useState<string | null>(null)
    const [branchesLoading, setBranchesLoading] = useState(false)
    const [uncommittedChanges, setUncommittedChanges] = useState<GitSummaryResponse | null>(null)
    const [useWorktree, setUseWorktree] = useState(false)
    const [createMore, setCreateMore] = useState(() => localStorage.getItem(getCreateMoreKey(workspaceId)) === "true")
    const [pendingNavigationCreationId, setPendingNavigationCreationId] = useState<string | null>(null)
    const [selectedMcpServerIds, setSelectedMcpServerIds] = useState<string[]>([])
    const editorRef = useRef<SmartEditorRef>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showHyperPlan, setShowHyperPlan] = useState(false)
    const showKeyboardHints = useShortcutHintsVisible()

    // Get SmartEditorManager for task creation
    const editorManager = codeStore.smartEditors.getManager("task-create", workspaceId)

    // Page-level drop zone for images
    const { isDragOver, dragHandlers } = useImageDropZone(editorManager)

    // SDK capabilities for slash command autocomplete
    const sdkCapabilities = useMemo(() => new SdkCapabilitiesManager(), [])
    const focusEditorAtEnd = useCallback(() => {
        requestAnimationFrame(() => {
            editorRef.current?.focusEnd()
        })
    }, [])
    const handleEditorKeyDown = useCallback((event: ReactKeyboardEvent) => {
        if (event.key !== "Escape") return

        event.preventDefault()
        editorRef.current?.blur()
    }, [])

    // Track if git info has been loaded
    const [gitInfoLoaded, setGitInfoLoaded] = useState(false)

    // Load git info and branches on mount
    useEffect(() => {
        const loadGitInfo = async () => {
            setBranchesLoading(true)
            try {
                // Fetch git info (async, from cache or Electron)
                const gitInfo = await codeStore.repos.getGitInfo(workspaceId)
                setGitInfoLoaded(true)

                if (!gitInfo) {
                    setBranchesLoading(false)
                    return
                }

                // Load branches using RepoManager
                const result = await codeStore.repos.listBranches(workspaceId)
                setBranches(result.branches)
                setDefaultBranch(result.defaultBranch)

                const storedLastBranch = localStorage.getItem(getLastBranchKey(workspaceId))
                const branchExists = result.branches.some((b) => b.name === storedLastBranch)

                if (storedLastBranch && branchExists) {
                    setLastUsedBranch(storedLastBranch)
                    setSelectedBranch(storedLastBranch)
                } else {
                    setSelectedBranch(result.defaultBranch)
                }
            } catch (err) {
                console.error("[TaskCreatePage] Failed to load git info/branches:", err)
            } finally {
                setBranchesLoading(false)
            }
        }

        loadGitInfo()
    }, [workspaceId, codeStore.repos])

    // Check for uncommitted changes when git info is loaded
    useEffect(() => {
        if (!gitInfoLoaded) return

        const checkUncommitted = async () => {
            try {
                const result = await codeStore.repos.getGitSummary(workspaceId)
                setUncommittedChanges(result)
            } catch (err) {
                console.error("[TaskCreatePage] Failed to check uncommitted changes:", err)
            }
        }

        checkUncommitted()
    }, [gitInfoLoaded, workspaceId, codeStore.repos])

    // Refresh uncommitted changes when window regains focus
    useEffect(() => {
        if (!gitInfoLoaded) return

        const handleFocus = async () => {
            try {
                const result = await codeStore.repos.getGitSummary(workspaceId)
                setUncommittedChanges(result)
            } catch (err) {
                console.error("[TaskCreatePage] Failed to refresh uncommitted changes:", err)
            }
        }

        window.addEventListener("focus", handleFocus)
        return () => window.removeEventListener("focus", handleFocus)
    }, [gitInfoLoaded, workspaceId, codeStore.repos])

    useEffect(() => {
        localStorage.setItem(getCreateMoreKey(workspaceId), String(createMore))
    }, [createMore, workspaceId])

    const handleBranchSelect = (branchName: string) => {
        setSelectedBranch(branchName)
        localStorage.setItem(getLastBranchKey(workspaceId), branchName)
        setLastUsedBranch(branchName)
    }

    useEffect(() => {
        if (shouldSuppressEditorAutoFocusForKeyboardNavigation()) return

        editorRef.current?.focus()
    }, [repo?.path, editorManager])

    useEffect(() => {
        return onKeyboardNavigationSettled(focusEditorAtEnd)
    }, [focusEditorAtEnd])

    useEffect(() => {
        const handleFocusShortcut = (event: KeyboardEvent) => {
            if (!isMetaOnlyShortcut(event, "KeyL")) return

            event.preventDefault()
            resetMetaKeyPressed()
            focusEditorAtEnd()
        }

        window.addEventListener("keydown", handleFocusShortcut, true)
        return () => window.removeEventListener("keydown", handleFocusShortcut, true)
    }, [focusEditorAtEnd])

    useEffect(() => {
        return onFocusInputShortcut(() => {
            resetMetaKeyPressed()
            focusEditorAtEnd()
        })
    }, [focusEditorAtEnd])

    // Prune favorites that reference deleted files
    useEffect(() => {
        if (repo?.path) {
            editorManager.validateFiles(repo.path)
        }
    }, [repo?.path, editorManager])

    const handleCreate = (mode: CreateMode) => {
        if (!editorManager.value.trim() || !workspaceId) return

        const description = editorManager.value.trim()
        const images = [...editorManager.pendingImages]

        console.log("[TaskCreatePage] Creating task with MCP servers", {
            selectedMcpServerIds,
            enabledServersCount: codeStore.mcpServers.enabledServers.length,
        })

        const creationId = codeStore.creation.newTask({
            repoId: workspaceId,
            description,
            mode,
            isolationStrategy: useWorktree && selectedBranch ? { type: "worktree", sourceBranch: selectedBranch } : { type: "head" },
            images,
            enabledMcpServerIds: selectedMcpServerIds.length > 0 ? selectedMcpServerIds : undefined,
            harnessId: codeStore.defaultHarnessId,
            modelId: codeStore.defaultModel,
            thinking: codeStore.defaultThinking,
            fastMode: codeStore.defaultFastMode,
        })

        editorManager.clear()
        if (mode === "do" || mode === "ask") {
            navigate.go("CodeWorkspaceTaskCreating", { workspaceId, creationId })
        } else if (createMore) {
            editorRef.current?.focus()
        } else {
            setPendingNavigationCreationId(creationId)
        }
    }

    const isDisabled = !editorManager.value.trim()
    const showBranchSelector = gitInfoLoaded && branches.length > 0

    useEffect(() => {
        const handleCreateShortcut = (event: KeyboardEvent) => {
            const shortcutIndex = getMetaDigitShortcutIndex(event)
            if (shortcutIndex === null || isDisabled || showHyperPlan) return

            const shortcutNumber = shortcutIndex + 1
            const mode = (Object.entries(CREATE_MODE_SHORTCUTS) as Array<[CreateMode, number]>).find(([, number]) => number === shortcutNumber)?.[0]
            if (!mode) return

            event.preventDefault()
            if (mode === "hyperplan") {
                setShowHyperPlan(true)
                return
            }

            handleCreate(mode)
        }

        window.addEventListener("keydown", handleCreateShortcut, true)
        return () => window.removeEventListener("keydown", handleCreateShortcut, true)
    }, [handleCreate, isDisabled, showHyperPlan])

    useEffect(() => {
        const handleOptionShortcut = (event: KeyboardEvent) => {
            if (showHyperPlan) return

            if (isMetaShortcut(event, "KeyM", { alt: true })) {
                event.preventDefault()
                setCreateMore((value) => !value)
                return
            }

            if (showBranchSelector && isMetaShortcut(event, "KeyW", { alt: true })) {
                event.preventDefault()
                setUseWorktree((value) => !value)
            }
        }

        window.addEventListener("keydown", handleOptionShortcut, true)
        return () => window.removeEventListener("keydown", handleOptionShortcut, true)
    }, [showBranchSelector, showHyperPlan])

    const creations = codeStore.creation.getCreationsForRepo(workspaceId)
    const pendingCreations = creations.filter((c) => c.completedTaskId === null)

    const pendingCreation = pendingNavigationCreationId ? codeStore.creation.getCreation(pendingNavigationCreationId) : null
    useEffect(() => {
        if (pendingCreation?.completedTaskId) {
            setPendingNavigationCreationId(null)
            navigate.go("CodeWorkspaceTask", { workspaceId, taskId: pendingCreation.completedTaskId })
        }
    }, [pendingCreation?.completedTaskId, workspaceId, navigate])

    const handleRetryCreation = (creationId: string) => {
        codeStore.creation.retryCreation(creationId)
    }

    const handleDismissCreation = (creationId: string) => {
        codeStore.creation.dismissCreation(creationId)
    }

    // Check for uncommitted changes warning condition
    const showUncommittedWarning = uncommittedChanges?.hasChanges && useWorktree

    const handleEditorAreaClick = () => {
        editorRef.current?.focus()
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative" {...dragHandlers}>
            {isDragOver && <ImageDropOverlay />}
            {/* Editor area - takes remaining space with scroll */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: clicking anywhere focuses editor */}
            <div className="relative flex-1 min-h-0 overflow-y-auto p-6 cursor-text" onClick={handleEditorAreaClick}>
                <SmartEditor
                    key={`${editorManager.workspaceId}:${editorManager.id}`}
                    ref={editorRef}
                    manager={editorManager}
                    fileMentionsDir={repo?.path ?? null}
                    slashCommandsDir={repo?.path ?? null}
                    sdkCapabilities={sdkCapabilities}
                    onKeyDown={handleEditorKeyDown}
                    allowGlobalShortcutsWhenEmpty
                    placeholder="Describe your task... Use @ to reference files, / for commands"
                    className="h-full text-base border-0 bg-transparent [&>div]:h-full [&>div]:border-0 [&>div]:border-l-2 [&>div]:border-l-transparent [&>div:focus-within]:border-l-primary [&>div]:transition-colors"
                    editorClassName="h-full"
                />
                <ShortcutBadge label="L" visible={showKeyboardHints} variant="floating" className="absolute right-4 top-4" />
            </div>

            {/* Favorites bar - outside bottom bar, same bg as editor */}
            {editorManager.favorites.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2">
                    <Star size={12} className="text-muted" />
                    {editorManager.favorites.map((file) => (
                        <button
                            key={file.path}
                            type="button"
                            onClick={() => editorManager.insertFile(file.path)}
                            title={file.path}
                            className="btn text-xs px-2 py-1 bg-base-200 text-base-content hover:bg-base-300 transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <FileText size={12} className="flex-shrink-0 text-muted" />
                            {file.parentDir && <span className="text-muted">{file.parentDir}/</span>}
                            {file.fileName}
                        </button>
                    ))}
                </div>
            )}

            {/* Bottom bar */}
            <div className="flex-shrink-0 border-t border-border bg-base-100">
                {/* Image preview strip */}
                {editorManager.pendingImages.length > 0 && (
                    <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto">
                        {editorManager.pendingImages.map((img) => (
                            <div key={img.id} className="relative shrink-0 group">
                                <img
                                    src={editorManager.pendingImageDataUrls.get(img.id)}
                                    alt=""
                                    className="h-20 object-cover"
                                    style={{ aspectRatio: `${img.resizedWidth}/${img.resizedHeight}` }}
                                />
                                <button
                                    type="button"
                                    className="btn absolute -top-1.5 -right-1.5 bg-base-300 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => editorManager.removeImage(img.id)}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Uncommitted changes warning */}
                {showUncommittedWarning && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/20">
                        <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                        <span className="text-xs text-warning">
                            Uncommitted changes won't be included in worktree
                            {uncommittedChanges.staged.files.length > 0 && (
                                <span className="ml-1.5 text-warning/80">({uncommittedChanges.staged.files.length} staged)</span>
                            )}
                            {uncommittedChanges.unstaged.files.length > 0 && (
                                <span className="ml-1.5 text-warning/80">({uncommittedChanges.unstaged.files.length} unstaged)</span>
                            )}
                        </span>
                    </div>
                )}

                {/* Main toolbar row */}
                <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                    {/* Left section: Connectors - scrollable */}
                    <div className="flex-1 min-w-0 overflow-x-auto">
                        <div className="flex items-center gap-2">
                            <TaskMcpSelector selectedServerIds={selectedMcpServerIds} onSelectionChange={setSelectedMcpServerIds} compact iconOnly />
                        </div>
                    </div>

                    {/* Image attach + Model picker */}
                    <div className="flex items-center gap-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    processImageBlob(file).then(({ attachment, dataUrl }) => {
                                        editorManager.addImage(attachment, dataUrl)
                                    })
                                    e.target.value = ""
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn p-2 text-muted hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach image"
                        >
                            <ImagePlus size={16} />
                        </button>
                        <HarnessPicker value={codeStore.defaultHarnessId} onChange={(id) => codeStore.setDefaultHarnessId(id)} />
                        <ModelPicker value={codeStore.defaultModel} onChange={(m) => codeStore.setDefaultModel(m)} harnessId={codeStore.defaultHarnessId} />
                        <ThinkingPicker value={codeStore.defaultThinking} onChange={(t) => codeStore.setDefaultThinking(t)} />
                        <FastModeToggle enabled={codeStore.defaultFastMode} onChange={(enabled) => codeStore.setDefaultFastMode(enabled)} />
                    </div>

                    {/* Center section: Worktree toggle + branch selector */}
                    {showBranchSelector && (
                        <div className="flex items-center gap-3 border-l border-border pl-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted">Worktree</span>
                                <span className="relative inline-flex">
                                    <Switch checked={useWorktree} onCheckedChange={setUseWorktree} aria-label="Use worktree" />
                                    <ShortcutBadge label={WORKTREE_SHORTCUT_LABEL} visible={showKeyboardHints} variant="corner" />
                                </span>
                            </div>

                            {useWorktree && (
                                <div className="flex items-center gap-2">
                                    <GitBranch size={14} className="text-muted" />
                                    <Select
                                        selectedId={selectedBranch}
                                        entries={branches.map((branch) => ({
                                            id: branch.name,
                                            content: (
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate">{truncateMiddle(branch.name, 20)}</span>
                                                    {branch.isDefault && <span className="text-xs text-muted">default</span>}
                                                    {!branch.isDefault && lastUsedBranch === branch.name && <span className="text-xs text-primary">last</span>}
                                                </span>
                                            ),
                                        }))}
                                        onSelect={(entry) => handleBranchSelect(entry.id)}
                                        disabled={branchesLoading}
                                        className={{
                                            trigger: "h-8 min-w-0 w-auto max-w-48 text-sm px-2",
                                        }}
                                    />
                                    {selectedBranch && defaultBranch && selectedBranch !== defaultBranch && (
                                        <span title={`Branching from ${selectedBranch}, not ${defaultBranch}`}>
                                            <AlertCircle size={14} className="text-muted flex-shrink-0" />
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Right section: Settings + Pending + Actions */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {/* Pending tasks indicator */}
                        {pendingCreations.length > 0 && (
                            <Popover.Root>
                                <Popover.Trigger className="btn flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted hover:text-base-content hover:bg-base-200 transition-colors">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>{pendingCreations.length} pending</span>
                                    <ChevronDown size={12} />
                                </Popover.Trigger>
                                <Popover.Portal container={portalContainer}>
                                    <Popover.Positioner sideOffset={8} side="top" align="end">
                                        <Popover.Popup className="z-50 w-80 bg-base-100 border border-border shadow-lg outline-none">
                                            <div className="px-3 py-2 border-b border-border">
                                                <span className="text-xs font-medium text-muted">Pending Tasks</span>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {pendingCreations.map((creation) => (
                                                    <PendingTaskItem
                                                        key={creation.id}
                                                        creation={creation}
                                                        onClick={() => navigate.go("CodeWorkspaceTaskCreating", { workspaceId, creationId: creation.id })}
                                                        onRetry={() => handleRetryCreation(creation.id)}
                                                        onDismiss={() => handleDismissCreation(creation.id)}
                                                    />
                                                ))}
                                            </div>
                                        </Popover.Popup>
                                    </Popover.Positioner>
                                </Popover.Portal>
                            </Popover.Root>
                        )}

                        {/* Settings popover */}
                        <Popover.Root>
                            <Popover.Trigger
                                className="btn relative p-2 text-muted hover:text-base-content hover:bg-base-200 transition-colors"
                                title="Toggle Create More (⌘⌥M)"
                            >
                                <Settings size={16} />
                                <ShortcutBadge label={CREATE_MORE_SHORTCUT_LABEL} visible={showKeyboardHints} variant="corner" />
                            </Popover.Trigger>
                            <Popover.Portal container={portalContainer}>
                                <Popover.Positioner sideOffset={8} side="top" align="end">
                                    <Popover.Popup className="z-50 w-56 bg-base-100 border border-border shadow-lg p-3 outline-none">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-base-content">Create More</div>
                                                <div className="text-xs text-muted">Stay on page after creating</div>
                                            </div>
                                            <Switch checked={createMore} onCheckedChange={setCreateMore} aria-label="Create more tasks" />
                                        </div>
                                    </Popover.Popup>
                                </Popover.Positioner>
                            </Popover.Portal>
                        </Popover.Root>

                        {/* Action buttons */}
                        <button
                            type="button"
                            onClick={() => handleCreate("do")}
                            disabled={isDisabled}
                            title="Do (⌘1)"
                            className={cx(
                                "btn relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                                isDisabled
                                    ? "bg-success/40 text-success-content/50 cursor-not-allowed"
                                    : "bg-success text-success-content hover:bg-success/90 cursor-pointer"
                            )}
                        >
                            <Code size={14} />
                            Do
                            <ShortcutBadge
                                label={String(CREATE_MODE_SHORTCUTS.do)}
                                visible={showKeyboardHints}
                                variant="corner"
                                className="bg-base-100/20 text-current shadow-none"
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCreate("plan")}
                            disabled={isDisabled}
                            title="Plan (⌘2)"
                            className={cx(
                                "btn relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                                isDisabled
                                    ? "bg-primary/40 text-primary-content/50 cursor-not-allowed"
                                    : "bg-primary text-primary-content hover:bg-primary/90 cursor-pointer"
                            )}
                        >
                            <FileText size={14} />
                            Plan
                            <ShortcutBadge
                                label={String(CREATE_MODE_SHORTCUTS.plan)}
                                visible={showKeyboardHints}
                                variant="corner"
                                className="bg-base-100/20 text-current shadow-none"
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowHyperPlan(true)}
                            disabled={isDisabled}
                            title="HyperPlan (⌘4)"
                            className={cx(
                                "btn relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                                isDisabled
                                    ? "text-muted/50 cursor-not-allowed"
                                    : "text-base-content hover:bg-base-200 active:bg-base-300 active:scale-95 cursor-pointer"
                            )}
                        >
                            <Zap size={14} />
                            HyperPlan
                            <ShortcutBadge label={String(CREATE_MODE_SHORTCUTS.hyperplan)} visible={showKeyboardHints} variant="corner" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCreate("ask")}
                            disabled={isDisabled}
                            title="Ask (⌘3)"
                            className={cx(
                                "btn relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
                                isDisabled
                                    ? "bg-base-200/40 text-base-content/50 cursor-not-allowed"
                                    : "bg-base-200 text-base-content hover:bg-base-300 active:bg-base-300 active:scale-95 cursor-pointer"
                            )}
                        >
                            <MessageCircle size={14} />
                            Ask
                            <ShortcutBadge label={String(CREATE_MODE_SHORTCUTS.ask)} visible={showKeyboardHints} variant="corner" />
                        </button>
                    </div>
                </div>
            </div>

            {/* HyperPlan modal */}
            {showHyperPlan && (
                <StrategyPicker
                    onClose={() => setShowHyperPlan(false)}
                    onRun={(strategyId) => {
                        setShowHyperPlan(false)
                        handleCreate(strategyId === "standard" ? "plan" : "hyperplan")
                    }}
                />
            )}
        </div>
    )
})
