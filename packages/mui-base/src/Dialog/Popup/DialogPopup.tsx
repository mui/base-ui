'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { useDialogPopup } from './useDialogPopup';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { refType, HTMLElementType } from '../../utils/proptypes';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping';

const customStyleHookMapping: CustomStyleHookMapping<DialogPopup.OwnerState> = {
  ...baseMapping,
  nestedOpenDialogCount: (value) => ({ 'data-nested-dialogs': value.toString() }),
  transitionStatus: (value) => {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogPopup API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogPopup)
 */
const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, container, id, keepMounted = false, render, ...other } = props;
  const rootContext = useDialogRootContext();
  const { open, modal, nestedOpenDialogCount, dismissible } = rootContext;

  const { getRootProps, floatingContext, mounted, transitionStatus } = useDialogPopup({
    id,
    ref: forwardedRef,
    isTopmost: nestedOpenDialogCount === 0,
    ...rootContext,
  });

  const ownerState: DialogPopup.OwnerState = {
    open,
    modal,
    nestedOpenDialogCount,
    transitionStatus,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: {
      ...other,
      style: { ...other.style, '--nested-dialogs': nestedOpenDialogCount },
    },
    customStyleHookMapping,
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return (
    <FloatingPortal root={container}>
      <FloatingFocusManager
        context={floatingContext}
        modal={modal}
        disabled={!mounted}
        closeOnFocusOut={dismissible}
      >
        {renderElement()}
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

namespace DialogPopup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The container element to which the popup is appended to.
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
    /**
     * If `true`, the dialog element is kept in the DOM when closed.
     *
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface OwnerState {
    open: boolean;
    modal: boolean;
    nestedOpenDialogCount: number;
    transitionStatus: TransitionStatus;
  }
}

DialogPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The container element to which the popup is appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, refType]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, the dialog element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { DialogPopup };
