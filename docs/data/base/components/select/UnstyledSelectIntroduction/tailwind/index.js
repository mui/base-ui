import * as React from 'react';
import PropTypes from 'prop-types';
import { Select as BaseSelect } from '@base_ui/react/legacy/Select';
import { Option as BaseOption } from '@base_ui/react/legacy/Option';
import { useTheme } from '@mui/system';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import clsx from 'clsx';
import { PopupContext } from '@base_ui/react/legacy/Unstable_Popup';
import { CssTransition } from '@base_ui/react/legacy/Transitions';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledSelectIntroduction() {
  // Replace this with your app logic for determining dark modes
  const isDarkMode = useIsDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Select defaultValue={10}>
        <Option value={10}>Documentation</Option>
        <Option value={20}>Components</Option>
        <Option value={30}>Features</Option>
      </Select>
    </div>
  );
}

const getOptionColorClasses = ({ selected, highlighted, disabled }) => {
  let classes = '';
  if (disabled) {
    classes += 'text-slate-400 dark:text-slate-700';
  } else {
    if (selected) {
      classes +=
        ' bg-purple-100 dark:bg-purple-950 text-purple-950 dark:text-purple-50';
    } else if (highlighted) {
      classes +=
        ' bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300';
    }
    classes +=
      ' hover:dark:bg-slate-800 hover:bg-slate-100 hover:dark:text-slate-300 hover:text-slate-900';
    classes +=
      ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 focus-visible:dark:outline-purple-300';
  }
  return classes;
};

const Option = React.forwardRef((props, ref) => {
  return (
    <BaseOption
      ref={ref}
      {...props}
      slotProps={{
        root: ({ selected, highlighted, disabled }) => ({
          className: `list-none p-2 rounded-lg cursor-default last-of-type:border-b-0 ${getOptionColorClasses(
            { selected, highlighted, disabled },
          )}`,
        }),
      }}
    />
  );
});

const Button = React.forwardRef(function Button(props, ref) {
  const { ownerState, ...other } = props;
  return (
    <button type="button" {...other} ref={ref}>
      {other.children}
      <UnfoldMoreRoundedIcon />
    </button>
  );
});

Button.propTypes = {
  children: PropTypes.node,
  ownerState: PropTypes.object.isRequired,
};

const AnimatedListbox = React.forwardRef(function AnimatedListbox(props, ref) {
  const { ownerState, ...other } = props;
  const popupContext = React.useContext(PopupContext);

  if (popupContext == null) {
    throw new Error(
      'The `AnimatedListbox` component cannot be rendered outside a `Popup` component',
    );
  }

  const verticalPlacement = popupContext.placement.split('-')[0];

  return (
    <CssTransition
      className={`placement-${verticalPlacement}`}
      enterClassName="open"
      exitClassName="closed"
    >
      <ul {...other} ref={ref} />
    </CssTransition>
  );
});

AnimatedListbox.propTypes = {
  ownerState: PropTypes.object.isRequired,
};

const resolveSlotProps = (fn, args) => (typeof fn === 'function' ? fn(args) : fn);

const Select = React.forwardRef(function CustomSelect(props, ref) {
  // Replace this with your app logic for determining dark modes
  const isDarkMode = useIsDarkMode();

  return (
    <BaseSelect
      ref={ref}
      {...props}
      slots={{
        root: Button,
        listbox: AnimatedListbox,
        ...props.slots,
      }}
      className={clsx('CustomSelect', props.className)}
      slotProps={{
        ...props.slotProps,
        root: (ownerState) => {
          const resolvedSlotProps = resolveSlotProps(
            props.slotProps?.root,
            ownerState,
          );
          return {
            ...resolvedSlotProps,
            className: clsx(
              `relative text-sm font-sans box-border w-80 px-3 py-2 rounded-lg text-left bg-white dark:bg-neutral-900 border border-solid border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-300 transition-all hover:bg-slate-50 dark:hover:bg-neutral-800 outline-0 shadow-md shadow-slate-100 dark:shadow-slate-900 ${
                ownerState.focusVisible
                  ? 'focus-visible:ring-4 ring-purple-500/30 focus-visible:border-purple-500 focus-visible:dark:border-purple-500'
                  : ''
              } [&>svg]:text-base	[&>svg]:absolute [&>svg]:h-full [&>svg]:top-0 [&>svg]:right-2.5`,
              resolvedSlotProps?.className,
            ),
          };
        },
        listbox: (ownerState) => {
          const resolvedSlotProps = resolveSlotProps(
            props.slotProps?.listbox,
            ownerState,
          );
          return {
            ...resolvedSlotProps,
            className: clsx(
              `text-sm font-sans p-1.5 my-3 w-80 rounded-xl overflow-auto outline-0 bg-white dark:bg-slate-900 border border-solid border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-300 shadow shadow-slate-200 dark:shadow-slate-900 [.open_&]:opacity-100 [.open_&]:scale-100 transition-[opacity,transform] [.closed_&]:opacity-0 [.closed_&]:scale-90 [.placement-top_&]:origin-bottom [.placement-bottom_&]:origin-top`,
              resolvedSlotProps?.className,
            ),
          };
        },
        popup: (ownerState) => {
          const resolvedSlotProps = resolveSlotProps(
            props.slotProps?.popup,
            ownerState,
          );
          return {
            ...resolvedSlotProps,
            className: clsx(
              `${isDarkMode ? 'dark' : ''} z-10`,
              resolvedSlotProps?.className,
            ),
          };
        },
      }}
    />
  );
});

Select.propTypes = {
  className: PropTypes.string,
  /**
   * The props used for each slot inside the Input.
   * @default {}
   */
  slotProps: PropTypes.shape({
    listbox: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    popup: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * The components used for each slot inside the Select.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    listbox: PropTypes.elementType,
    popup: PropTypes.elementType,
    root: PropTypes.elementType,
  }),
};
