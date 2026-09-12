// tfjs-node 4.x calls util.isNullOrUndefined, which Node 23+ removed. Preload this file with --require.
const util = require('node:util')
if (typeof util.isNullOrUndefined !== 'function') {
  util.isNullOrUndefined = (value) => value === null || value === undefined
}
