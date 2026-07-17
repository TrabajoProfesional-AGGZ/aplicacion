import { useEffect, useState } from 'react';
import { getEstadoFinanciero } from '../../services/finanzasService';
import { PagoCuotaFlow } from '../../components/pagoCuota/PagoCuotaFlow';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import './FinanzasPage.css';

const RESUMEN_CONFIG = {
  'Al día': { tono: 'success', copy: 'Estás al día con tus cuotas.' },
  Moroso: { tono: 'danger', copy: 'Por pagar.' },
};

const CUOTA_ESTADO_TAG = {
  Pagada: 'success',
  Pendiente: 'warning',
  Vencida: 'danger',
};

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

export function FinanzasPage({ socio }) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cuotaAPagar, setCuotaAPagar] = useState(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(null);
    getEstadoFinanciero(socio.id)
      .then((data) => { if (!cancelled) setResumen(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id, recarga]);

  const volverALista = () => { setCuotaAPagar(null); setRecarga((n) => n + 1); };

  return (
    <>
      {cargando && <LoadingScreen />}

      {!cargando && error && <p className="finanzas-error">No se pudo cargar tu estado financiero.</p>}

      {!cargando && !error && resumen && cuotaAPagar && (
        <PagoCuotaFlow cuota={cuotaAPagar} socio={socio} onVolver={volverALista} />
      )}

      {!cargando && !error && resumen && !cuotaAPagar && (
        <>
          {(() => {
            const config = RESUMEN_CONFIG[resumen.estado_financiero] ?? { tono: 'warning', copy: '' };
            return (
              <section className={`finanzas-resumen finanzas-resumen--${config.tono}`}>
                <div className="finanzas-resumen-texture" aria-hidden="true" />
                <div className="finanzas-resumen-content">
                  <span className={`finanzas-resumen-tag finanzas-resumen-tag--${config.tono}`}>
                    {resumen.estado_financiero}
                  </span>
                  <p className="finanzas-resumen-deuda">{formatearMonto(resumen.deuda_total)}</p>
                  <p className="finanzas-resumen-copy">{config.copy}</p>
                </div>
              </section>
            );
          })()}

          <section className="finanzas-cuotas">
            <h2 className="finanzas-cuotas-title">Cuotas</h2>
            {resumen.cuotas.length === 0 && <p>No tenés cuotas registradas.</p>}
            {resumen.cuotas.map((cuota) => {
              const tono = CUOTA_ESTADO_TAG[cuota.estado] ?? 'neutral';
              return (
                <div className={`finanzas-cuota-card finanzas-cuota-card--${tono}`} key={cuota.id}>
                  <div className="finanzas-cuota-info">
                    <span className="finanzas-cuota-concepto">{cuota.concepto}</span>
                    <span className="finanzas-cuota-vencimiento">
                      Vence: {formatearFecha(cuota.fecha_vencimiento)}
                    </span>
                    <span className={`finanzas-cuota-tag finanzas-cuota-tag--${tono}`}>
                      {cuota.estado}
                    </span>
                  </div>
                  <div className="finanzas-cuota-detalle">
                    <span className="finanzas-cuota-monto">{formatearMonto(cuota.monto)}</span>
                    {cuota.estado !== 'Pagada' && (
                      <button
                        type="button"
                        className="finanzas-pagar-btn"
                        onClick={() => setCuotaAPagar(cuota)}
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}
