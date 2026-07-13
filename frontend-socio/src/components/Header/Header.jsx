import { Bell, CircleUserRound } from 'lucide-react';
import logoTexto from '../../assets/texto.png';
import './Header.css';

export function Header({ onPerfil }) {
  return (
    <header className="app-header">
      <button onClick={onPerfil} className="app-header-perfil" aria-label="Mi perfil">
        <CircleUserRound size={24} color="#111111" />
      </button>
      <img src={logoTexto} alt="SocioUnido" className="app-header-logo" />
      <button className="app-header-bell" aria-label="Notificaciones">
        <Bell size={22} color="#111111" />
      </button>
    </header>
  );
}
