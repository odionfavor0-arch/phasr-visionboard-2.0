// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/themes.css'
import App from './App.jsx'
import SageTestHarness from './SageTestHarness.jsx'

const TEST_SAGE = false

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {TEST_SAGE ? <SageTestHarness /> : <App />}
  </StrictMode>,
)
