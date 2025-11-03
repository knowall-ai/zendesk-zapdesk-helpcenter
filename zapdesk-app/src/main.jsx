import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

/**
 * Mount function for embedding the Zapdesk app
 * This is called by the theme's bootstrap script
 */
function mount(container, config = {}) {
  if (!container) {
    console.error('Zapdesk: No container element provided')
    return
  }

  // Remove loading state
  container.removeAttribute('data-loading')

  // Create root and render app
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  )

  return root
}

// Export for use in Zendesk theme
if (typeof window !== 'undefined') {
  window.ZapdeskApp = {
    mount
  }
}

// For development mode
if (import.meta.env.DEV) {
  const devRoot = document.getElementById('zapdesk-app-root')
  if (devRoot) {
    mount(devRoot, {
      apiBase: 'https://api.knowall.ai',
      lnurlEndpoint: '',
      brandColor: '#F7931A',
      placement: 'development'
    })
  }
}

export { mount }
