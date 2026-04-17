import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SiteLanguageProvider } from './utils/siteLanguage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteLanguageProvider>
      <App />
    </SiteLanguageProvider>
  </StrictMode>,
)

