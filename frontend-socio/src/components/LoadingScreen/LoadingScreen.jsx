import logoSocio from '../../assets/logo_socio.png';
import './LoadingScreen.css';

export function LoadingScreen() {
  return (
    <output className="loading-screen" aria-label="Cargando">
      <img src={logoSocio} alt="SocioUnido" className="loading-logo" />
    </output>
  );
}
