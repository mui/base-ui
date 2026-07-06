import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { cx } from 'class-variance-authority'
import { ComponentProps, Ref, useEffect } from 'react'

import { dialogContentStyles, type DialogContentStylesProps } from './DialogContent.styles'
import { useDialog } from './DialogContext'

export interface ContentProps
  extends Omit<ComponentProps<typeof BaseDialog.Popup>, 'render'>, DialogContentStylesProps {
  /**
   * When set to true, the content will adjust its width to fit the content rather than taking up the full available width.
   */
  isNarrow?: boolean
  ref?: Ref<HTMLDivElement>
}

/**
 * The popup element that contains the dialog content. Renders a <div> element.
 */
export const Content = ({
  className,
  isNarrow = false,
  size = 'md',
  ref,
  ...rest
}: ContentProps) => {
  const { setIsFullScreen } = useDialog()

  useEffect(() => {
    if (size === 'fullscreen') setIsFullScreen(true)

    return () => setIsFullScreen(false)
  }, [setIsFullScreen, size])

  return (
    <BaseDialog.Popup
      ref={ref}
      data-spark-component="dialog-content"
      role="dialog"
      className={state =>
        cx(
          dialogContentStyles({
            isNarrow,
            size,
            className: typeof className === 'function' ? className(state) : className,
          })
        )
      }
      {...rest}
    />
  )
}

Content.displayName = 'Dialog.Content'
