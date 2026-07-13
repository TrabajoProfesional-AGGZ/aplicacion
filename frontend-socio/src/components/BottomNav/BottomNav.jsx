import { Home, Calendar, QrCode, ClipboardList, Newspaper } from 'lucide-react';
import './BottomNav.css';

const ITEMS = [
  { id: 'inicio', icon: Home, label: 'Inicio' },
  { id: 'reservas', icon: Calendar, label: 'Mis Reservas' },
  { id: 'carnet', icon: QrCode, label: 'Mi Carnet' },
  { id: 'inscripciones', icon: ClipboardList, label: 'Mis Inscripciones' },
  { id: 'noticias', icon: Newspaper, label: 'Noticias del Club' },
];

export function BottomNav({ onProximamente }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, icon: Icon, label }) => {
        const esInicio = id === 'inicio';
        const esCarnet = id === 'carnet';
        return (
          <button
            key={id}
            type="button"
            className={[
              'bottom-nav-item',
              esInicio && 'bottom-nav-item--active',
              esCarnet && 'bottom-nav-item--carnet',
            ].filter(Boolean).join(' ')}
            aria-current={esInicio ? 'page' : undefined}
            onClick={esInicio ? undefined : () => onProximamente(label)}
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
