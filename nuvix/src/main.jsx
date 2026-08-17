import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Silence Three.js v0.184 deprecation and ANGLE GPU driver shader warnings in developer console
const originalWarn = console.warn;
const originalError = console.error;

const shouldSilence = (msg) => {
  if (typeof msg !== 'string') return false;
  return (
    msg.includes('THREE.Clock: This module has been deprecated') ||
    msg.includes('PCFSoftShadowMap has been deprecated') ||
    msg.includes('THREE.WebGLProgram: Program Info Log') ||
    msg.includes('warning X4122')
  );
};

console.warn = function (...args) {
  if (shouldSilence(args[0])) return;
  originalWarn.apply(console, args);
};

console.error = function (...args) {
  if (shouldSilence(args[0])) return;
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

