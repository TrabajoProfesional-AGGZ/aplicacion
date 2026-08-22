import logoSocio from '../../assets/logo_socio.png';
import './LoadingScreen.css';

/** Indicador de carga estándar: logo con animación de pulso + rotación. */
export function LoadingScreen() {
  return (
    <output className="loading-screen" aria-label="Cargando">
      <img src={logoSocio} alt="SocioUnido" className="loading-logo" />
    </output>
  );
}
