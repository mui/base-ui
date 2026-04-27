'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';

const demoPreviewCard = PreviewCard.createHandle<React.ReactElement>();

const cardContents = {
  typography: (
    <div className="box-border flex w-min flex-col gap-2 p-2">
      <img
        width="224"
        height="150"
        className="block max-w-none"
        src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
        alt="Station Hofplein signage in Rotterdam, Netherlands"
      />
      <p className="m-0 text-sm leading-5 text-gray-600 text-pretty dark:text-gray-400">
        <strong>Typography</strong> is the art and science of arranging type.
      </p>
    </div>
  ),
  design: (
    <div className="box-border flex w-min flex-col gap-2 p-2">
      <img
        width="241"
        height="240"
        className="block max-w-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Braun_ABW30_%28schwarz%29.jpg/250px-Braun_ABW30_%28schwarz%29.jpg"
        alt="Braun ABW30"
      />
      <p className="m-0 text-sm leading-5 text-gray-600 text-pretty dark:text-gray-400">
        A <strong>design</strong> is the concept or proposal for an object, process, or system.
      </p>
    </div>
  ),
  art: (
    <div className="box-border flex w-min flex-col gap-2 p-2">
      <img
        width="206"
        height="240"
        className="block max-w-none"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/MonaLisa_sfumato.jpeg/250px-MonaLisa_sfumato.jpeg"
        alt="Mona Lisa"
      />
      <p className="m-0 text-sm leading-5 text-gray-600 text-pretty dark:text-gray-400">
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
      <div className="flex flex-wrap items-baseline justify-center gap-2">
        <p className="m-0 text-base leading-6 text-gray-950 text-balance dark:text-white">
          Discover{' '}
          <PreviewCard.Trigger
            className="text-blue-800 underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:decoration-blue-800 data-[popup-open]:decoration-blue-800 focus-visible:no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:text-blue-500 dark:decoration-blue-500/60 dark:hover:decoration-blue-500 dark:data-[popup-open]:decoration-blue-500"
            handle={demoPreviewCard}
            href="https://en.wikipedia.org/wiki/Typography"
            id="trigger-1"
            payload={cardContents.typography}
          >
            typography
          </PreviewCard.Trigger>
          ,{' '}
          <PreviewCard.Trigger
            className="text-blue-800 underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:decoration-blue-800 data-[popup-open]:decoration-blue-800 focus-visible:no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:text-blue-500 dark:decoration-blue-500/60 dark:hover:decoration-blue-500 dark:data-[popup-open]:decoration-blue-500"
            handle={demoPreviewCard}
            href="https://en.wikipedia.org/wiki/Industrial_design"
            id="trigger-2"
            payload={cardContents.design}
          >
            design
          </PreviewCard.Trigger>
          , or{' '}
          <PreviewCard.Trigger
            className="text-blue-800 underline decoration-blue-800/60 decoration-1 underline-offset-2 outline-0 hover:decoration-blue-800 data-[popup-open]:decoration-blue-800 focus-visible:no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:text-blue-500 dark:decoration-blue-500/60 dark:hover:decoration-blue-500 dark:data-[popup-open]:decoration-blue-500"
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
          className="box-border flex h-10 items-center justify-center border border-gray-950 bg-white px-3.5 font-[inherit] text-base leading-6 font-normal text-gray-950 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800"
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
              <PreviewCard.Popup className="relative box-border h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-gray-950 bg-white text-gray-950 [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[transform,opacity] duration-100 ease-out data-[ending-style]:[transform:scale(0.98)] data-[ending-style]:opacity-0 data-[starting-style]:[transform:scale(0.98)] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
                <PreviewCard.Arrow className="relative block h-1.5 w-3 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:absolute before:bottom-0 before:left-1/2 before:box-border before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:border before:border-gray-950 before:bg-white before:content-[''] before:[transform:translate(-50%,50%)_rotate(45deg)] dark:before:border-white dark:before:bg-gray-950" />
                {payload}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </div>
  );
}
