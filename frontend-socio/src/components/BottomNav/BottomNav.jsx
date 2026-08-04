import { Home, Calendar, QrCode, ClipboardList, Ticket } from 'lucide-react';
import './BottomNav.css';

const ITEMS = [
  { id: 'inicio', icon: Home, label: 'Inicio', vista: 'inicio' },
  { id: 'reservas', icon: Calendar, label: 'Mis Reservas', vista: 'reservas' },
  { id: 'carnet', icon: QrCode, label: 'Mi Carnet', vista: 'carnet' },
  { id: 'inscripciones', icon: ClipboardList, label: 'Mis Inscripciones', vista: 'inscripciones' },
  { id: 'entradas', icon: Ticket, label: 'Mis Entradas', vista: 'mis-entradas' },
];

export function BottomNav({ onProximamente, onInicio, onReservas, onMisInscripciones, onMisEntradas, onCarnet, vistaActual }) {
  const handlersPorId = {
    inicio: onInicio,
    reservas: onReservas,
    inscripciones: onMisInscripciones,
    entradas: onMisEntradas,
    carnet: onCarnet,
  };

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, icon: Icon, label, vista }) => {
        const esCarnet = id === 'carnet';
        const activo = vistaActual === vista;
        const onClick = handlersPorId[id] ?? (() => onProximamente(label));
        return (
          <button
            key={id}
            type="button"
            className={[
              'bottom-nav-item',
              activo && 'bottom-nav-item--active',
              esCarnet && 'bottom-nav-item--carnet',
            ].filter(Boolean).join(' ')}
            aria-current={activo ? 'page' : undefined}
            onClick={onClick}
          >
            {esCarnet ? (
              <span className="bottom-nav-carnet-icon"><Icon size={22} /></span>
            ) : (
              <Icon size={20} />
            )}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
