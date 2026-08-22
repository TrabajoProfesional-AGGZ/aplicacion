import { Fragment, useEffect, useState } from 'react';
import { CreditCard, Calendar, ClipboardList, Newspaper, FileText, Ticket, ShoppingBag } from 'lucide-react';
import { QuickAccessCard } from './QuickAccessCard';
import { getUltimaNoticia } from '../../services/noticiasService';
import './QuickAccessGrid.css';

const ACCESOS_RAPIDOS = [
  { id: 'pagos', icon: CreditCard, titulo: 'Cuotas y pagos', desc: 'Aboná tu cuota social o servicios adicionales.' },
  { id: 'reservas', icon: Calendar, titulo: 'Reservar instalación', desc: 'Administrá reservas de espacios físicos del club.' },
  { id: 'inscripciones', icon: ClipboardList, titulo: 'Inscribirme a actividad', desc: 'Sumate a una disciplina o actividad del club.' },
  { id: 'eventos', icon: Ticket, titulo: 'Comprar entradas', desc: 'Comprá tu entrada para los próximos eventos del club.' },
  { id: 'tramites', icon: FileText, titulo: 'Mis trámites', desc: 'Cargá y consultá tus trámites y formularios.' },
  { id: 'tienda', icon: ShoppingBag, titulo: 'Tienda', desc: 'Explorá los productos del club.' },
  { id: 'noticias', icon: Newspaper, titulo: 'Noticias', desc: 'Enterate de las últimas novedades del club.' },
];

/**
 * Grilla de accesos rápidos del Home: un ítem destacado (Cuotas y pagos) más
 * una lista agrupada del resto. Un ítem sin handler dedicado cae en
 * `onProximamente`. Debajo de "Noticias" agrega una extensión con la última
 * noticia publicada, si hay alguna.
 */
export function QuickAccessGrid({
  onProximamente, onPagos, onTramites, onReservas, onInscripciones, onEventos, onNoticias, onTienda,
  onVerNoticia = () => {},
}) {
  const [destacado, ...resto] = ACCESOS_RAPIDOS;
  const [ultimaNoticia, setUltimaNoticia] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getUltimaNoticia()
      .then((detalle) => { if (!cancelled) setUltimaNoticia(detalle); })
      .catch(() => { if (!cancelled) setUltimaNoticia(null); });
    return () => { cancelled = true; };
  }, []);

  function resolverOnClick(id, titulo) {
    if (id === 'pagos') return onPagos;
    if (id === 'tramites') return onTramites;
    if (id === 'reservas') return onReservas;
    if (id === 'inscripciones') return onInscripciones;
    if (id === 'eventos') return onEventos;
    if (id === 'noticias') return onNoticias;
    if (id === 'tienda') return onTienda;
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
          <Fragment key={id}>
            <QuickAccessCard
              icon={icon}
              titulo={titulo}
              desc={desc}
              variant="row"
              onClick={resolverOnClick(id, titulo)}
            />
            {id === 'noticias' && ultimaNoticia && (
              <button
                type="button"
                className="qa-noticia-extension"
                onClick={() => onVerNoticia(ultimaNoticia.id)}
              >
                {ultimaNoticia.imagen
                  ? <img src={ultimaNoticia.imagen} alt="" className="qa-noticia-extension-img" />
                  : <span className="qa-noticia-extension-icon"><Newspaper size={28} /></span>}
                <span className="qa-noticia-extension-text">
                  <span className="qa-noticia-extension-label">Última Noticia</span>
                  <span className="qa-noticia-extension-titulo">{ultimaNoticia.titulo}</span>
                </span>
              </button>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
