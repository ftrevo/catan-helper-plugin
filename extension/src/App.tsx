import React, { useState } from 'react'

import { Game } from './components/Game/Game'
import { ReadCreateData } from '../typings/api'
import { Statistics } from './components/Statistics/Statistics'
import { TabHeader, type Tab } from './components/TabHeader/TabHeader'
import { buildHexagons } from './utils/hexagons'
import { getScarcityFactors } from './utils/statistics'
import { captureAndProcessScreenshot } from './infra/repository'
import { NoData } from './components/NoData/NoData'
import { setMockData } from './utils/mockData'

const USE_MOCK = process.env.NODE_ENV === 'development'

export const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('game')
  const [data, setData] = React.useState<ReadCreateData | undefined>()
  const [rarity, setRarity] = useState<boolean>(false)
  const [isLoading, setLoading] = useState(false)

  const takeScreenshot = async () => {
    if (USE_MOCK) {
      return setMockData(setData, setLoading)
    }

    console.log('Taking screenshot...')

    const tabs = await chrome.tabs?.query({ active: true, currentWindow: true })

    if (!tabs?.[0]?.url?.includes('colonist.io')) {
      return alert('This extension only work in a colonist.io game')
    }

    setLoading(true)

    const { height, url, width, windowId } = tabs[0]

    const result = await captureAndProcessScreenshot({ height, url, width, windowId })

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
        hideButtons={!data}
        loading={isLoading}
        onClickScreenshot={takeScreenshot}
        rarity={rarity}
        setActiveTab={setActiveTab}
        setRarity={setRarity}
      />

      <div className="tab-content">
        {!data && <NoData onCapture={takeScreenshot} loading={isLoading} />}
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
