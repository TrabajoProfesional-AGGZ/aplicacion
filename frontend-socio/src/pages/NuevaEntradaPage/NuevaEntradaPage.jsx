import { useEffect, useState } from 'react';
import {
  getEventos,
  comprarEntrada,
  getEntradasActivas,
  getEntradasPendientes,
} from '../../services/eventosService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { EventosListStep } from '../../components/nuevaEntradaFlow/EventosListStep';
import { EventoDetalleStep } from '../../components/nuevaEntradaFlow/EventoDetalleStep';
import { PagoCuotaFlow } from '../../components/pagoCuota/PagoCuotaFlow';

const MENSAJES_ERROR_COMPRA = {
  'evento-no-encontrado': 'No se pudo procesar la compra. Volvé a intentarlo.',
  'sin-cupo': 'Este evento ya no tiene entradas disponibles.',
  'ya-tiene-entrada': 'Ya tenés una entrada para este evento.',
  'fuera-de-plazo': 'Ya no se pueden comprar entradas para este evento.',
  moroso: 'Tenés pagos pendientes. Regularizá tu situación para poder comprar entradas.',
  suspendido: 'Tu cuenta está suspendida. Contactate con el club para más información.',
  'no-autorizado': 'No pudimos procesar tu compra.',
  'servicio-no-disponible': 'El servicio no está disponible. Intentá más tarde.',
};

function mensajeError(codigo) {
  return MENSAJES_ERROR_COMPRA[codigo] || 'No se pudo comprar la entrada. Intentá de nuevo.';
}

export function NuevaEntradaPage({ socio, onSalir, onExito = () => {} }) {
  const [step, setStep] = useState('lista');

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [eventosConEntradaIds, setEventosConEntradaIds] = useState(new Set());

  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [yaTieneEntrada, setYaTieneEntrada] = useState(false);
  const [entradaPendiente, setEntradaPendiente] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');

  useBackToRoot(step, 'lista', volverALista);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(false);
    Promise.all([getEventos(), getEntradasActivas(socio.id), getEntradasPendientes(socio.id)])
      .then(([listaEventos, activas, pendientes]) => {
        if (cancelled) return;
        setEventos(listaEventos);
        setEventosConEntradaIds(new Set([...activas, ...pendientes].map((e) => e.evento.id)));
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  function irADetalle(evento) {
    setEventoSeleccionado(evento);
    setYaTieneEntrada(eventosConEntradaIds.has(evento.id));
    setErrorCompra('');
    setStep('detalle');
  }

  function volverALista() {
    setEventoSeleccionado(null);
    setEntradaPendiente(null);
    setYaTieneEntrada(false);
    setStep('lista');
  }

  async function handlePagarEntrada() {
    setEnviando(true);
    setErrorCompra('');
    try {
      const entrada = await comprarEntrada(eventoSeleccionado.id, socio.id);
      setEntradaPendiente(entrada);
      setStep('pago');
    } catch (e) {
      setErrorCompra(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (step === 'pago' && entradaPendiente) {
    return (
      <PagoCuotaFlow
        item={{
          id: entradaPendiente.id,
          monto: entradaPendiente.monto,
          concepto: `Entrada: ${entradaPendiente.evento.nombre}`,
        }}
        tipoItem="entrada"
        socio={socio}
        onVolver={onExito}
      />
    );
  }

  if (step === 'detalle') {
    return (
      <EventoDetalleStep
        evento={eventoSeleccionado}
        yaTieneEntrada={yaTieneEntrada}
        onPagarEntrada={handlePagarEntrada}
        onVolver={volverALista}
        enviando={enviando}
        submitError={errorCompra ? mensajeError(errorCompra) : ''}
      />
    );
  }

  return (
    <EventosListStep
      eventos={eventos}
      cargando={cargando}
      error={error}
      onSeleccionar={irADetalle}
      onVolver={onSalir}
    />
  );
}
