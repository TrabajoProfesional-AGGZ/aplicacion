import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getNoticiasVigentes, getNoticia } from '../../services/noticiasService';
import './NoticiasPage.css';

export function NoticiasPage() {
  const [noticias, setNoticias] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarNoticias();
  }, []);

  async function cargarNoticias() {
    try {
      setLoading(true);
      const data = await getNoticiasVigentes();
      setNoticias(data);
    } catch {
      setError('No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalle(id) {
    try {
      setLoadingDetalle(true);
      const data = await getNoticia(id);
      setDetalle(data);
    } catch {
      setError('No se pudo cargar la noticia.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  function volverALista() {
    setDetalle(null);
    setError(null);
  }

  if (loading) return <div className="noticias-loading">Cargando noticias...</div>;

  // ─── Vista de detalle ───
  if (detalle) {
    return (
      <div className="noticias-page">
        <button className="noticias-volver" onClick={volverALista}>
          <ArrowLeft size={20} /> Volver
        </button>

        <article className="noticias-detalle">
          {detalle.imagen && (
            <img src={detalle.imagen} alt={detalle.titulo} className="noticias-detalle-img" />
          )}
          <h2 className="noticias-detalle-titulo">{detalle.titulo}</h2>
          <div className="noticias-detalle-fechas">
            <span>Publicada: {new Date(detalle.fecha_publicacion).toLocaleDateString('es-AR')}</span>
            <span>Vigente hasta: {new Date(detalle.fecha_expiracion).toLocaleDateString('es-AR')}</span>
          </div>
          <div className="noticias-detalle-cuerpo">{detalle.cuerpo}</div>
        </article>
      </div>
    );
  }

  // ─── Vista de lista ───
  return (
    <div className="noticias-page">
      <h2 className="noticias-titulo">Noticias del Club</h2>

      {error && <div className="noticias-error">{error}</div>}

      {noticias.length === 0 ? (
        <p className="noticias-empty">No hay noticias publicadas por el momento.</p>
      ) : (
        <div className="noticias-lista">
          {noticias.map(n => (
            <button key={n.id} className="noticias-card" onClick={() => abrirDetalle(n.id)}>
              <span className="noticias-card-titulo">{n.titulo}</span>
              <span className="noticias-card-fecha">
                {new Date(n.fecha_publicacion).toLocaleDateString('es-AR')}
              </span>
            </button>
          ))}
        </div>
      )}

      {loadingDetalle && <div className="noticias-loading">Cargando...</div>}
    </div>
  );
}