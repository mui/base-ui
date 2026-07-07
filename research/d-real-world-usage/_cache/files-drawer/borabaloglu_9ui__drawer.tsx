"use client"

import * as React from "react"
import { Drawer as BaseDrawer } from "vaul-base"

import { cn } from "@/lib/utils"

function Drawer({ ...props }: React.ComponentProps<typeof BaseDrawer.Root>) {
	return <BaseDrawer.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
	...props
}: React.ComponentProps<typeof BaseDrawer.Trigger>) {
	return <BaseDrawer.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
	...props
}: React.ComponentProps<typeof BaseDrawer.Portal>) {
	return <BaseDrawer.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
	...props
}: React.ComponentProps<typeof BaseDrawer.Close>) {
	return <BaseDrawer.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
	className,
	...props
}: React.ComponentProps<typeof BaseDrawer.Overlay>) {
	return (
		<BaseDrawer.Overlay
			data-slot="drawer-overlay"
			className={cn(
				"fixed inset-0 bg-black/50 transition-all duration-200 [&[data-ending-style]]:opacity-0 [&[data-starting-style]]:opacity-0",
				className
			)}
			{...props}
		/>
	)
}

function DrawerContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof BaseDrawer.Content>) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<BaseDrawer.Content
				data-slot="drawer-content"
				className={cn(
					"group/drawer-content bg-popover text-popover-foreground fixed z-50 flex h-auto flex-col outline-none",
					"data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
					"data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
					"data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-lg data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
					"data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-lg data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
					className
				)}
				{...props}
			>
				<div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
				{children}
			</BaseDrawer.Content>
		</DrawerPortal>
	)
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn("flex flex-col gap-1.5 p-4", className)}
			{...props}
		/>
	)
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	)
}
function DrawerTitle({
	className,
	...props
}: React.ComponentProps<typeof BaseDrawer.Title>) {
	return (
		<BaseDrawer.Title
			data-slot="drawer-title"
			className={cn("text-foreground font-semibold", className)}
			{...props}
		/>
	)
}

function DrawerDescription({
	className,
	...props
}: React.ComponentProps<typeof BaseDrawer.Description>) {
	return (
		<BaseDrawer.Description
			data-slot="drawer-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	)
}

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
}
