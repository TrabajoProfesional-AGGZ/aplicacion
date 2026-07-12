import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './context/AuthContext.jsx'

registerSW({
  onNeedRefresh() {
    console.log("Hay una nueva versión disponible. (Se actualizará sola en breve)");
  },
  onOfflineReady() {
    console.log("La app ya está lista para usarse sin conexión.");
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)