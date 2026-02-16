'use client';
import * as React from 'react';
import { set } from 'date-fns/set';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { TimeField } from '@base-ui/react/time-field';
import styles from './time-field-validation.module.css';

const today = new Date();
const minDate = set(today, { hours: 9, minutes: 0, seconds: 0 });
const maxDate = set(today, { hours: 17, minutes: 30, seconds: 0 });

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
                <TimeField.Root
                  id="time-required-native"
                  name="time-required-native"
                  className={styles.Root}
                  required
                >
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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

        {/* minDate validation */}
        <section>
          <h2>Min Time ({format(minDate, 'h:mm a')})</h2>
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
                  Time (min: {format(minDate, 'h:mm a')})
                </label>
                <TimeField.Root
                  id="time-min-native"
                  name="time-min-native"
                  className={styles.Root}
                  minDate={minDate}
                >
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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
                  Time (min: {format(minDate, 'h:mm a')})
                </Field.Label>
                <TimeField.Root className={styles.Root} minDate={minDate}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Root>
                <Field.Error match="rangeUnderflow" className={styles.Error}>
                  Time must be on or after {format(minDate, 'h:mm a')}
                </Field.Error>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>

        {/* maxDate validation */}
        <section>
          <h2>Max Time ({format(maxDate, 'h:mm a')})</h2>
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
                  Time (max: {format(maxDate, 'h:mm a')})
                </label>
                <TimeField.Root
                  id="time-max-native"
                  name="time-max-native"
                  className={styles.Root}
                  maxDate={maxDate}
                >
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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
                  Time (max: {format(maxDate, 'h:mm a')})
                </Field.Label>
                <TimeField.Root className={styles.Root} maxDate={maxDate}>
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </TimeField.Root>
                <Field.Error match="rangeOverflow" className={styles.Error}>
                  Time must be on or before {format(maxDate, 'h:mm a')}
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
                  className={styles.Root}
                  format="HH:mm:ss"
                >
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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
                  {(section) => (
                    <TimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
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
