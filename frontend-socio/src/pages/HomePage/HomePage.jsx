import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { WelcomeCard } from '../../components/WelcomeCard/WelcomeCard';
import { QuickAccessGrid } from '../../components/QuickAccessGrid/QuickAccessGrid';
import { BottomNav } from '../../components/BottomNav/BottomNav';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';
import { PerfilPage } from '../PerfilPage/PerfilPage';
import '../../socio-theme.css';
import './HomePage.css';

export function HomePage({ socio, cerrarSesion }) {
  const [proximamente, setProximamente] = useState(null);
  const [vista, setVista] = useState('inicio');

  if (vista === 'perfil') {
    return (
      <PerfilPage
        socio={socio}
        cerrarSesion={cerrarSesion}
        onVolver={() => setVista('inicio')}
      />
    );
  }

  return (
    <div>
      <Header onPerfil={() => setVista('perfil')} />

      <main className="home-page">
        <WelcomeCard socio={socio} />
        <QuickAccessGrid onProximamente={setProximamente} />
      </main>

      <BottomNav onProximamente={setProximamente} />

      {proximamente && (
        <ProximamenteOverlay titulo={proximamente} onClose={() => setProximamente(null)} />
      )}
    </div>
  );
}
