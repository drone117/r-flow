/**
 * Application entry point.
 *
 * Mounts the React app into the #root DOM element with StrictMode enabled.
 * StrictMode runs components twice in development to help catch bugs.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
