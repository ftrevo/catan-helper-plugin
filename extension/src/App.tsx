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

const useMock = false

export const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('game')
  const [data, setData] = React.useState<ReadCreateData | undefined>()
  const [rarity, setRarity] = useState<boolean>(false)
  const [isLoading, setLoading] = useState(false)

  const takeScreenshot = async () => {
    if (useMock) {
      return setData(mockData)
    }

    const tabs = await chrome.tabs?.query({ active: true, currentWindow: true })

    if (!tabs || !tabs[0]?.url?.includes('colonist.io')) {
      return alert('This extension only work in a colonist.io game')
    }

    setLoading(true)

    const { height, url, width, windowId } = tabs && tabs[0] ? tabs[0] : { height: 0, url: '', width: 0, windowId: 0 }
    const tabInfo = { height, url, width, windowId }

    const result = await captureAndProcessScreenshot(tabInfo)

    if (result.error) {
      setLoading(false)
      return null
    }

    setData(result.data)
    setLoading(false)
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
        hideButtons={!data}
        loading={isLoading}
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
