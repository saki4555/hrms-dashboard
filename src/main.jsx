import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter } from 'react-router'
import AppRoutes from './router/routes'
import { AuthProvider } from './context/auth-context'
import { ThemeProvider } from './components/theme-provider'
import {



  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
    <AppRoutes />
    </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
