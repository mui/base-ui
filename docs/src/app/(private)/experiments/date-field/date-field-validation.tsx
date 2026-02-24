'use client';
import * as React from 'react';
import { startOfDay } from 'date-fns/startOfDay';
import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import { subYears } from 'date-fns/subYears';
import { addYears } from 'date-fns/addYears';
import { format } from 'date-fns/format';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DateField } from '@base-ui/react/date-field';
import styles from './date-field-validation.module.css';

const today = startOfDay(new Date());
const minDate = subDays(today, 7);
const maxDate = addDays(today, 30);

const minDateLarge = subYears(today, 5);
const maxDateLarge = addYears(today, 5);

export default function DateFieldValidation() {
  return (
    <div>
      <h1>Date Field Validation</h1>
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
                alert(`Submitted: ${formData.get('date-required-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-required-native">
                  Date (required)
                </label>
                <DateField.Root
                  id="date-required-native"
                  name="date-required-native"
                  className={styles.Root}
                  required
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-required-baseui']}`);
              }}
            >
              <Field.Root name="date-required-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>Date (required)</Field.Label>
                <DateField.Root className={styles.Root} required>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
                <Field.Error match="valueMissing" className={styles.Error}>
                  Please select a date
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
                alert(`Submitted: ${formData.get('date-min-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-min-native">
                  Date (min: {format(minDate, 'MMM d')})
                </label>
                <DateField.Root
                  id="date-min-native"
                  name="date-min-native"
                  className={styles.Root}
                  minDate={minDate}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-min-baseui']}`);
              }}
            >
              <Field.Root name="date-min-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date (min: {format(minDate, 'MMM d')})
                </Field.Label>
                <DateField.Root className={styles.Root} minDate={minDate}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
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
                alert(`Submitted: ${formData.get('date-max-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-max-native">
                  Date (max: {format(maxDate, 'MMM d')})
                </label>
                <DateField.Root
                  id="date-max-native"
                  name="date-max-native"
                  className={styles.Root}
                  maxDate={maxDate}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-max-baseui']}`);
              }}
            >
              <Field.Root name="date-max-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date (max: {format(maxDate, 'MMM d')})
                </Field.Label>
                <DateField.Root className={styles.Root} maxDate={maxDate}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
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

        {/* minDate + maxDate validation */}
        <section>
          <h2>
            Min Date ({format(minDate, 'MMM d, yyyy')}), Max Date ({format(maxDate, 'MMM d, yyyy')})
          </h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('date-min-max-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-min-max-native">
                  Date (min: {format(minDate, 'MMM d')}, max: {format(maxDate, 'MMM d')})
                </label>
                <DateField.Root
                  id="date-min-max-native"
                  name="date-min-max-native"
                  className={styles.Root}
                  minDate={minDate}
                  maxDate={maxDate}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-min-max-baseui']}`);
              }}
            >
              <Field.Root name="date-min-max-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date (min: {format(minDate, 'MMM d')}, max: {format(maxDate, 'MMM d')})
                </Field.Label>
                <DateField.Root className={styles.Root} minDate={minDate} maxDate={maxDate}>
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
                <Field.Error match="rangeUnderflow" className={styles.Error}>
                  Date must be on or after {format(minDate, 'MMM d, yyyy')}
                </Field.Error>
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

        {/* minDate + maxDate validation (multiple years) */}
        <section>
          <h2>
            Min Date ({format(minDateLarge, 'MMM d, yyyy')}), Max Date (
            {format(maxDateLarge, 'MMM d, yyyy')})
          </h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('date-min-max-large-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-min-max-large-native">
                  Date (min: {format(minDateLarge, 'MMM d')}, max: {format(maxDateLarge, 'MMM d')})
                </label>
                <DateField.Root
                  id="date-min-max-large-native"
                  name="date-min-max-large-native"
                  className={styles.Root}
                  minDate={minDateLarge}
                  maxDate={maxDateLarge}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-min-max-large-baseui']}`);
              }}
            >
              <Field.Root name="date-min-max-large-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date (min: {format(minDateLarge, 'MMM d')}, max: {format(maxDateLarge, 'MMM d')})
                </Field.Label>
                <DateField.Root
                  className={styles.Root}
                  minDate={minDateLarge}
                  maxDate={maxDateLarge}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
                <Field.Error match="rangeUnderflow" className={styles.Error}>
                  Date must be on or after {format(minDateLarge, 'MMM d, yyyy')}
                </Field.Error>
                <Field.Error match="rangeOverflow" className={styles.Error}>
                  Date must be on or before {format(maxDateLarge, 'MMM d, yyyy')}
                </Field.Error>
              </Field.Root>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </Form>
          </div>
        </section>

        {/* Format with week day + minDate validation */}
        <section>
          <h2>Min Date ({format(minDate, 'MMM d, yyyy')}) when the format contains week day</h2>
          <div className={styles.DemoList}>
            {/* Native form + label */}
            <form
              className={styles.Demo}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                alert(`Submitted: ${formData.get('date-weekday-native')}`);
              }}
            >
              <div className={styles.DemoField}>
                <div className={styles.SectionTitle}>Native</div>
                <label className={styles.Label} htmlFor="date-weekday-native">
                  Date (min: {format(minDate, 'MMM d')})
                </label>
                <DateField.Root
                  id="date-weekday-native"
                  name="date-weekday-native"
                  className={styles.Root}
                  format="EEEE, MMM d, yyyy"
                  minDate={minDate}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
              </div>
              <button type="submit" className={styles.Button}>
                Submit
              </button>
            </form>

            {/* Base UI Form + Field */}
            <Form
              className={styles.Demo}
              onFormSubmit={(formData) => {
                alert(`Submitted: ${formData['date-weekday-baseui']}`);
              }}
            >
              <Field.Root name="date-weekday-baseui" className={styles.DemoField}>
                <div className={styles.SectionTitle}>Base UI</div>
                <Field.Label className={styles.Label}>
                  Date (min: {format(minDate, 'MMM d')})
                </Field.Label>
                <DateField.Root
                  className={styles.Root}
                  format="EEEE, MMM d, yyyy"
                  minDate={minDate}
                >
                  {(section) => (
                    <DateField.Section
                      key={section.index}
                      className={styles.Section}
                      section={section}
                    />
                  )}
                </DateField.Root>
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
      </div>
    </div>
  );
}
