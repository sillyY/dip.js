#!/usr/bin/env node
import * as log from '../build/output/log';
import arg from 'arg';
['react', 'react-dom'].forEach((dependency) => {
  try {
    // When 'npm link' is used it checks the clone location. Not the project.
    require.resolve(dependency);
  } catch (err) {
    // tslint:disable-next-line
    console.warn(
      `The module '${dependency}' was not found. Next.js requires that you include it in 'dependencies' of your 'package.json'. To add it, run 'npm install ${dependency}'`
    );
  }
});

const defaultCommand = 'dev';
export type cliCommand = (argv?: string[]) => void;
const commands: { [command: string]: () => Promise<cliCommand> } = {
  dev: async () => await import('../cli/dip-dev').then((i) => i.dipDev),
};

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,
    '--inspect': Boolean,

    // Aliases
    '-v': '--version',
    '-h': '--help',
  },
  {
    permissive: true,
  }
);

// Version is inlined into the file using taskr build pipeline
if (args['--version']) {
  // tslint:disable-next-line
  console.log(`Dip.js v${process.env.__DIP_VERSION}`)
  process.exit(0)
}

// Check if we are running `dip <subcommand>` or `dip`
const foundCommand = Boolean(commands[args._[0]])

// Makes sure the `dip <subcommand> --help` case is covered
// This help message is only showed for `dip --help`
if (!foundCommand && args['--help']) {
  // tslint:disable-next-line
  console.log(`
    Usage
      $ dip <command>

    Available commands
      ${Object.keys(commands).join(', ')}

    Options
      --version, -v   Version number
      --help, -h      Displays this message

    For more information run a command with the --help flag
      $ next build --help
  `)
  process.exit(0)
}

const command = foundCommand ? args._[0] : defaultCommand
const forwardedArgs = foundCommand ? args._.slice(1) : args._

if (args['--inspect'])
  throw new Error(
    `--inspect flag is deprecated. Use env variable NODE_OPTIONS instead: NODE_OPTIONS='--inspect' dip ${command}`
  )

// Make sure the `next <subcommand> --help` case is covered
if (args['--help']) {
  forwardedArgs.push('--help')
}

const defaultEnv = command === 'dev' ? 'development' : 'production'

const standardEnv = ['production', 'development', 'test']

if (process.env.NODE_ENV && !standardEnv.includes(process.env.NODE_ENV)) {
  // log.warn(NON_STANDARD_NODE_ENV)
}

;(process.env as any).NODE_ENV = process.env.NODE_ENV || defaultEnv

// this needs to come after we set the correct NODE_ENV or
// else it might cause SSR to break
const React = require('react')

if (typeof React.Suspense === 'undefined') {
  throw new Error(
    `The version of React you are using is lower than the minimum required version needed for Next.js. Please upgrade "react" and "react-dom": "npm install react react-dom" https://err.sh/vercel/next.js/invalid-react-version`
  )
}

commands[command]().then((exec) => exec(forwardedArgs))
