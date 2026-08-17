import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Silence Three.js v0.184 deprecation warnings in developer console
const originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('THREE.Clock: This module has been deprecated') ||
     args[0].includes('PCFSoftShadowMap has been deprecated'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

