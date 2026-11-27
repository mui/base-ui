import * as React from 'react';
import { Toast } from '@base-ui/react/toast';

function Messages() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Title />
      <Toast.Description />
      <Toast.Close>Dismiss notification</Toast.Close>
    </Toast.Root>
  ));
}

export default function ToastAnnouncements() {
  const manager = React.useMemo(() => Toast.createToastManager(), []);
  const finish = React.useRef<() => void>(() => {});
  return (
    <Toast.Provider toastManager={manager} timeout={0}>
      <button
        type="button"
        onClick={() =>
          manager.add({ title: 'Changes saved', description: 'Your document is up to date' })
        }
      >
        Add polite toast
      </button>
      <button
        type="button"
        onClick={() =>
          manager.add({ title: 'Upload failed', description: 'Please try again', priority: 'high' })
        }
      >
        Add urgent toast
      </button>
      <button
        type="button"
        onClick={() => {
          const upload = new Promise<void>((resolve) => {
            finish.current = resolve;
          });
          void manager.promise(upload, {
            loading: 'Uploading document',
            success: 'Document uploaded',
            error: 'Upload error',
          });
        }}
      >
        Start upload
      </button>
      <button type="button" onClick={() => finish.current()}>
        Finish upload
      </button>
      <Toast.Viewport>
        <Messages />
      </Toast.Viewport>
    </Toast.Provider>
  );
}
