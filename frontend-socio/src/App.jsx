import { useState } from 'react';
import { LoginSocio } from './components/LoginSocio';
import { RegistroSocioForm } from './components/RegistroSocioForm';

export default function App() {
  // Estados de navegación: 'login', 'registro', 'dashboard'
  const [vistaActual, setVistaActual] = useState('login');
  
  // Guardamos los datos del socio una vez que se loguea
  const [socioActivo, setSocioActivo] = useState(null);

  // Efecto opcional: Si ya hay un token en localStorage, podríamos intentar 
  // auto-loguearlo, pero por ahora lo dejamos simple.

  const manejarLoginExitoso = (datosSocio) => {
    setSocioActivo(datosSocio);
    setVistaActual('dashboard'); // Cambiamos la vista a la app principal
  };

  const manejarRegistroExitoso = () => {
    // Si se registró con éxito, lo mandamos al login para que entre (o lo logueamos directo)
    alert("¡Registro exitoso! Por favor, iniciá sesión.");
    setVistaActual('login');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('socioToken');
    setSocioActivo(null);
    setVistaActual('login');
  };

  // ----------------------------------------------------
  // RENDERIZADO CONDICIONAL DE PANTALLAS
  // ----------------------------------------------------

  if (vistaActual === 'login') {
    return (
      <LoginSocio 
        irARegistro={() => setVistaActual('registro')} 
        onLoginExitoso={manejarLoginExitoso} 
      />
    );
  }

  if (vistaActual === 'registro') {
    return (
      <div style={{ padding: '2rem' }}>
        <RegistroSocioForm 
          onSuccess={manejarRegistroExitoso}
          onCancel={() => setVistaActual('login')} 
        />
      </div>
    );
  }

  if (vistaActual === 'dashboard') {
    return (
      <div>
        {/* Navbar de ejemplo */}
        <nav style={{ padding: '1rem', backgroundColor: '#009ee3', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>SocioUnido</h2>
          <div>
            <span style={{ marginRight: '1rem' }}>Hola, {socioActivo?.nombre}</span>
            <button onClick={cerrarSesion} style={{ padding: '0.5rem', cursor: 'pointer' }}>Salir</button>
          </div>
        </nav>

        {/* ACÁ VA TU APP REAL: El componente de pagos, el TOTP, etc. */}
        <div style={{ padding: '2rem' }}>
          <h3>Bienvenido a tu panel</h3>
          <p>Tu estado actual: <strong>{socioActivo?.estado || 'Activo'}</strong></p>
          
          {/* <FlujoPagoCompleto /> */}
        </div>
      </div>
    );
  }

  return null;
}