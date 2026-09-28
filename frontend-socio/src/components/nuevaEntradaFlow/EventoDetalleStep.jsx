import { AlertCircle } from 'lucide-react';
import { PageHeader } from '../PageHeader/PageHeader';
import { RechazoAcciones } from '../RechazoAcciones/RechazoAcciones';
import './EventoDetalleStep.css';

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
}

/** Detalle de un evento: banner con datos/cupo, descripción y acción para comprar la entrada. */
export function EventoDetalleStep({
  evento,
  yaTieneEntrada = false,
  onPagarEntrada,
  onVerEntradas,
  enviando = false,
  submitError = '',
  motivoRechazo = null,
  onIrAPagar,
}) {
  return (
    <section className="detalle-evento">
      <PageHeader
        variant="hero"
        aviso={yaTieneEntrada && {
          titulo: 'Ya tenés tu entrada',
          texto: 'Podés verla en Mis Entradas.',
          accion: onVerEntradas && { label: 'Ver mis entradas', onClick: onVerEntradas },
        }}
        titulo={evento.nombre}
        stats={[
          { label: 'Día', value: formatearFecha(evento.dia) },
          { label: 'Horario', value: `${evento.hora_inicio?.slice(0, 5) ?? '--:--'} - ${evento.hora_fin?.slice(0, 5) ?? '--:--'}` },
          { label: 'Cupo', value: `${evento.entradas_vendidas}/${evento.capacidad_maxima}` },
          { label: 'Valor', value: formatearMonto(evento.valor_entrada) },
        ]}
      />

      {evento.foto_url && (
        <img
          src={evento.foto_url}
          alt={`Foto del evento ${evento.nombre}`}
          className="evento-detalle-foto"
          referrerPolicy="no-referrer"
        />
      )}

      {evento.descripcion && (
        <div className="evento-descripcion-box">
          <span className="evento-descripcion-label">Descripción</span>
          <p className="evento-descripcion-texto">{evento.descripcion}</p>
        </div>
      )}

      {submitError && (
        <div className="detalle-error-box">
          <p className="detalle-error" role="alert">
            <AlertCircle size={14} />
            {submitError}
          </p>
          <RechazoAcciones motivo={motivoRechazo} onIrAPagar={onIrAPagar} />
        </div>
      )}

      {!yaTieneEntrada && (
        <button
          type="button"
          className="evento-pagar-btn"
          onClick={onPagarEntrada}
          disabled={enviando}
        >
          {enviando ? 'Procesando...' : 'Reserva tu entrada'}
        </button>
      )}
    </section>
  );
}
