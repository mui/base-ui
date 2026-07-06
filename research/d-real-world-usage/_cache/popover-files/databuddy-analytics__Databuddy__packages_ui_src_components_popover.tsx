"use client";

import { cn } from "../lib/utils";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import type { ComponentPropsWithoutRef } from "react";

function Root(props: ComponentPropsWithoutRef<typeof BasePopover.Root>) {
	return <BasePopover.Root {...props} />;
}

function Trigger({
	className,
	children,
	render,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Trigger>) {
	return (
		<BasePopover.Trigger
			className={render ? className : cn("cursor-pointer", className)}
			render={render}
			{...rest}
		>
			{children}
		</BasePopover.Trigger>
	);
}

function Content({
	className,
	children,
	align = "center",
	disableAnchorTracking = false,
	side = "bottom",
	sideOffset = 6,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
	align?: ComponentPropsWithoutRef<typeof BasePopover.Positioner>["align"];
	disableAnchorTracking?: ComponentPropsWithoutRef<
		typeof BasePopover.Positioner
	>["disableAnchorTracking"];
	side?: ComponentPropsWithoutRef<typeof BasePopover.Positioner>["side"];
	sideOffset?: ComponentPropsWithoutRef<
		typeof BasePopover.Positioner
	>["sideOffset"];
}) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner
				align={align}
				className="z-50"
				disableAnchorTracking={disableAnchorTracking}
				side={side}
				sideOffset={sideOffset}
			>
				<BasePopover.Popup
					className={cn(
						"w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-border/60 bg-popover p-4",
						"origin-(--transform-origin)",
						"motion-reduce:transition-none",
						"data-open:fade-in data-open:zoom-in-95 data-open:animate-in data-open:duration-150",
						"not-data-open:fade-out not-data-open:zoom-out-95 not-data-open:animate-out not-data-open:duration-100",
						className
					)}
					{...rest}
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

function Title({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Title>) {
	return (
		<BasePopover.Title
			className={cn("font-semibold text-foreground text-xs", className)}
			{...rest}
		/>
	);
}

function Description({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Description>) {
	return (
		<BasePopover.Description
			className={cn("text-[11px] text-muted-foreground", className)}
			{...rest}
		/>
	);
}

function Close(props: ComponentPropsWithoutRef<typeof BasePopover.Close>) {
	return <BasePopover.Close {...props} />;
}

export const Popover: typeof Root & {
	Close: typeof Close;
	Content: typeof Content;
	Description: typeof Description;
	Title: typeof Title;
	Trigger: typeof Trigger;
} = Object.assign(Root, {
	Trigger,
	Content,
	Title,
	Description,
	Close,
});

export const PopoverTrigger = Trigger;
export const PopoverContent = Content;
