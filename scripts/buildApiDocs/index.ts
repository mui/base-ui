import yargs, { ArgumentsCamelCase } from 'yargs';
import { buildApi } from '@mui-internal/api-docs-builder';
import { buildReference } from './buildReference';
import { projectSettings, newProjectSettings } from './config/projectSettings';

type CommandOptions = { grep?: string };

async function run(argv: ArgumentsCamelCase<CommandOptions>) {
  const grep = argv.grep == null ? null : new RegExp(argv.grep);
  await buildApi([projectSettings], grep);
  await buildApi([newProjectSettings], grep, true);
  await buildReference();
}

yargs(process.argv.slice(2))
  .command({
    command: '$0',
    describe: 'Generates API documentation for Base UI.',
    builder: (command) => {
      return command.option('grep', {
        description:
          'Only generate files for component filenames matching the pattern. The string is treated as a RegExp.',
        type: 'string',
      });
    },
    handler: run,
  })
  .help()
  .strict(true)
  .version(false)
  .parse();
