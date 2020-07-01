import Server, { ServerConstructor } from '../dip-server/server/dip-server';
import fs from 'fs';
import { join as pathJoin, relative, resolve as pathResolve, sep } from 'path';
import { findPagesDir } from '../lib/find-pages-dir'

export default class DevServer extends Server {
  private devReady: Promise<void>;
  private setDevReady?: Function;
  private webpackWatcher?: any;
  private hotReloader?: any;
  private isCustomServer: boolean;

  constructor(options: ServerConstructor & { isDipDevCommand?: boolean }) {
    super({ ...options, dev: true });
    this.renderOpts.dev = true;
    this.devReady = new Promise((resolve) => {
      this.setDevReady = resolve;
    });

    if (fs.existsSync(pathJoin(this.dir, 'static'))) {
      console.warn(
        `The static directory has been deprecated in favor of the public directory.`
      );
    }
    this.isCustomServer = !options.isDipDevCommand;
    this.pagesDir = findPagesDir(this.dir)
    // this.staticPathsWorker = new Worker()
  }
}
