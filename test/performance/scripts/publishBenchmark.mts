import fs from 'node:fs';
import { benchmarkUploadSchema } from '@mui/internal-benchmark/ciReport';

const [reportPath] = process.argv.slice(2);
if (!reportPath) {
  throw new Error('Usage: node publishBenchmark.mts <report>');
}

const oidcToken = process.env.CIRCLE_OIDC_TOKEN_V2;
if (!oidcToken) {
  throw new Error('CIRCLE_OIDC_TOKEN_V2 is required to publish a benchmark.');
}

const report = benchmarkUploadSchema.parse(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
if (!report.base) {
  throw new Error('The benchmark comparison report is invalid.');
}

const apiUrl = process.env.CI_REPORT_API_URL ?? 'https://frontend-public.mui.com';
const headers = {
  Authorization: `Bearer ${oidcToken}`,
  'Content-Type': 'application/json',
};
const uploadResponse = await fetch(new URL('/api/ci-reports/upload', apiUrl), {
  method: 'POST',
  headers,
  body: JSON.stringify(report),
});
if (!uploadResponse.ok) {
  throw new Error(
    `Benchmark upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`,
  );
}

const syncResponse = await fetch(new URL('/api/ci-reports/sync-pr-comment', apiUrl), {
  method: 'POST',
  headers,
  body: JSON.stringify({ repo: report.repo }),
});
if (!syncResponse.ok) {
  throw new Error(`PR comment sync failed (${syncResponse.status}): ${await syncResponse.text()}`);
}

process.stdout.write('Uploaded benchmark and updated the consolidated PR comment.\n');
