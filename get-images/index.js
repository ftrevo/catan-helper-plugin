const {
  captureResourcesImages,
  captureSpecificPositionResourceImages,
} = require('./getImgResources')
const {
  captureNumbersImages,
  captureSpecificPositionNumbersImages,
} = require('./getImgNumbers')
const { predict, loadModel } = require('./predictResources')
const fs = require('fs')

const tuples = [
  { line: 1, column: 1 },
  { line: 1, column: 2 },
  { line: 1, column: 3 },
  { line: 2, column: 1 },
  { line: 2, column: 2 },
  { line: 2, column: 3 },
  { line: 2, column: 4 },
  { line: 3, column: 1 },
  { line: 3, column: 2 },
  { line: 3, column: 3 },
  { line: 3, column: 4 },
  { line: 3, column: 5 },
  { line: 4, column: 1 },
  { line: 4, column: 2 },
  { line: 4, column: 3 },
  { line: 4, column: 4 },
  { line: 5, column: 1 },
  { line: 5, column: 2 },
  { line: 5, column: 3 },
]

const moveFiles = (model, line) => {
  for (let x = 0; x < tuples.length; x++) {
    const tuple = tuples[x]

    if (tuple.line !== line) {
      continue
    }

    const fileName = `./ss/resources/${tuple.line}-${tuple.column}-70.png`
    const prediction = predict(model, fileName)

    if (prediction.chance < 0.9) {
      console.log(
        'file not moved',
        fileName,
        prediction.resource,
        prediction.chance
      )
      continue
    }

    for (let i = 1; i <= 140; i++) {
      const oldName = `./ss/resources/${tuple.line}-${tuple.column}-${i}.png`
      const newName = `./resources/strong/${prediction.resource}/${tuple.line}-${tuple.column}-${i}.png`

      fs.renameSync(oldName, newName)
    }
  }
}

async function run() {
  const line = 5
  const column = 2

  // await captureResourcesImages(line)
  // await captureNumbersImages(line)

  await captureSpecificPositionNumbersImages(line, column)
  await captureSpecificPositionResourceImages(line, column)

  // const model = await loadModel()
  // moveFiles(model, line)
}

run()

// 40 x 30 screenshoot - height: 64 px width: 80 px
