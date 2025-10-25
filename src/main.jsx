import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { BrowserRouter } from 'react-router'
import AppRoutes from './router/routes'
import { AuthProvider } from './context/auth-context'
import { ThemeProvider } from './components/theme-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <ThemeProvider>
    <AuthProvider>
    <AppRoutes />
    </AuthProvider>
    </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
