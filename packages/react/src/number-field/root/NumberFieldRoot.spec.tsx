import { expectType } from '#test-utils';
import { NumberField } from '@base-ui-components/react/number-field';

type NumberFieldChangeHandler = NonNullable<NumberField.Root.Props['onValueChange']>;
type NumberFieldCommitHandler = NonNullable<NumberField.Root.Props['onValueCommitted']>;

type NumberFieldChangeDetails = Parameters<NumberFieldChangeHandler>[1];
type NumberFieldWheelEvent = Extract<NumberFieldChangeDetails, { reason: 'wheel' }>['event'];

expectType<WheelEvent, NumberFieldWheelEvent>(null as unknown as NumberFieldWheelEvent);

function assertNumberFieldChange(details: NumberFieldChangeDetails) {
  if (details.reason === 'wheel') {
    const wheelEvent: WheelEvent = details.event;
    void wheelEvent;
    // @ts-expect-error wheel details should not expose pointer events
    const pointerEvent: PointerEvent = details.event;
    void pointerEvent;
  }

  if (details.reason === 'increment-press') {
    const event: PointerEvent | MouseEvent | TouchEvent = details.event;
    void event;
  }

  if (details.reason === 'input-clear') {
    const event: InputEvent | FocusEvent | Event = details.event;
    void event;
    // @ts-expect-error keyboard events are not emitted for input-clear
    const keyboardEvent: KeyboardEvent = details.event;
    void keyboardEvent;
  }
}

type NumberFieldCommitDetails = Parameters<NumberFieldCommitHandler>[1];

function assertNumberFieldCommit(details: NumberFieldCommitDetails) {
  if (details.reason === 'wheel') {
    const event: WheelEvent = details.event;
    void event;
  }

  if (details.reason === 'scrub') {
    const event: PointerEvent = details.event;
    void event;
  }

  if (details.reason === 'input-clear') {
    const event: InputEvent | FocusEvent | Event = details.event;
    void event;
  }
}

const handleNumberFieldChange: NumberFieldChangeHandler = (value, details) => {
  expectType<number | null, typeof value>(value);
  assertNumberFieldChange(details);
};

const handleNumberFieldCommit: NumberFieldCommitHandler = (value, details) => {
  expectType<number | null, typeof value>(value);
  assertNumberFieldCommit(details);
};

const numberFieldEventNarrowing = (
  <NumberField.Root
    defaultValue={0}
    onValueChange={handleNumberFieldChange}
    onValueCommitted={handleNumberFieldCommit}
  />
);
