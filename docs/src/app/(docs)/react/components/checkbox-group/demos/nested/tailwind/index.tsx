'use client';
import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';

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
      className="flex flex-col items-start gap-1 text-neutral-950 dark:text-white"
      style={{ marginLeft: '1rem' }}
    >
      <label
        className="flex items-center gap-2 text-sm font-normal"
        id={id}
        style={{ marginLeft: '-1rem' }}
      >
        <Checkbox.Root
          className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          parent
          indeterminate={
            managementValue.length > 0 &&
            managementValue.length !== userManagementPermissions.length
          }
        >
          <Checkbox.Indicator
            className="flex data-unchecked:hidden"
            render={(props, state) => (
              <span {...props}>{state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}</span>
            )}
          />
        </Checkbox.Root>
        User Permissions
      </label>

      <label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox.Root
          value="view-dashboard"
          className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          <Checkbox.Indicator className="flex data-unchecked:hidden">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        View Dashboard
      </label>

      <label className="flex items-center gap-2 text-sm font-normal">
        <Checkbox.Root
          value="access-reports"
          className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
        >
          <Checkbox.Indicator className="flex data-unchecked:hidden">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Access Reports
      </label>

      <CheckboxGroup
        aria-labelledby="manage-users-caption"
        className="flex flex-col items-start gap-1 text-neutral-950 dark:text-white"
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
        <label
          className="flex items-center gap-2 text-sm font-normal"
          id="manage-users-caption"
          style={{ marginLeft: '-1rem' }}
        >
          <Checkbox.Root
            className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
            parent
          >
            <Checkbox.Indicator
              className="flex data-unchecked:hidden"
              render={(props, state) => (
                <span {...props}>
                  {state.indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
                </span>
              )}
            />
          </Checkbox.Root>
          Manage Users
        </label>

        <label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox.Root
            value="create-user"
            className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          >
            <Checkbox.Indicator className="flex data-unchecked:hidden">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Create User
        </label>

        <label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox.Root
            value="edit-user"
            className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          >
            <Checkbox.Indicator className="flex data-unchecked:hidden">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Edit User
        </label>

        <label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox.Root
            value="delete-user"
            className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          >
            <Checkbox.Indicator className="flex data-unchecked:hidden">
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox.Root>
          Delete User
        </label>

        <label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox.Root
            value="assign-roles"
            className="box-border m-0 flex size-4 shrink-0 items-center justify-center rounded-none border border-neutral-950 bg-white p-0 text-white dark:border-white dark:bg-neutral-950 dark:text-neutral-950 data-checked:bg-neutral-950 data-checked:text-white data-indeterminate:bg-neutral-950 data-indeterminate:text-white dark:data-checked:bg-white dark:data-checked:text-neutral-950 dark:data-indeterminate:bg-white dark:data-indeterminate:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          >
            <Checkbox.Indicator className="flex data-unchecked:hidden">
              <CheckIcon />
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
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

function HorizontalRuleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      strokeWidth={1}
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
