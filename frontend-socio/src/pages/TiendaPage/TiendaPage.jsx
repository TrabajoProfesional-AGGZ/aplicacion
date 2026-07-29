import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react';
import { getProductosDisponibles, getProducto } from '../../services/tiendaService';
import './TiendaPage.css';

export function TiendaPage() {
  const [productos, setProductos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { cargarProductos(); }, []);

  async function cargarProductos() {
    try {
      setLoading(true);
      setProductos(await getProductosDisponibles());
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalle(id) {
    try {
      setLoadingDetalle(true);
      setDetalle(await getProducto(id));
    } catch {
      setError('No se pudo cargar el producto.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  if (loading) return <p className="tienda-empty">Cargando tienda...</p>;

  // ─── Detalle ───
  if (detalle) {
    return (
      <div className="tienda-page">
        <button className="tienda-volver" onClick={() => { setDetalle(null); setError(null); }}>
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="tienda-detalle-card">
          {detalle.imagen_url ? (
            <img src={detalle.imagen_url} alt={detalle.nombre} className="tienda-detalle-img" />
          ) : (
            <div className="tienda-detalle-img-placeholder"><Package size={48} /></div>
          )}
          <h2 className="tienda-detalle-nombre">{detalle.nombre}</h2>
          <span className="tienda-detalle-precio">${Number(detalle.precio).toLocaleString('es-AR')}</span>
          <span className="tienda-detalle-stock">
            {detalle.stock > 0 ? `${detalle.stock} disponibles` : 'Sin stock'}
          </span>
          {detalle.descripcion && <p className="tienda-detalle-desc">{detalle.descripcion}</p>}
        </div>
      </div>
    );
  }

  // ─── Lista ───
  return (
    <div className="tienda-page">
      <div className="tienda-banner">
        <div className="tienda-banner-texture" />
        <div className="tienda-banner-top">
          <span className="tienda-banner-eyebrow"><ShoppingBag size={14} /> TIENDA DEL CLUB</span>
        </div>
        <h2 className="tienda-banner-title">Explorá nuestros productos</h2>
        <div className="tienda-banner-stats">
          <div className="tienda-banner-stat">
            <span className="tienda-banner-stat-value">{productos.length}</span>
            <span className="tienda-banner-stat-label">Disponibles</span>
          </div>
        </div>
      </div>

      {error && <p className="tienda-error">{error}</p>}

      {productos.length === 0 ? (
        <p className="tienda-empty">No hay productos disponibles por el momento.</p>
      ) : (
        <div className="tienda-grid">
          {productos.map(p => (
            <button key={p.id} className="tienda-card" onClick={() => abrirDetalle(p.id)}>
              {p.imagen_url ? (
                <img src={p.imagen_url} alt={p.nombre} className="tienda-card-img" />
              ) : (
                <div className="tienda-card-img-placeholder"><Package size={32} /></div>
              )}
              <div className="tienda-card-info">
                <span className="tienda-card-nombre">{p.nombre}</span>
                <span className="tienda-card-precio">${Number(p.precio).toLocaleString('es-AR')}</span>
                <span className="tienda-card-stock">{p.stock} disponibles</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {loadingDetalle && <p className="tienda-empty">Cargando...</p>}
    </div>
  );
}