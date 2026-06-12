import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import TeamShell from './team/TeamShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeamShell>
      <App />
    </TeamShell>
  </StrictMode>,
)
