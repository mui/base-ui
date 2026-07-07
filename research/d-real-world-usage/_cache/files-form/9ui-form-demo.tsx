"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const schema = z.object({
	displayName: z
		.string()
		.min(3, { message: "Please enter at least 3 characters." }),
	email: z.string().email({ message: "Please enter a valid email address." }),
})

type FormValues = z.infer<typeof schema>

export default function FormDemo() {
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			displayName: "",
			email: "",
		},
	})

	const onSubmit = (data: FormValues) => {
		console.log(data)
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex w-96 flex-col gap-4"
			>
				<FormField
					name="displayName"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Display Name</FormLabel>
							<FormControl>
								<Input
									className="w-full"
									placeholder="borabalogluu"
									aria-invalid={!!form.formState.errors.displayName}
									{...field}
								/>
							</FormControl>
							<FormDescription>
								This is the name that will be displayed to other users.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									className="w-full"
									placeholder="your@email.com"
									aria-invalid={!!form.formState.errors.email}
									{...field}
								/>
							</FormControl>
							<FormDescription>Enter your email address</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	)
}
