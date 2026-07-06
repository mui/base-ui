import { Dialog } from "@base-ui/react";

export const composeDialogHandle = Dialog.createHandle<{
	to?: string;
	from?: string;
	subject?: string;
	body?: string;
}>();
