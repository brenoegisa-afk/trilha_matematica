import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Game from './pages/Game'
import Shop from './pages/Shop'
import Ranking from './pages/Ranking'
import { GameProvider } from './context/GameContext'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/setup', element: <Setup /> },
  { path: '/game', element: <Game /> },
  { path: '/shop', element: <Shop /> },
  { path: '/ranking', element: <Ranking /> }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <RouterProvider router={router} />
    </GameProvider>
  </StrictMode>,
)
