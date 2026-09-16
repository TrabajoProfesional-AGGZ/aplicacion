import { Bell, CircleUserRound } from 'lucide-react';
import logoTexto from '../../assets/texto.png';
import './Header.css';

/** Barra superior fija: acceso a perfil, logo centrado y acceso a alertas. */
export function Header({ onPerfil, onAlertas, mostrarPerfil = true, hayAlertasNoLeidas = false }) {
  return (
    <header className="app-header">
      {mostrarPerfil ? (
        <button type="button" onClick={onPerfil} className="app-header-perfil" aria-label="Mi perfil">
          <CircleUserRound size={24} color="#111111" />
        </button>
      ) : (
        <span className="app-header-spacer" aria-hidden="true" />
      )}
      <img src={logoTexto} alt="SocioUnido" className="app-header-logo" />
      <button type="button" onClick={onAlertas} className="app-header-bell" aria-label="Notificaciones">
        <Bell size={22} color="#111111" />
        {hayAlertasNoLeidas && <span className="app-header-bell-badge" aria-hidden="true" />}
      </button>
    </header>
  );
}
