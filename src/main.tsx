import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Game from './pages/Game'
import Shop from './pages/Shop'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import Hub from './pages/Hub'
import Arena from './pages/Arena'
import Battle from './pages/Battle'
import ParentDashboard from './pages/ParentDashboard'
import { BatchImporter } from './pages/BatchImporter'
import { GameProvider } from './context/GameContext'

import RootLayout from './RootLayout'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/hub', element: <Hub /> },
      { path: '/arena', element: <Arena /> },
      { path: '/setup', element: <Setup /> },
      { path: '/game', element: <Game /> },
      { path: '/shop', element: <Shop /> },
      { path: '/ranking', element: <Ranking /> },
      { path: '/teacher', element: <TeacherDashboard /> },
      { path: '/dashboard', element: <TeacherDashboard /> },
      { path: '/parent', element: <ParentDashboard /> },
      { path: '/admin/import', element: <BatchImporter /> },
      { path: '/battle', element: <Battle /> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <RouterProvider router={router} />
    </GameProvider>
  </StrictMode>,
)
