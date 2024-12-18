const path = require('path')

module.exports = function override(config, env) {
  // Add the background script entry point
  config.entry = {
    main: config.entry,
    background: path.join(__dirname, 'src/infra/background.ts'),
  }

  // Output to separate files
  config.output.filename = 'static/js/[name].js'

  return config
}
