import { resolve, join } from 'path';
import fs from 'fs';
import { LoadedEnvConfig } from '../../lib/load-env-config';
import loadConfig from './config';
import {
  CLIENT_PUBLIC_FILES_PATH,
  BUILD_ID_FILE,
  PRERENDER_MANIFEST,
} from '../lib/constants';

type DipConfig = any;
export type ServerConstructor = {
  /**
   * Where the Dip project is located - @default '.'
   */
  dir?: string;
  staticMarkup?: boolean;
  /**
   * Hide error messages containing server information - @default false
   */
  quiet?: boolean;
  /**
   * Object what you would use in dip.config.js - @default {}
   */
  conf?: DipConfig;
  dev?: boolean;
  customServer?: boolean;
};

export default class Server {
  dir: string;
  quiet: boolean;
  dipConfig: DipConfig;
  distDir: string;
  pagesDir?: string;
  publicDir: string;
  hasStaticDir: boolean;
  buildId: string;
  renderOpts: {
    poweredByHeader: boolean;
    staticMarkup: boolean;
    buildId: string;
    generateEtags: boolean;
    runtimeConfig?: { [key: string]: any };
    assetPrefix?: string;
    canonicalBase: string;
    dev?: boolean;
    previewProps: any;
    customServer?: boolean;
    ampOptimizerConfig?: { [key: string]: any };
    basePath: string;
  };

  public constructor({
    dir = '.',
    staticMarkup = false,
    quiet = false,
    conf = null,
    dev = false,
    customServer = true,
  }: ServerConstructor = {}) {
    this.dir = resolve(dir);
    this.quiet = quiet;
    const phase = this.currentPhase();
    LoadedEnvConfig(this.dir, dev);

    this.dipConfig = loadConfig(phase, this.dir, conf);
    this.distDir = join(this.dir, this.dipConfig.distDir);
    this.publicDir = join(this.dir, CLIENT_PUBLIC_FILES_PATH);
    this.hasStaticDir = fs.existsSync(join(this.dir, 'static'));

    const {
      serverRuntimeConfig = {},
      publicRuntimeConfig,
      assetPrefix,
      generateEtags,
      compress,
    } = this.dipConfig;

    this.buildId = this.readBuildId();

    this.renderOpts = {
      poweredByHeader: this.dipConfig.poweredByHeader,
      canonicalBase: this.dipConfig.amp.canonicalBase,
      staticMarkup,
      buildId: this.buildId,
      generateEtags,
      previewProps: this.getPreviewProps(),
      customServer: customServer === true ? true : undefined,
      ampOptimizerConfig: this.dipConfig.experimental.amp?.optimizer,
      basePath: this.dipConfig.experimental.basePath,
    };
  }

  protected currentPhase(): string {
    return 'phase-production-server';
  }

  protected readBuildId(): string {
    const buildIdFile = join(this.distDir, BUILD_ID_FILE);
    try {
      return fs.readFileSync(buildIdFile, 'utf8').trim();
    } catch (err) {
      if (!fs.existsSync(buildIdFile)) {
        throw new Error(
          `Could not find a valid build in the '${this.distDir}' directory! Try building your app with 'dip build' before starting the server.`
        );
      }

      throw err;
    }
  }
  private _cachedPreviewManifest: any | undefined;
  protected getPrerenderManifest(): any {
    if (this._cachedPreviewManifest) {
      return this._cachedPreviewManifest;
    }
    const manifest = require(join(this.distDir, PRERENDER_MANIFEST));
    return (this._cachedPreviewManifest = manifest);
  }

  protected getPreviewProps(): any {
    return this.getPrerenderManifest().preview;
  }
  public getRequestHandler() {
    return this.handleRequest.bind(this);
  }

  private async handleRequest(req: any, res: any, parsedUrl?: any) {
    
  }

  // Backwards compatibility
  public async prepare(): Promise<void> {}
}
