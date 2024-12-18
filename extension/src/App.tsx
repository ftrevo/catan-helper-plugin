import React from 'react'

import { readImageCb } from './infra/repository'
import { Board } from './infra/board'
import { Game } from './components/Game/Game'

const mockData = {
  numbers: ['8', '10', '5', '4', '3', '9', '2', '11', '7', '11', '4', '6', '12', '6', '5', '3', '9', '10', '8'],
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
  const [board, setBoard] = React.useState<Board | null>(null)

  const takeScreenshot = () => {
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

          setBoard(new Board(result.resources, result.numbers))
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    })
  }

  return (
    <div className="App">
      <button onClick={takeScreenshot}>Capture Screenshot</button>
      {board && board.hexagons && board.hexagons.length > 0 && <Game key="game" board={board} />}
    </div>
  )
}
