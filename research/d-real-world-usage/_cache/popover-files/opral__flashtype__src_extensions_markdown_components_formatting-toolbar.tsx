import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent,
} from "react";
import { Toolbar } from "@base-ui-components/react/toolbar";
import { Select } from "@base-ui-components/react/select";
import { Tooltip } from "@base-ui-components/react/tooltip";
import { Popover } from "@base-ui-components/react/popover";
import clsx from "clsx";
import {
	Bold,
	Check,
	ChevronDown,
	Code2,
	Copy,
	Italic,
	Link as LinkIcon,
	List,
	ListChecks,
	ListOrdered,
	Unlink,
	X,
} from "lucide-react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "../editor/editor-context";
import { buildMarkdownFromEditor } from "../editor/build-markdown-from-editor";
import { normalizeUrl } from "../editor/normalize-url";
import {
	TOOLBAR_BLOCK_OPTIONS,
	type ToolbarBlockType,
} from "../editor/block-commands";

type FormatState = {
	block: ToolbarBlockType;
	isBold: boolean;
	isItalic: boolean;
	isCode: boolean;
	isLink: boolean;
	isBulletList: boolean;
	isOrderedList: boolean;
	isTaskList: boolean;
};

/** 28px square icon button, matching the panel-header chips in the islands UI. */
const iconButtonClass =
	"inline-flex size-7 shrink-0 select-none items-center justify-center rounded-[7px] text-[var(--color-text-tertiary)] transition-[background-color,color,box-shadow] duration-100 ease-out hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus-visible)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:stroke-[1.9]";

/** Pressed state for a formatting toggle. */
const iconButtonActiveClass =
	"bg-[var(--color-bg-control-selected)] text-[var(--color-text-primary)] [&_svg]:text-[var(--color-icon-control-selected)]";

const ToolbarSeparator = () => (
	<Toolbar.Separator className="mx-1.5 h-3.5 w-px bg-[var(--color-border-subtle)]" />
);

const initialFormatState: FormatState = {
	block: "paragraph",
	isBold: false,
	isItalic: false,
	isCode: false,
	isLink: false,
	isBulletList: false,
	isOrderedList: false,
	isTaskList: false,
};

/**
 * Floating toolbar rendering Markdown formatting controls for the TipTap editor.
 *
 * @example
 * <FormattingToolbar className="sticky top-0 z-10" />
 */
export function FormattingToolbar({ className }: { className?: string }) {
	const { editor } = useEditorCtx();
	const [formatState, setFormatState] =
		useState<FormatState>(initialFormatState);
	const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
		"idle",
	);
	const [blockMenuOpen, setBlockMenuOpen] = useState(false);
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkValue, setLinkValue] = useState("");
	const [linkEditing, setLinkEditing] = useState(false);
	const linkInputRef = useRef<HTMLInputElement>(null);

	const suppressMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
		event.preventDefault();
	}, []);

	const hasTaskListCommand = useMemo(
		() =>
			Boolean(
				editor &&
				typeof (editor.commands as any)?.toggleTaskList === "function",
			),
		[editor],
	);

	useEffect(() => {
		if (!editor) return;
		const update = () => {
			const isTaskList = computeTaskListActive(editor, hasTaskListCommand);
			setFormatState({
				block: getActiveBlock(editor),
				isBold: editor.isActive("bold"),
				isItalic: editor.isActive("italic"),
				isCode: editor.isActive("code"),
				isLink: editor.isActive("link"),
				isBulletList: editor.isActive("bulletList") && !isTaskList,
				isOrderedList: editor.isActive("orderedList"),
				isTaskList,
			});
		};

		update();

		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		editor.on("update", update);

		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
			editor.off("update", update);
		};
	}, [editor, hasTaskListCommand]);

	const activeBlockLabel = useMemo(() => {
		const active = TOOLBAR_BLOCK_OPTIONS.find(
			(option) => option.value === formatState.block,
		);
		return active?.label ?? "Text";
	}, [formatState.block]);

	const handleBlockChange = useCallback(
		(value: ToolbarBlockType) => {
			if (!editor) return;
			const option = TOOLBAR_BLOCK_OPTIONS.find(
				(entry) => entry.value === value,
			);
			option?.apply(editor);
			setBlockMenuOpen(false);
		},
		[editor],
	);

	const handleToggleBold = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("bold").run();
	}, [editor]);

	const handleToggleItalic = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("italic").run();
	}, [editor]);

	const handleToggleCode = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("code").run();
	}, [editor]);

	const handleLinkOpenChange = useCallback(
		(next: boolean) => {
			if (next && editor) {
				const active = editor.isActive("link");
				setLinkEditing(active);
				setLinkValue(
					active ? String(editor.getAttributes("link")?.href ?? "") : "",
				);
			}
			setLinkOpen(next);
		},
		[editor],
	);

	const handleApplyLink = useCallback(() => {
		if (!editor) return;
		const href = normalizeUrl(linkValue);
		if (!href) {
			setLinkOpen(false);
			return;
		}
		const chain = editor.chain().focus();
		if (editor.isActive("link")) {
			// Caret inside an existing link — update the whole mark range.
			chain.extendMarkRange("link").setMark("link", { href }).run();
		} else if (!editor.state.selection.empty) {
			// Apply to the current selection.
			chain.setMark("link", { href }).run();
		} else {
			// No selection — insert the URL itself as the linked text.
			chain
				.insertContent({
					type: "text",
					text: linkValue.trim() || href,
					marks: [{ type: "link", attrs: { href } }],
				})
				.run();
		}
		setLinkOpen(false);
	}, [editor, linkValue]);

	const handleRemoveLink = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().extendMarkRange("link").unsetMark("link").run();
		setLinkOpen(false);
	}, [editor]);

	const handleLinkKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleApplyLink();
			}
		},
		[handleApplyLink],
	);

	const handleToggleBulletList = useCallback(() => {
		if (!editor) return;
		if (computeTaskListActive(editor, hasTaskListCommand)) {
			setTaskListState(editor, null);
			return;
		}
		if (editor.isActive("bulletList") && editor.state.selection.empty) {
			return;
		}
		const chain = editor.chain().focus() as any;
		let success = editor.isActive("bulletList")
			? (chain.liftListItem?.("listItem")?.run?.() ?? false)
			: (chain.wrapIn?.("bulletList")?.run?.() ?? false);
		if (!success) {
			const altChain = editor.chain().focus() as any;
			success =
				chain.toggleList?.("bulletList", "listItem")?.run?.() ??
				altChain.toggleBulletList?.()?.run?.() ??
				false;
		}
	}, [editor, hasTaskListCommand]);

	const handleToggleOrderedList = useCallback(() => {
		if (!editor) return;
		if (editor.isActive("orderedList") && editor.state.selection.empty) {
			return;
		}
		const chain = editor.chain().focus() as any;
		let success = editor.isActive("orderedList")
			? (chain.liftListItem?.("listItem")?.run?.() ?? false)
			: (chain.wrapIn?.("orderedList")?.run?.() ?? false);
		if (!success) {
			const altChain = editor.chain().focus() as any;
			success =
				chain.toggleList?.("orderedList", "listItem")?.run?.() ??
				altChain.toggleOrderedList?.()?.run?.() ??
				false;
		}
	}, [editor]);

	const handleToggleTaskList = useCallback(() => {
		if (!editor) return;
		if (typeof editor.chain().focus().toggleTaskList === "function") {
			editor.chain().focus().toggleTaskList().run();
			return;
		}
		toggleTaskListFallback(editor);
	}, [editor]);

	const handleCopyMarkdown = useCallback(() => {
		if (!editor) return;
		if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
			setCopyStatus("error");
			return;
		}
		const markdown = buildMarkdownFromEditor(editor);
		navigator.clipboard
			.writeText(markdown)
			.then(() => setCopyStatus("success"))
			.catch(() => {
				setCopyStatus("error");
			});
	}, [editor]);

	useEffect(() => {
		if (copyStatus === "idle") return;
		const reset = window.setTimeout(() => setCopyStatus("idle"), 2000);
		return () => window.clearTimeout(reset);
	}, [copyStatus]);

	if (!editor) return null;

	return (
		<Toolbar.Root
			className={clsx(
				"flex h-10 w-full shrink-0 items-center gap-0.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)] px-2 text-foreground",
				className,
			)}
			aria-label="Formatting toolbar"
			data-attr="markdown-format-toolbar"
		>
			<Toolbar.Group className="flex flex-1 items-center gap-0.5">
				<Select.Root
					value={formatState.block}
					onValueChange={handleBlockChange}
					open={blockMenuOpen}
					onOpenChange={setBlockMenuOpen}
				>
					<Toolbar.Button
						render={<Select.Trigger />}
						nativeButton={false}
						data-attr="markdown-block-selector"
						className={clsx(
							"inline-flex h-7 shrink-0 select-none items-center gap-1 rounded-[7px] pr-1.5 pl-2.25 text-[12.5px] font-medium text-[var(--color-text-secondary)] transition-[background-color,color,box-shadow] duration-100 ease-out hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus-visible)]",
							blockMenuOpen &&
								"bg-[var(--color-bg-control-selected)] text-[var(--color-text-primary)]",
						)}
						onMouseDown={suppressMouseDown}
					>
						<Select.Value className="block w-[4.25rem] truncate">
							{activeBlockLabel}
						</Select.Value>
						<Select.Icon className="text-[var(--color-icon-tertiary)] transition-transform duration-100 data-[popup-open]:rotate-180">
							<ChevronDown className="size-[13px] stroke-[2]" aria-hidden />
						</Select.Icon>
					</Toolbar.Button>
					<Select.Portal>
						<Select.Positioner
							className="z-50 outline-none"
							side="bottom"
							align="start"
							sideOffset={6}
							alignItemWithTrigger={false}
						>
							<Select.Popup className="min-w-[10.75rem] origin-[var(--transform-origin)] rounded-[8px] border border-[var(--color-border-panel)] bg-[var(--color-bg-panel)] p-1 shadow-lg transition-[transform,opacity] duration-150 data-[side=bottom]:mt-2 data-[side=top]:mb-2 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-100 data-[ending-style]:opacity-100">
								<div className="px-2 pb-0.75 pt-1 text-[11px] font-medium leading-4 text-[var(--color-icon-tertiary)]">
									Turn into
								</div>
								{TOOLBAR_BLOCK_OPTIONS.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										className="group flex min-h-9 cursor-default items-center gap-2 rounded-[7px] px-2 py-1 text-[12.5px] outline-none focus-visible:ring-0 data-[highlighted]:bg-[var(--color-bg-hover)] data-[highlighted]:text-[var(--color-text-primary)]"
									>
										<span className="flex size-4.5 items-center justify-center text-[12px] text-[var(--color-icon-tertiary)] group-data-[highlighted]:text-[var(--color-text-secondary)] [&_svg]:stroke-[1.8]">
											<option.icon className="h-3.5 w-3.5" aria-hidden />
										</span>
										<div className="flex flex-1 flex-col">
											<span className="text-[12.5px] font-semibold leading-4 text-[var(--color-text-primary)]">
												{option.label}
											</span>
											<span className="text-[11.5px] font-normal leading-4 text-[var(--color-text-tertiary)]">
												{option.description}
											</span>
										</div>
										<Select.ItemIndicator className="text-[var(--color-text-link-hover)]">
											<Check className="h-3.5 w-3.5 stroke-[2]" aria-hidden />
										</Select.ItemIndicator>
									</Select.Item>
								))}
							</Select.Popup>
						</Select.Positioner>
					</Select.Portal>
				</Select.Root>

				<ToolbarSeparator />

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isBold && iconButtonActiveClass,
					)}
					onClick={handleToggleBold}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isBold}
					aria-label="Bold"
					data-attr="markdown-format-bold"
				>
					<Bold className="size-3.5" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isItalic && iconButtonActiveClass,
					)}
					onClick={handleToggleItalic}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isItalic}
					aria-label="Italic"
					data-attr="markdown-format-italic"
				>
					<Italic className="size-3.5" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isCode && iconButtonActiveClass,
					)}
					onClick={handleToggleCode}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isCode}
					aria-label="Inline code"
					data-attr="markdown-format-code"
				>
					<Code2 className="size-3.5" aria-hidden />
				</Toolbar.Button>

				<Popover.Root
					open={linkOpen}
					onOpenChange={handleLinkOpenChange}
					openOnHover={false}
				>
					<Toolbar.Button
						render={<Popover.Trigger />}
						nativeButton={false}
						className={clsx(
							iconButtonClass,
							(linkOpen || formatState.isLink) && iconButtonActiveClass,
						)}
						onMouseDown={suppressMouseDown}
						aria-label="Link"
						data-attr="markdown-format-link"
					>
						<LinkIcon className="size-3.5" aria-hidden />
					</Toolbar.Button>
					<Popover.Portal>
						<Popover.Positioner
							className="z-50 outline-none"
							side="bottom"
							align="start"
							sideOffset={6}
						>
							<Popover.Popup
								initialFocus={linkInputRef}
								className="w-[19rem] origin-[var(--transform-origin)] rounded-[8px] border border-[var(--color-border-panel)] bg-[var(--color-bg-panel)] p-1.5 shadow-lg transition-[transform,opacity] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
								data-attr="markdown-link-popover"
							>
								<div className="flex h-8 items-center gap-1.5 rounded-[7px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-panel-muted)] px-2 text-[var(--color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-[background-color,border-color,box-shadow] duration-100 focus-within:border-[var(--color-border-brand-soft)] focus-within:bg-[var(--color-bg-panel)] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_0_0_2px_var(--color-bg-brand-soft)]">
									<LinkIcon
										className="size-3.5 shrink-0 text-[var(--color-icon-tertiary)]"
										aria-hidden
									/>
									<input
										ref={linkInputRef}
										value={linkValue}
										onChange={(event) => setLinkValue(event.target.value)}
										onKeyDown={handleLinkKeyDown}
										aria-label="Link URL"
										placeholder="Paste a link..."
										className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[12.5px] font-medium text-[var(--color-text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--color-text-tertiary)]"
										data-attr="markdown-link-input"
									/>
								</div>
								<div className="mt-1.5 flex items-center gap-1">
									{linkEditing && (
										<button
											type="button"
											onClick={handleRemoveLink}
											className="inline-flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] font-medium text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-status-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus-visible)]"
											data-attr="markdown-link-remove"
										>
											<Unlink className="size-3.5" aria-hidden />
											Remove
										</button>
									)}
									<Popover.Close className="ml-auto inline-flex h-7 items-center gap-1 rounded-[7px] px-2.5 text-[12.5px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus-visible)]">
										<X className="size-3.5" aria-hidden />
										Cancel
									</Popover.Close>
									<button
										type="button"
										onClick={handleApplyLink}
										className="inline-flex h-7 items-center gap-1 rounded-[7px] bg-[var(--color-bg-action-primary)] px-3 text-[12.5px] font-semibold text-[var(--color-text-on-action-primary)] shadow-[0_1px_2px_rgba(194,65,12,0.18)] transition-colors hover:bg-[var(--color-bg-action-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring-focus-visible)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-panel)]"
										data-attr="markdown-link-apply"
									>
										<Check className="size-3.5" aria-hidden />
										{linkEditing ? "Update" : "Add link"}
									</button>
								</div>
							</Popover.Popup>
						</Popover.Positioner>
					</Popover.Portal>
				</Popover.Root>

				<ToolbarSeparator />

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isOrderedList && iconButtonActiveClass,
					)}
					onClick={handleToggleOrderedList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isOrderedList}
					aria-label="Numbered list"
					data-attr="markdown-format-ordered-list"
				>
					<ListOrdered className="size-3.5" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isBulletList && iconButtonActiveClass,
					)}
					onClick={handleToggleBulletList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isBulletList}
					aria-label="Bullet list"
					data-attr="markdown-format-bullet-list"
				>
					<List className="size-3.5" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						iconButtonClass,
						formatState.isTaskList && iconButtonActiveClass,
					)}
					onClick={handleToggleTaskList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isTaskList}
					aria-label="Checklist"
					data-attr="markdown-format-task-list"
				>
					<ListChecks className="size-3.5" aria-hidden />
				</Toolbar.Button>
			</Toolbar.Group>

			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Toolbar.Button
							className={clsx(
								iconButtonClass,
								"ml-auto",
								copyStatus === "error" &&
									"text-[var(--color-text-status-danger)]",
							)}
							onClick={handleCopyMarkdown}
							onMouseDown={suppressMouseDown}
							data-attr="markdown-copy-markdown"
							aria-label={
								copyStatus === "success" ? "Copied markdown" : "Copy markdown"
							}
						>
							<span className="relative inline-flex size-3.5 items-center justify-center">
								<Copy
									className={clsx(
										"size-3.5 transition-all duration-150",
										copyStatus === "success"
											? "scale-75 opacity-0"
											: "scale-100 opacity-100",
									)}
									aria-hidden
								/>
								<Check
									className={clsx(
										"absolute size-3.5 text-[var(--color-text-status-success)] transition-all duration-150",
										copyStatus === "success"
											? "scale-100 opacity-100"
											: "scale-75 opacity-0",
									)}
									aria-hidden
								/>
							</span>
						</Toolbar.Button>
					}
				/>
				<Tooltip.Portal>
					<Tooltip.Positioner side="top" align="center" sideOffset={6}>
						<Tooltip.Popup className="rounded-md border border-[var(--color-border-panel)] bg-[var(--color-bg-panel)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow-md transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100">
							{copyStatus === "success" ? "Copied Markdown" : "Copy Markdown"}
						</Tooltip.Popup>
					</Tooltip.Positioner>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Toolbar.Root>
	);
}

function getActiveBlock(editor: Editor): ToolbarBlockType {
	if (editor.isActive("heading", { level: 1 })) return "heading-1";
	if (editor.isActive("heading", { level: 2 })) return "heading-2";
	if (editor.isActive("heading", { level: 3 })) return "heading-3";
	if (editor.isActive("codeBlock")) return "code";
	if (editor.isActive("blockquote")) return "blockquote";
	return "paragraph";
}

function computeTaskListActive(editor: Editor, hasTaskListCommand: boolean) {
	if (hasTaskListCommand && editor.isActive("taskList")) return true;
	const itemAttrs = editor.getAttributes("listItem");
	if (itemAttrs && "checked" in itemAttrs) {
		return typeof itemAttrs.checked === "boolean";
	}
	const listAttrs = editor.getAttributes("bulletList");
	if (listAttrs?.isTaskList) return true;
	return false;
}

function toggleTaskListFallback(editor: Editor) {
	if (!editor.isActive("bulletList")) {
		const chain = editor.chain().focus() as any;
		const wrapped = chain.wrapIn?.("bulletList")?.run?.();
		if (!wrapped) {
			return;
		}
	}

	const listItemAttrs = editor.getAttributes("listItem");
	const isCurrentlyTask =
		listItemAttrs && typeof listItemAttrs.checked === "boolean";
	setTaskListState(editor, isCurrentlyTask ? null : false);
}

function setTaskListState(editor: Editor, checked: boolean | null) {
	const { state, view } = editor;
	const { selection } = state;
	const tr = state.tr;
	let applied = false;
	const touchedBulletLists = new Set<number>();

	const applyListItem = (node: any, pos: number) => {
		if (node.type.name !== "listItem") return;
		if (checked === null && node.attrs.checked == null) return;
		if (checked !== null && node.attrs.checked === checked) return;
		tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked });
		applied = true;
	};

	const applyBulletList = (node: any, pos: number) => {
		if (node.type.name !== "bulletList" || touchedBulletLists.has(pos)) return;
		touchedBulletLists.add(pos);
		const isTaskList = checked !== null;
		if (node.attrs.isTaskList === isTaskList) return;
		tr.setNodeMarkup(pos, undefined, { ...node.attrs, isTaskList });
		applied = true;
	};

	const visitSelection = () => {
		state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
			applyListItem(node, pos);
			applyBulletList(node, pos);
		});
	};

	const visitAncestors = () => {
		const $from: any = selection.$from;
		let appliedListItem = false;
		let appliedBulletList = false;
		for (
			let depth = $from.depth;
			depth > 0 && (!appliedListItem || !appliedBulletList);
			depth--
		) {
			const node = $from.node(depth);
			if (!appliedListItem && node.type.name === "listItem") {
				applyListItem(node, $from.before(depth));
				appliedListItem = true;
				continue;
			}
			if (!appliedBulletList && node.type.name === "bulletList") {
				applyBulletList(node, $from.before(depth));
				appliedBulletList = true;
			}
		}
	};

	if (selection.empty) {
		visitAncestors();
	} else {
		visitSelection();
	}

	if (applied) {
		view.dispatch(tr);
	}
}
