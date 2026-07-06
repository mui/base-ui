import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	buttonVariants,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@selfmail/ui";
import {
	CalendarIcon,
	FingerprintIcon,
	UserRoundIcon,
	XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { m } from "#/paraglide/messages";

export function createMemberInformationDialogHandle() {
	return Dialog.createHandle();
}

export function createRemoveMemberDialogHandle() {
	return AlertDialog.createHandle();
}

interface MemberInformationDialogProps {
	handle: ReturnType<typeof createMemberInformationDialogHandle>;
	joinedAt: Date;
	memberId: string;
	memberName: string;
	userId: string;
}

export function MemberInformationDialog({
	handle,
	joinedAt,
	memberId,
	memberName,
	userId,
}: MemberInformationDialogProps) {
	const memberInitials = getMemberInitials(memberName);

	return (
		<Dialog handle={handle}>
			<DialogContent className="relative max-w-md">
				<DialogClose asChild>
					<Button
						aria-label={m["dashboard.settings.close"]()}
						className="absolute top-4 right-4"
						size="icon-sm"
						type="button"
						variant="ghost"
					>
						<XIcon aria-hidden="true" />
					</Button>
				</DialogClose>
				<div className="flex items-start gap-4 pr-8">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
						{memberInitials}
					</div>
					<div className="grid min-w-0 gap-1">
						<DialogTitle className="truncate">{memberName}</DialogTitle>
						<DialogDescription>
							{m["dashboard.settings.member_settings.more_information"]()}
						</DialogDescription>
					</div>
				</div>
				<div className="grid gap-2 rounded-xl border border-border bg-muted p-2">
					<MemberDetail
						icon={<FingerprintIcon />}
						label={m["dashboard.settings.member_settings.member_id"]()}
						value={memberId}
					/>
					<MemberDetail
						icon={<UserRoundIcon />}
						label={m["dashboard.settings.member_settings.user_id"]()}
						value={userId}
					/>
					<MemberDetail
						icon={<CalendarIcon />}
						label={m["dashboard.settings.member_settings.joined"]()}
						value={new Intl.DateTimeFormat(undefined, {
							dateStyle: "medium",
						}).format(new Date(joinedAt))}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface RemoveMemberDialogProps {
	handle: ReturnType<typeof createRemoveMemberDialogHandle>;
	memberName: string;
	onRemove: () => void;
}

export function RemoveMemberDialog({
	handle,
	memberName,
	onRemove,
}: RemoveMemberDialogProps) {
	return (
		<AlertDialog handle={handle}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>
						{m["dashboard.settings.member_settings.remove_title"]({
							memberName,
						})}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{m["dashboard.settings.cannot_undo"]()}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
					{memberName}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel type="button">
						{m["dashboard.settings.cancel"]()}
					</AlertDialogCancel>
					<AlertDialogAction
						className={buttonVariants({ variant: "destructive" })}
						onClick={onRemove}
						type="button"
					>
						{m["dashboard.settings.member_settings.remove_confirm"]()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface MemberDetailProps {
	icon: ReactNode;
	label: string;
	value: string;
}

function MemberDetail({ icon, label, value }: MemberDetailProps) {
	return (
		<div className="grid grid-cols-[1rem_1fr] items-start gap-3 rounded-lg bg-background px-3 py-2.5">
			<span className="mt-0.5 flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4">
				{icon}
			</span>
			<span className="grid min-w-0 gap-1">
				<span className="text-muted-foreground text-xs">{label}</span>
				<span className="truncate font-mono text-sm tabular-nums">{value}</span>
			</span>
		</div>
	);
}

function getMemberInitials(name: string) {
	return (
		name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.slice(0, 2)
			.toUpperCase() || "?"
	);
}
