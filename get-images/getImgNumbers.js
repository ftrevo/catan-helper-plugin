// 30 x 40 screenshoot - height: 80 px width: 64 px
// 1476 px width: 3024 px
//  MAC RESOLUCAO = 1512 X 982
const { getStuff, waitFor, captureSS, findCookieButton } = require('./utils')

const asset = 'numbers'

const width = 32
const height = 35

const totalImgX = 10
const totalImgY = 10

// const totalImgX = 1
// const totalImgY = 1

const l1XStart = 483
const l1YStart = 137

const l2XStart = 430
const l2YStart = 230

const l3XStart = 375
const l3YStart = 323

const l4XStart = 430
const l4YStart = 416

const l5XStart = 483
const l5YStart = 507

async function captureNumbersImages(line) {
  const { page, browser } = await getStuff()

  try {
    await findCookieButton(page)

    await waitFor(5000)

    console.time('taking ss numbers')

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
    console.timeEnd('taking ss numbers')
  } catch (e) {
    console.log(e)
  } finally {
    await browser.close()
  }
}

async function captureSpecificPositionNumbersImages(line, column) {
  const { page, browser } = await getStuff()

  try {
    await findCookieButton(page)

    await waitFor(5000)

    const position = column - 1
    let imgNumber = 1

    console.time('taking ss numbers')

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
    console.timeEnd('taking ss numbers')
  } catch (e) {
    console.log(e)
  } finally {
    await browser.close()
  }
}

module.exports = {
  captureNumbersImages,
  captureSpecificPositionNumbersImages,
}
