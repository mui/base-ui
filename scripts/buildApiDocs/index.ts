import yargs, { ArgumentsCamelCase } from 'yargs';
import { buildApi } from '@mui-internal/api-docs-builder';
import { projectSettings } from './config/projectSettings';

type CommandOptions = { grep?: string };

async function run(argv: ArgumentsCamelCase<CommandOptions>) {
  const grep = argv.grep == null ? null : new RegExp(argv.grep);
  return buildApi([projectSettings], grep);
}

yargs(process.argv.slice(2))
  .command({
    command: '$0',
    describe: 'Generates API documentation for the MUI packages.',
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
