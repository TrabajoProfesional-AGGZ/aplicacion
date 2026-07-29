import { useState, useEffect } from 'react';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { getNoticiasVigentes, getNoticia } from '../../services/noticiasService';
import './NoticiasPage.css';

export function NoticiasPage() {
  const [noticias, setNoticias] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { cargarNoticias(); }, []);

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

  if (loading) return <p className="noticias-empty">Cargando noticias...</p>;

  // ─── Detalle ───
  if (detalle) {
    return (
      <div className="noticias-page">
        <button className="noticias-volver" onClick={() => { setDetalle(null); setError(null); }}>
          <ArrowLeft size={20} /> Volver
        </button>
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
      <div className="noticias-banner">
        <div className="noticias-banner-texture" />
        <div className="noticias-banner-top">
          <span className="noticias-banner-eyebrow"><Newspaper size={14} /> NOVEDADES DEL CLUB</span>
        </div>
        <h2 className="noticias-banner-title">Noticias del Club</h2>
        <div className="noticias-banner-stats">
          <div className="noticias-banner-stat">
            <span className="noticias-banner-stat-value">{noticias.length}</span>
            <span className="noticias-banner-stat-label">Vigentes</span>
          </div>
        </div>
      </div>

      {error && <p className="noticias-error">{error}</p>}

      {noticias.length === 0 ? (
        <p className="noticias-empty">No hay noticias publicadas por el momento.</p>
      ) : (
        <div className="noticias-lista">
          {noticias.map(n => (
            <button key={n.id} className="noticias-card" onClick={() => abrirDetalle(n.id)}>
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

      {loadingDetalle && <p className="noticias-empty">Cargando...</p>}
    </div>
  );
}