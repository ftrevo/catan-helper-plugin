// 40 x 30 screenshoot - height: 64 px width: 80 px
// 1476 px width: 3024 px
//  MAC RESOLUCAO = 1512 X 982
const { getStuff, waitFor, captureSS, findCookieButton } = require('./utils')

const asset = 'resources'

const width = 40
const height = 32

const totalImgX = 14
const totalImgY = 10

const l1XStart = 475
const l1YStart = 98

const l2XStart = 422
const l2YStart = 191

const l3XStart = 367
const l3YStart = 284

const l4XStart = 422
const l4YStart = 375

const l5XStart = 475
const l5YStart = 466

async function captureResourcesImages(line) {
  const { page, browser } = await getStuff()

  try {
    await findCookieButton(page)

    await waitFor(5000)
    console.time('taking ss resources')

    if (line === 1) {
      for (let position = 0; position <= 2; position++) {
        let imgNumber = 1
        for (let extraX = 0; extraX < totalImgX; extraX++) {
          const promises = []
          for (let extraY = 0; extraY < totalImgY; extraY++) {
            const x = l1XStart + extraX + position * 107.5
            const y = l1YStart + extraY
            promises.push(
              captureSS(
                page,
                x,
                y,
                line,
                position,
                imgNumber,
                width,
                height,
                asset
              )
            )
            imgNumber++
          }
          await Promise.all(promises)
        }
      }
    }

    if (line === 2) {
      for (let position = 0; position <= 3; position++) {
        let imgNumber = 1
        for (let extraX = 0; extraX < totalImgX; extraX++) {
          const promises = []
          for (let extraY = 0; extraY < totalImgY; extraY++) {
            const x = l2XStart + extraX + position * 107.5
            const y = l2YStart + extraY
            promises.push(
              captureSS(
                page,
                x,
                y,
                line,
                position,
                imgNumber,
                width,
                height,
                asset
              )
            )
            imgNumber++
          }
          await Promise.all(promises)
        }
      }
    }

    if (line === 3) {
      for (let position = 0; position <= 4; position++) {
        let imgNumber = 1
        for (let extraX = 0; extraX < totalImgX; extraX++) {
          const promises = []
          for (let extraY = 0; extraY < totalImgY; extraY++) {
            const x = l3XStart + extraX + position * 107.5
            const y = l3YStart + extraY
            promises.push(
              captureSS(
                page,
                x,
                y,
                line,
                position,
                imgNumber,
                width,
                height,
                asset
              )
            )
            imgNumber++
          }
          await Promise.all(promises)
        }
      }
    }

    if (line === 4) {
      for (let position = 0; position <= 3; position++) {
        let imgNumber = 1
        for (let extraX = 0; extraX < totalImgX; extraX++) {
          const promises = []
          for (let extraY = 0; extraY < totalImgY; extraY++) {
            const x = l4XStart + extraX + position * 107.5
            const y = l4YStart + extraY
            promises.push(
              captureSS(
                page,
                x,
                y,
                line,
                position,
                imgNumber,
                width,
                height,
                asset
              )
            )
            imgNumber++
          }
          await Promise.all(promises)
        }
      }
    }

    if (line === 5) {
      for (let position = 0; position <= 2; position++) {
        let imgNumber = 1
        for (let extraX = 0; extraX < totalImgX; extraX++) {
          const promises = []
          for (let extraY = 0; extraY < totalImgY; extraY++) {
            const x = l5XStart + extraX + position * 107.5
            const y = l5YStart + extraY
            promises.push(
              captureSS(
                page,
                x,
                y,
                line,
                position,
                imgNumber,
                width,
                height,
                asset
              )
            )
            imgNumber++
          }
          await Promise.all(promises)
        }
      }
    }
    console.timeEnd('taking ss resources')
  } catch (e) {
    console.log(e)
  } finally {
    await browser.close()
  }
}

async function captureSpecificPositionResourceImages(line, column) {
  const { page, browser } = await getStuff()

  try {
    await findCookieButton(page)

    await waitFor(5000)

    const position = column - 1
    let imgNumber = 1

    console.time('taking ss resources')

    if (line === 1) {
      for (let extraX = 0; extraX < totalImgX; extraX++) {
        const promises = []
        for (let extraY = 0; extraY < totalImgY; extraY++) {
          const x = l1XStart + extraX + position * 107.5
          const y = l1YStart + extraY
          promises.push(
            captureSS(
              page,
              x,
              y,
              line,
              position,
              imgNumber,
              width,
              height,
              asset
            )
          )
          imgNumber++
        }
        await Promise.all(promises)
      }
    }

    if (line === 2) {
      for (let extraX = 0; extraX < totalImgX; extraX++) {
        const promises = []
        for (let extraY = 0; extraY < totalImgY; extraY++) {
          const x = l2XStart + extraX + position * 107.5
          const y = l2YStart + extraY
          promises.push(
            captureSS(
              page,
              x,
              y,
              line,
              position,
              imgNumber,
              width,
              height,
              asset
            )
          )
          imgNumber++
        }
        await Promise.all(promises)
      }
    }

    if (line === 3) {
      for (let extraX = 0; extraX < totalImgX; extraX++) {
        const promises = []
        for (let extraY = 0; extraY < totalImgY; extraY++) {
          const x = l3XStart + extraX + position * 107.5
          const y = l3YStart + extraY
          promises.push(
            captureSS(
              page,
              x,
              y,
              line,
              position,
              imgNumber,
              width,
              height,
              asset
            )
          )
          imgNumber++
        }
        await Promise.all(promises)
      }
    }

    if (line === 4) {
      for (let extraX = 0; extraX < totalImgX; extraX++) {
        const promises = []
        for (let extraY = 0; extraY < totalImgY; extraY++) {
          const x = l4XStart + extraX + position * 107.5
          const y = l4YStart + extraY
          promises.push(
            captureSS(
              page,
              x,
              y,
              line,
              position,
              imgNumber,
              width,
              height,
              asset
            )
          )
          imgNumber++
        }
        await Promise.all(promises)
      }
    }

    if (line === 5) {
      for (let extraX = 0; extraX < totalImgX; extraX++) {
        const promises = []
        for (let extraY = 0; extraY < totalImgY; extraY++) {
          const x = l5XStart + extraX + position * 107.5
          const y = l5YStart + extraY
          promises.push(
            captureSS(
              page,
              x,
              y,
              line,
              position,
              imgNumber,
              width,
              height,
              asset
            )
          )
          imgNumber++
        }
        await Promise.all(promises)
      }
    }
    console.timeEnd('taking ss resources')
  } catch (e) {
    console.log(e)
  } finally {
    await browser.close()
  }
}

module.exports = {
  captureResourcesImages,
  captureSpecificPositionResourceImages,
}
