import { useEffect, useRef, useState } from 'react';
import AccesoQR from '../AccesoQR/AccesoQr';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { enrolarYGuardarSecreto, obtenerUltimoAcceso } from '../../services/accesosService';
import './Carnet.css';

const POLLING_INTERVALO_MS = 2000;
const PERIODO_TOTP_S = 30;

function nombreCompleto(socio) {
  return [socio?.nombre, socio?.apellido].filter(Boolean).join(' ') || '---';
}

function segundosRestantes() {
  return PERIODO_TOTP_S - (Math.floor(Date.now() / 1000) % PERIODO_TOTP_S);
}

/**
 * Barra que indica cuánto falta para que `AccesoQR` regenere el token TOTP
 * (mismo período de 30s que `AccesoQr.jsx`). Avisa a `onCicloNuevo` en el
 * tick en que el ciclo reinicia, para que el contenedor del QR pulse.
 */
function TimerTotp({ onCicloNuevo }) {
  const [restante, setRestante] = useState(segundosRestantes);
  const anteriorRef = useRef(restante);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const nuevo = segundosRestantes();
      if (nuevo > anteriorRef.current) onCicloNuevo?.();
      anteriorRef.current = nuevo;
      setRestante(nuevo);
    }, 1000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reiniciando = restante === PERIODO_TOTP_S;

  return (
    <div className="carnet-timer" role="timer" aria-label={`El código se renueva en ${restante} segundos`}>
      <div
        className={`carnet-timer-fill${reiniciando ? ' carnet-timer-fill--reset' : ''}`}
        style={{ transform: `scaleX(${restante / PERIODO_TOTP_S})` }}
      />
    </div>
  );
}

/**
 * Carnet de socio: tarjeta con el QR de acceso (`AccesoQR`) más nombre/nº de
 * socio y polling del último resultado de escaneo para mostrar feedback de
 * acceso concedido/rechazado. El código se renueva solo (cada 30s, o tras un
 * escaneo aprobado) — no hay acción manual de recarga.
 */
export function Carnet({ socio }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [resultadoAcceso, setResultadoAcceso] = useState(null);
  const [pulsoQr, setPulsoQr] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [tieneSecreto, setTieneSecreto] = useState(() => !!localStorage.getItem('socio_totp_secret'));

  const ultimoIdMostradoRef = useRef(null);
  const montadoEnRef = useRef(new Date().toISOString());

  const handleCicloNuevo = () => {
    setPulsoQr(true);
    setTimeout(() => setPulsoQr(false), 300);
  };

  const pedirSecretoNuevo = async () => {
    const secreto = await enrolarYGuardarSecreto(socio);
    if (secreto) {
      // Nuevo secreto guardado: remontamos AccesoQR para que lo relea de localStorage.
      setRefreshKey((k) => k + 1);
      setTieneSecreto(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const alConectar = () => setOnline(true);
    const alDesconectar = () => setOnline(false);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  // Reintento de enrolamiento: si no hay secreto en localStorage y hay red,
  // se pide uno con backoff (2 s, 4 s, 8 s, luego cada 30 s). Reemplaza al
  // botón "Recargar QR" como camino de recuperación.
  useEffect(() => {
    if (!socio?.id) return undefined;
    let cancelado = false;
    let intento = 0;
    let timer = null;

    const programar = () => {
      const espera = Math.min(2000 * 2 ** intento, 30000);
      timer = setTimeout(async () => {
        if (cancelado) return;
        if (localStorage.getItem('socio_totp_secret')) { setTieneSecreto(true); return; }
        if (!navigator.onLine) { programar(); return; }
        intento += 1;
        try {
          const ok = await pedirSecretoNuevo();
          if (!ok && !cancelado) programar();
        } catch {
          if (!cancelado) programar();
        }
      }, espera);
    };

    if (!localStorage.getItem('socio_totp_secret')) programar();
    const alVolverOnline = () => { if (!localStorage.getItem('socio_totp_secret')) { intento = 0; programar(); } };
    window.addEventListener('online', alVolverOnline);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      window.removeEventListener('online', alVolverOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socio?.id]);

  useEffect(() => {
    if (!socio?.id) return undefined;

    const intervalo = setInterval(async () => {
      if (!navigator.onLine) return;

      const resultado = await obtenerUltimoAcceso(socio.id);
      if (!resultado) return;
      if (resultado.id === ultimoIdMostradoRef.current) return;
      if (resultado.creado_en < montadoEnRef.current) return;

      ultimoIdMostradoRef.current = resultado.id;
      setResultadoAcceso(resultado);

      if (resultado.aprobado) {
        pedirSecretoNuevo().catch(() => {});
      }
    }, POLLING_INTERVALO_MS);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socio?.id]);

  return (
    <div className="carnet-view">
      <div className="carnet-header-mobile">
        <h2>Mi Pase de Acceso</h2>
        <p>Mostrá este código para ingresar</p>
      </div>

      <div className="carnet-card">
        <div className="carnet-card-header">
          <div className="carnet-brand">
            <ShieldCheck size={28} className="brand-icon" />
            <span>SOCIOUNIDO</span>
          </div>
        </div>

        <TimerTotp onCicloNuevo={handleCicloNuevo} />

        {/* Contenedor del QR con zona blanca de seguridad (Quiet Zone) */}
        <div className={`carnet-qr-container${pulsoQr ? ' carnet-qr-container--nuevo' : ''}`}>
          <AccesoQR key={refreshKey} />

          {resultadoAcceso && (
            <div
              className={`carnet-resultado-overlay carnet-resultado-overlay--${resultadoAcceso.aprobado ? 'exito' : 'error'}`}
              role="status"
            >
              {resultadoAcceso.aprobado ? (
                <CheckCircle2 size={40} className="carnet-resultado-icono" />
              ) : (
                <XCircle size={40} className="carnet-resultado-icono" />
              )}
              <p className="carnet-resultado-mensaje">{resultadoAcceso.mensaje}</p>
              {resultadoAcceso.nombre && (
                <p className="carnet-resultado-nombre">{resultadoAcceso.nombre}</p>
              )}
              {!resultadoAcceso.aprobado && resultadoAcceso.estado_financiero && (
                <p className="carnet-resultado-estado-financiero">
                  Estado financiero: {resultadoAcceso.estado_financiero}
                </p>
              )}
              <button
                type="button"
                className="carnet-resultado-ok"
                onClick={() => setResultadoAcceso(null)}
              >
                Ok
              </button>
            </div>
          )}
        </div>

        {!tieneSecreto && !online && (
          <p className="carnet-aviso">Sin conexión. El pase se activará al reconectar.</p>
        )}

        <div className="carnet-card-footer">
          <div className="socio-data">
            <span className="data-label">Socio</span>
            <span className="data-value">{nombreCompleto(socio)}</span>
          </div>
          <div className="socio-data align-right">
            <span className="data-label">Nº de Socio</span>
            <span className="data-value">#{socio?.nro_socio || '---'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}