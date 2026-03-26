import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
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
import Inventory from './pages/Inventory'
import { BatchImporter } from './pages/BatchImporter'
import { GameProvider } from './context/GameContext'
import RootLayout from './RootLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CloudSyncProvider } from './components/CloudSyncProvider'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})
// Dynamic Imports for Heavy 3D Experimental Routes
const Mundo3D = React.lazy(() => import('./experimental/Mundo3D'));
const MathRunner = React.lazy(() => import('./experimental/MathRunner/MathRunner'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/teacher/login', element: <Navigate to="/login" replace /> },
      { path: '/hub', element: <Hub /> },
      { path: '/arena', element: <Arena /> },
      { path: '/setup', element: <Setup /> },
      { path: '/game', element: <Game /> },
      { path: '/shop', element: <Shop /> },
      { path: '/ranking', element: <Ranking /> },
      { path: '/teacher', element: <TeacherDashboard /> },
      { path: '/dashboard', element: <TeacherDashboard /> },
      { path: '/parent', element: <ParentDashboard /> },
      { path: '/inventory', element: <Inventory /> },
      { path: '/admin/import', element: <BatchImporter /> },
      { path: '/battle', element: <Battle /> }
    ]
  },
  { 
    path: '/experimental/3d', 
    element: (
      <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}><h2>Carregando Mundo 3D...</h2></div>}>
        <Mundo3D />
      </React.Suspense>
    ) 
  },
  { 
    path: '/experimental/runner', 
    element: (
      <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}><h2>Carregando MathRunner...</h2></div>}>
        <MathRunner />
      </React.Suspense>
    ) 
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <CloudSyncProvider />
        <RouterProvider router={router} />
      </GameProvider>
    </QueryClientProvider>
  </StrictMode>,
)
