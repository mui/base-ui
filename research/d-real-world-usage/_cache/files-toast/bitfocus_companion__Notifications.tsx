import { Toast } from '@base-ui/react/toast'
import { nanoid } from 'nanoid'
import { forwardRef, useImperativeHandle } from 'react'

export interface NotificationsManagerRef {
	show(title: string, message: string, duration?: number | null, stickyId?: string): string
	close(messageId: string): void
}

const toastManager = Toast.createToastManager()

function ToastList() {
	const { toasts } = Toast.useToastManager()
	return (
		<Toast.Portal>
			<Toast.Viewport className="notification-viewport">
				{toasts.map((toast) => {
					const isSticky = toast.timeout === 0
					const showHeader = !!toast.title || isSticky
					return (
						<Toast.Root key={toast.id} toast={toast} className="notification">
							<Toast.Content className="notification-content">
								{showHeader && (
									<div className="notification-header">
										{toast.title && <Toast.Title className="notification-title">{toast.title}</Toast.Title>}
										<Toast.Close className="btn btn-close" aria-label="Close notification" />
									</div>
								)}
								<Toast.Description className="notification-body">{toast.description}</Toast.Description>
							</Toast.Content>
						</Toast.Root>
					)
				})}
			</Toast.Viewport>
		</Toast.Portal>
	)
}

export const NotificationsManager = forwardRef<NotificationsManagerRef>(function NotificationsManager(_props, ref) {
	useImperativeHandle(ref, () => ({
		show(title, message, duration, stickyId) {
			const id = stickyId ?? nanoid()
			const timeout = duration === null ? 0 : (duration ?? 10000)
			toastManager.add({ id, title: title || undefined, description: message ?? title, timeout })
			return id
		},
		close(id) {
			toastManager.close(id)
		},
	}))

	return (
		<Toast.Provider toastManager={toastManager} timeout={10000} limit={20}>
			<ToastList />
		</Toast.Provider>
	)
})
