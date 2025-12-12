import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // Importar BrowserRouter
import axios from 'axios'; // Importar axios
import './index.css'
import App from './App.tsx'

// Configuración global de Axios para el backend
axios.defaults.baseURL = 'http://localhost:5001';

console.log('main.tsx is executing'); // Added for debugging

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
