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

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setLoading(true);
      const data = await getProductosDisponibles();
      setProductos(data);
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalle(id) {
    try {
      setLoadingDetalle(true);
      const data = await getProducto(id);
      setDetalle(data);
    } catch {
      setError('No se pudo cargar el producto.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  function volverALista() {
    setDetalle(null);
    setError(null);
  }

  if (loading) return <div className="tienda-loading">Cargando tienda...</div>;

  // ─── Detalle ───
  if (detalle) {
    return (
      <div className="tienda-page">
        <button className="tienda-volver" onClick={volverALista}>
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="tienda-detalle">
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
          {detalle.descripcion && (
            <p className="tienda-detalle-desc">{detalle.descripcion}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Lista ───
  return (
    <div className="tienda-page">
      <h2 className="tienda-titulo">
        <ShoppingBag size={22} /> Tienda del Club
      </h2>

      {error && <div className="tienda-error">{error}</div>}

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
              <span className="tienda-card-nombre">{p.nombre}</span>
              <span className="tienda-card-precio">${Number(p.precio).toLocaleString('es-AR')}</span>
              <span className="tienda-card-stock">{p.stock} disp.</span>
            </button>
          ))}
        </div>
      )}

      {loadingDetalle && <div className="tienda-loading">Cargando...</div>}
    </div>
  );
}