const fs = require('fs')
const path = require('path')

console.log('File manifest.json is being copied to build folder')

const source = path.join(__dirname, 'manifest.json')
const destination = path.join(__dirname, 'build', 'manifest.json')

fs.copyFileSync(source, destination)

console.log('Successfully copied manifest.json to build folder')
