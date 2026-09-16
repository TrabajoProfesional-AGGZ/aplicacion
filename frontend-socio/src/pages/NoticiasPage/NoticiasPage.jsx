import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getNoticiasVigentes, getNoticia } from '../../services/noticiasService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { SkeletonRows } from '../../components/SkeletonRows/SkeletonRows';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import './NoticiasPage.css';

/**
 * Lista de noticias vigentes del club y su detalle. Si recibe `noticiaInicialId`
 * (atajo "Última Noticia" desde el Home), abre ese detalle directo sin pasar
 * primero por la lista.
 */
export function NoticiasPage({ noticiaInicialId = null, onConsumirNoticiaInicial = () => {} }) {
  const [noticias, setNoticias] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);
  // El detalle abierto por el atajo "Última Noticia" no empuja su propia entrada
  // de historial (un gesto de atrás va directo a Home); un click real en la
  // lista sí, para que atrás vuelva primero a la lista.
  const entradaDesdeListaRef = useRef(!noticiaInicialId);

  useBackToRoot(entradaDesdeListaRef.current ? detalle : null, null, () => { setDetalle(null); setError(null); });

  useEffect(() => {
    cargarNoticias();
    if (noticiaInicialId) {
      onConsumirNoticiaInicial();
      abrirDetalle(noticiaInicialId);
    }
    // Solo se captura al montar: HomePage crea una instancia nueva en cada navegación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarNoticias() {
    try {
      setLoading(true);
      setNoticias(await getNoticiasVigentes());
    } catch {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalle(id) {
    try {
      setLoadingDetalle(true);
      setDetalle(await getNoticia(id));
    } catch {
      setError('No se pudo cargar la noticia.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  function abrirDetalleDesdeLista(id) {
    entradaDesdeListaRef.current = true;
    abrirDetalle(id);
  }

  // ─── Detalle ───
  if (detalle) {
    return (
      <div className="noticias-page">
        <article className="noticias-detalle-card">
          {detalle.imagen && <img src={detalle.imagen} alt={detalle.titulo} className="noticias-detalle-img" />}
          <div className="noticias-detalle-body">
            <h2 className="noticias-detalle-titulo">{detalle.titulo}</h2>
            <div className="noticias-detalle-fechas">
              <span>Publicada: {new Date(detalle.fecha_publicacion).toLocaleDateString('es-AR')}</span>
              <span>Vigente hasta: {new Date(detalle.fecha_expiracion).toLocaleDateString('es-AR')}</span>
            </div>
            <p className="noticias-detalle-cuerpo">{detalle.cuerpo}</p>
          </div>
        </article>
      </div>
    );
  }

  // ─── Lista ───
  return (
    <div className="noticias-page">
      <PageHeader
        eyebrow="Novedades del club"
        titulo="Noticias del Club"
        stats={[{ label: 'Vigentes', value: loading ? '—' : noticias.length }]}
      />

      {loading && <SkeletonRows n={4} altura={64} />}

      {!loading && error && <p className="noticias-error">{error}</p>}

      {!loading && !error && noticias.length === 0 && (
        <p className="noticias-empty">No hay noticias publicadas por el momento.</p>
      )}

      {!loading && !error && noticias.length > 0 && (
        <div className="noticias-lista">
          {noticias.map(n => (
            <button key={n.id} type="button" className="noticias-card" onClick={() => abrirDetalleDesdeLista(n.id)}>
              <div className="noticias-card-info">
                <span className="noticias-card-titulo">{n.titulo}</span>
                <span className="noticias-card-fecha">
                  {new Date(n.fecha_publicacion).toLocaleDateString('es-AR')}
                </span>
              </div>
              <ArrowLeft size={16} className="noticias-card-chevron" />
            </button>
          ))}
        </div>
      )}

      {loadingDetalle && <SkeletonRows n={1} altura={220} />}
    </div>
  );
}