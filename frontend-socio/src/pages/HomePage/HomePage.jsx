import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { WelcomeCard } from '../../components/WelcomeCard/WelcomeCard';
import { QuickAccessGrid } from '../../components/QuickAccessGrid/QuickAccessGrid';
import { BottomNav } from '../../components/BottomNav/BottomNav';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';
import { PerfilPage } from '../PerfilPage/PerfilPage';
import { FinanzasPage } from '../FinanzasPage/FinanzasPage';
import '../../socio-theme.css';
import './HomePage.css';

export function HomePage({ socio, cerrarSesion }) {
  const [proximamente, setProximamente] = useState(null);
  const [vista, setVista] = useState('inicio');

  return (
    <div>
      <Header onPerfil={() => setVista('perfil')} mostrarPerfil={vista !== 'perfil'} />

      <main className="home-page">
        {vista === 'perfil' && <PerfilPage socio={socio} cerrarSesion={cerrarSesion} />}
        {vista === 'pagos' && <FinanzasPage socio={socio} />}
        {vista === 'inicio' && (
          <>
            <WelcomeCard socio={socio} />
            <QuickAccessGrid onProximamente={setProximamente} onPagos={() => setVista('pagos')} />
          </>
        )}
      </main>

      <BottomNav
        onProximamente={setProximamente}
        onInicio={() => setVista('inicio')}
        vistaActual={vista}
      />

      {proximamente && (
        <ProximamenteOverlay titulo={proximamente} onClose={() => setProximamente(null)} />
      )}
    </div>
  );
}
