import Server from "../dip-server/server/dip-server"

// This file is used for when users run `require('dip')`
function createServer(options: any) {

  return new Server(options)
}

export default createServer