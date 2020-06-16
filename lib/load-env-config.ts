import fs from 'fs';
import path from 'path';
import * as log from '../build/output/log';
import dotenvExpand from 'dotenv-expand'
import dotenv, { DotenvConfigOutput } from 'dotenv'

export type Env = { [key: string]: string };
export type LoadedEnvFiles = Array<{
  path: string;
  contents: string;
}>;

let combinedEnv: Env | undefined = undefined;
let cachedLoadedEnvFiles: LoadedEnvFiles = [];

export function processEnv(loadedEnvFiles: LoadedEnvFiles, dir?: string) {
  // don't reload env if we already have since this breaks escaped
  // environment values e.g. \$ENV_FILE_KEY
  if (combinedEnv || process.env._DIP_PROCESSED_ENV || !loadedEnvFiles.length) {
    return process.env as Env;
  }
  // flag that we processed the environment values in case a serverless
  // function is re-used or we are running in `dip start` mode
  process.env._DIP_PROCESSED_ENV = 'true';

  for (const envFile of loadedEnvFiles) {
    try {
      let result: DotenvConfigOutput = {}
      result.parsed = dotenv.parse(envFile.contents)

      result = dotenvExpand(result)

      if(result.parsed) {
        log.info(`Loaded env from ${path.join(dir || '', envFile.path)}`)
      }
      
      Object.assign(process.env, result.parsed)
    } catch (err) {
      log.error(
        `Failed to load env from ${path.join(dir || '', envFile.path)}`,
        err
      );
    }
  }

  return process.env as Env
}

export function LoadedEnvConfig(
  dir: string,
  dev?: boolean
): {
  combinedEnv: Env;
  loadedEnvFiles: LoadedEnvFiles;
} {
  if (combinedEnv) return { combinedEnv, loadedEnvFiles: cachedLoadedEnvFiles };

  const isTest = process.env.NODE_ENV === 'test';
  const mode = isTest ? 'test' : dev ? 'development' : 'production';
  const dotenvFiles = [
    `.env.${mode}.local`,
    mode !== 'test' && `.env.local`,
    `.env.${mode}`,
    '.env',
  ].filter(Boolean) as string[];

  for (const envFile of dotenvFiles) {
    // only load .env if the user provided has an env config file
    const dotEnvPath = path.join(dir, envFile);

    try {
      const stats = fs.statSync(dotEnvPath);

      // make sure to only attempt to read files
      if (!stats.isFile()) {
        continue;
      }

      const contents = fs.readFileSync(dotEnvPath, 'utf8');
      cachedLoadedEnvFiles.push({
        path: envFile,
        contents,
      });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        log.error(`Failed to load env from ${envFile}`, err);
      }
    }
  }

  combinedEnv = processEnv(cachedLoadedEnvFiles, dir);
  return { combinedEnv, loadedEnvFiles: cachedLoadedEnvFiles };
}
