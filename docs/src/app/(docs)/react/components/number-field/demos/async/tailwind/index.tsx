'use client';
import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';

const unitPrice = 24;
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const stepperClasses =
  'flex h-full w-8 items-center justify-center border border-neutral-950 bg-white bg-clip-padding text-neutral-950 outline-0 select-none dark:border-white dark:bg-neutral-950 dark:text-white hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400';

interface Quote {
  quantity: number;
  total: number;
}

interface CalculatePricePayload {
  value: number | null;
  signal: AbortSignal;
}

async function calculatePrice(previousQuote: Quote, payload: CalculatePricePayload) {
  try {
    await wait(1000, payload.signal);
  } catch {
    return previousQuote;
  }

  const quantity = payload.value ?? 1;
  return {
    quantity,
    total: quantity * unitPrice,
  };
}

export default function ExampleNumberField() {
  const id = React.useId();
  const abortRef = React.useRef<AbortController | null>(null);
  const [quote, dispatchQuantityChange, isPending] = React.useActionState(calculatePrice, {
    quantity: 2,
    total: 2 * unitPrice,
  });

  async function updateQuantity(nextQuantity: number | null) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    await dispatchQuantityChange({
      value: nextQuantity,
      signal: abortRef.current.signal,
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <NumberField.Root
        id={id}
        min={1}
        value={quote.quantity}
        valueChangeAction={updateQuantity}
        className="flex flex-col items-start gap-1"
      >
        <label htmlFor={id} className="text-sm font-bold text-neutral-950 dark:text-white">
          Licenses
        </label>

        <NumberField.Group className="flex h-8">
          <NumberField.Decrement className={`${stepperClasses} border-r-0`}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className="h-full w-[7ch] border border-neutral-950 bg-white px-2 text-left text-sm font-normal text-neutral-950 tabular-nums any-pointer-coarse:text-base dark:border-white dark:bg-neutral-950 dark:text-white focus:z-1 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white" />
          <NumberField.Increment className={`${stepperClasses} border-l-0`}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>

      <div className="min-h-11 text-sm text-neutral-800 dark:text-neutral-200" aria-live="polite">
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <SpinnerIcon className="animate-spin" aria-hidden />
            Calculating...
          </span>
        ) : null}
        <p className="m-0 tabular-nums">Estimated total: {currencyFormatter.format(quote.total)}</p>
      </div>
    </div>
  );
}

function wait(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, delay);

    function handleAbort() {
      clearTimeout(timeout);
      reject(signal.reason);
    }

    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

function MinusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13" />
    </svg>
  );
}

function SpinnerIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
