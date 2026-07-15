import { CreditCard, Calendar, ClipboardList, Newspaper, FileText } from 'lucide-react';
import { QuickAccessCard } from './QuickAccessCard';
import './QuickAccessGrid.css';

const ACCESOS_RAPIDOS = [
  { id: 'pagos', icon: CreditCard, titulo: 'Cuotas y pagos', desc: 'Aboná tu cuota social o servicios adicionales.' },
  { id: 'reservas', icon: Calendar, titulo: 'Reservar instalación', desc: 'Administrá reservas de espacios físicos del club.' },
  { id: 'inscripciones', icon: ClipboardList, titulo: 'Inscribirme a actividad', desc: 'Sumate a una disciplina o actividad del club.' },
  { id: 'noticias', icon: Newspaper, titulo: 'Última noticia', desc: 'Enterate de las últimas novedades del club.' },
  { id: 'tramites', icon: FileText, titulo: 'Mis trámites', desc: 'Cargá y consultá tus trámites y formularios.' },
];

export function QuickAccessGrid({ onProximamente, onPagos, onTramites }) {
  const [destacado, ...resto] = ACCESOS_RAPIDOS;

  function resolverOnClick(id, titulo) {
    if (id === 'pagos') return onPagos;
    if (id === 'tramites') return onTramites;
    return () => onProximamente(titulo);
  }

  return (
    <div className="quick-access">
      <QuickAccessCard
        key={destacado.id}
        icon={destacado.icon}
        titulo={destacado.titulo}
        desc={destacado.desc}
        variant="featured"
        onClick={resolverOnClick(destacado.id, destacado.titulo)}
      />

      <div className="quick-access-list">
        {resto.map(({ id, icon, titulo, desc }) => (
          <QuickAccessCard
            key={id}
            icon={icon}
            titulo={titulo}
            desc={desc}
            variant="row"
            onClick={resolverOnClick(id, titulo)}
          />
        ))}
      </div>
    </div>
  );
}
