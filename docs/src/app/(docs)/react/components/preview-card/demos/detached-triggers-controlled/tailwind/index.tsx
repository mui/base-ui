'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';

const demoPreviewCard = PreviewCard.createHandle<React.ReactElement>();

const cardContents = {
  typography: (
    <div className="w-min flex flex-col gap-2 p-2 box-border">
      <img
        width="224"
        height="150"
        className="block rounded-xs max-w-none"
        src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
        alt="Station Hofplein signage in Rotterdam, Netherlands"
      />
      <p className="m-0 text-sm leading-5 text-gray-900 text-pretty">
        <strong>Typography</strong> is the art and science of arranging type.
      </p>
    </div>
  ),
  design: (
    <div className="w-min flex flex-col gap-2 p-2 box-border">
      <img
        width="241"
        height="240"
        className="block rounded-xs max-w-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Braun_ABW30_%28schwarz%29.jpg/250px-Braun_ABW30_%28schwarz%29.jpg"
        alt="Braun ABW30"
      />
      <p className="m-0 text-sm leading-5 text-gray-900 text-pretty">
        A <strong>design</strong> is the concept or proposal for an object, process, or system.
      </p>
    </div>
  ),
  art: (
    <div className="w-min flex flex-col gap-2 p-2 box-border">
      <img
        width="206"
        height="240"
        className="block rounded-xs max-w-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/MonaLisa_sfumato.jpeg/250px-MonaLisa_sfumato.jpeg"
        alt="Mona Lisa"
      />
      <p className="m-0 text-sm leading-5 text-gray-900 text-pretty">
        <strong>Art</strong> is a diverse range of cultural activity centered around works utilizing
        creative or imaginative talents, which are expected to evoke a worthwhile experience,
        generally through an expression of emotional power, conceptual ideas, technical proficiency,
        or beauty.
      </p>
    </div>
  ),
};

export default function PreviewCardDetachedTriggersControlledDemo() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: PreviewCard.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap justify-center items-baseline">
        <p className="m-0 text-base leading-6 text-gray-900 text-balance">
          Discover{' '}
          <PreviewCard.Trigger
            className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:underline data-[popup-open]:underline focus-visible:rounded-[2px] focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
            handle={demoPreviewCard}
            href="https://en.wikipedia.org/wiki/Typography"
            id="trigger-1"
            payload={cardContents.typography}
          >
            typography
          </PreviewCard.Trigger>
          ,{' '}
          <PreviewCard.Trigger
            className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:underline data-[popup-open]:underline focus-visible:rounded-[2px] focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
            handle={demoPreviewCard}
            href="https://en.wikipedia.org/wiki/Industrial_design"
            id="trigger-2"
            payload={cardContents.design}
          >
            design
          </PreviewCard.Trigger>
          , or{' '}
          <PreviewCard.Trigger
            className="text-blue-800 no-underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:underline data-[popup-open]:underline focus-visible:rounded-[2px] focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-blue-800"
            handle={demoPreviewCard}
            href="https://en.wikipedia.org/wiki/Art"
            id="trigger-3"
            payload={cardContents.art}
          >
            art
          </PreviewCard.Trigger>
          .
        </p>
        <button
          type="button"
          className="box-border flex items-center justify-center h-10 px-3.5 m-0 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:bg-gray-100 active:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1"
          onClick={() => {
            setTriggerId('trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <PreviewCard.Root
        handle={demoPreviewCard}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              sideOffset={8}
              className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)]"
            >
              <PreviewCard.Popup className="box-border w-[var(--popup-width,auto)] h-[var(--popup-height,auto)] rounded-lg bg-[canvas] origin-[var(--transform-origin)] transition-[scale,opacity] duration-150 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1">
                <PreviewCard.Arrow className="flex data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </PreviewCard.Arrow>
                {payload}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </div>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}
