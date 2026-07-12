// src/App.jsx
import { useState } from 'react';
import { Menu, QrCode, CreditCard, Calendar, User } from 'lucide-react';
import { LoginSocio } from './pages/LoginPage/LoginSocio';
import { RegistroSocioForm } from './pages/Registropage/RegistroSocioForm';
import './socio-theme.css';

export default function App() {
  const [vistaActual, setVistaActual] = useState('login');
  const [socioActivo, setSocioActivo] = useState(null);

  const manejarLoginExitoso = (datosSocio) => {
    setSocioActivo(datosSocio);
    setVistaActual('dashboard');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('socioToken');
    setSocioActivo(null);
    setVistaActual('login');
  };

  if (vistaActual === 'login') return <LoginSocio irARegistro={() => setVistaActual('registro')} onLoginExitoso={manejarLoginExitoso} />;
  
  if (vistaActual === 'registro') return <RegistroSocioForm onSuccess={() => setVistaActual('login')} onCancel={() => setVistaActual('login')} />;

  if (vistaActual === 'dashboard') {
    return (
      <div>
        <header className="topbar">
          <button className="menu-btn">
            <Menu size={24} color="#111827" />
          </button>
          <div className="user-info">
            <span style={{ color: '#6b7280' }}>Socio {socioActivo?.nro_socio}</span>
            <button onClick={cerrarSesion} className="btn-cerrar-sesion">Cerrar sesión</button>
          </div>
        </header>

        {/* CONTENIDO DEL DASHBOARD */}
        <main className="dashboard-layout">
          <h1 className="dashboard-title">Panel principal</h1>
          <p className="dashboard-subtitle">
            Bienvenido, <b>{socioActivo?.nombre}</b>. Accedé rápidamente a las secciones del club.
          </p>

          <div className="cards-grid">
            {/* TARJETA 1: CARNET / QR */}
            <div className="su-card" onClick={() => alert('Próximamente: Tu QR')}>
              <div className="card-icon"><QrCode size={24} color="#111827" /></div>
              <h3 className="card-title">Mi Carnet Digital</h3>
              <p className="card-desc">Generá tu código QR de acceso a las instalaciones.</p>
            </div>

            {/* TARJETA 2: PAGOS */}
            <div className="su-card" onClick={() => alert('Próximamente: Pagos')}>
              <div className="card-icon"><CreditCard size={24} color="#111827" /></div>
              <h3 className="card-title">Cuotas y Pagos</h3>
              <p className="card-desc">Aboná tu cuota social o servicios adicionales.</p>
            </div>

            {/* TARJETA 3: RESERVAS */}
            <div className="su-card" onClick={() => alert('Próximamente: Reservas')}>
              <div className="card-icon"><Calendar size={24} color="#111827" /></div>
              <h3 className="card-title">Reservas e Instalaciones</h3>
              <p className="card-desc">Administrar reservas de espacios físicos.</p>
            </div>

            {/* TARJETA 4: PERFIL */}
            <div className="su-card" onClick={() => alert('Próximamente: Perfil')}>
              <div className="card-icon"><User size={24} color="#111827" /></div>
              <h3 className="card-title">Mis Datos</h3>
              <p className="card-desc">Consultar o modificar tu información personal.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}