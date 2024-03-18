'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { PolymorphicComponent, useSlotProps, WithOptionalOwnerState } from '../utils';
import {
  TablePaginationActionsButtonSlotProps,
  TablePaginationActionsProps,
  TablePaginationActionsRootSlotProps,
  TablePaginationActionsTypeMap,
} from './TablePaginationActions.types';
import { ItemAriaLabelType } from './common.types';

function LastPageIconDefault() {
  return <span>{'⇾|'}</span>;
}
function FirstPageIconDefault() {
  return <span>{'|⇽'}</span>;
}
function NextPageIconDefault() {
  return <span>{'⇾'}</span>;
}
function BackPageIconDefault() {
  return <span>{'⇽'}</span>;
}

function defaultGetAriaLabel(type: ItemAriaLabelType) {
  return `Go to ${type} page`;
}

/**
 * @ignore - internal component.
 */
const TablePaginationActions = React.forwardRef(function TablePaginationActions<
  RootComponentType extends React.ElementType,
>(
  props: TablePaginationActionsProps<RootComponentType>,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    count,
    getItemAriaLabel = defaultGetAriaLabel,
    onPageChange,
    page,
    rowsPerPage,
    showFirstButton = false,
    showLastButton = false,
    direction,
    // @ts-ignore
    ownerState: ownerStateProp,
    slotProps = {},
    slots = {},
    ...other
  } = props;

  const ownerState = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  const Root = slots.root ?? 'div';
  const rootProps: WithOptionalOwnerState<TablePaginationActionsRootSlotProps> = useSlotProps({
    elementType: Root,
    externalSlotProps: slotProps.root,
    externalForwardedProps: other,
    additionalProps: { ref: forwardedRef },
    ownerState,
  });

  const FirstButton = slots.firstButton ?? 'button';
  const firstButtonProps: WithOptionalOwnerState<TablePaginationActionsButtonSlotProps> =
    useSlotProps({
      elementType: FirstButton,
      externalSlotProps: slotProps.firstButton,
      additionalProps: {
        onClick: handleFirstPageButtonClick,
        disabled: page === 0,
        'aria-label': getItemAriaLabel('first', page),
        title: getItemAriaLabel('first', page),
      },
      ownerState,
    });

  const LastButton = slots.lastButton ?? 'button';
  const lastButtonProps: WithOptionalOwnerState<TablePaginationActionsButtonSlotProps> =
    useSlotProps({
      elementType: LastButton,
      externalSlotProps: slotProps.lastButton,
      additionalProps: {
        onClick: handleLastPageButtonClick,
        disabled: page >= Math.ceil(count / rowsPerPage) - 1,
        'aria-label': getItemAriaLabel('last', page),
        title: getItemAriaLabel('last', page),
      },
      ownerState,
    });

  const NextButton = slots.nextButton ?? 'button';
  const nextButtonProps: WithOptionalOwnerState<TablePaginationActionsButtonSlotProps> =
    useSlotProps({
      elementType: NextButton,
      externalSlotProps: slotProps.nextButton,
      additionalProps: {
        onClick: handleNextButtonClick,
        disabled: count !== -1 ? page >= Math.ceil(count / rowsPerPage) - 1 : false,
        'aria-label': getItemAriaLabel('next', page),
        title: getItemAriaLabel('next', page),
      },
      ownerState,
    });

  const BackButton = slots.backButton ?? 'button';
  const backButtonProps: WithOptionalOwnerState<TablePaginationActionsButtonSlotProps> =
    useSlotProps({
      elementType: BackButton,
      externalSlotProps: slotProps.backButton,
      additionalProps: {
        onClick: handleBackButtonClick,
        disabled: page === 0,
        'aria-label': getItemAriaLabel('previous', page),
        title: getItemAriaLabel('previous', page),
      },
      ownerState,
    });

  const LastPageIcon = slots.lastPageIcon ?? LastPageIconDefault;
  const FirstPageIcon = slots.firstPageIcon ?? FirstPageIconDefault;
  const NextPageIcon = slots.nextPageIcon ?? NextPageIconDefault;
  const BackPageIcon = slots.backPageIcon ?? BackPageIconDefault;

  return (
    <Root {...rootProps}>
      {showFirstButton && (
        <FirstButton {...firstButtonProps}>
          {direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
        </FirstButton>
      )}

      <BackButton {...backButtonProps}>
        {direction === 'rtl' ? <NextPageIcon /> : <BackPageIcon />}
      </BackButton>
      <NextButton {...nextButtonProps}>
        {direction === 'rtl' ? <BackPageIcon /> : <NextPageIcon />}
      </NextButton>
      {showLastButton && (
        <LastButton {...lastButtonProps}>
          {direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
        </LastButton>
      )}
    </Root>
  );
}) as PolymorphicComponent<TablePaginationActionsTypeMap>;

TablePaginationActions.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  count: PropTypes.number.isRequired,
  /**
   * Direction of the text.
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current page.
   * This is important for screen reader users.
   *
   * For localization purposes, you can use the provided [translations](/material-ui/guides/localization/).
   * @param {string} type The link or button type to format ('first' | 'last' | 'next' | 'previous').
   * @returns {string}
   */
  getItemAriaLabel: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  onPageChange: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  page: PropTypes.number.isRequired,
  /**
   * @ignore
   */
  rowsPerPage: PropTypes.number.isRequired,
  /**
   * @ignore
   */
  showFirstButton: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  showLastButton: PropTypes.bool.isRequired,
  /**
   * The props used for each slot inside the TablePagination.
   * @default {}
   */
  slotProps: PropTypes.shape({
    backButton: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    firstButton: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    lastButton: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    nextButton: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * The components used for each slot inside the TablePagination.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    backButton: PropTypes.elementType,
    backPageIcon: PropTypes.elementType,
    firstButton: PropTypes.elementType,
    firstPageIcon: PropTypes.elementType,
    lastButton: PropTypes.elementType,
    lastPageIcon: PropTypes.elementType,
    nextButton: PropTypes.elementType,
    nextPageIcon: PropTypes.elementType,
    root: PropTypes.elementType,
  }),
} as any;

export { TablePaginationActions };
