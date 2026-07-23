import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { WelcomeCard } from '../../components/WelcomeCard/WelcomeCard';
import { QuickAccessGrid } from '../../components/QuickAccessGrid/QuickAccessGrid';
import { BottomNav } from '../../components/BottomNav/BottomNav';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';
import { PerfilPage } from '../PerfilPage/PerfilPage';
import { FinanzasPage } from '../FinanzasPage/FinanzasPage';
import { TramitesPage } from '../TramitesPage/TramitesPage';
import { AlertasPage } from '../AlertasPage/AlertasPage';
import { ReservasPage } from '../ReservasPage/ReservasPage';
import { NuevaReservaPage } from '../NuevaReservaPage/NuevaReservaPage';
import { InscripcionesPage } from '../InscripcionesPage/InscripcionesPage';
import { NuevaInscripcionPage } from '../NuevaInscripcionPage/NuevaInscripcionPage';
import { NuevaEntradaPage } from '../NuevaEntradaPage/NuevaEntradaPage';
import { MisEntradasPage } from '../MisEntradasPage/MisEntradasPage';
import { CertificadoVencidoBanner } from '../../components/CertificadoVencidoBanner/CertificadoVencidoBanner';
import { BiometriaOfferBanner } from '../../components/BiometriaOfferBanner/BiometriaOfferBanner';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import '../../socio-theme.css';
import './HomePage.css';

export function HomePage({
  socio,
  cerrarSesion,
  credencialParaEnrolar = null,
  onDescartarCredencialParaEnrolar = () => {},
}) {
  const [proximamente, setProximamente] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [itemAPagarId, setItemAPagarId] = useState(null);

  useBackToRoot(vista, 'inicio', () => setVista('inicio'));

  return (
    <div>
      <Header
        onPerfil={() => setVista('perfil')}
        onAlertas={() => setVista('alertas')}
        mostrarPerfil={vista !== 'perfil'}
      />

      <main className="home-page">
        {vista === 'perfil' && <PerfilPage socio={socio} cerrarSesion={cerrarSesion} />}
        {vista === 'pagos' && (
          <FinanzasPage
            socio={socio}
            itemAPagarId={itemAPagarId}
            onConsumirItemAPagar={() => setItemAPagarId(null)}
          />
        )}
        {vista === 'tramites' && <TramitesPage socio={socio} />}
        {vista === 'alertas' && <AlertasPage socio={socio} />}
        {vista === 'reservas' && (
          <ReservasPage
            socio={socio}
            onNuevaReserva={() => setVista('nueva-reserva')}
            onPagarReserva={(reserva) => { setItemAPagarId(reserva.id); setVista('pagos'); }}
          />
        )}
        {vista === 'nueva-reserva' && (
          <NuevaReservaPage
            socio={socio}
            onSalir={() => setVista('inicio')}
            onExito={() => setVista('reservas')}
          />
        )}
        {vista === 'inscripciones' && (
          <InscripcionesPage socio={socio} onNuevaInscripcion={() => setVista('nueva-inscripcion')} />
        )}
        {vista === 'nueva-inscripcion' && (
          <NuevaInscripcionPage
            socio={socio}
            onSalir={() => setVista('inicio')}
            onExito={() => setVista('inscripciones')}
            onIrATramites={() => setVista('tramites')}
          />
        )}
        {vista === 'nueva-entrada' && (
          <NuevaEntradaPage
            socio={socio}
            onSalir={() => setVista('inicio')}
            onExito={() => setVista('mis-entradas')}
          />
        )}
        {vista === 'mis-entradas' && (
          <MisEntradasPage
            socio={socio}
            onPagarEntrada={(entrada) => { setItemAPagarId(entrada.id); setVista('pagos'); }}
          />
        )}
        {vista === 'inicio' && (
          <>
            <WelcomeCard socio={socio} />
            <BiometriaOfferBanner
              credencial={credencialParaEnrolar}
              onDescartar={onDescartarCredencialParaEnrolar}
            />
            <CertificadoVencidoBanner socio={socio} onClick={() => setVista('tramites')} />
            <QuickAccessGrid
              onProximamente={setProximamente}
              onPagos={() => setVista('pagos')}
              onTramites={() => setVista('tramites')}
              onReservas={() => setVista('nueva-reserva')}
              onInscripciones={() => setVista('nueva-inscripcion')}
              onEventos={() => setVista('nueva-entrada')}
            />
          </>
        )}
      </main>

      <BottomNav
        onProximamente={setProximamente}
        onInicio={() => setVista('inicio')}
        onReservas={() => setVista('reservas')}
        onMisInscripciones={() => setVista('inscripciones')}
        onMisEntradas={() => setVista('mis-entradas')}
        vistaActual={vista}
      />

      {proximamente && (
        <ProximamenteOverlay titulo={proximamente} onClose={() => setProximamente(null)} />
      )}
    </div>
  );
}
