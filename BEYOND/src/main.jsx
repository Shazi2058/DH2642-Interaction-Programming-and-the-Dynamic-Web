import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/animations.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find the app root element.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
