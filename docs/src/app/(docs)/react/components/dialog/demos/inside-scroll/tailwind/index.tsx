import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';

export default function InsideScrollDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
        Open dialog
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-opacity duration-[250ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center overflow-hidden py-6 [@media(min-height:600px)]:pb-12 [@media(min-height:600px)]:pt-8">
          <Dialog.Popup className="relative flex w-[min(40rem,calc(100vw-2rem))] max-h-full max-w-full min-h-0 flex-col overflow-hidden rounded-lg bg-gray-50 p-8 text-gray-900 shadow-[0_24px_45px_rgba(15,23,42,0.18)] outline-1 outline-gray-200 transition-all duration-[300ms] ease-[cubic-bezier(0.45,1.005,0,1.005)] data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 dark:outline-gray-300">
            <div className="mb-2 flex items-start justify-between gap-3">
              <Dialog.Title className="m-0 text-xl font-semibold leading-[1.875rem]">
                Dialog
              </Dialog.Title>
            </div>
            <Dialog.Description className="m-0 mb-4 text-base leading-[1.6rem] text-gray-600">
              This layout keeps the popup fully on screen while allowing its content to scroll.
            </Dialog.Description>
            <ScrollArea.Root className="relative flex min-h-0 flex-1 overflow-hidden before:absolute before:top-0 before:h-px before:w-full before:bg-gray-200 before:content-[''] after:absolute after:bottom-0 after:h-px after:w-full after:bg-gray-200 after:content-['']">
              <ScrollArea.Viewport className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-6 pr-6 pl-1 focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-blue-800">
                <ScrollArea.Content className="flex flex-col gap-6">
                  {CONTENT_SECTIONS.map((item) => (
                    <section key={item.title}>
                      <h3 className="mb-[0.4rem] text-base font-semibold leading-6">
                        {item.title}
                      </h3>
                      <p className="m-0 text-[0.95rem] leading-[1.55rem] text-gray-700">
                        {item.body}
                      </p>
                    </section>
                  ))}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="pointer-events-none absolute m-1 flex w-[0.25rem] justify-center rounded-[1rem] opacity-0 transition-opacity duration-[250ms] data-[hovering]:pointer-events-auto data-[hovering]:opacity-100 data-[hovering]:duration-[75ms] data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-[75ms] md:w-[0.325rem]">
                <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:left-1/2 before:top-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
            <div className="mt-4 flex justify-end gap-3">
              <Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                Close
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const CONTENT_SECTIONS = [
  {
    title: 'What a dialog is for',
    body: 'Use a dialog when you need the user to complete a focused task or read something important without navigating away. It opens on top of the page and returns focus back where it started when closed.',
  },
  {
    title: 'Anatomy at a glance',
    body: 'Root, Trigger, Portal, Backdrop, Popup, Title/Description, Close. Keep the title short and the first paragraph specific so screen readers announce something meaningful.',
  },
  {
    title: 'Opening and closing',
    body: 'Control it using external state via the `open` and `onOpenChange` props, or let it manage state for you internally.',
  },
  {
    title: 'Keyboard and focus behavior',
    body: 'Focus moves inside the dialog when it opens. Tab and Shift+Tab loop within, and Esc requests close.',
  },
  {
    title: 'Accessible labeling',
    body: 'Set an explicit title and description using the `Dialog.Title` and `Dialog.Description` components.',
  },
  {
    title: 'Backdrop and page scrolling',
    body: 'The backdrop visually separates layers while background content is inert. Don’t rely on dimness alone—keep copy clear and buttons obvious so actions are easy to choose.',
  },
  {
    title: 'Portals and stacking',
    body: 'Dialogs render in a portal so they sit above the `isolation: isolate` app content and avoid local z-index wars.',
  },
  {
    title: 'Viewport overflow',
    body: 'Let long content overflow the bottom edge and reveal as you scroll the page container. Keep generous padding at the top and bottom so the dialog doesn’t feel jammed against the edges.',
  },
  {
    title: 'Nested dialogs and confirmations',
    body: 'If closing a dialog needs confirmation, open a child alert dialog rather than mutating the current one. The parent stays visible behind it; only the topmost layer should feel interactive.',
  },
  {
    title: 'Transitions that respect motion settings',
    body: 'Use small, fast transitions (opacity plus a few pixels of Y translation or scale). Subtle motion helps people notice what changed without slowing them down.',
  },
  {
    title: 'Controlled vs. uncontrolled',
    body: 'Controlled state is best when other parts of the page need to react to open/close. Uncontrolled is fine for local cases where only the dialog matters.',
  },
  {
    title: 'Close affordances',
    body: 'Always offer a visible close button in the corner. Don’t rely only on Esc or the backdrop for pointer outside presses. Touch screen readers and accessibility users benefit from a clear, targetable control to click to close the dialog.',
  },
  {
    title: 'Forms inside dialogs',
    body: 'Keep forms short; longer flows usually deserve a full page. Validate inline, keep button text specific (“Create project”), and disable destructive actions until the input is valid.',
  },
  {
    title: 'Content guidelines',
    body: 'Lead with the outcome (“Rename project?”) and follow with one or two short, concrete sentences. Avoid long prose; link out for details instead.',
  },
  {
    title: 'SSR and hydration notes',
    body: 'Because dialogs render in a portal, make sure your portal container exists on the client.',
  },
  {
    title: 'Mobile ergonomics',
    body: 'Use larger touch targets and keep the close button reachable with the thumb. Avoid full-screen modals unless the task truly needs a whole screen.',
  },
  {
    title: 'Theming and density',
    body: 'Match spacing and corner radius to your system. Use a slightly denser layout than pages so the dialog feels purpose-built, not like a mini web page.',
  },
  {
    title: 'Internationalization',
    body: 'Plan for longer text. Buttons can grow to two lines; titles should wrap gracefully. Keep destructive terms consistent across locales.',
  },
  {
    title: 'Performance',
    body: 'Children are mounted lazily when the dialog opens. If the dialog can reopen often, consider the `keepMounted` prop sparingly to perform the work only once on mount to avoid re-initializing complex React trees on each open.',
  },
  {
    title: 'When a popover is better',
    body: 'If the content is a small hint or a few quick actions anchored to a control, use a popover or menu instead of a dialog. Dialogs interrupt on purpose—use that sparingly.',
  },
  {
    title: 'Follow-up and cleanup',
    body: 'After a successful action, close the dialog and show confirmation in context (toast, inline message, or updated UI) so people can see the result of what they just did.',
  },
];
