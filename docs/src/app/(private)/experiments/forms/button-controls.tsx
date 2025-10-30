'use client';
import * as React from 'react';
import { Field } from '@base-ui-components/react/field';
import { Fieldset } from '@base-ui-components/react/fieldset';
import { Form } from '@base-ui-components/react/form';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Radio } from '@base-ui-components/react/radio';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import styles from './form.module.css';
import { CheckIcon } from './_icons';

function PullRequestsCheckboxGroup() {
  return (
    <Field.Root
      name="pull-requests"
      className={styles.Field}
      validate={(value) => {
        return (value as string[]).length === 0 ? 'Required' : null;
      }}
      render={
        <Fieldset.Root
          render={<CheckboxGroup defaultValue={[]} className={styles.CheckboxGroup} />}
        />
      }
    >
      <Fieldset.Legend className={styles.Legend}>Pull Requests (Required)</Fieldset.Legend>

      <Field.Item className={styles.FieldItem}>
        <Checkbox.Root value="merge" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.CheckboxIndicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Allow merge commits</Field.Label>
          <Field.Description className={styles.Description}>
            Add all commits from the head branch to the base branch with a merge commit.
          </Field.Description>
        </div>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Checkbox.Root value="squash" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.CheckboxIndicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Allow squash merging</Field.Label>
          <Field.Description className={styles.Description}>
            Combine all commits from the head branch into a single commit in the base branch.
          </Field.Description>
        </div>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Checkbox.Root value="rebase" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.CheckboxIndicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Allow rebase merging</Field.Label>
          <Field.Description className={styles.Description}>
            Add all commits from the head branch onto the base branch individually.
          </Field.Description>
        </div>
      </Field.Item>
      <Field.Error className={styles.Error} />
    </Field.Root>
  );
}

function StickersRadioGroup() {
  return (
    <Field.Root
      name="stickers"
      className={styles.Field}
      render={<Fieldset.Root render={<RadioGroup required />} className={styles.RadioGroup} />}
    >
      <Fieldset.Legend className={styles.Legend}>Stickers</Fieldset.Legend>
      <Field.Item className={styles.FieldItem}>
        <Field.Label className={styles.Label}>
          <Radio.Root value="always" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          Always animate
        </Field.Label>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Field.Label className={styles.Label}>
          <Radio.Root value="interaction" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          <div>
            Animate on interaction
            <Field.Description className={styles.Description}>
              On the desktop client, stickers will animate on hover or focus. On mobile clients,
              stickers will animate on long-press.
            </Field.Description>
          </div>
        </Field.Label>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Field.Label className={styles.Label}>
          <Radio.Root value="never" className={styles.Radio}>
            <Radio.Indicator className={styles.Indicator} />
          </Radio.Root>
          Never animate
        </Field.Label>
      </Field.Item>
      <Field.Error className={styles.Error} />
    </Field.Root>
  );
}

function DmSpamRadioGroup() {
  return (
    <Field.Root
      className={styles.Field}
      name="dmSpam"
      validationMode="onChange"
      render={<Fieldset.Root render={<RadioGroup required />} className={styles.RadioGroup} />}
    >
      <Fieldset.Legend className={styles.Legend}>Direct Message spam</Fieldset.Legend>
      <Field.Item className={styles.FieldItem}>
        <Radio.Root value="all" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Filter all</Field.Label>
          <Field.Description className={styles.Description}>
            All DMs will be filtered for spam
          </Field.Description>
        </div>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Radio.Root value="non-friends" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Filter from non-friends</Field.Label>
          <Field.Description className={styles.Description}>
            DMs from non-friends will be filtered for spam
          </Field.Description>
        </div>
      </Field.Item>

      <Field.Item className={styles.FieldItem}>
        <Radio.Root value="none" className={styles.Radio}>
          <Radio.Indicator className={styles.Indicator} />
        </Radio.Root>
        <div className={styles.FieldItemName}>
          <Field.Label className={styles.Label}>Do not filter</Field.Label>
          <Field.Description className={styles.Description}>
            DMs will not be filtered for spam
          </Field.Description>
        </div>
      </Field.Item>

      <Field.Error className={styles.Error} />
    </Field.Root>
  );
}

export default function ButtonControlsForm() {
  return (
    <Form
      className={styles.Form}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        console.log('submitting:', formData.getAll('pull-requests'));
      }}
      style={{
        fontFamily: 'var(--font-sans)',
      }}
    >
      <PullRequestsCheckboxGroup />
      <StickersRadioGroup />
      <DmSpamRadioGroup />

      <button type="submit" className={styles.Button}>
        Submit
      </button>
    </Form>
  );
}
