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
import { restoredPath } from './services/redirectPath.js'

// Coming back from public/404.html: restore the page they asked for before the router
// reads the URL. See services/redirectPath.js for why nested ?p= values are unwrapped.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const target = restoredPath(window.location.search, window.location.pathname, base);
if (target !== null) window.history.replaceState(null, '', base + target + window.location.hash);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
