"use client";

import { cn } from "../lib/utils";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { SubmitHintProvider } from "./button";
import { XMarkIcon } from "./icons";
import { useCallback, type ComponentPropsWithoutRef } from "react";

function Root(props: ComponentPropsWithoutRef<typeof BaseDialog.Root>) {
	return <BaseDialog.Root {...props} />;
}

function Trigger({
	children,
	render,
	...rest
}: ComponentPropsWithoutRef<typeof BaseDialog.Trigger>) {
	return (
		<BaseDialog.Trigger render={render} {...rest}>
			{children}
		</BaseDialog.Trigger>
	);
}

function Content({
	className,
	children,
	...rest
}: ComponentPropsWithoutRef<typeof BaseDialog.Popup>) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop
				className={cn(
					"fixed inset-0 z-50 bg-black/40",
					"data-open:fade-in data-open:animate-in data-open:duration-200",
					"not-data-open:fade-out not-data-open:animate-out not-data-open:duration-150"
				)}
			/>
			<BaseDialog.Popup
				className={cn(
					"fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
					"overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg",
					"motion-reduce:transition-none",
					"data-open:fade-in data-open:zoom-in-95 data-open:animate-in data-open:duration-200",
					"not-data-open:fade-out not-data-open:zoom-out-95 not-data-open:animate-out not-data-open:duration-150",
					className
				)}
				{...rest}
			>
				{children}
			</BaseDialog.Popup>
		</BaseDialog.Portal>
	);
}

function Form({
	className,
	children,
	...rest
}: React.FormHTMLAttributes<HTMLFormElement>) {
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLFormElement>) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				e.currentTarget.requestSubmit();
			}
			rest.onKeyDown?.(e);
		},
		[rest.onKeyDown]
	);

	return (
		<SubmitHintProvider value>
			<form
				className={className}
				{...rest}
				onKeyDown={handleKeyDown}
			>
				{children}
			</form>
		</SubmitHintProvider>
	);
}

function Header({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-col gap-1 bg-muted px-5 py-4", className)}
			{...rest}
		/>
	);
}

function Body({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("px-5 py-4", className)} {...rest} />;
}

function Footer({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"angled-rectangle-gradient flex items-center justify-end gap-2 bg-muted px-5 py-3",
				className
			)}
			{...rest}
		/>
	);
}

function Title({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BaseDialog.Title>) {
	return (
		<BaseDialog.Title
			className={cn("font-semibold text-foreground text-xs", className)}
			{...rest}
		/>
	);
}

function Description({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BaseDialog.Description>) {
	return (
		<BaseDialog.Description
			className={cn("text-muted-foreground text-xs", className)}
			{...rest}
		/>
	);
}

function Close({
	className,
	children,
	...rest
}: ComponentPropsWithoutRef<typeof BaseDialog.Close>) {
	if (children) {
		return (
			<BaseDialog.Close
				render={children as React.ReactElement<Record<string, unknown>>}
				{...rest}
			/>
		);
	}
	return (
		<BaseDialog.Close
			aria-label={rest["aria-label"] ?? "Close"}
			className={cn(
				"absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground",
				"transition-colors duration-(--duration-instant) ease-(--ease-smooth)",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
				"hover:bg-interactive-hover hover:text-foreground",
				className
			)}
			{...rest}
		>
			<XMarkIcon aria-hidden="true" className="size-3.5" />
		</BaseDialog.Close>
	);
}

export const Dialog = Object.assign(Root, {
	Trigger,
	Content,
	Form,
	Header,
	Body,
	Footer,
	Title,
	Description,
	Close,
});
