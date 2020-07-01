import Server from "../dip-server/server/dip-server"

// This file is used for when users run `require('dip')`
function createServer(options: any) {

  if(options.dev) {
    const DevServer = require('./dip-dev-server').default
    return new DevServer(options)
  }
  return new Server(options)
}

export default createServer