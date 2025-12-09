'use client';
import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import styles from './index.module.css';

const mainPermissions = ['view-dashboard', 'manage-users', 'access-reports'];
const userManagementPermissions = ['create-user', 'edit-user', 'delete-user', 'assign-roles'];

export default function PermissionsForm() {
  const id = React.useId();
  const [mainValue, setMainValue] = React.useState<string[]>([]);
  const [managementValue, setManagementValue] = React.useState<string[]>([]);

  return (
    <CheckboxGroup
      aria-labelledby={id}
      value={mainValue}
      onValueChange={(value) => {
        if (value.includes('manage-users')) {
          setManagementValue(userManagementPermissions);
        } else if (managementValue.length === userManagementPermissions.length) {
          setManagementValue([]);
        }
        setMainValue(value);
      }}
      allValues={mainPermissions}
      className={styles.CheckboxGroup}
      style={{ marginLeft: '1rem' }}
    >
      <label className={styles.Item} id={id} style={{ marginLeft: '-1rem' }}>
        <Checkbox.Root
          className={styles.Checkbox}
          parent
          indeterminate={
            managementValue.length > 0 &&
            managementValue.length !== userManagementPermissions.length
          }
        >
          <Checkbox.Indicator
            className={styles.Indicator}
            render={(props, state) => (
              <span {...props}>
                {state.indeterminate ? (
                  <HorizontalRuleIcon className={styles.Icon} />
                ) : (
                  <CheckIcon className={styles.Icon} />
                )}
              </span>
            )}
          />
        </Checkbox.Root>
        User Permissions
      </label>

      <label className={styles.Item}>
        <Checkbox.Root value="view-dashboard" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        View Dashboard
      </label>

      <label className={styles.Item}>
        <Checkbox.Root value="access-reports" className={styles.Checkbox}>
          <Checkbox.Indicator className={styles.Indicator}>
            <CheckIcon className={styles.Icon} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Access Reports
      </label>

      <CheckboxGroup
        aria-labelledby="manage-users-caption"
        className={styles.CheckboxGroup}
        value={managementValue}
        onValueChange={(value) => {
          if (value.length === userManagementPermissions.length) {
            setMainValue((prev) => Array.from(new Set([...prev, 'manage-users'])));
          } else {
            setMainValue((prev) => prev.filter((v) => v !== 'manage-users'));
          }
          setManagementValue(value);
        }}
        allValues={userManagementPermissions}
        style={{ marginLeft: '1rem' }}
      >
        <label className={styles.Item} id="manage-users-caption" style={{ marginLeft: '-1rem' }}>
          <Checkbox.Root className={styles.Checkbox} parent>
            <Checkbox.Indicator
              className={styles.Indicator}
              render={(props, state) => (
                <span {...props}>
                  {state.indeterminate ? (
                    <HorizontalRuleIcon className={styles.Icon} />
                  ) : (
                    <CheckIcon className={styles.Icon} />
                  )}
                </span>
              )}
            />
          </Checkbox.Root>
          Manage Users
        </label>

        <label className={styles.Item}>
          <Checkbox.Root value="create-user" className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon className={styles.Icon} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Create User
        </label>

        <label className={styles.Item}>
          <Checkbox.Root value="edit-user" className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon className={styles.Icon} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Edit User
        </label>

        <label className={styles.Item}>
          <Checkbox.Root value="delete-user" className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon className={styles.Icon} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Delete User
        </label>

        <label className={styles.Item}>
          <Checkbox.Root value="assign-roles" className={styles.Checkbox}>
            <Checkbox.Indicator className={styles.Indicator}>
              <CheckIcon className={styles.Icon} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Assign Roles
        </label>
      </CheckboxGroup>
    </CheckboxGroup>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentcolor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
