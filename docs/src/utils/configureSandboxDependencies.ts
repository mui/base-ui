import { ponyfillGlobal } from '@mui/utils';

function getMuiPackageVersion(packageName: string, commitRef: string) {
  if (commitRef === undefined) {
    // #default-branch-switch
    return 'latest';
  }
  const shortSha = commitRef.slice(0, 8);
  return `https://pkg.csb.dev/mui/base-ui/commit/${shortSha}/${packageName}`;
}

export default function configureSandboxDependencies() {
  ponyfillGlobal.muiDocConfig = {
    csbGetVersions: (
      versions: Record<string, string>,
      { muiCommitRef }: { muiCommitRef: string },
    ) => {
      const output = {
        ...versions,
        '@base_ui/react': getMuiPackageVersion('@base_ui/react', muiCommitRef),
      };
      return output;
    },
  };
}
