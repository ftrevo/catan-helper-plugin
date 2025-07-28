import React, { useState } from 'react'

import { Game } from './components/Game/Game'
import { ReadCreateData } from '../typings/api'
import { Statistics } from './components/Statistics/Statistics'
import { TabHeader, type Tab } from './components/TabHeader/TabHeader'
import { buildHexagons } from './utils/hexagons'
import { getScarcityFactors } from './utils/statistics'
import { captureAndProcessScreenshot } from './infra/repository'
import { NoData } from './components/NoData/NoData'

const mockData = {
  numbers: ['8', '10', '5', '4', '3', '9', '2', '11', '7', '11', '5', '6', '12', '10', '4', '3', '9', '6', '8'],
  resources: [
    'wool',
    'stone',
    'wool',
    'brick',
    'brick',
    'wool',
    'stone',
    'grain',
    'desert',
    'lumber',
    'grain',
    'stone',
    'brick',
    'wool',
    'grain',
    'lumber',
    'lumber',
    'grain',
    'lumber',
  ],
}

const useMock = true

export const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('game')
  const [data, setData] = React.useState<ReadCreateData | undefined>()
  const [rarity, setRarity] = useState<boolean>(false)

  const takeScreenshot = async () => {
    if (useMock) {
      return setData(mockData)
    }

    if (!window.location.href.includes('colonist.io')) {
      return alert('This extension only work in a colonist.io game')
    }

    const result = await captureAndProcessScreenshot()

    if (result.error) return // TODO: Handle error appropriately

    setData(result.data)

    // TODO: Left this here for reference, since captureAndProcessScreenshot is not tested yet
    // chrome.runtime.sendMessage({ action: 'capturePage' }, async function (params: { error: any; data: string }) {
    //   if (params.error) {
    //     console.error(params.error)
    //     return
    //   }
    //   readImageCb(params.data)
    //     .then((response) => response.json())
    //     .then((result) => {
    //       setData(result)
    //       setScarcityFactors(getScarcityFactors(result))
    //     })
    // })
  }

  return (
    <div className="App">
      <TabHeader
        key="tab-header"
        activeTab={activeTab}
        onClickScreenshot={takeScreenshot}
        rarity={rarity}
        setActiveTab={setActiveTab}
        setRarity={setRarity}
        hideRefreshButton={!data}
      />

      <div className="tab-content">
        {!data && <NoData onCapture={takeScreenshot} />}
        {activeTab === 'game' && data && (
          <Game
            key="game"
            hexagons={buildHexagons(data)}
            scarcityFactors={rarity ? getScarcityFactors(data) : undefined}
          />
        )}

        {activeTab === 'statistics' && data && <Statistics data={data} />}
      </div>
    </div>
  )
}
