import os from 'os';
import findUp from 'find-up';
import { CONFIG_FILE } from '../lib/constants';
import chalk from 'chalk';
import { basename, extname } from 'path';

const targets = ['server', 'serverless', 'experimental-serverless-trace'];

const defaultConfig: { [key: string]: any } = {
  env: [],
  webpack: null,
  webpackDevMiddleware: null,
  distDir: '.dip',
  assetPrefix: '',
  configOrigin: 'default',
  useFileSystemPublicRoutes: true,
  generateBuildId: () => null,
  generateEtags: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  target: 'server',
  powerdByHeader: true,
  compress: true,
  devIndicators: {
    buildActivity: true,
    autoPrerender: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  amp: {
    canonicalBase: '',
  },
  exportTrailingSlash: false,
  sassOptions: {},
  experimental: {
    cpus: Math.max(
      1,
      (Number(process.env.CIRCLE_NODE_TOTAL) ||
        (os.cpus() || { length: 1 }).length) - 1
    ),
    granularChunks: true,
    modern: false,
    plugins: false,
    profiling: false,
    sprFlushToDisk: true,
    reactMode: 'legacy',
    workerThreads: false,
    basePath: '',
    pageEnv: false,
    productionBrowserSourceMaps: false,
    optionalCatchAll: false,
  },
  future: {
    excludeDefaultMomentLocales: false,
  },
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
  reactStrictMode: false,
};

function assignDefaults(userConfig: { [key: string]: any }) {}

export function normalizeConfig(phase: string, config: any) {
  if (typeof config === 'function') {
    config = config(phase, { defaultConfig });

    if (typeof config.then === 'function') {
      throw new Error(`> Promise returned in eror`);
    }
  }
  return config;
}

export default function loadConfig(
  phase: string,
  dir: string,
  customConfig?: object | null
) {
  if (customConfig) {
    return assignDefaults({ configOrigin: 'server', ...customConfig });
  }
  const path = findUp.sync(CONFIG_FILE, {
    cwd: dir,
  });

  if (path?.length) {
    const userConfigModule = require(path);
    const userConfig = normalizeConfig(
      phase,
      userConfigModule.default || userConfigModule
    );

    console.log(userConfig)

    if (Object.keys(userConfig).length === 0) {
      console.warn(
        chalk.yellow.bold('Warning: ') +
          'Detected dip.config.js, no exported configuration found.'
      );
    }

    if (userConfig.target && !targets.includes(userConfig.target)) {
      throw new Error(
        `Specified target is invalid. Provided: "${
          userConfig.target
        }" should be one of ${targets.join(', ')}`
      );
    }

    // TODO: 省略部分代码

    return assignDefaults({ configOrigin: CONFIG_FILE, ...userConfig });
  } else {
    const configBaseName = basename(CONFIG_FILE, extname(CONFIG_FILE));
    const nonJsPath = findUp.sync(
      [
        `${configBaseName}.jsx`,
        `${configBaseName}.ts`,
        `${configBaseName}.tsx`,
        `${configBaseName}.json`,
      ],
      { cwd: dir }
    );
    if(nonJsPath?.length) {
      throw new Error(
        `Configuring Dip.js via '${basename(
          nonJsPath
        )}' is not supported. Please replace the file with 'dip.config.js'.`
      )
    }
  }

  return defaultConfig
}
