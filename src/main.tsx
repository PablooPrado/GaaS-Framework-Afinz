import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { PeriodProvider } from './contexts/PeriodContext'
import { BUProvider } from './contexts/BUContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PeriodProvider>
      <BUProvider>
        <App />
      </BUProvider>
    </PeriodProvider>
  </React.StrictMode>,
)
