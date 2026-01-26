'use client';
import * as React from 'react';
import { set } from 'date-fns/set';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { TimeField } from '@base-ui/react/time-field';
import styles from './time-field-validation.module.css';

const today = new Date();
const minTime = set(today, { hours: 9, minutes: 0, seconds: 0 });
const maxTime = set(today, { hours: 17, minutes: 30, seconds: 0 });

function TimeFieldInput() {
  return (
    <TimeField.Input className={styles.Input}>
      {(section) => (
        <TimeField.Section key={section.index} className={styles.Section} section={section} />
      )}
    </TimeField.Input>
  );
}

export default function TimeFieldValidation() {
  return (
    <div>
      <h1>Time Field Validation</h1>
      <div className={styles.Page}>
        {/* Required validation */}
        <section>
          <h2>Required</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('time-required-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="time-required-native">
                  Time (required)
                </label>
                <TimeField.Root id="time-required-native" name="time-required-native" required>
                  <TimeFieldInput />
                </TimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['time-required-baseui']}`);
              }}
            >
              <Field.Root name="time-required-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>Time (required)</Field.Label>
                <TimeField.Root className={styles.Root} required>
                  <TimeFieldInput />
                </TimeField.Root>
                <Field.Error match="valueMissing" className={styles.Error}>
                  Please select a time
                </Field.Error>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>

        {/* minTime validation */}
        <section>
          <h2>Min Time ({format(minTime, 'h:mm a')})</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('time-min-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="time-min-native">
                  Time (min: {format(minTime, 'h:mm a')})
                </label>
                <TimeField.Root id="time-min-native" name="time-min-native" minTime={minTime}>
                  <TimeFieldInput />
                </TimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['time-min-baseui']}`);
              }}
            >
              <Field.Root name="time-min-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Time (min: {format(minTime, 'h:mm a')})
                </Field.Label>
                <TimeField.Root className={styles.Root} minTime={minTime}>
                  <TimeFieldInput />
                </TimeField.Root>
                <Field.Error match="rangeUnderflow" className={styles.Error}>
                  Time must be on or after {format(minTime, 'h:mm a')}
                </Field.Error>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>

        {/* maxTime validation */}
        <section>
          <h2>Max Time ({format(maxTime, 'h:mm a')})</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('time-max-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="time-max-native">
                  Time (max: {format(maxTime, 'h:mm a')})
                </label>
                <TimeField.Root id="time-max-native" name="time-max-native" maxTime={maxTime}>
                  <TimeFieldInput />
                </TimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['time-max-baseui']}`);
              }}
            >
              <Field.Root name="time-max-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Time (max: {format(maxTime, 'h:mm a')})
                </Field.Label>
                <TimeField.Root className={styles.Root} maxTime={maxTime}>
                  <TimeFieldInput />
                </TimeField.Root>
                <Field.Error match="rangeOverflow" className={styles.Error}>
                  Time must be on or before {format(maxTime, 'h:mm a')}
                </Field.Error>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>

        {/* Format with seconds */}
        <section>
          <h2>With Seconds (HH:mm:ss)</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('time-seconds-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="time-seconds-native">
                  Time with seconds
                </label>
                <TimeField.Root
                  id="time-seconds-native"
                  name="time-seconds-native"
                  format="HH:mm:ss"
                >
                  <TimeFieldInput />
                </TimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['time-seconds-baseui']}`);
              }}
            >
              <Field.Root name="time-seconds-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>Time with seconds</Field.Label>
                <TimeField.Root className={styles.Root} format="HH:mm:ss">
                  <TimeFieldInput />
                </TimeField.Root>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>
      </div>
    </div>
  );
}
