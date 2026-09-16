import { useEffect, useRef, useState } from 'react';
import AccesoQR from '../AccesoQR/AccesoQr';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
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
 * socio, un botón para forzar un nuevo enrolamiento TOTP si el QR falla, y
 * polling del último resultado de escaneo para mostrar feedback de acceso
 * concedido/rechazado.
 */
export function Carnet({ socio }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [recargando, setRecargando] = useState(false);
  const [errorRecarga, setErrorRecarga] = useState(false);
  const [resultadoAcceso, setResultadoAcceso] = useState(null);
  const [pulsoQr, setPulsoQr] = useState(false);

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
      return true;
    }
    return false;
  };

  const handleRecargar = async () => {
    setRecargando(true);
    setErrorRecarga(false);
    setResultadoAcceso(null);
    ultimoIdMostradoRef.current = null;
    montadoEnRef.current = new Date().toISOString();
    try {
      const exito = await pedirSecretoNuevo();
      if (!exito) setErrorRecarga(true);
    } catch {
      setErrorRecarga(true);
    } finally {
      setRecargando(false);
    }
  };

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

        {socio?.id && (
          <div className="carnet-recargar-container">
            <button
              type="button"
              className="carnet-recargar-btn"
              onClick={handleRecargar}
              disabled={recargando}
            >
              <RefreshCw size={15} className={recargando ? 'carnet-recargar-icono--girando' : ''} />
              {recargando ? 'Recargando...' : 'Recargar QR'}
            </button>
            {errorRecarga && (
              <p className="carnet-recargar-error">No se pudo recargar el QR. Probá de nuevo.</p>
            )}
          </div>
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