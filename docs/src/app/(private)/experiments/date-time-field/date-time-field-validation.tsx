'use client';
import * as React from 'react';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DateTimeField } from '@base-ui/react/date-time-field';
import styles from './date-time-field-validation.module.css';

const today = new Date();
const minDate = subDays(today, 7);
const maxDate = addDays(today, 7);

export default function DateTimeFieldValidation() {
  return (
    <div>
      <h1>Date Time Field Validation</h1>
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
                alert(`Submitted: ${formData.get('datetime-required-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="datetime-required-native">
                  Date and Time (required)
                </label>
                <DateTimeField.Root
                  id="datetime-required-native"
                  name="datetime-required-native"
                  className={styles.Root}
                  required
                >
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['datetime-required-baseui']}`);
              }}
            >
              <Field.Root name="datetime-required-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>Date and Time (required)</Field.Label>
                <DateTimeField.Root className={styles.Root} required>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
                <Field.Error match="valueMissing" className={styles.Error}>
                  Please select a date and time
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
          <h2>Min Date ({format(minDate, 'MMM d, yyyy')})</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('datetime-min-date-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="datetime-min-date-native">
                  Date and Time (min: {format(minDate, 'MMM d')})
                </label>
                <DateTimeField.Root
                  id="datetime-min-date-native"
                  name="datetime-min-date-native"
                  className={styles.Root}
                  minDate={minDate}
                >
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['datetime-min-date-baseui']}`);
              }}
            >
              <Field.Root name="datetime-min-date-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date and Time (min: {format(minDate, 'MMM d')})
                </Field.Label>
                <DateTimeField.Root className={styles.Root} minDate={minDate}>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
                <Field.Error match="rangeUnderflow" className={styles.Error}>
                  Date must be on or after {format(minDate, 'MMM d, yyyy')}
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
          <h2>Max Date ({format(maxDate, 'MMM d, yyyy')})</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('datetime-max-date-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="datetime-max-date-native">
                  Date and Time (max: {format(maxDate, 'MMM d')})
                </label>
                <DateTimeField.Root
                  id="datetime-max-date-native"
                  name="datetime-max-date-native"
                  className={styles.Root}
                  maxDate={maxDate}
                >
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['datetime-max-date-baseui']}`);
              }}
            >
              <Field.Root name="datetime-max-date-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date and Time (max: {format(maxDate, 'MMM d')})
                </Field.Label>
                <DateTimeField.Root className={styles.Root} maxDate={maxDate}>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
                <Field.Error match="rangeOverflow" className={styles.Error}>
                  Date must be on or before {format(maxDate, 'MMM d, yyyy')}
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
            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['datetime-min-time-baseui']}`);
              }}
            >
              <Field.Root name="datetime-min-time-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date and Time (min time: {format(minDate, 'h:mm a')})
                </Field.Label>
                <DateTimeField.Root className={styles.Root} minDate={minDate}>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
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
            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['datetime-max-time-baseui']}`);
              }}
            >
              <Field.Root name="datetime-max-time-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date and Time (max time: {format(maxDate, 'h:mm a')})
                </Field.Label>
                <DateTimeField.Root className={styles.Root} maxDate={maxDate}>
                  {(section) => (
                    <DateTimeField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateTimeField.Root>
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
      </div>
    </div>
  );
}
