'use client';

import { Toast, type ToastObject } from '@base-ui/react/toast';
import {
  createContext,
  type FocusEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useRef,
} from 'react';

import CloseButton from '@codaco/fresco-ui/CloseButton';
import { usePortalContainer } from '@codaco/fresco-ui/PortalContainer';
import {
  type ToastVariant,
  toastVariants,
  variantIcons,
} from '@codaco/fresco-ui/Toast';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { cva, cx } from '@codaco/fresco-ui/utils/cva';

import { interviewToastManager } from './interviewToastManager';

type InterviewToastContextValue = {
  forwardButtonRef: RefObject<HTMLButtonElement | null>;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  orientation: 'vertical' | 'horizontal';
};

const InterviewToastContext = createContext<InterviewToastContextValue | null>(
  null,
);

export function useInterviewToastContext() {
  return useContext(InterviewToastContext);
}

const arrowVariants = cva({
  base: 'size-2.5 rotate-45 rounded-br-sm data-[side=bottom]:top-[-5px] data-[side=left]:right-[-5px] data-[side=right]:left-[-5px] data-[side=top]:bottom-[-5px]',
  variants: {
    variant: {
      default: 'bg-surface',
      info: 'bg-info',
      success: 'bg-success',
      destructive: 'bg-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type InterviewToastData = {
  icon?: ReactNode;
};

function InterviewToastIcon({
  toast,
  variant,
}: {
  toast: ToastObject<InterviewToastData>;
  variant: ToastVariant;
}) {
  const customIcon = toast.data?.icon;
  if (customIcon) {
    return (
      <span className="mt-[0.1em] size-5 shrink-0" aria-hidden="true">
        {customIcon}
      </span>
    );
  }

  const IconComponent = variantIcons[variant];
  if (!IconComponent) return null;

  return (
    <IconComponent className="mt-[0.1em] size-5 shrink-0" aria-hidden="true" />
  );
}

function InterviewToastItem({
  toast,
}: {
  toast: ToastObject<InterviewToastData>;
}) {
  const variant = (toast.type ?? 'default') as ToastVariant;

  const hasFocusedRef = useRef(false);

  const focusRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  const handleFocus = useCallback(() => {
    hasFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (hasFocusedRef.current && !e.currentTarget.contains(e.relatedTarget)) {
        interviewToastManager.close(toast.id);
      }
    },
    [toast.id],
  );

  const variantClasses = cx(
    toastVariants({ variant }),
    'rounded p-4 shadow-lg',
  );

  return (
    <Toast.Root
      toast={toast}
      ref={focusRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Toast.Positioner
        toast={toast}
        {...toast.positionerProps}
        sideOffset={12}
        collisionPadding={24}
      >
        <Toast.Content
          className={cx(
            variantClasses,
            'animate-shake pointer-events-auto flex max-w-72 items-start gap-3',
          )}
        >
          <InterviewToastIcon toast={toast} variant={variant} />
          <Toast.Description
            render={<Paragraph margin="none" className="flex-1" />}
          />
          <Toast.Close
            render={<CloseButton size="sm" />}
            aria-label="Close"
            nativeButton
          />
        </Toast.Content>
        <Toast.Arrow
          className={cx(arrowVariants({ variant }), 'animate-shake')}
        />
      </Toast.Positioner>
    </Toast.Root>
  );
}

export function InterviewToastViewport() {
  const { toasts } = Toast.useToastManager();
  const portalContainer = usePortalContainer();

  return (
    <Toast.Portal container={portalContainer ?? undefined}>
      <Toast.Viewport
        aria-label="Interview notifications"
        className="pointer-events-none fixed inset-0 z-50"
      >
        {toasts.map((toast) => (
          <InterviewToastItem key={toast.id} toast={toast} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

type InterviewToastProviderProps = {
  children: ReactNode;
  forwardButtonRef: RefObject<HTMLButtonElement | null>;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  orientation: 'vertical' | 'horizontal';
};

/**
 * Provides button refs and orientation context for interview toast positioning.
 * Does NOT wrap in Toast.Provider — that is handled as a sibling provider in
 * the app-level Providers component to avoid nested providers.
 */
export function InterviewToastProvider({
  children,
  forwardButtonRef,
  backButtonRef,
  orientation,
}: InterviewToastProviderProps) {
  return (
    <InterviewToastContext.Provider
      value={{ forwardButtonRef, backButtonRef, orientation }}
    >
      {children}
    </InterviewToastContext.Provider>
  );
}
