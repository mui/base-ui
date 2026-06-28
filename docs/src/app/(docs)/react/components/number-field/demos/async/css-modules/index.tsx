'use client';
import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';
import styles from './index.module.css';

const unitPrice = 24;
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

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
    <div className={styles.Field}>
      <NumberField.Root
        id={id}
        min={1}
        value={quote.quantity}
        valueChangeAction={updateQuantity}
        className={styles.NumberField}
      >
        <label htmlFor={id} className={styles.Label}>
          Licenses
        </label>

        <NumberField.Group className={styles.Group}>
          <NumberField.Decrement className={styles.Decrement}>
            <MinusIcon />
          </NumberField.Decrement>
          <NumberField.Input className={styles.Input} />
          <NumberField.Increment className={styles.Increment}>
            <PlusIcon />
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>

      <div className={styles.Status} aria-live="polite">
        {isPending ? (
          <span className={styles.Pending}>
            <SpinnerIcon className={styles.Spinner} aria-hidden />
            Calculating...
          </span>
        ) : null}
        <p className={styles.Total}>Estimated total: {currencyFormatter.format(quote.total)}</p>
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
