import { resolve, join } from "path";
import fs from 'fs'
import { LoadedEnvConfig } from "../../lib/load-env-config";
import loadConfig from "./config";
import { CLIENT_PUBLIC_FILES_PATH, BUILD_ID_FILE } from "../lib/constants";

type DipConfig = any
export type ServerConstructor = {
    /**
   * Where the Dip project is located - @default '.'
   */
  dir?: string
  staticMarkup?: boolean
  /**
   * Hide error messages containing server information - @default false
   */
  quiet?: boolean
  /**
   * Object what you would use in dip.config.js - @default {}
   */
  conf?: DipConfig
  dev?: boolean
  customServer?:boolean

}

export default class Server {
  dir: string
  quiet: boolean
  dipConfig: DipConfig
  distDir: string
  pagesDir?: string
  publicDir: string
  hasStaticDir: boolean
  buildId: string

  public constructor({
    dir= '.',
    staticMarkup = false,
    quiet = false,
    conf = null,
    dev = false,
    customServer = true
  }: ServerConstructor = {}) {
    this.dir = resolve(dir)
    this.quiet = quiet
    const phase = this.currentPhase()
    LoadedEnvConfig(this.dir, dev)

    this.dipConfig = loadConfig(phase, this.dir, conf)
    this.distDir = join(this.dir, this.dipConfig.dipDir)
    this.publicDir = join(this.dir, CLIENT_PUBLIC_FILES_PATH)
    this.hasStaticDir = fs.existsSync(join(this.dir, 'static'))

    const {
      serverRuntimeConfig = {},
      publicRuntimeConfig,
      assetPrefix,
      generateEtags,
      compress,
    } = this.dipConfig

    this.buildId = this.readBuildId()



  }

  protected currentPhase(): string {
    return 'phase-production-server'
  }

  protected readBuildId(): string {
    const buildIdFile = join(this.distDir, BUILD_ID_FILE)
    try {
      return fs.readFileSync(buildIdFile, 'utf8').trim()
    } catch (err) {
      if (!fs.existsSync(buildIdFile)) {
        throw new Error(
          `Could not find a valid build in the '${this.distDir}' directory! Try building your app with 'next build' before starting the server.`
        )
      }

      throw err
    }
  }


  public getRequestHandler() {
    return this.handleRequest.bind(this);
  }

  private async handleRequest(req: any, res: any, parsedUrl?: any) {}

  // Backwards compatibility
  public async prepare(): Promise<void> {}

  
}
