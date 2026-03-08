import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Game from './pages/Game'
import Shop from './pages/Shop'
import Ranking from './pages/Ranking'
import TeacherLogin from './pages/TeacherLogin'
import TeacherDashboard from './pages/TeacherDashboard'
import Hub from './pages/Hub'
import Arena from './pages/Arena'
import Battle from './pages/Battle'
import { GameProvider } from './context/GameContext'


import RootLayout from './RootLayout'


const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/hub', element: <Hub /> },
      { path: '/arena', element: <Arena /> },
      { path: '/setup', element: <Setup /> },
      { path: '/game', element: <Game /> },
      { path: '/shop', element: <Shop /> },
      { path: '/ranking', element: <Ranking /> },
      { path: '/teacher/login', element: <TeacherLogin /> },
      { path: '/teacher', element: <TeacherDashboard /> },
      { path: '/dashboard', element: <TeacherDashboard /> },
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


