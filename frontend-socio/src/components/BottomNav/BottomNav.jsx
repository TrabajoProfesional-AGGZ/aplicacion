import { Home, Calendar, QrCode, ClipboardList, Newspaper } from 'lucide-react';
import './BottomNav.css';

const ITEMS = [
  { id: 'inicio', icon: Home, label: 'Inicio' },
  { id: 'reservas', icon: Calendar, label: 'Mis Reservas' },
  { id: 'carnet', icon: QrCode, label: 'Mi Carnet' },
  { id: 'inscripciones', icon: ClipboardList, label: 'Mis Inscripciones' },
  { id: 'noticias', icon: Newspaper, label: 'Noticias del Club' },
];

export function BottomNav({ onProximamente, onInicio, onReservas, vistaActual }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, icon: Icon, label }) => {
        const esInicio = id === 'inicio';
        const esReservas = id === 'reservas';
        const esCarnet = id === 'carnet';
        const activo = (esInicio && vistaActual === 'inicio') || (esReservas && vistaActual === 'reservas');
        const onClick = esInicio ? onInicio : esReservas ? onReservas : () => onProximamente(label);
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
