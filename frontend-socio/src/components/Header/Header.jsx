import { Bell, CircleUserRound } from 'lucide-react';
import logoTexto from '../../assets/texto.png';
import './Header.css';

export function Header({ onPerfil, mostrarPerfil = true }) {
  return (
    <header className="app-header">
      {mostrarPerfil ? (
        <button onClick={onPerfil} className="app-header-perfil" aria-label="Mi perfil">
          <CircleUserRound size={24} color="#111111" />
        </button>
      ) : (
        <span className="app-header-spacer" aria-hidden="true" />
      )}
      <img src={logoTexto} alt="SocioUnido" className="app-header-logo" />
      <button className="app-header-bell" aria-label="Notificaciones">
        <Bell size={22} color="#111111" />
      </button>
    </header>
  );
}
