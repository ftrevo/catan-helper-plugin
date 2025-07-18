import React, { useEffect, useState } from 'react'

import { Board } from './infra/board'
import { Game } from './components/Game/Game'
import { TabHeader, type Tab } from './components/TabHeader/TabHeader'
import { readImageCb } from './infra/repository'
import { ReadCreateData } from '../typings/api'
import { Statistics } from './components/Statistics/Statistics'

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

export const App = () => {
  const [board, setBoard] = React.useState<Board | undefined>()
  const [data, setData] = React.useState<ReadCreateData | undefined>()
  const [activeTab, setActiveTab] = useState<Tab>('game')
  const [rarity, setRarity] = useState<boolean>(false)

  const takeScreenshot = () => {
    setData(mockData)
    setBoard(new Board(mockData, rarity))
    return

    if (window.location.href.includes('colonist.io')) {
      alert('This extension only work in a colonist.io game')
      return
    }

    chrome.runtime.sendMessage({ action: 'capturePage' }, async function (params: { error: any; data: string }) {
      if (params.error) {
        console.error(params.error)
        return
      }

      readImageCb(params.data)
        .then((response) => response.json())
        .then((result) => {
          console.log('Success:', result)
          // setBoard(new Board(result.resources, result.numbers))
          setData(result)
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    })
  }

  return (
    <div className="App">
      <TabHeader
        onClickScreenshot={takeScreenshot}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rarity={rarity}
        setRarity={setRarity}
      />

      <div className="tab-content">
        {activeTab === 'game' && <Game key="game" board={board} />}

        {activeTab === 'statistics' && <Statistics data={data} />}
      </div>
    </div>
  )
}
