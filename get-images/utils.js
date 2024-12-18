const puppeteer = require('puppeteer-extra')
const adBlock = require('puppeteer-extra-plugin-adblocker')

puppeteer.use(adBlock())

const gameUrl = 'https://colonist.io/#xeRE'

const getStuff = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    // args: ['--window-size=1512,982', '--disable-infobars'],
    args: ['--window-size=3024,1476', '--disable-infobars'],
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
  })

  const page = await browser.newPage()

  await page.goto(gameUrl, {
    waitUntil: 'networkidle2',
  })

  return { page, browser }
}

const waitFor = (delay) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

const findCookieButton = async (page) => {
  const [button] = await page.$x("//button[contains(., 'AGREE')]")
  if (button) {
    await button.click()
  }
}

const captureSS = (
  page,
  x,
  y,
  line,
  position,
  imgNumber,
  width,
  height,
  asset
) => {
  return page.screenshot({
    path: `ss/${asset}/${line}-${position + 1}-${imgNumber}.png`,
    clip: {
      x,
      y,
      width,
      height,
      // width: 100,
      // height: 100,
      captureBeyondViewport: false,
    },
  })
}

module.exports = { getStuff, waitFor, captureSS, findCookieButton }
