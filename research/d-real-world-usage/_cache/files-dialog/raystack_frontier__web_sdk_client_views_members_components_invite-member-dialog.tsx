'use client';

import { useCallback, useMemo } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { create } from '@bufbuild/protobuf';
import { useMutation, useQuery } from '@connectrpc/connect-query';
import {
  FrontierServiceQueries,
  CreateOrganizationInvitationRequestSchema,
  ListOrganizationRolesRequestSchema,
  ListRolesRequestSchema,
  ListOrganizationGroupsRequestSchema
} from '@raystack/proton/frontier';
import {
  Button,
  Skeleton,
  Text,
  Label,
  Select,
  Flex,
  Dialog,
  Field,
  TextArea,
  toastManager
} from '@raystack/apsara';
import { useFrontier } from '../../../contexts/FrontierContext';
import { PERMISSIONS } from '../../../../utils';
import { handleConnectError } from '~/utils/error';

const inviteSchema = yup.object({
  type: yup.string().required(),
  team: yup.string(),
  emails: yup.string().required()
});

type InviteSchemaType = yup.InferType<typeof inviteSchema>;

export interface InviteMemberDialogProps {
  handle: ReturnType<typeof Dialog.createHandle>;
  showTeamField?: boolean;
  refetch: () => void;
}

export function InviteMemberDialog({ handle, showTeamField = true, refetch }: InviteMemberDialogProps) {
  const {
    watch,
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(inviteSchema)
  });
  const { activeOrganization: organization } = useFrontier();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      refetch();
    }
  };

  const { data: orgRolesData, isLoading: isOrgRolesLoading } = useQuery(
    FrontierServiceQueries.listOrganizationRoles,
    create(ListOrganizationRolesRequestSchema, {
      orgId: organization?.id || '',
      scopes: [PERMISSIONS.OrganizationNamespace]
    }),
    { enabled: !!organization?.id }
  );

  const orgRoles = useMemo(() => orgRolesData?.roles || [], [orgRolesData]);

  const { data: globalRolesData, isLoading: isGlobalRolesLoading } = useQuery(
    FrontierServiceQueries.listRoles,
    create(ListRolesRequestSchema, {
      scopes: [PERMISSIONS.OrganizationNamespace]
    }),
    { enabled: !!organization?.id }
  );

  const globalRoles = useMemo(
    () => globalRolesData?.roles || [],
    [globalRolesData]
  );

  const { data: teamsData, isLoading: isGroupsLoading } = useQuery(
    FrontierServiceQueries.listOrganizationGroups,
    create(ListOrganizationGroupsRequestSchema, {
      orgId: organization?.id || ''
    }),
    { enabled: !!organization?.id && showTeamField }
  );

  const teams = useMemo(() => teamsData?.groups || [], [teamsData]);

  const isLoading =
    isOrgRolesLoading || isGlobalRolesLoading || (showTeamField && isGroupsLoading);

  const roles = useMemo(
    () => [...(globalRoles || []), ...(orgRoles || [])],
    [globalRoles, orgRoles]
  );

  const { mutateAsync: createInvitation } = useMutation(
    FrontierServiceQueries.createOrganizationInvitation,
    {
      onSuccess: () => {
        toastManager.add({ title: 'User(s) invited', type: 'success' });
        handle.close();
      }
    }
  );

  const values = watch(['emails', 'type']);

  const onSubmit = useCallback(
    async ({ emails, type, team }: InviteSchemaType) => {
      const emailList = emails
        .split(',')
        .map(e => e.trim())
        .filter(str => str.length > 0);

      if (!organization?.id) return;
      if (!emailList.length) return;
      if (!type) return;

      try {
        const req = create(CreateOrganizationInvitationRequestSchema, {
          orgId: organization.id,
          userIds: emailList,
          groupIds: showTeamField && team ? [team] : undefined,
          roleIds: [type]
        });
        await createInvitation(req);
      } catch (error) {
        handleConnectError(error, {
          AlreadyExists: () => toastManager.add({ title: 'Invitation already exists', type: 'error' }),
          InvalidArgument: (err) => toastManager.add({ title: 'Invalid input', description: err.message, type: 'error' }),
          PermissionDenied: () => toastManager.add({ title: "You don't have permission to perform this action", type: 'error' }),
          Default: (err) => toastManager.add({ title: 'Something went wrong', description: err.message, type: 'error' }),
        });
      }
    },
    [createInvitation, organization?.id, showTeamField]
  );

  const isDisabled = useMemo(() => {
    const [emails, type] = values;
    const emailList =
      emails
        ?.split(',')
        .map((e: string) => e.trim())
        .filter((str: string) => str.length > 0) || [];
    return emailList.length <= 0 || !type || isSubmitting;
  }, [isSubmitting, values]);

  return (
    <Dialog handle={handle} onOpenChange={handleOpenChange}>
      <Dialog.Content width={600}>
        <Dialog.Header>
          <Dialog.Title>Invite people</Dialog.Title>
        </Dialog.Header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Body>
            <Flex direction="column" gap={7}>
              {isLoading ? (
                <Skeleton height="80px" />
              ) : (
                <Field label="Email">
                  <TextArea
                    {...register('emails')}
                    placeholder="abc@example.com, xyz@example.com"
                  />
                </Field>
              )}
              <Flex direction="column" gap={2}>
                <Label>Invite as</Label>
                {isLoading ? (
                  <Skeleton height="36px" />
                ) : (
                  <Controller
                    render={({ field }) => {
                      const { ref, onChange, ...rest } = field;
                      return (
                        <Select
                          {...rest}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value placeholder="Select a role" />
                          </Select.Trigger>
                          <Select.Content>
                            {!roles.length && (
                              <Text size="small" variant="secondary">
                                No roles available
                              </Text>
                            )}
                            {roles.map(role => (
                              <Select.Item
                                value={role.id || ''}
                                key={role.id}
                              >
                                {role.title || role.name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      );
                    }}
                    control={control}
                    name="type"
                  />
                )}
              </Flex>
              {showTeamField && (
                <Flex direction="column" gap={2}>
                  <Label>Add to team (optional)</Label>
                  {isLoading ? (
                    <Skeleton height="36px" />
                  ) : (
                    <Controller
                      render={({ field }) => {
                        const { ref, onChange, ...rest } = field;
                        return (
                          <Select
                            {...rest}
                            onValueChange={onChange}
                          >
                            <Select.Trigger ref={ref}>
                              <Select.Value placeholder="Select a team" />
                            </Select.Trigger>
                            <Select.Content>
                              {!teams?.length && (
                                <Text size="small" variant="secondary">
                                  No teams available
                                </Text>
                              )}
                              {(teams || []).map(t => (
                                <Select.Item value={t.id || ''} key={t.id}>
                                  {t.title}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        );
                      }}
                      control={control}
                      name="team"
                    />
                  )}
                </Flex>
              )}
            </Flex>
          </Dialog.Body>
          <Dialog.Footer>
            <Flex justify="end">
              <Button
                type="submit"
                variant="solid"
                color="accent"
                disabled={isDisabled}
                data-test-id="frontier-sdk-send-member-invite-btn"
                loading={isSubmitting}
                loaderText="Sending..."
              >
                Send invites
              </Button>
            </Flex>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
