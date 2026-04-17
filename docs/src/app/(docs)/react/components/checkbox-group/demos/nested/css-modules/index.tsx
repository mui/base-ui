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
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
