import { useState, useEffect } from 'react';
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
import { NoticiasPage } from '../NoticiasPage/NoticiasPage';
import { TiendaPage } from '../TiendaPage/TiendaPage';
import { CertificadoVencidoBanner } from '../../components/CertificadoVencidoBanner/CertificadoVencidoBanner';
import { BotinButton } from '../../components/BotinButton/BotinButton';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import '../../socio-theme.css';
import './HomePage.css';
import { Carnet } from '../../components/Carnet/Carnet';
import { AnimatePresence } from 'framer-motion';
import { enrolarYGuardarSecreto } from '../../services/accesosService';

export function HomePage({ socio, cerrarSesion }) {
  const [proximamente, setProximamente] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [itemAPagarId, setItemAPagarId] = useState(null);
  const [noticiaSeleccionadaId, setNoticiaSeleccionadaId] = useState(null);
  
  useBackToRoot(vista, 'inicio', () => setVista('inicio'));
  
  useEffect(() => {
    const enrolarDispositivo = async () => {
      const secretoGuardado = localStorage.getItem('socio_totp_secret');
      const idGuardado = localStorage.getItem('socio_id');

      if (secretoGuardado && idGuardado !== String(socio.id)) {
        localStorage.removeItem('socio_totp_secret');
      } else if (secretoGuardado || !navigator.onLine || socio.modoOffline) {
        return;
      }

      try {
        const secreto = await enrolarYGuardarSecreto(socio);
        if (secreto) {
          console.log("Dispositivo enrolado correctamente para acceso offline.");
        }
      } catch (error) {
        console.error("No se pudo enrolar el dispositivo:", error);
      }
    };

    if (socio) {
      enrolarDispositivo();
    }
  }, [socio]);
  
  if (socio.modoOffline) {
    console.warn("Estás sin conexión. Mostrando el pase de acceso offline.");
    return (
      <div className="offline-fullscreen-container" style={{ minHeight: '100dvh', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: '#ff9800', color: 'white', textAlign: 'center', padding: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
          Conexión perdida. Mostrando credencial offline.
        </div>
        
        <Carnet socio={socio} />
      </div>
    );
  }
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
        {vista === 'noticias' && (
          <NoticiasPage
            noticiaInicialId={noticiaSeleccionadaId}
            onConsumirNoticiaInicial={() => setNoticiaSeleccionadaId(null)}
          />
        )}
        {vista === 'tienda' && <TiendaPage socio={socio} />}
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
            onVerCarnet={() => setVista('carnet')}
          />
        )}
        {vista === 'inicio' && (
          <>
            <WelcomeCard socio={socio} />
            <CertificadoVencidoBanner socio={socio} onClick={() => setVista('tramites')} />
            <QuickAccessGrid
              onProximamente={setProximamente}
              onPagos={() => setVista('pagos')}
              onTramites={() => setVista('tramites')}
              onReservas={() => setVista('nueva-reserva')}
              onInscripciones={() => setVista('nueva-inscripcion')}
              onEventos={() => setVista('nueva-entrada')}
              onNoticias={() => setVista('noticias')}
              onTienda={() => setVista('tienda')}
              onVerNoticia={(id) => { setNoticiaSeleccionadaId(id); setVista('noticias'); }}
            />
          </>
        )}
        {vista === 'carnet' && (
          <AnimatePresence>
            <Carnet socio={socio} onClose={() => setVista('inicio')} />
          </AnimatePresence>
        )}
      </main>
      
      <BottomNav
        onProximamente={setProximamente}
        onInicio={() => setVista('inicio')}
        onReservas={() => setVista('reservas')}
        onMisInscripciones={() => setVista('inscripciones')}
        onMisEntradas={() => setVista('mis-entradas')}
        onCarnet={() => setVista('carnet')}
        vistaActual={vista}
      />

      {proximamente && (
        <ProximamenteOverlay titulo={proximamente} onClose={() => setProximamente(null)} />
      )}

      <BotinButton />
    </div>
  );
}
