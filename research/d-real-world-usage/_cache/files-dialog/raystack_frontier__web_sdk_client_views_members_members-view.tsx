'use client';

import { useMemo, useState } from 'react';
import { ExclamationTriangleIcon, UpdateIcon } from '@radix-ui/react-icons';
import {
  AlertDialog,
  Button,
  Tooltip,
  Skeleton,
  Flex,
  Select,
  EmptyState,
  DataTable,
  Dialog,
  Image,
  Menu
} from '@raystack/apsara';
import deleteIcon from '../../assets/delete.svg';
import { useFrontier } from '../../contexts/FrontierContext';
import { useOrganizationMembers } from '../../hooks/useOrganizationMembers';
import { usePermissions } from '../../hooks/usePermissions';
import { AuthTooltipMessage } from '../../utils';
import { PERMISSIONS, shouldShowComponent } from '../../../utils';
import { ViewContainer } from '../../components/view-container';
import { ViewHeader } from '../../components/view-header';
import { getColumns, type MemberMenuPayload } from './components/member-columns';
import { InviteMemberDialog } from './components/invite-member-dialog';
import { RemoveMemberDialog, type RemoveMemberPayload } from './components/remove-member-dialog';
import { UpdateRoleDialog, type UpdateRolePayload } from './components/update-role-dialog';
import styles from './members-view.module.css';

const memberMenuHandle = Menu.createHandle<MemberMenuPayload>();
const inviteDialogHandle = Dialog.createHandle();
const removeMemberDialogHandle = AlertDialog.createHandle<RemoveMemberPayload>();
const updateRoleDialogHandle = AlertDialog.createHandle<UpdateRolePayload>();

export interface MembersViewProps {
  showTeamField?: boolean;
}

export function MembersView({ showTeamField = true }: MembersViewProps) {
  const { activeOrganization: organization } = useFrontier();

  const resource = `app/organization:${organization?.id}`;
  const listOfPermissionsToCheck = useMemo(
    () => [
      {
        permission: PERMISSIONS.InvitationCreatePermission,
        resource
      },
      {
        permission: PERMISSIONS.UpdatePermission,
        resource
      }
    ],
    [resource]
  );

  const { permissions, isFetching: isPermissionsFetching } = usePermissions(
    listOfPermissionsToCheck,
    !!organization?.id
  );

  const { canCreateInvite, canDeleteUser } = useMemo(() => {
    return {
      canCreateInvite: shouldShowComponent(
        permissions,
        `${PERMISSIONS.InvitationCreatePermission}::${resource}`
      ),
      canDeleteUser: shouldShowComponent(
        permissions,
        `${PERMISSIONS.UpdatePermission}::${resource}`
      )
    };
  }, [permissions, resource]);

  const {
    roles,
    members,
    memberRoles,
    refetch,
    isFetching: isOrgMembersLoading
  } = useOrganizationMembers({
    showInvitations: canCreateInvite
  });

  const isLoading = !organization?.id || isOrgMembersLoading || isPermissionsFetching;

  const [roleFilter, setRoleFilter] = useState('all');

  const filteredMembers = useMemo(() => {
    if (roleFilter === 'all') return members;
    return members.filter(member => {
      if (roleFilter === 'invited') return member.invited;
      if (member.invited) return false;
      const userRoles = member.id ? memberRoles[member.id] : [];
      return userRoles?.some(r => r.id === roleFilter);
    }) || [];
  }, [members, roleFilter, memberRoles]);

  const columns = useMemo(
    () =>
      getColumns({
        memberRoles,
        roles,
        canDeleteUser,
        menuHandle: memberMenuHandle
      }),
    [memberRoles, roles, canDeleteUser]
  );

  return (
    <ViewContainer>
      <ViewHeader
        title="Members"
        description="Manage members for this domain."
      />

      <DataTable
        data={filteredMembers}
        columns={columns}
        isLoading={isLoading}
        defaultSort={{ name: 'name', order: 'asc' }}
        mode="client"
      >
        <Flex direction="column" gap={7}>
          <Flex justify="between" gap={3}>
            <Flex gap={3} align="center">
              {isLoading ? (
                <>
                  <Skeleton height="34px" width="360px" />
                  <Skeleton height="34px" width="80px" />
                </>
              ) : (
                <>
                  <DataTable.Search
                    placeholder="Search by name or email"
                    size="large"
                    width={360}
                  />
                  <Select
                    value={roleFilter}
                    onValueChange={setRoleFilter}
                  >
                    <Select.Trigger className={styles.roleFilter}>
                      <Select.Value placeholder="All" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="all">All</Select.Item>
                      {roles.map(role => (
                        <Select.Item key={role.id} value={role.id || ''}>
                          {role.title || role.name}
                        </Select.Item>
                      ))}
                      <Select.Item value="invited">Invited</Select.Item>
                    </Select.Content>
                  </Select>
                </>
              )}
            </Flex>
            {isLoading ? (
              <Skeleton height="34px" width="120px" />
            ) : (
              <Tooltip>
                <Tooltip.Trigger
                  disabled={canCreateInvite}
                  render={<span />}
                >
                  <Button
                    variant="solid"
                    color="accent"
                    onClick={() => inviteDialogHandle.open(null)}
                    disabled={!canCreateInvite}
                    data-test-id="frontier-sdk-invite-member-btn"
                  >
                    Invite people
                  </Button>
                </Tooltip.Trigger>
                {!canCreateInvite && (
                  <Tooltip.Content>{AuthTooltipMessage}</Tooltip.Content>
                )}
              </Tooltip>
            )}
          </Flex>
          <DataTable.Content
            emptyState={
              <EmptyState
                icon={<ExclamationTriangleIcon />}
                heading="No members found"
                subHeading="Get started by adding your first member"
              />
            }
            classNames={{
              root: styles.tableRoot,
              table: styles.table,
              row: styles.tableRow
            }}
          />
        </Flex>
      </DataTable>

      <Menu handle={memberMenuHandle} modal={false}>
        {({ payload: rawPayload }) => {
          const payload = rawPayload as MemberMenuPayload | undefined;
          return (
            <Menu.Content align="end" className={styles.menuContent}>
              {payload?.canUpdateRole &&
                payload.excludedRoles.map(role => (
                  <Menu.Item
                    key={role.id}
                    leadingIcon={<UpdateIcon />}
                    onClick={() =>
                      updateRoleDialogHandle.openWithPayload({
                        memberId: payload.memberId,
                        role
                      })
                    }
                    data-test-id={`update-role-${role.name}-dropdown-item`}
                  >
                    Make {role.title}
                  </Menu.Item>
                ))}
              {payload?.canRemove && (
                <Menu.Item
                  leadingIcon={
                    <Image
                      src={deleteIcon as unknown as string}
                      alt="Remove"
                      width={16}
                      height={16}
                    />
                  }
                  onClick={() =>
                    removeMemberDialogHandle.openWithPayload({
                      memberId: payload.memberId,
                      invited: String(payload.invited)
                    })
                  }
                  data-test-id="remove-member-dropdown-item"
                  style={{
                    color: 'var(--rs-color-foreground-danger-primary)'
                  }}
                >
                  Remove
                </Menu.Item>
              )}
            </Menu.Content>
          );
        }}
      </Menu>

      <InviteMemberDialog
        handle={inviteDialogHandle}
        showTeamField={showTeamField}
        refetch={refetch}
      />
      <RemoveMemberDialog
        handle={removeMemberDialogHandle}
        refetch={refetch}
      />
      <UpdateRoleDialog
        handle={updateRoleDialogHandle}
        organizationId={organization?.id ?? ''}
        refetch={refetch}
      />
    </ViewContainer>
  );
}
