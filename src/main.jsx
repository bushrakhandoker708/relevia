import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
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
