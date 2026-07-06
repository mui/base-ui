import { Popover } from "@base-ui-components/react/popover"
import { Tooltip } from "@base-ui-components/react/tooltip"
import cx from "classnames"
import { ExternalLink, GitBranch, ImagePlus, Plug, X } from "lucide-react"
import { observer } from "mobx-react"
import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { Z_INDEX } from "../constants"
import { onFocusInputShortcut } from "../electronAPI/app"
import type { GitSummaryResponse } from "../electronAPI/git"
import type { HarnessId } from "../electronAPI/harnessEventTypes"
import { openUrlInNativeBrowser } from "../electronAPI/shell"
import { usePortalContainer } from "../hooks/usePortalContainer"
import { resetMetaKeyPressed } from "../hooks/useMetaKeyPressed"
import { useShortcutHintsVisible } from "../hooks/useShortcutHintsVisible"
import type { ThinkingLevel } from "../store/TaskModel"
import type { Command, InputManager } from "../store/managers/InputManager"
import type { SdkCapabilitiesManager } from "../store/managers/SdkCapabilitiesManager"
import type { SmartEditorManager } from "../store/managers/SmartEditorManager"
import type { TrayManager } from "../store/managers/TrayManager"
import type { Comment } from "../types"
import { processImageBlob } from "../utils/imageAttachment"
import {
    getMetaDigitShortcutIndex,
    isMetaOnlyShortcut,
    onKeyboardNavigationSettled,
    shouldSuppressEditorAutoFocusForKeyboardNavigation,
} from "../utils/keyboardShortcuts"
import { HarnessPicker } from "./HarnessPicker"
import { ModelPicker } from "./ModelPicker"
import { SmartEditor, type SmartEditorRef } from "./SmartEditor"
import { ThinkingPicker } from "./ThinkingPicker"
import { CommentsSection } from "./events/CommentsSection"
import { FastModeToggle } from "./FastModeToggle"
import { TaskMcpSelector } from "./mcp/TaskMcpSelector"
import { ShortcutBadge } from "./ui"
import { TrayButtons, TraySlideOut, getTrayConfig } from "./tray"

// Button variant styles
const BUTTON_BASE = "btn flex items-center justify-center h-9 text-sm font-medium transition-all duration-100 whitespace-nowrap shrink-0"
const BUTTON_LABELED = `${BUTTON_BASE} gap-2 px-4`
const BUTTON_ICON_ONLY = `${BUTTON_BASE} w-9`
const COMMAND_SHORTCUT_BY_ID: Partial<Record<string, number>> = {
    do: 1,
    runPlan: 1,
    plan: 2,
    revise: 2,
    ask: 3,
    review: 4,
    reviewPlan: 4,
    retry: 5,
    repeat: 6,
    commitAndPush: 7,
    stop: 8,
    repeatStop: 8,
    cancelPlan: 8,
    close: 9,
    reopen: 9,
}

// Semantic button styles - each variant has enabled and disabled states
// Disabled states preserve the button's color identity with reduced opacity
const BUTTON_STYLES = {
    primary: {
        enabled: "bg-primary text-primary-content cursor-pointer hover:bg-primary/80 active:bg-primary/70 active:scale-95",
        disabled: "bg-primary/40 text-primary-content/50 cursor-not-allowed",
    },
    success: {
        enabled: "bg-success text-success-content cursor-pointer hover:bg-success/80 active:bg-success/70 active:scale-95",
        disabled: "bg-success/40 text-success-content/50 cursor-not-allowed",
    },
    danger: {
        enabled: "bg-error text-error-content cursor-pointer hover:bg-error/80 active:bg-error/70 active:scale-95",
        disabled: "bg-error/40 text-error-content/50 cursor-not-allowed",
    },
    neutral: {
        enabled: "bg-base-200 text-base-content cursor-pointer hover:bg-base-300 active:bg-base-300 active:scale-95",
        disabled: "bg-base-200/40 text-base-content/50 cursor-not-allowed",
    },
    ghost: {
        enabled: "text-base-content cursor-pointer hover:bg-base-200 active:bg-base-300 active:scale-95",
        disabled: "text-muted/50 cursor-not-allowed",
    },
} as const

type ButtonVariant = keyof typeof BUTTON_STYLES

function getCommandShortcut(command: Command): number | undefined {
    return COMMAND_SHORTCUT_BY_ID[command.id]
}

/** Reusable action button that renders a Command. Secondary commands render icon-only with a tooltip. */
function CommandButton({
    command,
    onExecute,
    portalContainer,
    shortcutNumber,
    showShortcut,
}: {
    command: Command
    onExecute: (id: string) => void
    portalContainer: HTMLElement | null
    shortcutNumber?: number
    showShortcut: boolean
}) {
    const Icon = command.icon
    const variant = (command.style?.variant ?? "ghost") as ButtonVariant
    const styles = BUTTON_STYLES[variant]
    const iconOnly = command.group === "secondary"
    const base = iconOnly ? BUTTON_ICON_ONLY : BUTTON_LABELED
    const shortcutLabel = shortcutNumber?.toString()
    const shortcutTitle = shortcutLabel ? `${command.label} (⌘${shortcutLabel})` : command.label

    const btn = (
        <button
            type="button"
            onClick={() => onExecute(command.id)}
            disabled={!command.enabled}
            className={cx(base, "relative", command.enabled ? styles.enabled : styles.disabled)}
            title={shortcutTitle}
            aria-keyshortcuts={shortcutLabel ? `Meta+${shortcutLabel}` : undefined}
        >
            <Icon size={14} />
            {!iconOnly && command.label}
            <ShortcutBadge label={shortcutLabel} visible={showShortcut} variant="corner" className="bg-base-100/20 text-current shadow-none" />
        </button>
    )

    if (!iconOnly) return btn

    return (
        <Tooltip.Root delay={0}>
            <Tooltip.Trigger render={btn} />
            <Tooltip.Portal container={portalContainer}>
                <Tooltip.Positioner sideOffset={6} side="top">
                    <Tooltip.Popup className="bg-base-300 text-base-content text-xs px-2 py-1 shadow-lg border border-border">{shortcutTitle}</Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    )
}

export const InputBar = observer(function InputBar({
    input,
    editorManager,
    tray,
    gitStatus,
    pullRequest,
    fileMentionsDir,
    slashCommandsDir,
    sdkCapabilities,
    unsubmittedComments = [],
    selectedModel,
    onModelChange,
    thinking,
    onThinkingChange,
    fastMode,
    onFastModeChange,
    harnessId,
    onHarnessChange,
    allowHarnessSwitch = true,
    hideTray = false,
    enabledMcpServerIds,
    onMcpServerIdsChange,
    autoFocusKey,
}: {
    input: InputManager
    editorManager: SmartEditorManager
    tray: TrayManager
    gitStatus?: GitSummaryResponse | null
    /** Associated pull request info */
    pullRequest?: { url: string; number?: number; provider: "github" | "gitlab" | "other" }
    /** Directory for @file mention autocomplete, null to disable */
    fileMentionsDir: string | null
    /** Directory for /slash command autocomplete, null to disable */
    slashCommandsDir: string | null
    /** SDK capabilities manager for slash command discovery */
    sdkCapabilities?: SdkCapabilitiesManager
    unsubmittedComments?: Comment[]
    selectedModel?: string
    onModelChange?: (model: string) => void
    thinking?: ThinkingLevel
    onThinkingChange?: (level: ThinkingLevel) => void
    fastMode?: boolean
    onFastModeChange?: (enabled: boolean) => void
    harnessId?: HarnessId
    onHarnessChange?: (harnessId: HarnessId) => void
    allowHarnessSwitch?: boolean
    /** Dev: Hide tray buttons and slide-out */
    hideTray?: boolean
    enabledMcpServerIds?: string[]
    onMcpServerIdsChange?: (serverIds: string[]) => void
    autoFocusKey?: string
}) {
    const portalContainer = usePortalContainer()
    const editorRef = useRef<SmartEditorRef>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const showCommandShortcuts = useShortcutHintsVisible()

    // Get commands from InputManager
    const { commands } = input
    const hasComments = unsubmittedComments.length > 0
    const hasPendingImages = editorManager.pendingImages.length > 0
    const queuedTurns = input.queuedTurns
    const focusEditorAtEnd = useCallback(() => {
        if (input.isDisabled) return

        requestAnimationFrame(() => {
            editorRef.current?.focusEnd()
        })
    }, [input.isDisabled])
    const handleEditorKeyDown = useCallback(
        (event: ReactKeyboardEvent) => {
            if (event.key !== "Escape" || tray.isOpen) return

            event.preventDefault()
            editorRef.current?.blur()
        },
        [tray.isOpen]
    )

    useEffect(() => {
        const handleCommandShortcut = (event: KeyboardEvent) => {
            const shortcutIndex = getMetaDigitShortcutIndex(event)
            if (shortcutIndex === null) return

            const shortcutNumber = shortcutIndex + 1
            const cmd = commands.find((command) => getCommandShortcut(command) === shortcutNumber)
            if (!cmd) return

            event.preventDefault()
            tray.close()
            void input.runCommand(cmd.id)
        }

        window.addEventListener("keydown", handleCommandShortcut, true)
        return () => window.removeEventListener("keydown", handleCommandShortcut, true)
    }, [commands, input, tray])

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

    useEffect(() => {
        if (autoFocusKey === undefined || input.isDisabled) return
        if (shouldSuppressEditorAutoFocusForKeyboardNavigation()) return

        const frame = requestAnimationFrame(() => {
            editorRef.current?.focusEnd()
        })

        return () => cancelAnimationFrame(frame)
    }, [autoFocusKey, input.isDisabled])

    useEffect(() => {
        return onKeyboardNavigationSettled(focusEditorAtEnd)
    }, [focusEditorAtEnd])

    // Strip "openade/" worktree prefix from branch display
    const displayBranch = gitStatus?.branch?.replace(/^openade\//, "")

    // Get tray content from config
    const trayConfig = tray.openTray ? getTrayConfig(tray.openTray) : null
    const trayContent = trayConfig?.renderContent(tray) ?? null
    const showHarnessPicker = !!(allowHarnessSwitch && harnessId && onHarnessChange)

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4" style={{ zIndex: Z_INDEX.INPUT_BAR }}>
            {!hideTray && (
                <TraySlideOut open={tray.isOpen} noPadding>
                    {trayContent}
                </TraySlideOut>
            )}
            <div className="bg-base-100 border border-border shadow-lg">
                {/* Tray toggle buttons */}
                {!hideTray && (
                    <div className="flex items-center gap-1 p-1">
                        <TrayButtons tray={tray} />
                        {gitStatus?.branch && (
                            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-muted ml-auto shrink-0">
                                <GitBranch size={12} />
                                <span className="max-w-[120px] truncate" title={displayBranch}>
                                    {displayBranch}
                                </span>
                                {pullRequest && (
                                    <button
                                        type="button"
                                        onClick={() => openUrlInNativeBrowser(pullRequest.url)}
                                        className="btn flex items-center gap-1 ml-1 shrink-0 whitespace-nowrap text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                        title={pullRequest.url}
                                    >
                                        <ExternalLink size={11} />
                                        <span>PR{pullRequest.number ? ` #${pullRequest.number}` : ""}</span>
                                    </button>
                                )}
                            </div>
                        )}
                        {showHarnessPicker && harnessId && onHarnessChange && (
                            <div className={cx("shrink-0", !gitStatus?.branch && "ml-auto")}>
                                <HarnessPicker value={harnessId} onChange={onHarnessChange} />
                            </div>
                        )}
                        {selectedModel && onModelChange && (
                            <div className={cx("shrink-0", !gitStatus?.branch && !showHarnessPicker && "ml-auto")}>
                                <ModelPicker value={selectedModel} onChange={onModelChange} harnessId={harnessId} />
                            </div>
                        )}
                        {thinking && onThinkingChange && (
                            <div className="shrink-0">
                                <ThinkingPicker value={thinking} onChange={onThinkingChange} />
                            </div>
                        )}
                        {fastMode !== undefined && onFastModeChange && (
                            <div className="shrink-0">
                                <FastModeToggle enabled={fastMode} onChange={onFastModeChange} />
                            </div>
                        )}
                        {enabledMcpServerIds && onMcpServerIdsChange && (
                            <Popover.Root>
                                <Popover.Trigger
                                    className={cx(
                                        "btn h-7 px-2 flex items-center gap-1.5 text-xs font-mono border-0 bg-transparent hover:bg-base-200 shrink-0",
                                        enabledMcpServerIds.length > 0 ? "text-primary" : "text-muted"
                                    )}
                                >
                                    <Plug size={12} />
                                    {enabledMcpServerIds.length > 0 && <span>{enabledMcpServerIds.length}</span>}
                                </Popover.Trigger>
                                <Popover.Portal container={portalContainer}>
                                    <Popover.Positioner sideOffset={8} side="top" align="end">
                                        <Popover.Popup className="z-50 bg-base-100 border border-border shadow-lg p-3 outline-none">
                                            <TaskMcpSelector selectedServerIds={enabledMcpServerIds} onSelectionChange={onMcpServerIdsChange} vertical />
                                        </Popover.Popup>
                                    </Popover.Positioner>
                                </Popover.Portal>
                            </Popover.Root>
                        )}
                    </div>
                )}

                {/* Pending comments section */}
                {hasComments && <CommentsSection comments={unsubmittedComments} variant="pending" />}

                {queuedTurns.length > 0 && (
                    <div className="border-t border-border bg-base-100 px-2 py-2">
                        <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted">Queued</div>
                        <div className="flex flex-col gap-1">
                            {queuedTurns.map((turn) => (
                                <div key={turn.id} className="flex min-w-0 items-center gap-2 border border-border bg-base-200 px-2 py-1.5 text-xs">
                                    <span className="shrink-0 font-medium text-primary">{turn.label ?? (turn.type === "ask" ? "Ask Next" : "Do Next")}</span>
                                    <span className="min-w-0 flex-1 truncate text-base-content" title={turn.input}>
                                        {turn.input || "No message"}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn shrink-0 cursor-pointer p-1 text-muted hover:bg-base-300 hover:text-base-content"
                                        onClick={() => void input.cancelQueuedTurn(turn.id)}
                                        aria-label={`Cancel queued ${turn.type}`}
                                        title="Cancel queued message"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Text input area with image attach overlay */}
                <div className="relative">
                    <SmartEditor
                        key={`${editorManager.workspaceId}:${editorManager.id}`}
                        ref={editorRef}
                        manager={editorManager}
                        fileMentionsDir={fileMentionsDir}
                        slashCommandsDir={slashCommandsDir}
                        sdkCapabilities={sdkCapabilities}
                        onKeyDown={handleEditorKeyDown}
                        allowGlobalShortcutsWhenEmpty
                        placeholder={input.isDisabled ? "Task is closed. Click Reopen to continue." : "What would you like to do?"}
                        className={cx(
                            "min-h-[58px] max-h-[150px] overflow-y-auto text-sm leading-[20px] border-x-0 focus-within:border-border",
                            input.isDisabled && "opacity-50 pointer-events-none"
                        )}
                        editorClassName="px-2.5 py-[9px]"
                    />
                    {/* Image attach button - bottom right of textarea */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                processImageBlob(file)
                                    .then(({ attachment, dataUrl }) => editorManager.addImage(attachment, dataUrl))
                                    .catch((err) => console.error("[InputBar] Failed to process image:", err))
                                e.target.value = ""
                            }
                        }}
                    />
                    <button
                        type="button"
                        className={cx(
                            "btn absolute bottom-1.5 right-1.5 p-1.5 text-muted hover:text-base-content hover:bg-base-300/50 transition-colors",
                            input.isDisabled && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach image"
                    >
                        <ImagePlus size={14} />
                    </button>
                    <ShortcutBadge label="L" visible={showCommandShortcuts} variant="corner" />
                </div>

                {/* Image preview strip */}
                {hasPendingImages && (
                    <div className="flex gap-2 px-3 py-2 border-t border-border overflow-x-auto">
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

                {/* Repeat mode: stop-on-text + max runs + iteration counter */}
                {input.repeatState && (
                    <div className="flex items-center gap-2 px-3 py-2 border-t border-border text-sm">
                        <span className="text-muted whitespace-nowrap">Stop on text:</span>
                        <input
                            type="text"
                            value={input.repeatState.stopOnText}
                            onChange={(e) => input.repeatState!.setStopOnText(e.target.value)}
                            placeholder="optional"
                            className="btn flex-1 bg-transparent border border-border px-2 py-1 text-sm text-base-content placeholder:text-muted/50 outline-none focus:border-primary"
                        />
                        <span className="text-muted whitespace-nowrap">Max runs:</span>
                        <input
                            type="number"
                            min={1}
                            value={input.repeatState.maxRuns}
                            onChange={(e) => input.repeatState!.setMaxRuns(Number.parseInt(e.target.value) || 1)}
                            className="btn w-16 bg-transparent border border-border px-2 py-1 text-sm text-base-content outline-none focus:border-primary"
                        />
                        <span className="text-muted text-xs tabular-nums">#{input.repeatState.iterationCount}</span>
                    </div>
                )}

                {/* Action buttons row - rendered from centralized commands */}
                <Tooltip.Provider>
                    <div className="flex flex-wrap items-center gap-2 px-2 py-2 bg-base-200">
                        {commands.map((cmd) => (
                            <div key={cmd.id} className={cx(cmd.spacer && "ml-auto", !cmd.spacer && input.isDisabled && "opacity-50 pointer-events-none")}>
                                <CommandButton
                                    command={cmd}
                                    shortcutNumber={getCommandShortcut(cmd)}
                                    showShortcut={showCommandShortcuts}
                                    portalContainer={portalContainer}
                                    onExecute={(id) => {
                                        tray.close()
                                        input.runCommand(id)
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </Tooltip.Provider>
            </div>
        </div>
    )
})
