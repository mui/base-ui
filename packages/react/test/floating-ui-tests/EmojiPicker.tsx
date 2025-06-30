import * as React from 'react';
import c from 'clsx';
import { useId } from '../../src/utils/useId';
import type { Placement } from '../../src/floating-ui-react/types';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from '../../src/floating-ui-react';
import { Button } from './Button';

const emojis = [
  {
    name: 'apple',
    emoji: '🍎',
  },
  {
    name: 'orange',
    emoji: '🍊',
  },
  {
    name: 'watermelon',
    emoji: '🍉',
  },
  {
    name: 'strawberry',
    emoji: '🍓',
  },
  {
    name: 'pear',
    emoji: '🍐',
  },
  {
    name: 'banana',
    emoji: '🍌',
  },
  {
    name: 'pineapple',
    emoji: '🍍',
  },
  {
    name: 'cherry',
    emoji: '🍒',
  },
  {
    name: 'peach',
    emoji: '🍑',
  },
];

type OptionProps = React.HTMLAttributes<HTMLButtonElement> & {
  name: string;
  active: boolean;
  selected: boolean;
  children: React.ReactNode;
};

/** @internal */
const Option = React.forwardRef<HTMLButtonElement, OptionProps>(function Option(
  { name, active, selected, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <button
      {...props}
      ref={ref}
      id={id}
      role="option"
      className={c('aspect-square cursor-default rounded text-center text-3xl select-none', {
        'bg-cyan-100': selected && !active,
        'bg-cyan-200': active,
        'opacity-40': name === 'orange',
      })}
      aria-selected={selected}
      disabled={name === 'orange'}
      aria-label={name}
      tabIndex={-1}
      data-active={active ? '' : undefined}
      type="button"
    >
      {children}
    </button>
  );
});

/** @internal */
export function Main() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedEmoji, setSelectedEmoji] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [placement, setPlacement] = React.useState<Placement | null>(null);

  const arrowRef = React.useRef(null);

  const listRef = React.useRef<Array<HTMLElement | null>>([]);

  const noResultsId = useId();

  const {
    floatingStyles,
    refs,
    context,
    placement: resultantPlacement,
  } = useFloating({
    placement: placement ?? 'bottom-start',
    open,
    onOpenChange: setOpen,
    // We don't want flipping to occur while searching, as the floating element
    // will resize and cause disorientation.
    middleware: [
      offset(8),
      ...(placement ? [] : [flip()]),
      arrow({
        element: arrowRef,
        padding: 20,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Handles opening the floating element via the Choose Emoji button.
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: 'menu' }),
  ]);

  // Handles the list navigation where the reference is the inner input, not
  // the button that opens the floating element.
  const {
    getReferenceProps: getInputProps,
    getFloatingProps: getListFloatingProps,
    getItemProps,
  } = useInteractions([
    useListNavigation(context, {
      listRef,
      onNavigate: open ? setActiveIndex : undefined,
      activeIndex,
      cols: 3,
      orientation: 'horizontal',
      loop: true,
      focusItemOnOpen: false,
      virtual: true,
      allowEscape: true,
    }),
  ]);

  React.useEffect(() => {
    if (open) {
      setPlacement(resultantPlacement);
    } else {
      setSearch('');
      setActiveIndex(null);
      setPlacement(null);
    }
  }, [open, resultantPlacement]);

  const handleEmojiClick = () => {
    if (activeIndex !== null) {
      // eslint-disable-next-line
      setSelectedEmoji(filteredEmojis[activeIndex].emoji);
      setOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEmojiClick();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveIndex(null);
    setSearch(event.target.value);
  };

  const filteredEmojis = emojis.filter(({ name }) =>
    name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );

  return (
    <React.Fragment>
      <h1 className="mb-8 text-5xl font-bold">Emoji Picker</h1>
      <div className="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <div className="text-center">
          <Button
            ref={refs.setReference}
            className="text-2xl"
            aria-label="Choose emoji"
            aria-describedby="emoji-label"
            data-open={open ? '' : undefined}
            {...getReferenceProps()}
          >
            ☻
          </Button>
          <br />
          {selectedEmoji && (
            <span id="emoji-label">
              <span
                style={{ fontSize: 30 }}
                aria-label={emojis.find(({ emoji }) => emoji === selectedEmoji)?.name}
              >
                {selectedEmoji}
              </span>{' '}
              selected
            </span>
          )}
          <FloatingPortal>
            {open && (
              <FloatingFocusManager context={context} modal={false}>
                <div
                  ref={refs.setFloating}
                  className="border-slate-900/10 rounded-lg border bg-white/70 bg-clip-padding p-4 shadow-md backdrop-blur-sm"
                  style={floatingStyles}
                  {...getFloatingProps(getListFloatingProps())}
                >
                  <span className="text-sm uppercase opacity-40">Emoji Picker</span>
                  <input
                    className="border-slate-300 focus:border-blue-600 my-2 block w-36 rounded border p-1 outline-none"
                    placeholder="Search emoji"
                    value={search}
                    aria-controls={filteredEmojis.length === 0 ? noResultsId : undefined}
                    {...getInputProps({
                      onChange: handleInputChange,
                      onKeyDown: handleKeyDown,
                    })}
                  />
                  {filteredEmojis.length === 0 && (
                    <p
                      key={search}
                      id={noResultsId}
                      role="region"
                      aria-atomic="true"
                      aria-live="assertive"
                    >
                      No results.
                    </p>
                  )}
                  {filteredEmojis.length > 0 && (
                    <div className="grid grid-cols-3" role="listbox">
                      {filteredEmojis.map(({ name, emoji }, index) => (
                        <Option
                          key={name}
                          name={name}
                          ref={(node) => {
                            listRef.current[index] = node;
                          }}
                          selected={selectedEmoji === emoji}
                          active={activeIndex === index}
                          {...getItemProps({
                            onClick: handleEmojiClick,
                          })}
                        >
                          {emoji}
                        </Option>
                      ))}
                    </div>
                  )}
                </div>
              </FloatingFocusManager>
            )}
          </FloatingPortal>
        </div>
      </div>
    </React.Fragment>
  );
}
