import { CreditCard, Calendar, ClipboardList, Newspaper } from 'lucide-react';
import { QuickAccessCard } from './QuickAccessCard';
import './QuickAccessGrid.css';

const ACCESOS_RAPIDOS = [
  { id: 'pagos', icon: CreditCard, titulo: 'Cuotas y pagos', desc: 'Aboná tu cuota social o servicios adicionales.' },
  { id: 'reservas', icon: Calendar, titulo: 'Reservar instalación', desc: 'Administrá reservas de espacios físicos del club.' },
  { id: 'inscripciones', icon: ClipboardList, titulo: 'Inscribirme a actividad', desc: 'Sumate a una disciplina o actividad del club.' },
  { id: 'noticias', icon: Newspaper, titulo: 'Última noticia', desc: 'Enterate de las últimas novedades del club.' },
];

export function QuickAccessGrid({ onProximamente, onPagos }) {
  const [destacado, ...resto] = ACCESOS_RAPIDOS;

  return (
    <div className="quick-access">
      <QuickAccessCard
        key={destacado.id}
        icon={destacado.icon}
        titulo={destacado.titulo}
        desc={destacado.desc}
        variant="featured"
        onClick={destacado.id === 'pagos' ? onPagos : () => onProximamente(destacado.titulo)}
      />

      <div className="quick-access-list">
        {resto.map(({ id, icon, titulo, desc }) => (
          <QuickAccessCard
            key={id}
            icon={icon}
            titulo={titulo}
            desc={desc}
            variant="row"
            onClick={id === 'pagos' ? onPagos : () => onProximamente(titulo)}
          />
        ))}
      </div>
    </div>
  );
}
