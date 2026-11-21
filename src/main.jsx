import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Fonts are bundled with the site instead of loaded from Google Fonts, so visiting
// Relevia sends no request (and no IP address) to a font service.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/caveat/500.css'
import '@fontsource/caveat/700.css'
import '@fontsource/kalam/400.css'
import '@fontsource/kalam/700.css'
import './index.css'

// Coming back from public/404.html on GitHub Pages: restore the page they asked for
// (e.g. /relevia/?p=/coping -> /relevia/coping) before the router reads the URL.
const redirectPath = new URLSearchParams(window.location.search).get('p');
if (redirectPath) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  window.history.replaceState(null, '', base + redirectPath + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
