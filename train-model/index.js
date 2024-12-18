const trainModelResourceStrong = require('./rec-strong')

const trainModelNumStrong = require('./num-strong')

const run = async () => {
  await trainModelResourceStrong()
  // await trainModelNumStrong()
}

run()
